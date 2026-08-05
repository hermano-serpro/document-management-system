import { apiFetch } from './apiClient.js';

export async function uploadDocument({ owner, file }) {
  const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

  const formData = new FormData();
  formData.append('owner', normalizedOwner);
  formData.append('file', file);

  const response = await apiFetch('/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'x-owner-id': normalizedOwner,
    },
  });

  return response.json();
}

export async function listDocuments(owner) {
  const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

  if (!normalizedOwner) {
    throw new Error('Informe o owner para listar documentos');
  }

  const response = await apiFetch('/documents', {
    headers: {
      'x-owner-id': normalizedOwner,
    },
  });

  return response.json();
}

export async function downloadDocument(documentId, originalName, owner) {
  const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

  if (!normalizedOwner) {
    throw new Error('Owner do documento é obrigatório para download');
  }

  const response = await apiFetch(`/documents/${documentId}/download`, {
    headers: {
      'x-owner-id': normalizedOwner,
    },
  });

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