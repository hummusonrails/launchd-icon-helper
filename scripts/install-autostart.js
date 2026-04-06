// installs a launchagent plist so the app runs on login
const fs = require('fs')
const path = require('path')
const os = require('os')
const plist = require('plist')

const label = 'com.bengreenberg.launchd-icon-helper'
const plistDir = path.join(os.homedir(), 'Library/LaunchAgents')
const plistPath = path.join(plistDir, `${label}.plist`)

// figure out the electron binary path
const appPath = process.env.npm_package_json
  ? path.resolve(path.dirname(process.env.npm_package_json), 'node_modules/.bin/electron')
  : path.resolve(__dirname, '..', 'node_modules/.bin/electron')

const mainPath = path.resolve(__dirname, '..', 'main/main.js')

const config = {
  Label: label,
  ProgramArguments: [appPath, mainPath],
  RunAtLoad: true,
  KeepAlive: false,
}

if (!fs.existsSync(plistDir)) {
  fs.mkdirSync(plistDir, { recursive: true })
}

fs.writeFileSync(plistPath, plist.build(config), 'utf8')
console.log(`installed autostart plist at ${plistPath}`)

// load it now
const { execSync } = require('child_process')
try {
  execSync(`launchctl load -w "${plistPath}"`)
  console.log('loaded into launchd')
} catch {
  console.log('note: load failed, may need to run manually')
}
