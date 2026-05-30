const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron")
const path = require("path")
const http = require("http")
const fs = require("fs")

const isDev = !app.isPackaged
const DEV_URL = process.env.ELECTRON_DEV_URL || "http://localhost:3000"

// Minimal static file server used in production to serve the exported Next.js
// site from the packaged "out" directory. This avoids file:// asset path issues.
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".map": "application/json; charset=utf-8",
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0])
        let filePath = path.join(rootDir, urlPath)

        // Default document
        if (urlPath === "/" || urlPath.endsWith("/")) {
          filePath = path.join(rootDir, urlPath, "index.html")
        }

        // Static export fallback: try ".html" then the directory's index.html
        if (!fs.existsSync(filePath)) {
          if (fs.existsSync(filePath + ".html")) {
            filePath = filePath + ".html"
          } else if (fs.existsSync(path.join(filePath, "index.html"))) {
            filePath = path.join(filePath, "index.html")
          } else {
            filePath = path.join(rootDir, "index.html")
          }
        }

        const ext = path.extname(filePath).toLowerCase()
        const data = fs.readFileSync(filePath)
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" })
        res.end(data)
      } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain" })
        res.end("Not found")
      }
    })
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      resolve(`http://127.0.0.1:${port}`)
    })
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#0a0a0a",
    show: false,
    autoHideMenuBar: true,
    title: "Vibe Motion Pro",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once("ready-to-show", () => win.show())

  // Open external links in the user's default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" }
    }
    shell.openExternal(url)
    return { action: "deny" }
  })

  if (isDev) {
    await win.loadURL(DEV_URL)
    win.webContents.openDevTools({ mode: "detach" })
  } else {
    const outDir = path.join(process.resourcesPath, "out")
    const baseUrl = await startStaticServer(outDir)
    await win.loadURL(baseUrl)
  }
}

// Let the renderer pick a default save directory through a native dialog
ipcMain.handle("choose-directory", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose Render Output Folder",
    properties: ["openDirectory", "createDirectory"],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

app.whenReady().then(createWindow)

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
