const { contextBridge, ipcRenderer } = require("electron")

// Expose a tiny, safe API to the renderer. The web build uses the File System
// Access API; inside Electron this lets us offer a native folder dialog too.
contextBridge.exposeInMainWorld("desktop", {
  isElectron: true,
  chooseDirectory: () => ipcRenderer.invoke("choose-directory"),
})
