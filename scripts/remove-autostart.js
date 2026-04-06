// removes the autostart launchagent plist
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const label = 'com.bengreenberg.launchd-icon-helper'
const plistPath = path.join(os.homedir(), 'Library/LaunchAgents', `${label}.plist`)

try {
  execSync(`launchctl unload "${plistPath}"`)
  console.log('unloaded from launchd')
} catch {
  // may not be loaded
}

try {
  fs.unlinkSync(plistPath)
  console.log(`removed ${plistPath}`)
} catch {
  console.log('plist not found, nothing to remove')
}
