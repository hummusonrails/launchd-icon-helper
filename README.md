<!-- Banner -->
<p align="center">
  <img src=".github/banner.svg" alt="launchd-helper" width="100%">
</p>

<!-- Badge row -->
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-8B5CF6.svg?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/electron-33-C4B5FD.svg?style=flat-square" alt="Electron">
  <img src="https://img.shields.io/badge/react-19-61DAFB.svg?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/platform-macOS-lightgrey.svg?style=flat-square" alt="macOS">
  <a href="https://github.com/hummusonrails/launchd-icon-helper/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"></a>
</p>

<!-- One-liner + nav -->
<p align="center">
  <strong>A macOS menu bar app that lets you view, create, edit, and remove launchd services without touching a single plist file.</strong>
  <br>
  <a href="#quick-start">Quick Start</a> · <a href="#usage">Usage</a> · <a href="https://github.com/hummusonrails/launchd-icon-helper/issues">Report a Bug</a>
</p>

## What it does

- **Browse** all your launchd agents and daemons from a single popover window
- **Toggle** services on and off with a switch — no terminal commands needed
- **Edit** schedules, programs, and options using plain-English dropdowns
- **Create** new agents with a friendly form that generates the plist for you
- **Remove** agents safely with a confirmation step
- **Manage** user agents, system agents, and system daemons in clearly separated sections

## Quick Start

```bash
git clone https://github.com/hummusonrails/launchd-icon-helper.git
cd launchd-icon-helper
npm install
npm run dev
```

To run on login automatically:

```bash
npm run install-autostart
```

To stop running on login:

```bash
npm run remove-autostart
```

## Stack

| Layer          | Tool          | Notes                                        |
| :------------- | :------------ | :------------------------------------------- |
| Framework      | Electron 33   | Menu bar tray app, no dock icon              |
| UI             | React 19      | Popover window with dark macOS styling       |
| Bundler        | Vite 6        | Fast builds for the renderer process         |
| Plist parsing  | plist (npm)   | Reads and writes macOS property list files   |
| Privilege escalation | osascript | Native macOS admin prompt for system services |

<details>
<summary><strong>Prerequisites</strong></summary>

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- macOS (launchd is macOS-only)

</details>

## Usage

Click the daemon icon in your menu bar to open the popover. You'll see three sections:

- **My Agents** — your personal launch agents (`~/Library/LaunchAgents`)
- **System Agents** — system-wide agents shared across users (`/Library/LaunchAgents`)
- **System Services** — low-level system daemons (`/Library/LaunchDaemons`)

Each service shows its name, status (Running/Stopped), and a toggle switch. Click any service to expand its detail panel where you can edit:

- **What to run** — the program or script path
- **When to run** — On startup, On a schedule, When a file changes, or Only when needed
- **Restart if it stops** — keep-alive toggle
- **Output logs** — stdout and stderr file paths

System services show a lock icon and require admin credentials to edit.

Hit the **+** button to create a new agent with a friendly form.

## Project structure

```
launchd-icon-helper/
├── main/
│   ├── main.js              # electron main process
│   ├── preload.js           # ipc bridge to renderer
│   ├── tray.js              # tray icon and window positioning
│   └── launchd-service.js   # plist read/write and launchctl ops
├── src/
│   ├── index.html           # renderer shell
│   ├── main.jsx             # react entry point
│   ├── App.jsx              # root component
│   ├── components/
│   │   ├── TopBar.jsx       # search and add button
│   │   ├── AgentSection.jsx # collapsible domain group
│   │   ├── AgentItem.jsx    # single agent row
│   │   ├── DetailPanel.jsx  # expanded edit form
│   │   └── AddNew.jsx       # new agent modal
│   └─�� styles/
│       └── app.css          # dark mode macos styling
├── assets/
│   ├── icon.svg             # app icon (daemon character)
│   ├── icon.png             # app icon png
│   └── tray-iconTemplate.png # menu bar template icon
├── scripts/
│   ├── install-autostart.js # add login item
│   └── remove-autostart.js  # remove login item
├── package.json
├── vite.config.js
└── LICENSE
```

## Contributing

Contributions welcome. Open an [issue](https://github.com/hummusonrails/launchd-icon-helper/issues) or submit a pull request.

## License

[MIT](LICENSE)
