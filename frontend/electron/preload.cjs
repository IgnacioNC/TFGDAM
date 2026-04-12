/**
 * Preload script de Electron para SARA.
 *
 * Expone de forma segura (contextBridge) las APIs de Electron al renderer process (React).
 * El renderer nunca tiene acceso directo a Node.js; sólo accede a lo que aquí se expone.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Abre un diálogo del SO para seleccionar un archivo local.
   * @param {Object} options - { title, filters }
   * @returns {Promise<{canceled: boolean, filePath?: string, fileName?: string, buffer?: string, mimeType?: string}>}
   */
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),

  /**
   * Abre un diálogo del SO para guardar un archivo.
   * @param {Object} options - { title, defaultName, filters }
   * @returns {Promise<{canceled: boolean, filePath?: string}>}
   */
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  /**
   * Escribe un archivo en la ruta indicada.
   * @param {string} filePath - Ruta absoluta de destino.
   * @param {string} base64Data - Contenido del archivo en base64.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  writeFile: (filePath, base64Data) => ipcRenderer.invoke('fs:writeFile', { filePath, base64Data }),

  /**
   * Obtiene la URL del backend Spring Boot configurada en el proceso principal.
   * @returns {Promise<string>}
   */
  getBackendUrl: () => ipcRenderer.invoke('config:getBackendUrl'),

  /**
   * Indica que la aplicación se está ejecutando dentro de Electron.
   * Útil para mostrar/ocultar funcionalidades específicas de escritorio.
   */
  isElectron: true,
})
