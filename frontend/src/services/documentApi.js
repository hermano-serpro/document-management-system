async function parseErrorResponse(response) {
  try {
    const body = await response.json();
    return body?.error?.message || 'Falha na comunicação com o backend';
  } catch {
    return 'Falha na comunicação com o backend';
  }
}

export async function uploadDocument({ owner, file }) {
  const formData = new FormData();
  formData.append('owner', owner);
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function listDocuments(owner) {
  const query = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const response = await fetch(`/api/documents${query}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function downloadDocument(documentId, originalName) {
  const response = await fetch(`/api/documents/${documentId}/download`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

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