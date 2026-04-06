#!/usr/bin/env node

/**
 * generate-icons.js
 *
 * Regenerates PNG icon assets from SVG sources using macOS qlmanage + sips.
 * Run from the project root: node scripts/generate-icons.js
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ASSETS = path.resolve(__dirname, "..", "assets");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function convert(svgName, pngName, size) {
  const svgPath = path.join(ASSETS, svgName);
  if (!fs.existsSync(svgPath)) {
    console.error(`SVG not found: ${svgPath}`);
    process.exit(1);
  }

  // qlmanage outputs <name>.png in the target directory
  run(`/usr/bin/qlmanage -t -s ${size} -o "${ASSETS}" "${svgPath}"`);

  const qlOutput = path.join(ASSETS, `${svgName}.png`);
  const finalPath = path.join(ASSETS, pngName);

  fs.renameSync(qlOutput, finalPath);

  // Ensure exact pixel dimensions
  run(`sips -z ${size} ${size} "${finalPath}"`);

  console.log(`Created ${pngName} (${size}x${size})`);
}

// Main app icon - 512x512
convert("icon.svg", "icon.png", 512);

// Tray template icon - 22x22 (1x)
convert("tray-icon.svg", "tray-iconTemplate.png", 22);

// Tray template icon - 44x44 (2x Retina)
convert("tray-icon.svg", "tray-iconTemplate@2x.png", 44);

console.log("\nAll icons generated successfully.");
