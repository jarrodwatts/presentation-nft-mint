// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PresentationNFT
 * @notice ERC1155 NFT collection for Abstract onboarding presentations
 * @dev Each tokenId represents a different presentation/event
 *      - Time-windowed minting per presentation
 *      - One mint per wallet per presentation
 *      - Admin controls for toggling mints
 */
contract PresentationNFT is ERC1155, ERC1155Supply, AccessControl {
    using Strings for uint256;

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ Structs ============
    
    struct Presentation {
        string name;
        string description;
        string imageUri;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 maxSupply; // 0 = unlimited
    }

    // ============ State ============
    
    /// @notice Mapping of tokenId to Presentation config
    mapping(uint256 => Presentation) public presentations;
    
    /// @notice Tracks if address has minted a specific tokenId
    mapping(address => mapping(uint256 => bool)) public hasMinted;
    
    /// @notice Current presentation counter
    uint256 public presentationCount;
    
    /// @notice Base URI for metadata
    string public baseTokenUri;

    // ============ Events ============
    
    event PresentationCreated(
        uint256 indexed tokenId,
        string name,
        uint256 startTime,
        uint256 endTime
    );
    
    event PresentationUpdated(uint256 indexed tokenId);
    event MintingToggled(uint256 indexed tokenId, bool isActive);
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event BaseURIUpdated(string newUri);

    // ============ Errors ============
    
    error MintingNotActive();
    error MintingNotStarted();
    error MintingEnded();
    error AlreadyMinted();
    error MaxSupplyReached();
    error InvalidPresentation();
    error InvalidTimeWindow();

    // ============ Constructor ============
    
    constructor(
        string memory _baseUri,
        address _admin
    ) ERC1155(_baseUri) {
        baseTokenUri = _baseUri;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============ Minting ============
    
    /**
     * @notice Mint an NFT for a specific presentation
     * @param tokenId The presentation ID to mint
     */
    function mint(uint256 tokenId) external {
        Presentation storage pres = presentations[tokenId];
        
        // Validate presentation exists and is active
        if (bytes(pres.name).length == 0) revert InvalidPresentation();
        if (!pres.isActive) revert MintingNotActive();
        if (block.timestamp < pres.startTime) revert MintingNotStarted();
        if (block.timestamp > pres.endTime) revert MintingEnded();
        
        // Check if already minted
        if (hasMinted[msg.sender][tokenId]) revert AlreadyMinted();
        
        // Check supply
        if (pres.maxSupply > 0 && totalSupply(tokenId) >= pres.maxSupply) {
            revert MaxSupplyReached();
        }
        
        // Mark as minted and mint
        hasMinted[msg.sender][tokenId] = true;
        _mint(msg.sender, tokenId, 1, "");
        
        emit NFTMinted(msg.sender, tokenId);
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Create a new presentation
     * @param name Name of the presentation
     * @param description Description of the presentation
     * @param imageUri IPFS or HTTP URI for the image
     * @param startTime Unix timestamp when minting starts
     * @param endTime Unix timestamp when minting ends
     * @param maxSupply Maximum supply (0 for unlimited)
     */
    function createPresentation(
        string calldata name,
        string calldata description,
        string calldata imageUri,
        uint256 startTime,
        uint256 endTime,
        uint256 maxSupply
    ) external onlyRole(ADMIN_ROLE) returns (uint256 tokenId) {
        if (startTime >= endTime) revert InvalidTimeWindow();
        
        tokenId = presentationCount++;
        
        presentations[tokenId] = Presentation({
            name: name,
            description: description,
            imageUri: imageUri,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            maxSupply: maxSupply
        });
        
        emit PresentationCreated(tokenId, name, startTime, endTime);
    }

    /**
     * @notice Toggle minting for a presentation
     * @param tokenId The presentation ID
     * @param isActive Whether minting should be active
     */
    function setMintingActive(uint256 tokenId, bool isActive) external onlyRole(ADMIN_ROLE) {
        if (bytes(presentations[tokenId].name).length == 0) {
            revert InvalidPresentation();
        }
        presentations[tokenId].isActive = isActive;
        emit MintingToggled(tokenId, isActive);
    }

    /**
     * @notice Update presentation time window
     * @param tokenId The presentation ID
     * @param startTime New start time
     * @param endTime New end time
     */
    function updateTimeWindow(
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) {
        if (bytes(presentations[tokenId].name).length == 0) {
            revert InvalidPresentation();
        }
        if (startTime >= endTime) revert InvalidTimeWindow();

        presentations[tokenId].startTime = startTime;
        presentations[tokenId].endTime = endTime;

        emit PresentationUpdated(tokenId);
    }

    /**
     * @notice Update base URI for metadata
     * @param newUri New base URI
     */
    function setBaseUri(string calldata newUri) external onlyRole(ADMIN_ROLE) {
        baseTokenUri = newUri;
        emit BaseURIUpdated(newUri);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get presentation details
     * @param tokenId The presentation ID
     */
    function getPresentation(uint256 tokenId) external view returns (Presentation memory) {
        return presentations[tokenId];
    }

    /**
     * @notice Check if minting is currently allowed for a presentation
     * @param tokenId The presentation ID
     */
    function canMint(uint256 tokenId, address user) external view returns (bool) {
        Presentation storage pres = presentations[tokenId];
        
        if (bytes(pres.name).length == 0) return false;
        if (!pres.isActive) return false;
        if (block.timestamp < pres.startTime) return false;
        if (block.timestamp > pres.endTime) return false;
        if (hasMinted[user][tokenId]) return false;
        if (pres.maxSupply > 0 && totalSupply(tokenId) >= pres.maxSupply) return false;
        
        return true;
    }

    function getActivePresentations() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < presentationCount; i++) {
            if (presentations[i].isActive) count++;
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < presentationCount; i++) {
            if (presentations[i].isActive) {
                active[index++] = i;
            }
        }
        
        return active;
    }

    // ============ Metadata ============
    
    /**
     * @notice Returns the URI for a token's metadata
     * @param tokenId The token ID
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        Presentation storage pres = presentations[tokenId];
        
        if (bytes(pres.name).length == 0) {
            return "";
        }
        
        // Return base URI + tokenId if set, otherwise construct JSON
        if (bytes(baseTokenUri).length > 0) {
            return string(abi.encodePacked(baseTokenUri, tokenId.toString(), ".json"));
        }
        
        // On-chain metadata fallback
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encodeBase64(abi.encodePacked(
                '{"name":"', pres.name,
                '","description":"', pres.description,
                '","image":"', pres.imageUri,
                '","attributes":[{"trait_type":"Presentation ID","value":"', tokenId.toString(), '"}]}'
            ))
        ));
    }

    // ============ Internal ============

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Simple base64 encoding for on-chain metadata
    function _encodeBase64(bytes memory data) internal pure returns (string memory) {
        bytes memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        uint256 len = data.length;
        if (len == 0) return "";
        
        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        
        assembly {
            mstore(result, encodedLen)
        }
        
        uint256 tablePtr;
        uint256 dataPtr;
        uint256 resultPtr;
        
        assembly {
            tablePtr := add(TABLE, 1)
            dataPtr := data
            resultPtr := add(result, 32)
        }
        
        for (uint256 i = 0; i < len; ) {
            assembly {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            unchecked { i += 3; }
        }
        
        // Padding
        uint256 mod = len % 3;
        if (mod > 0) {
            assembly {
                mstore8(sub(resultPtr, 1), 0x3d) // '='
            }
            if (mod == 1) {
                assembly {
                    mstore8(sub(resultPtr, 2), 0x3d) // '='
                }
            }
        }
        
        return string(result);
    }
}
