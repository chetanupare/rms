import axios from 'axios';

const API_BASE = 'https://rms-api-psi.vercel.app';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export function assetUrl(path) {
  return `${API_BASE}${path}`;
}

function withBranch(params = {}) {
  const branch = localStorage.getItem('slcg_branch');
  if (branch) params.branch = branch;
  return params;
}

export const endpoints = {
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),

  search: (q) => api.get('/search', { params: withBranch({ q }) }),
  searchProblems: (q) => api.get('/search/problems', { params: { q } }),

  customers: () => api.get('/customers', { params: withBranch() }),
  searchCustomers: (q) => api.get('/customers/search', { params: { q } }),
  customerByMobile: (mobile) => api.get(`/customers/by-mobile/${mobile}`),
  customerHistory: (id) => api.get(`/customers/${id}/history`),
  mergeCustomers: (payload) => api.post('/customers/merge', payload),
  createCustomer: (payload) => api.post('/customers', payload),
  updateCustomer: (id, payload) => api.put(`/customers/${id}`, payload),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),

  jobCards: () => api.get('/job-cards', { params: withBranch() }),
  jobCardById: (id) => api.get(`/job-cards/${id}`),
  createJobCard: (payload) => api.post('/job-cards', payload),
  updateJobCard: (id, payload) => api.put(`/job-cards/${id}`, payload),
  uploadPhotos: (id, payload) => api.post(`/job-cards/${id}/photos`, payload),
  transferJob: (id, payload) => api.post(`/job-cards/${id}/transfer`, payload),
  deletePhoto: (id, index) => api.delete(`/job-cards/${id}/photos/${index}`),

  repairs: () => api.get('/repairs', { params: withBranch() }),
  createRepair: (payload) => api.post('/repairs', payload),
  updateRepair: (id, payload) => api.put(`/repairs/${id}`, payload),

  billing: () => api.get('/billing', { params: withBranch() }),
  createBill: (payload) => api.post('/billing', payload),

  brands: () => api.get('/brands', { params: withBranch() }),
  createBrand: (payload) => api.post('/brands', payload),
  importBrands: (payload) => api.post('/brands/import', payload),
  deleteBrand: (id) => api.delete(`/brands/${id}`),

  deviceModels: () => api.get('/device-models', { params: withBranch() }),
  createDeviceModel: (payload) => api.post('/device-models', payload),
  importDeviceModels: (payload) => api.post('/device-models/import', payload),
  deleteDeviceModel: (id) => api.delete(`/device-models/${id}`),

  dashboard: () => api.get('/dashboard', { params: withBranch() }),
  reports: (params) => api.get('/reports', { params: withBranch(params) }),

  register: (date) => api.get('/register', { params: date ? { date } : {} }),
  createRegisterEntry: (payload) => api.post('/register', payload),
  updateRegisterEntry: (id, payload) => api.put(`/register/${id}`, payload),
  deleteRegisterEntry: (id) => api.delete(`/register/${id}`),
  finalizeRegister: () => api.post('/register/finalize'),
  registerSummary: (params) => api.get('/register/summary', { params }),
  tags: () => api.get('/tags'),
  createTag: (payload) => api.post('/tags', payload),

  // Inventory
  inventoryParts: (params) => api.get('/inventory/parts', { params }),
  createPart: (payload) => api.post('/inventory/parts', payload),
  updatePart: (id, payload) => api.put(`/inventory/parts/${id}`, payload),
  deletePart: (id) => api.delete(`/inventory/parts/${id}`),
  lowStock: () => api.get('/inventory/low-stock'),
  allocatePart: (payload) => api.post('/inventory/allocate', payload),
  jobAllocations: (jobId) => api.get(`/inventory/allocations/${jobId}`),
  removeAllocation: (id) => api.delete(`/inventory/allocations/${id}`),
  inventoryTransactions: (params) => api.get('/inventory/transactions', { params }),
  suppliers: () => api.get('/inventory/suppliers'),
  createSupplier: (payload) => api.post('/inventory/suppliers', payload),
  updateSupplier: (id, payload) => api.put(`/inventory/suppliers/${id}`, payload),
  deleteSupplier: (id) => api.delete(`/inventory/suppliers/${id}`),
  purchaseOrders: (params) => api.get('/inventory/purchase-orders', { params }),
  createPurchaseOrder: (payload) => api.post('/inventory/purchase-orders', payload),
  receivePurchaseOrder: (id, payload) => api.post(`/inventory/purchase-orders/${id}/receive`, payload),

  // Warranty & RMA
  warrantyCheck: (params) => api.get('/warranty/check', { params }),
  warrantyExpiring: (params) => api.get('/warranty/expiring', { params }),
  createRMA: (payload) => api.post('/warranty/rma', payload),
  rmaList: (params) => api.get('/warranty/rma', { params }),
  updateRMA: (id, payload) => api.put(`/warranty/rma/${id}`, payload),
  supplierReturnable: () => api.get('/warranty/supplier-returnable'),

  // Reception / Assignment
  receptionTechnicians: () => api.get('/reception/technicians'),
  receptionUnassigned: () => api.get('/reception/unassigned'),
  assignJob: (jobId, technicianId) => api.post(`/reception/jobs/${jobId}/assign`, { technicianId }),
};
