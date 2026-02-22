function ModulesView({
  busy,
  isAuthenticated,
  modules,
  onDeleteModule,
  selectedModuleId,
  setSelectedModuleId,
}) {
  const availableModules = Array.isArray(modules) ? modules : []

  return (
    <section className="panel">
      <h2>Modulos</h2>
      <div className="inline-actions">
        <label>
          Modulo a eliminar
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            disabled={busy || !isAuthenticated || !availableModules.length}
          >
            <option value="">Selecciona modulo...</option>
            {availableModules.map((moduleItem) => (
              <option key={moduleItem.id} value={String(moduleItem.id)}>
                #{moduleItem.id} - {moduleItem.name || 'Sin nombre'} ({moduleItem.academicYear || '-'})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onDeleteModule}
          disabled={busy || !isAuthenticated || !String(selectedModuleId || '').trim()}
        >
          Eliminar modulo
        </button>
      </div>
      {!availableModules.length && <p>No hay modulos creados todavia.</p>}
    </section>
  )
}

export default ModulesView
