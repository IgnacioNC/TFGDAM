import { isRunningInElectron } from '../lib/api'

/**
 * Vista de importacion de archivos (PDF para extraccion de RAs, XLSX para importacion completa).
 * En Electron ofrece un botón para abrir el explorador de archivos nativo del SO.
 */
function ImportView({
  busy,
  isAuthenticated,
  importForm,
  setImportForm,
  importJobId,
  setImportJobId,
  importJobData,
  detectedRas,
  onCreateImportJob,
  onLoadImportJob,
  onUpdateDetectedRa,
  onPersistDetectedRas,
}) {
  const inElectron = isRunningInElectron()

  /**
   * Abre el diálogo nativo de archivos de Electron y crea un File object
   * compatible con el flujo de importación estándar (FormData).
   */
  const onOpenNativeFilePicker = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.openFile({
        title: 'Seleccionar PDF o Excel para importar',
        filters: [
          { name: 'Documentos soportados', extensions: ['pdf', 'xlsx'] },
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Excel', extensions: ['xlsx'] },
        ],
      })

      if (result.canceled) return

      // Convierte el buffer base64 a un File object para que el resto del flujo funcione igual
      const byteArray = Uint8Array.from(atob(result.buffer), (c) => c.charCodeAt(0))
      const blob = new Blob([byteArray], { type: result.mimeType })
      const file = new File([blob], result.fileName, { type: result.mimeType })

      setImportForm((prev) => ({ ...prev, file }))
    } catch (err) {
      console.error('Error abriendo el explorador de archivos:', err)
    }
  }

  return (
    <section className="panel">
      <h2>Importacion PDF/XLSX</h2>
      <form className="grid two" onSubmit={onCreateImportJob}>
        <label>
          Modulo (ID)
          <input
            value={importForm.moduleId}
            onChange={(e) => setImportForm((p) => ({ ...p, moduleId: e.target.value }))}
            placeholder="Ej: 1"
          />
        </label>
        <label>
          Archivo
          {inElectron ? (
            <div className="inline-actions" style={{ marginTop: '4px' }}>
              <button
                type="button"
                onClick={onOpenNativeFilePicker}
                disabled={busy || !isAuthenticated}
              >
                Explorador de archivos
              </button>
              {importForm.file && (
                <span className="file-selected">
                  {importForm.file.name}
                </span>
              )}
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf,.xlsx"
              onChange={(e) => setImportForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
              required
            />
          )}
        </label>
        <button type="submit" disabled={busy || !isAuthenticated}>
          Subir y extraer
        </button>
      </form>
      <p>
        PDF: requiere modulo ID y crea un job de extraccion de RAs con el modulo Python.
        XLSX: si indicas modulo ID existente lo reemplaza; si lo dejas vacio crea un modulo nuevo.
      </p>

      <form className="inline-actions" onSubmit={onLoadImportJob}>
        <input
          placeholder="Job ID"
          value={importJobId}
          onChange={(e) => setImportJobId(e.target.value)}
          required
        />
        <button type="submit" disabled={busy || !isAuthenticated}>
          Consultar job
        </button>
      </form>

      {importJobData && <pre className="console">{JSON.stringify(importJobData, null, 2)}</pre>}

      {detectedRas.length > 0 && (
        <div className="report-wrap">
          <h3>RAs detectados — revisa y confirma</h3>
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Peso %</th>
              </tr>
            </thead>
            <tbody>
              {detectedRas.map((ra) => (
                <tr key={ra.id}>
                  <td>
                    <input value={ra.code} onChange={(e) => onUpdateDetectedRa(ra.id, 'code', e.target.value)} />
                  </td>
                  <td>
                    <input value={ra.name} onChange={(e) => onUpdateDetectedRa(ra.id, 'name', e.target.value)} />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={ra.weightPercent}
                      onChange={(e) => onUpdateDetectedRa(ra.id, 'weightPercent', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="inline-actions">
            <button type="button" onClick={onPersistDetectedRas} disabled={busy || !isAuthenticated}>
              Guardar RAs en backend
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ImportView
