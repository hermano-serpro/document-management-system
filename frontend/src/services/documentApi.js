import { apiFetch } from './apiClient.js';

export async function uploadDocument({ owner, file }) {
  const formData = new FormData();
  formData.append('owner', owner);
  formData.append('file', file);

  const response = await apiFetch('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function listDocuments(owner) {
  const query = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const response = await apiFetch(`/documents${query}`);

  return response.json();
}

export async function downloadDocument(documentId, originalName) {
  const response = await apiFetch(`/documents/${documentId}/download`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}