const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting AcademicCertificateRegistry deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const RegistryFactory = await hre.ethers.getContractFactory("AcademicCertificateRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("AcademicCertificateRegistry deployed successfully to:", contractAddress);

  // Extract artifact ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/AcademicCertificateRegistry.sol/AcademicCertificateRegistry.json");
  let artifact = { abi: [] };
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  const configData = {
    address: contractAddress,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    abi: artifact.abi
  };

  // Export to Server config
  const serverConfigDir = path.join(__dirname, "../../server/src/config");
  if (!fs.existsSync(serverConfigDir)) {
    fs.mkdirSync(serverConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(serverConfigDir, "contractConfig.json"),
    JSON.stringify(configData, null, 2)
  );
  console.log("Exported contract configuration to server/src/config/contractConfig.json");

  // Export to Client config
  const clientConfigDir = path.join(__dirname, "../../client/src/config");
  if (!fs.existsSync(clientConfigDir)) {
    fs.mkdirSync(clientConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(clientConfigDir, "contractConfig.json"),
    JSON.stringify(configData, null, 2)
  );
  console.log("Exported contract configuration to client/src/config/contractConfig.json");

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});
