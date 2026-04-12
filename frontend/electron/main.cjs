/**
 * Electron main process para SARA (Sistema de Autogestión de Resultados del Aprendizaje).
 *
 * Carga la interfaz React (build de producción) y provee acceso al sistema de archivos
 * local para importar y exportar documentos de evaluación.
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// Detecta si está en modo desarrollo (npm run electron:dev)
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

const BACKEND_URL = process.env.SARA_BACKEND_URL || 'http://localhost:8080'
const DEV_SERVER_URL = process.env.VITE_DEV_URL || 'http://localhost:5173'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SARA - Sistema de Autogestión de Resultados del Aprendizaje',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    // En desarrollo carga el servidor de Vite
    mainWindow.loadURL(DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // En producción carga el build estático
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Abre enlaces externos en el navegador por defecto, no en Electron
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// IPC handlers — comunicación renderer <-> main process
// ---------------------------------------------------------------------------

/**
 * Abre un diálogo para seleccionar un archivo y devuelve su ruta y contenido.
 * Permite al usuario importar PDFs o Excel desde el sistema de archivos local.
 */
ipcMain.handle('dialog:openFile', async (_event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Seleccionar archivo',
    filters: options.filters || [
      { name: 'Documentos', extensions: ['pdf', 'xlsx'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Excel', extensions: ['xlsx'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const filePath = result.filePaths[0]
  const fileName = path.basename(filePath)
  const buffer = fs.readFileSync(filePath)

  return {
    canceled: false,
    filePath,
    fileName,
    buffer: buffer.toString('base64'),
    mimeType: fileName.endsWith('.pdf') ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
})

/**
 * Abre un diálogo para guardar un archivo (por ejemplo, Excel exportado).
 */
ipcMain.handle('dialog:saveFile', async (_event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Guardar archivo',
    defaultPath: options.defaultName || 'export.xlsx',
    filters: options.filters || [
      { name: 'Excel', extensions: ['xlsx'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  return { canceled: false, filePath: result.filePath }
})

/**
 * Escribe bytes (base64) en un archivo del sistema local.
 */
ipcMain.handle('fs:writeFile', async (_event, { filePath, base64Data }) => {
  try {
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

/**
 * Devuelve la URL del backend configurada para que el renderer la use.
 */
ipcMain.handle('config:getBackendUrl', () => BACKEND_URL)

// ---------------------------------------------------------------------------
// Ciclo de vida de la aplicación
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // macOS: vuelve a crear la ventana si se hace click en el dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // En macOS la app permanece activa hasta que el usuario la cierra explícitamente
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
