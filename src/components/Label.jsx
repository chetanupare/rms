import { useEffect, useRef, useState, forwardRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { getTrackingUrl } from '../services/api';

export const Label = forwardRef(({ job, customer, type = 'full' }, ref) => {
  const barcodeRef = useRef(null);
  const [qrUrl, setQrUrl] = useState('');

  const showQr = type === 'full' || type === 'qr';
  const showBarcode = type === 'full' || type === 'barcode';

  useEffect(() => {
    if (showBarcode && barcodeRef.current && job?.jobId) {
      JsBarcode(barcodeRef.current, job.jobId, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 40,
        width: 1.5,
      });
    }
  }, [job?.jobId, showBarcode]);

  useEffect(() => {
    if (showQr && job?.jobId) {
      const trackingCode = job.trackingCode || job.jobId;
      const trackingUrl = getTrackingUrl(trackingCode);
      
      QRCode.toDataURL(trackingUrl, { margin: 0, scale: 4, width: 400 })
        .then(url => setQrUrl(url))
        .catch(err => console.error(err));
    }
  }, [job?.jobId, job?.trackingCode, showQr]);

  if (!job || !customer) return null;

  const now = new Date();
  const collectedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const collectedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div 
      ref={ref}
      style={{
        width: '38mm',
        height: '25mm',
        padding: '0.5mm 1mm',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', gap: '1mm', height: '100%', alignItems: 'center', justifyContent: 'flex-start' }}>
        
        {/* Left Side: QR Code */}
        <div style={{ flexShrink: 0, width: '10mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {showQr && qrUrl && (
            <>
              <img src={qrUrl} alt="QR" style={{ width: '10mm', height: '10mm', display: 'block', imageRendering: 'pixelated' }} />
              <div style={{ fontSize: '4pt', fontWeight: 'bold', textAlign: 'center', marginTop: '0.5mm', lineHeight: 1 }}>
                Scan to track repair
              </div>
            </>
          )}
        </div>

        {/* Right Side: Details & Barcode */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingLeft: '1.5mm' }}>
          <div style={{ fontSize: '5.5pt', fontWeight: 900, lineHeight: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.5mm', wordBreak: 'break-word' }}>
            {customer.name}
          </div>
          <div style={{ fontSize: '4.5pt', fontWeight: 'bold', lineHeight: 1, marginBottom: '1mm', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {collectedDate} {collectedTime}
          </div>
          
          <div style={{ fontSize: '4pt', textTransform: 'uppercase', lineHeight: 1, marginBottom: '0.2mm' }}>Device</div>
          <div style={{ fontSize: '6pt', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, marginBottom: '0.5mm' }}>
            {job.brand} {job.model}
          </div>
          
          {showBarcode && (
            <div style={{ textAlign: 'center', margin: '0.2mm 0' }}>
              <svg ref={barcodeRef} style={{ display: 'block', width: '100%', height: '3.5mm' }} />
            </div>
          )}
          
          <div style={{ fontSize: '4pt', fontWeight: 'bold', lineHeight: 1, fontFamily: 'monospace', textAlign: 'right', marginTop: '0.2mm' }}>
            {job.jobId}
          </div>
        </div>
      </div>
    </div>
  );
});

Label.displayName = 'Label';
export default Label;
