import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Label from './Label';
import PreviewToolbar from './PreviewToolbar';
import { useLabelExport } from '../hooks/useLabelExport';

export default function LabelPreview({ job, customer, type }) {
  const [zoom, setZoom] = useState(200);
  const [showSafe, setShowSafe] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const printRef = useRef(null);
  const { exportLabel } = useLabelExport();

  const handleExport = () => {
    exportLabel(printRef, `Label_${job?.jobId || 'export'}.png`, 2);
  };

  const handlePrint = () => {
    if (window.electronAPI && window.electronAPI.printNative) {
      window.electronAPI.printNative();
    } else {
      window.print();
    }
  };

  const safeAreaStyle = {
    position: 'absolute',
    top: '2mm',
    left: '2mm',
    right: '2mm',
    bottom: '2mm',
    border: '1px dashed red',
    background: 'transparent',
    pointerEvents: 'none',
    zIndex: 10
  };

  // Grid overlay (1mm grid)
  const gridStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,255,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,255,0.1) 1px, transparent 1px)
    `,
    backgroundSize: '1mm 1mm',
    pointerEvents: 'none',
    zIndex: 9
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--c-surface2)', borderRadius: 12, border: '1px solid var(--c-border)' }}>
      <PreviewToolbar 
        zoom={zoom} setZoom={setZoom}
        showSafe={showSafe} setShowSafe={setShowSafe}
        showGrid={showGrid} setShowGrid={setShowGrid}
        onExport={handleExport}
        onPrint={handlePrint}
      />

      <div style={{ 
        position: 'relative', 
        padding: '40px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'auto',
        minHeight: 300,
        background: '#e5e7eb'
      }}>
        {/* The Scaled Preview */}
        <div style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          background: '#fff',
          position: 'relative'
        }}>
          <Label job={job} customer={customer} type={type} />
          {showSafe && <div style={safeAreaStyle} />}
          {showGrid && <div style={gridStyle} />}
        </div>
      </div>

      {/* Developer Info Footer */}
      <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--c-text3)', display: 'flex', gap: 16, borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <div>Dimensions: 38mm × 25mm</div>
        <div>Target DPI: 203</div>
        <div>Export Res: 608 × 400 (2x)</div>
      </div>

      {/* The actual print root that will be exported and printed natively.
          We portal it to the body so it's not nested inside transformed/hidden parents during print.
          We keep it off-screen for regular viewing. */}
      {createPortal(
        <div id="print-root" style={{ position: 'fixed', top: '-9999px', left: '-9999px', background: '#fff' }}>
          <Label ref={printRef} job={job} customer={customer} type={type} />
        </div>,
        document.body
      )}
    </div>
  );
}
