import { useMemo, useState } from 'react';
import { UploadComponent } from './components/UploadComponent.jsx';
import { DocumentList } from './components/DocumentList.jsx';
import { downloadDocument, listDocuments } from './services/documentApi.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalSize = useMemo(() => {
    return documents.reduce((acc, item) => acc + item.size, 0);
  }, [documents]);

  async function loadDocuments(currentOwnerFilter = '') {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await listDocuments(currentOwnerFilter);
      setDocuments(response.items);
    } catch (error) {
      setErrorMessage(error.message || 'Falha ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (!ownerFilter.trim()) {
      setDocuments([]);
      setErrorMessage('Informe o owner para buscar documentos');
      return;
    }

    await loadDocuments(ownerFilter);
  }

  async function handleUploadSuccess(owner) {
    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

    if (!normalizedOwner) {
      return;
    }

    setOwnerFilter(normalizedOwner);
    await loadDocuments(normalizedOwner);
  }

  async function handleDownload(document) {
    try {
      await downloadDocument(document.id, document.originalName, document.owner);
    } catch (error) {
      setErrorMessage(error.message || 'Falha ao baixar documento');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <h1>Document Management System</h1>
        <p>
          Upload, listagem e download de documentos com armazenamento local no backend.
        </p>
      </section>

      <section className="panel">
        <UploadComponent onUploadSuccess={handleUploadSuccess} />
      </section>

      <section className="panel">
        <form className="filter-form" onSubmit={handleSearch}>
          <label htmlFor="owner-filter">Filtrar por owner</label>
          <div className="filter-row">
            <input
              id="owner-filter"
              type="text"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              placeholder="Ex.: user-123"
            />
            <button type="submit">Filtrar</button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setOwnerFilter('');
                setDocuments([]);
                setErrorMessage('');
              }}
            >
              Limpar
            </button>
          </div>
        </form>

        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

        <div className="summary">
          <span>Total de documentos: {documents.length}</span>
          <span>Tamanho total: {totalSize} bytes</span>
        </div>

        <DocumentList
          items={documents}
          isLoading={isLoading}
          onDownload={handleDownload}
        />
      </section>
    </main>
  );
}
