// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiSigWallet.sol";

/**
 * @title MultiSigFactory
 * @dev Factory contract for deploying MultiSigWallet instances using CREATE2.
 *      Tracks deployed wallets per user and allows deterministic address computation.
 */
contract MultiSigFactory {
    // ============ Events ============

    event WalletCreated(
        address indexed wallet,
        address indexed creator,
        address[] owners,
        uint256 required,
        bytes32 salt
    );

    // ============ State Variables ============

    /// @dev Mapping from user address to list of wallets they are associated with
    mapping(address => address[]) private userWallets;

    /// @dev All deployed wallet addresses
    address[] public allWallets;

    /// @dev Whether an address is a wallet deployed by this factory
    mapping(address => bool) public isWallet;

    // ============ Functions ============

    /**
     * @dev Deploy a new MultiSigWallet using CREATE2 for deterministic addresses.
     * @param _owners List of owner addresses
     * @param _required Number of required confirmations
     * @param _salt Unique salt for CREATE2 deployment
     * @return wallet Address of the deployed wallet
     */
    function createWallet(
        address[] calldata _owners,
        uint256 _required,
        bytes32 _salt
    ) external returns (address wallet) {
        require(_owners.length > 0, "Factory: owners required");
        require(
            _required > 0 && _required <= _owners.length,
            "Factory: invalid required"
        );

        // Encode constructor arguments
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners, _required)
        );

        // Deploy using CREATE2
        assembly {
            wallet := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
        }

        require(wallet != address(0), "Factory: deployment failed");

        // Track wallet per each owner
        for (uint256 i = 0; i < _owners.length; i++) {
            userWallets[_owners[i]].push(wallet);
        }

        // Also track for creator if not already an owner
        bool creatorIsOwner = false;
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == msg.sender) {
                creatorIsOwner = true;
                break;
            }
        }
        if (!creatorIsOwner) {
            userWallets[msg.sender].push(wallet);
        }

        allWallets.push(wallet);
        isWallet[wallet] = true;

        emit WalletCreated(wallet, msg.sender, _owners, _required, _salt);
    }

    /**
     * @dev Get all wallets associated with a user (as owner or creator).
     * @param _user Address to query
     * @return Array of wallet addresses
     */
    function getWallets(address _user) external view returns (address[] memory) {
        return userWallets[_user];
    }

    /**
     * @dev Get total number of deployed wallets.
     */
    function getWalletCount() external view returns (uint256) {
        return allWallets.length;
    }

    /**
     * @dev Compute the CREATE2 address for a wallet before deployment.
     * @param _owners List of owner addresses
     * @param _required Number of required confirmations
     * @param _salt Salt for CREATE2
     * @return predicted Predicted wallet address
     */
    function computeAddress(
        address[] calldata _owners,
        uint256 _required,
        bytes32 _salt
    ) external view returns (address predicted) {
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners, _required)
        );
        bytes32 bytecodeHash = keccak256(bytecode);

        predicted = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            _salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }

    /**
     * @dev Get all deployed wallet addresses (paginated).
     * @param _from Start index
     * @param _to End index (exclusive)
     */
    function getAllWallets(uint256 _from, uint256 _to)
        external
        view
        returns (address[] memory)
    {
        require(_to <= allWallets.length, "Factory: out of range");
        require(_from <= _to, "Factory: invalid range");

        address[] memory result = new address[](_to - _from);
        for (uint256 i = _from; i < _to; i++) {
            result[i - _from] = allWallets[i];
        }
        return result;
    }
}
