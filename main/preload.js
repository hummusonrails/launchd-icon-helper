// exposes ipc methods to renderer via context bridge
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("launchd", {
  // fetch all agents from every domain
  getAgents: () => ipcRenderer.invoke("get-agents"),

  // enable or disable an agent
  toggleAgent: (label, domain, enabled) =>
    ipcRenderer.invoke("toggle-agent", label, domain, enabled),

  // save or create a plist from config
  saveAgent: (config) => ipcRenderer.invoke("save-agent", config),

  // remove an agent plist
  removeAgent: (label, domain) =>
    ipcRenderer.invoke("remove-agent", label, domain),

  // read full detail for one agent
  getAgentDetail: (label, domain) =>
    ipcRenderer.invoke("get-agent-detail", label, domain),

  // quit the app
  quit: () => ipcRenderer.invoke("quit-app"),
});
