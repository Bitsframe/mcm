const fs = require("fs");
const path = require("path");

/**
 * Path to the Infisical CLI binary bundled with @infisical/cli.
 * @returns {string | null}
 */
function getInfisicalBinPath() {
  const binDir = path.join(__dirname, "..", "node_modules", "@infisical", "cli", "bin");
  const candidates =
    process.platform === "win32"
      ? ["infisical.exe", "infisical.cmd", "infisical"]
      : ["infisical"];

  for (const name of candidates) {
    const full = path.join(binDir, name);
    if (fs.existsSync(full)) {
      const stat = fs.statSync(full);
      if (stat.isFile() && stat.size > 0) {
        return full;
      }
    }
  }
  return null;
}

module.exports = { getInfisicalBinPath };
