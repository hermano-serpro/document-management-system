const API_PREFIX = '/api';

async function parseErrorResponse(response) {
  try {
    const body = await response.json();
    return body?.error?.message || 'Falha na comunicacao com o backend';
  } catch {
    return 'Falha na comunicacao com o backend';
  }
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response;
}