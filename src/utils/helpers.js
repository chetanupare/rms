export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

const STATUS_COLORS = {
  Pending: 'badge-amber',
  'In Progress': 'badge-blue',
  Completed: 'badge-green',
  Billed: 'badge-purple',
  Delivered: 'badge-cyan',
};

export function statusBadgeClass(status) {
  return STATUS_COLORS[status] || 'badge-ghost';
}

export function openWhatsApp(mobile, message) {
  const num = mobile.replace(/[^0-9]/g, '');
  if (num.length < 10) return;
  const url = `https://wa.me/91${num.slice(-10)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
