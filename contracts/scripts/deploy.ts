import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  chainId: number;
  timestamp: string;
  factory: string;
  sampleWallet?: string;
  deployer: string;
  blockNumber: number;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("=".repeat(60));
  console.log("MINs MultiSig Platform - Deployment");
  console.log("=".repeat(60));
  console.log(`Network:  ${networkName} (chainId: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );
  console.log("=".repeat(60));

  // ─── Deploy MultiSigFactory ───────────────────────────────────────────────

  console.log("\n[1/2] Deploying MultiSigFactory...");
  const MultiSigFactory = await ethers.getContractFactory("MultiSigFactory");
  const factory = await MultiSigFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`   ✓ MultiSigFactory deployed at: ${factoryAddress}`);

  // ─── Create a sample 2-of-3 MultiSigWallet ───────────────────────────────

  let sampleWalletAddress: string | undefined;

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\n[2/2] Creating sample 2-of-3 MultiSigWallet...");

    const signers = await ethers.getSigners();
    const owners = [
      signers[0].address,
      signers[1].address,
      signers[2].address,
    ];
    const required = 2;
    const salt = ethers.keccak256(ethers.toUtf8Bytes("sample-wallet-v1"));

    const tx = await factory.createWallet(owners, required, salt);
    const receipt = await tx.wait();

    // Parse event to find wallet address
    const iface = MultiSigFactory.interface;
    for (const log of receipt!.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "WalletCreated") {
          sampleWalletAddress = parsed.args[0];
          break;
        }
      } catch (_) {
        // skip unparseable logs
      }
    }

    console.log(`   ✓ Sample wallet created at: ${sampleWalletAddress}`);
    console.log(`   ✓ Owners: ${owners.join(", ")}`);
    console.log(`   ✓ Required: ${required}-of-${owners.length}`);
  } else {
    console.log("\n[2/2] Skipping sample wallet creation on live network.");
  }

  // ─── Save deployment info ─────────────────────────────────────────────────

  const blockNumber = await ethers.provider.getBlockNumber();

  const deploymentInfo: DeploymentInfo = {
    network: networkName,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    factory: factoryAddress,
    sampleWallet: sampleWalletAddress,
    deployer: deployer.address,
    blockNumber,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // Also write/update a combined deployments.json
  const combinedPath = path.join(__dirname, "..", "deployments.json");
  let combined: Record<string, DeploymentInfo> = {};
  if (fs.existsSync(combinedPath)) {
    combined = JSON.parse(fs.readFileSync(combinedPath, "utf-8"));
  }
  combined[networkName] = deploymentInfo;
  fs.writeFileSync(combinedPath, JSON.stringify(combined, null, 2));

  console.log("\n=".repeat(60));
  console.log("Deployment complete!");
  console.log(`Saved to: ${deploymentPath}`);
  console.log("=".repeat(60));
  console.log("\nSummary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Copy ABI to frontend
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const frontendAbisDir = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "lib",
    "contracts",
    "abis"
  );

  if (fs.existsSync(frontendAbisDir)) {
    const walletArtifact = path.join(
      artifactsDir,
      "MultiSigWallet.sol",
      "MultiSigWallet.json"
    );
    const factoryArtifact = path.join(
      artifactsDir,
      "MultiSigFactory.sol",
      "MultiSigFactory.json"
    );

    if (fs.existsSync(walletArtifact)) {
      const walletJson = JSON.parse(fs.readFileSync(walletArtifact, "utf-8"));
      fs.writeFileSync(
        path.join(frontendAbisDir, "MultiSigWallet.json"),
        JSON.stringify(walletJson.abi, null, 2)
      );
      console.log("   ✓ Copied MultiSigWallet ABI to frontend");
    }

    if (fs.existsSync(factoryArtifact)) {
      const factoryJson = JSON.parse(fs.readFileSync(factoryArtifact, "utf-8"));
      fs.writeFileSync(
        path.join(frontendAbisDir, "MultiSigFactory.json"),
        JSON.stringify(factoryJson.abi, null, 2)
      );
      console.log("   ✓ Copied MultiSigFactory ABI to frontend");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
