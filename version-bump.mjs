import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

// Read minAppVersion from manifest.json and update version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// Update versions.json with target version and minAppVersion
let versions = {};
try {
  versions = JSON.parse(readFileSync("versions.json", "utf8"));
} catch {}
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
