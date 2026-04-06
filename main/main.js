// electron main process for launchd tray helper
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { createTray } = require("./tray");
const launchd = require("./launchd-service");

let mainWindow = null;

// create the hidden popover window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 550,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  // close popover when it loses focus
  mainWindow.on("blur", () => {
    mainWindow.hide();
  });
};

// wire up ipc handlers that delegate to launchd service
const registerIpcHandlers = () => {
  ipcMain.handle("get-agents", async () => {
    try {
      return await launchd.getAllAgents();
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle("toggle-agent", async (_e, label, domain, enabled) => {
    try {
      await launchd.toggleAgent(label, domain, enabled);
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle("save-agent", async (_e, config) => {
    try {
      await launchd.saveAgent(config);
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle("remove-agent", async (_e, label, domain) => {
    try {
      await launchd.removeAgent(label, domain);
      return { ok: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle("get-agent-detail", async (_e, label, domain) => {
    try {
      return await launchd.getAgentDetail(label, domain);
    } catch (err) {
      return { error: err.message };
    }
  });
};

app.whenReady().then(() => {
  // hide dock icon so it behaves like a menu bar app
  if (app.dock) app.dock.hide();

  createWindow();
  createTray(mainWindow);
  registerIpcHandlers();
});

// keep running when all windows close (tray app stays alive)
app.on("window-all-closed", (e) => {
  e.preventDefault();
});
