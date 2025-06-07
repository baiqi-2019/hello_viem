// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../src/BaseERC20.sol";
import "../src/TokenBank.sol";
import "../src/SimpleDelegateContract.sol";

contract DeployScript is Script {
    function run() external {
         // 获取部署私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying contracts to Sepolia...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        
        // 1. 部署ERC20代币
        BaseERC20 token = new BaseERC20();
        console.log("BaseERC20 deployed at:", address(token));
        
        // 2. 部署TokenBank
        TokenBank tokenBank = new TokenBank(address(token));
        console.log("TokenBank deployed at:", address(tokenBank));
        
        // 3. 部署SimpleDelegateContract
        SimpleDelegateContract delegateContract = new SimpleDelegateContract();
        console.log("SimpleDelegateContract deployed at:", address(delegateContract));
        
        // 验证部署
        console.log("\n=== Deployment Summary ===");
        console.log("ERC20 Token:", address(token));
        console.log("Token Bank:", address(tokenBank));
        console.log("Delegate Contract:", address(delegateContract));
        
        // 验证token总供应量
        console.log("Token total supply:", token.totalSupply());
        console.log("Deployer token balance:", token.balanceOf(vm.addr(deployerPrivateKey)));
        
        vm.stopBroadcast();
    }
} 