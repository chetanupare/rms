import { toPng } from 'html-to-image';
import { useToast } from '../context/ToastContext';

export function useLabelExport() {
  const { addToast } = useToast();

  const exportLabel = async (elementRef, filename = 'label.png', scale = 2) => {
    if (!elementRef.current) return;
    try {
      // The target size for 203 DPI at 38x25mm is ~304x200 px.
      const dataUrl = await toPng(elementRef.current, {
        cacheBust: true,
        pixelRatio: scale,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: 0,
        }
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      addToast('Label exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Failed to export label', 'error');
    }
  };

  return { exportLabel };
}
