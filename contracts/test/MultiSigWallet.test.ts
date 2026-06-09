import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MultiSigWallet, MultiSigFactory } from "../typechain-types";

describe("MultiSigWallet", () => {
  let wallet: MultiSigWallet;
  let factory: MultiSigFactory;
  let owner1: HardhatEthersSigner;
  let owner2: HardhatEthersSigner;
  let owner3: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;

  const REQUIRED = 2;

  beforeEach(async () => {
    [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();

    const MultiSigFactory = await ethers.getContractFactory("MultiSigFactory");
    factory = await MultiSigFactory.deploy();

    const owners = [owner1.address, owner2.address, owner3.address];
    const salt = ethers.keccak256(ethers.toUtf8Bytes("test-wallet"));
    const tx = await factory.createWallet(owners, REQUIRED, salt);
    const receipt = await tx.wait();

    let walletAddress: string | undefined;
    const iface = MultiSigFactory.interface;
    for (const log of receipt!.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "WalletCreated") {
          walletAddress = parsed.args[0];
          break;
        }
      } catch (_) {}
    }

    wallet = await ethers.getContractAt("MultiSigWallet", walletAddress!);
  });

  // ─── Deployment ────────────────────────────────────────────────────────────

  describe("Deployment", () => {
    it("should set correct owners", async () => {
      const owners = await wallet.getOwners();
      expect(owners).to.deep.equal([owner1.address, owner2.address, owner3.address]);
    });

    it("should set correct required", async () => {
      expect(await wallet.required()).to.equal(REQUIRED);
    });

    it("should mark all owners as isOwner", async () => {
      expect(await wallet.isOwner(owner1.address)).to.be.true;
      expect(await wallet.isOwner(owner2.address)).to.be.true;
      expect(await wallet.isOwner(owner3.address)).to.be.true;
      expect(await wallet.isOwner(nonOwner.address)).to.be.false;
    });

    it("should reject 0 owners", async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([], 1)
      ).to.be.revertedWith("MultiSig: owners required");
    });

    it("should reject required > owners.length", async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([owner1.address, owner2.address], 3)
      ).to.be.revertedWith("MultiSig: invalid required number");
    });

    it("should reject required = 0", async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([owner1.address], 0)
      ).to.be.revertedWith("MultiSig: invalid required number");
    });

    it("should reject duplicate owners", async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([owner1.address, owner1.address], 1)
      ).to.be.revertedWith("MultiSig: owner not unique");
    });

    it("should reject zero address owner", async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet");
      await expect(
        MultiSigWalletFactory.deploy([ethers.ZeroAddress], 1)
      ).to.be.revertedWith("MultiSig: invalid owner");
    });
  });

  // ─── Receive ETH ───────────────────────────────────────────────────────────

  describe("Receive ETH", () => {
    it("should accept ETH deposits and emit Deposit event", async () => {
      const amount = ethers.parseEther("1.0");
      await expect(
        owner1.sendTransaction({ to: await wallet.getAddress(), value: amount })
      )
        .to.emit(wallet, "Deposit")
        .withArgs(owner1.address, amount, amount);
    });

    it("should correctly report balance", async () => {
      const amount = ethers.parseEther("2.0");
      await owner1.sendTransaction({ to: await wallet.getAddress(), value: amount });
      expect(await wallet.getBalance()).to.equal(amount);
    });
  });

  // ─── Submit Transaction ────────────────────────────────────────────────────

  describe("submitTransaction", () => {
    it("should submit a transaction and emit event", async () => {
      const to = nonOwner.address;
      const value = ethers.parseEther("0.1");
      await expect(
        wallet.connect(owner1).submitTransaction(to, value, "0x", "Send ETH")
      )
        .to.emit(wallet, "SubmitTransaction")
        .withArgs(owner1.address, 0, to, value, "0x", "Send ETH");
    });

    it("should increment transaction count", async () => {
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x", "test");
      expect(await wallet.getTransactionCount()).to.equal(1);
    });

    it("should revert if non-owner submits", async () => {
      await expect(
        wallet.connect(nonOwner).submitTransaction(nonOwner.address, 0, "0x", "test")
      ).to.be.revertedWith("MultiSig: not owner");
    });
  });

  // ─── Confirm Transaction ───────────────────────────────────────────────────

  describe("confirmTransaction", () => {
    beforeEach(async () => {
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x", "test");
    });

    it("should confirm a transaction", async () => {
      await expect(wallet.connect(owner1).confirmTransaction(0))
        .to.emit(wallet, "ConfirmTransaction")
        .withArgs(owner1.address, 0);

      const tx = await wallet.getTransaction(0);
      expect(tx.numConfirmations).to.equal(1);
    });

    it("should not allow double confirmation", async () => {
      await wallet.connect(owner1).confirmTransaction(0);
      await expect(
        wallet.connect(owner1).confirmTransaction(0)
      ).to.be.revertedWith("MultiSig: tx already confirmed");
    });

    it("should revert for non-existent transaction", async () => {
      await expect(wallet.connect(owner1).confirmTransaction(99)).to.be.revertedWith(
        "MultiSig: tx does not exist"
      );
    });

    it("should revert if non-owner confirms", async () => {
      await expect(
        wallet.connect(nonOwner).confirmTransaction(0)
      ).to.be.revertedWith("MultiSig: not owner");
    });
  });

  // ─── Execute Transaction ───────────────────────────────────────────────────

  describe("executeTransaction", () => {
    const sendAmount = ethers.parseEther("0.5");

    beforeEach(async () => {
      await owner1.sendTransaction({
        to: await wallet.getAddress(),
        value: ethers.parseEther("1.0"),
      });
      await wallet.connect(owner1).submitTransaction(nonOwner.address, sendAmount, "0x", "payment");
    });

    it("should execute after reaching threshold", async () => {
      const balanceBefore = await ethers.provider.getBalance(nonOwner.address);
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);

      await expect(wallet.connect(owner1).executeTransaction(0))
        .to.emit(wallet, "ExecuteTransaction")
        .withArgs(owner1.address, 0);

      const balanceAfter = await ethers.provider.getBalance(nonOwner.address);
      expect(balanceAfter - balanceBefore).to.equal(sendAmount);
    });

    it("should revert if insufficient confirmations", async () => {
      await wallet.connect(owner1).confirmTransaction(0);
      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: insufficient confirmations");
    });

    it("should revert double execution", async () => {
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: tx already executed");
    });

    it("should revert if non-owner executes", async () => {
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await expect(
        wallet.connect(nonOwner).executeTransaction(0)
      ).to.be.revertedWith("MultiSig: not owner");
    });
  });

  // ─── Revoke Confirmation ───────────────────────────────────────────────────

  describe("revokeConfirmation", () => {
    beforeEach(async () => {
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x", "test");
      await wallet.connect(owner1).confirmTransaction(0);
    });

    it("should revoke a confirmation", async () => {
      await expect(wallet.connect(owner1).revokeConfirmation(0))
        .to.emit(wallet, "RevokeConfirmation")
        .withArgs(owner1.address, 0);

      const tx = await wallet.getTransaction(0);
      expect(tx.numConfirmations).to.equal(0);
      expect(await wallet.isConfirmed(0, owner1.address)).to.be.false;
    });

    it("should revert if not confirmed", async () => {
      await expect(
        wallet.connect(owner2).revokeConfirmation(0)
      ).to.be.revertedWith("MultiSig: tx not confirmed");
    });
  });

  // ─── Owner Management ─────────────────────────────────────────────────────

  describe("addOwner / removeOwner / changeRequirement", () => {
    it("addOwner via self-call", async () => {
      const data = wallet.interface.encodeFunctionData("addOwner", [nonOwner.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, "add owner");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      expect(await wallet.isOwner(nonOwner.address)).to.be.true;
      expect((await wallet.getOwners()).length).to.equal(4);
    });

    it("removeOwner via self-call", async () => {
      const data = wallet.interface.encodeFunctionData("removeOwner", [owner3.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, "remove owner");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      expect(await wallet.isOwner(owner3.address)).to.be.false;
      expect((await wallet.getOwners()).length).to.equal(2);
    });

    it("changeRequirement via self-call", async () => {
      const data = wallet.interface.encodeFunctionData("changeRequirement", [3]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, "change req");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      expect(await wallet.required()).to.equal(3);
    });

    it("cannot removeOwner if it would violate required", async () => {
      // 3 owners, required=2. Remove 2 owners first would leave 1 owner < required=2
      const data = wallet.interface.encodeFunctionData("removeOwner", [owner3.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data, "remove");
      await wallet.connect(owner1).confirmTransaction(0);
      await wallet.connect(owner2).confirmTransaction(0);
      await wallet.connect(owner1).executeTransaction(0);

      // Now 2 owners, required=2. Try to remove another → should fail
      const data2 = wallet.interface.encodeFunctionData("removeOwner", [owner2.address]);
      await wallet.connect(owner1).submitTransaction(await wallet.getAddress(), 0, data2, "remove2");
      await wallet.connect(owner1).confirmTransaction(1);
      await wallet.connect(owner2).confirmTransaction(1);
      await expect(
        wallet.connect(owner1).executeTransaction(1)
      ).to.be.revertedWith("MultiSig: tx execution failed");
    });
  });

  // ─── getTransactionIds ─────────────────────────────────────────────────────

  describe("getTransactionIds", () => {
    beforeEach(async () => {
      await owner1.sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") });
      // tx 0: pending
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x", "tx0");
      // tx 1: executed
      await wallet.connect(owner1).submitTransaction(nonOwner.address, 0, "0x", "tx1");
      await wallet.connect(owner1).confirmTransaction(1);
      await wallet.connect(owner2).confirmTransaction(1);
      await wallet.connect(owner1).executeTransaction(1);
    });

    it("should return pending transaction ids", async () => {
      const ids = await wallet.getTransactionIds(0, 2, true, false);
      expect(ids.map((id) => Number(id))).to.deep.equal([0]);
    });

    it("should return executed transaction ids", async () => {
      const ids = await wallet.getTransactionIds(0, 2, false, true);
      expect(ids.map((id) => Number(id))).to.deep.equal([1]);
    });

    it("should return all transaction ids", async () => {
      const ids = await wallet.getTransactionIds(0, 2, true, true);
      expect(ids.map((id) => Number(id))).to.deep.equal([0, 1]);
    });
  });
});

// ─── MultiSigFactory ──────────────────────────────────────────────────────────

describe("MultiSigFactory", () => {
  let factory: MultiSigFactory;
  let owner1: HardhatEthersSigner;
  let owner2: HardhatEthersSigner;
  let owner3: HardhatEthersSigner;

  beforeEach(async () => {
    [owner1, owner2, owner3] = await ethers.getSigners();
    const MultiSigFactoryContract = await ethers.getContractFactory("MultiSigFactory");
    factory = await MultiSigFactoryContract.deploy();
  });

  it("should create wallet and track it", async () => {
    const owners = [owner1.address, owner2.address];
    const salt = ethers.keccak256(ethers.toUtf8Bytes("factory-test"));
    await factory.createWallet(owners, 2, salt);

    const wallets = await factory.getWallets(owner1.address);
    expect(wallets.length).to.equal(1);
    expect(await factory.isWallet(wallets[0])).to.be.true;
  });

  it("should compute address deterministically", async () => {
    const owners = [owner1.address, owner2.address];
    const salt = ethers.keccak256(ethers.toUtf8Bytes("deterministic"));

    const predicted = await factory.computeAddress(owners, 2, salt);
    const tx = await factory.createWallet(owners, 2, salt);
    const receipt = await tx.wait();

    let actual: string | undefined;
    const iface = (await ethers.getContractFactory("MultiSigFactory")).interface;
    for (const log of receipt!.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "WalletCreated") {
          actual = parsed.args[0];
          break;
        }
      } catch (_) {}
    }

    expect(actual).to.equal(predicted);
  });

  it("should emit WalletCreated event", async () => {
    const owners = [owner1.address, owner2.address, owner3.address];
    const salt = ethers.keccak256(ethers.toUtf8Bytes("event-test"));

    await expect(factory.createWallet(owners, 2, salt)).to.emit(factory, "WalletCreated");
  });

  it("should revert on empty owners", async () => {
    await expect(
      factory.createWallet([], 1, ethers.keccak256(ethers.toUtf8Bytes("x")))
    ).to.be.revertedWith("Factory: owners required");
  });

  it("should revert on invalid required", async () => {
    await expect(
      factory.createWallet([owner1.address], 5, ethers.keccak256(ethers.toUtf8Bytes("x")))
    ).to.be.revertedWith("Factory: invalid required");
  });
});
