// tray icon setup and window positioning
const { Tray, Menu, app } = require("electron");
const path = require("path");

let tray = null;

// create the tray and wire up click to toggle the window
const createTray = (window) => {
  const iconPath = path.join(__dirname, "..", "assets", "tray-iconTemplate.png");
  tray = new Tray(iconPath);
  tray.setToolTip("Launchd Helper");

  // right-click context menu with quit option
  const contextMenu = Menu.buildFromTemplate([
    { label: "Quit Launchd Helper", click: () => app.quit() },
  ]);
  tray.on("right-click", () => tray.popUpContextMenu(contextMenu));

  tray.on("click", () => {
    if (window.isVisible()) {
      window.hide();
      return;
    }
    positionWindow(window);
    window.show();
    window.focus();
  });

  return tray;
};

// anchor the window just below the tray icon
const positionWindow = (window) => {
  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height);
  window.setPosition(x, y, false);
};

module.exports = { createTray };
