// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MultiSigWallet
 * @dev A multi-signature wallet contract that requires multiple owner approvals
 *      before executing transactions. Supports ETH transfers, ERC20 token transfers,
 *      and arbitrary contract calls.
 */
contract MultiSigWallet is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Events ============

    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data,
        string description
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);
    event RequirementChanged(uint256 required);

    // ============ State Variables ============

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 submittedAt;
        address submittedBy;
        string description;
    }

    // txIndex => owner => confirmed
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    Transaction[] public transactions;

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultiSig: not owner");
        _;
    }

    modifier onlySelf() {
        require(msg.sender == address(this), "MultiSig: not self");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "MultiSig: tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "MultiSig: tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "MultiSig: tx already confirmed");
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Constructor sets up owners and required confirmations.
     * @param _owners List of initial owners
     * @param _required Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "MultiSig: owners required");
        require(
            _required > 0 && _required <= _owners.length,
            "MultiSig: invalid required number"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "MultiSig: invalid owner");
            require(!isOwner[owner], "MultiSig: owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    // ============ Receive / Fallback ============

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    fallback() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value, address(this).balance);
        }
    }

    // ============ Transaction Functions ============

    /**
     * @dev Submit a new transaction for owners to confirm.
     * @param _to Destination address
     * @param _value ETH value to send
     * @param _data Calldata to send
     * @param _description Human-readable description
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data,
        string calldata _description
    ) external onlyOwner returns (uint256 txIndex) {
        txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                submittedAt: block.timestamp,
                submittedBy: msg.sender,
                description: _description
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data, _description);
    }

    /**
     * @dev Confirm a pending transaction.
     * @param _txIndex Index of the transaction
     */
    function confirmTransaction(uint256 _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev Execute a transaction that has enough confirmations.
     * @param _txIndex Index of the transaction
     */
    function executeTransaction(uint256 _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        nonReentrant
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= required,
            "MultiSig: insufficient confirmations"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "MultiSig: tx execution failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev Revoke a previously given confirmation.
     * @param _txIndex Index of the transaction
     */
    function revokeConfirmation(uint256 _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "MultiSig: tx not confirmed");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    // ============ Owner Management (via self-calls) ============

    /**
     * @dev Add a new owner. Must be called via a confirmed transaction.
     * @param _owner Address of the new owner
     */
    function addOwner(address _owner) external onlySelf {
        require(_owner != address(0), "MultiSig: invalid owner");
        require(!isOwner[_owner], "MultiSig: owner exists");

        isOwner[_owner] = true;
        owners.push(_owner);

        emit OwnerAdded(_owner);
    }

    /**
     * @dev Remove an existing owner. Must be called via a confirmed transaction.
     * @param _owner Address of the owner to remove
     */
    function removeOwner(address _owner) external onlySelf {
        require(isOwner[_owner], "MultiSig: not owner");
        require(owners.length - 1 >= required, "MultiSig: would violate requirement");

        isOwner[_owner] = false;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    /**
     * @dev Change the required confirmations threshold.
     * @param _required New required number
     */
    function changeRequirement(uint256 _required) external onlySelf {
        require(_required > 0 && _required <= owners.length, "MultiSig: invalid required");
        required = _required;
        emit RequirementChanged(_required);
    }

    // ============ ERC20 Helper ============

    /**
     * @dev Encode ERC20 transfer calldata (helper for transaction submission UI).
     * @param _token ERC20 token address
     * @param _to Recipient address
     * @param _amount Token amount (in wei)
     */
    function encodeERC20Transfer(
        address _token,
        address _to,
        uint256 _amount
    ) external pure returns (address to, uint256 value, bytes memory data) {
        to = _token;
        value = 0;
        data = abi.encodeWithSelector(IERC20.transfer.selector, _to, _amount);
    }

    // ============ View Functions ============

    /**
     * @dev Get list of all owners.
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Get total transaction count.
     */
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    /**
     * @dev Get transaction details by index.
     */
    function getTransaction(uint256 _txIndex)
        external
        view
        txExists(_txIndex)
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 submittedAt,
            address submittedBy,
            string memory description
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.submittedAt,
            transaction.submittedBy,
            transaction.description
        );
    }

    /**
     * @dev Get a range of transaction IDs (for pagination).
     * @param _from Start index
     * @param _to End index (exclusive)
     * @param _pending If true, include only pending transactions
     * @param _executed If true, include only executed transactions
     */
    function getTransactionIds(
        uint256 _from,
        uint256 _to,
        bool _pending,
        bool _executed
    ) external view returns (uint256[] memory ids) {
        require(_to <= transactions.length, "MultiSig: out of range");
        require(_from <= _to, "MultiSig: invalid range");

        uint256 count = 0;
        for (uint256 i = _from; i < _to; i++) {
            if (
                (_pending && !transactions[i].executed) ||
                (_executed && transactions[i].executed)
            ) {
                count++;
            }
        }

        ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = _from; i < _to; i++) {
            if (
                (_pending && !transactions[i].executed) ||
                (_executed && transactions[i].executed)
            ) {
                ids[idx] = i;
                idx++;
            }
        }
    }

    /**
     * @dev Check if a transaction has been confirmed by a specific owner.
     */
    function isTransactionConfirmed(uint256 _txIndex, address _owner)
        external
        view
        returns (bool)
    {
        return isConfirmed[_txIndex][_owner];
    }

    /**
     * @dev Get contract ETH balance.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get ERC20 token balance of this wallet.
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Check if address is an owner.
     */
    function checkIsOwner(address _addr) external view returns (bool) {
        return isOwner[_addr];
    }
}
