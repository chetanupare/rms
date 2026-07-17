export default function PreviewToolbar({
  zoom,
  setZoom,
  showSafe,
  setShowSafe,
  showGrid,
  setShowGrid,
  onExport,
  onPrint,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'var(--c-surface)',
      borderBottom: '1px solid var(--c-border)',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      {/* Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text2)' }}>Zoom</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[100, 200, 400, 800].map(level => (
            <button
              key={level}
              type="button"
              className={`btn ${zoom === level ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 8px', fontSize: 12 }}
              onClick={() => setZoom(level)}
            >
              {level}%
            </button>
          ))}
        </div>
      </div>

      {/* Developer Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={showSafe} onChange={e => setShowSafe(e.target.checked)} />
          Safe Area
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
          Grid
        </label>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 8, paddingLeft: 16, borderLeft: '1px solid var(--c-border)' }}>
          <button type="button" className="btn btn-ghost" onClick={onExport} style={{ padding: '6px 12px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>image</span> Export PNG
          </button>
          <button type="button" className="btn btn-primary" onClick={onPrint} style={{ padding: '6px 16px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>print</span> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
