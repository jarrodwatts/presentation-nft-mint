// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Transaction} from "./IPaymaster.sol";

library TransactionHelper {
    function payToTheBootloader(Transaction calldata _transaction) internal returns (bool success) {
        address bootloaderAddr = address(0x8001);
        uint256 amount = _transaction.gasLimit * _transaction.maxFeePerGas;
        (success, ) = bootloaderAddr.call{value: amount}("");
    }
}
