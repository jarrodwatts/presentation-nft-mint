// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster, Transaction, ExecutionResult} from "./interfaces/IPaymaster.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PresentationPaymaster is IPaymaster, Ownable {

    // ============ Constants ============
    
    /// @notice Magic value for successful paymaster validation
    bytes4 public constant PAYMASTER_VALIDATION_SUCCESS_MAGIC = IPaymaster.validateAndPayForPaymasterTransaction.selector;
    
    /// @notice Selector for the mint function: mint(uint256)
    bytes4 public constant MINT_SELECTOR = bytes4(keccak256("mint(uint256)"));

    // ============ State ============
    
    /// @notice The NFT contract we're sponsoring mints for
    address public nftContract;
    
    /// @notice Whether the paymaster is active
    bool public isActive;
    
    /// @notice Maximum gas price we'll sponsor (wei)
    uint256 public maxGasPrice;
    
    /// @notice Addresses that can withdraw funds
    mapping(address => bool) public withdrawers;

    // ============ Events ============
    
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event PaymasterToggled(bool isActive);
    event MaxGasPriceUpdated(uint256 newMaxGasPrice);
    event GasSponsored(address indexed user, uint256 gasUsed);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // ============ Errors ============
    
    error PaymasterNotActive();
    error InvalidNFTContract();
    error InvalidFunction();
    error GasPriceTooHigh();
    error InsufficientBalance();
    error NotWithdrawer();
    error TransferFailed();

    // ============ Constructor ============
    
    constructor(
        address _owner,
        address _nftContract
    ) Ownable(_owner) {
        nftContract = _nftContract;
        isActive = true;
        maxGasPrice = 1 gwei; // Default max gas price
        withdrawers[_owner] = true;
    }

    // ============ IPaymaster Implementation ============
    
    /**
     * @notice Validates and pays for a paymaster transaction
     * @dev Called by the bootloader to determine if we'll sponsor this tx
     * @param _transaction The transaction to validate
     * @return magic The validation result (success magic or empty)
     * @return context Context to pass to postTransaction (unused here)
     */
    function validateAndPayForPaymasterTransaction(
        bytes32, // _txHash - unused
        bytes32, // _suggestedSignedHash - unused  
        Transaction calldata _transaction
    ) external payable returns (bytes4 magic, bytes memory context) {
        // Only bootloader can call this
        require(msg.sender == address(0x8001), "Only bootloader");
        
        // Check if paymaster is active
        if (!isActive) revert PaymasterNotActive();
        
        // Validate the transaction is to our NFT contract
        address to = address(uint160(_transaction.to));
        if (to != nftContract) revert InvalidNFTContract();
        
        // Validate it's calling the mint function
        bytes4 selector = bytes4(_transaction.data[:4]);
        if (selector != MINT_SELECTOR) revert InvalidFunction();
        
        // Check gas price isn't too high
        if (_transaction.maxFeePerGas > maxGasPrice) revert GasPriceTooHigh();
        
        // Calculate required ETH for gas
        uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;
        
        // Check we have enough balance
        if (address(this).balance < requiredETH) revert InsufficientBalance();
        
        // Pay the bootloader
        (bool success, ) = payable(address(0x8001)).call{value: requiredETH}("");
        if (!success) revert TransferFailed();
        
        // Emit event
        emit GasSponsored(address(uint160(_transaction.from)), requiredETH);
        
        // Return success
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        context = "";
    }

    /**
     * @notice Called after transaction execution
     * @dev Can be used for refunds or logging, but we keep it simple
     */
    function postTransaction(
        bytes calldata, // _context
        Transaction calldata, // _transaction
        bytes32, // _txHash
        bytes32, // _suggestedSignedHash
        ExecutionResult, // _txResult
        uint256 // _maxRefundedGas
    ) external payable {
        // Only bootloader can call
        require(msg.sender == address(0x8001), "Only bootloader");
        // No-op for now - could add refund logic here
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update the NFT contract address
     * @param _nftContract New NFT contract address
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        address old = nftContract;
        nftContract = _nftContract;
        emit NFTContractUpdated(old, _nftContract);
    }

    /**
     * @notice Toggle the paymaster on/off
     * @param _isActive Whether paymaster should be active
     */
    function setActive(bool _isActive) external onlyOwner {
        isActive = _isActive;
        emit PaymasterToggled(_isActive);
    }

    /**
     * @notice Set maximum gas price to sponsor
     * @param _maxGasPrice Max gas price in wei
     */
    function setMaxGasPrice(uint256 _maxGasPrice) external onlyOwner {
        maxGasPrice = _maxGasPrice;
        emit MaxGasPriceUpdated(_maxGasPrice);
    }

    /**
     * @notice Add/remove a withdrawer
     * @param withdrawer Address to update
     * @param canWithdraw Whether they can withdraw
     */
    function setWithdrawer(address withdrawer, bool canWithdraw) external onlyOwner {
        withdrawers[withdrawer] = canWithdraw;
    }

    /**
     * @notice Withdraw ETH from the paymaster
     * @param to Address to send ETH to
     * @param amount Amount to withdraw
     */
    function withdraw(address to, uint256 amount) external {
        if (!withdrawers[msg.sender]) revert NotWithdrawer();
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FundsWithdrawn(to, amount);
    }

    // ============ Receive ============
    
    /// @notice Accept ETH deposits to fund the paymaster
    receive() external payable {}
}
