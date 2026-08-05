import { DownloadButton } from './DownloadButton.jsx';

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export function DocumentList({ items, isLoading, onDownload }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (!items.length) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <div className="list-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Owner</th>
            <th>Tamanho</th>
            <th>Upload em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.originalName}</td>
              <td>{item.owner}</td>
              <td>{item.size} bytes</td>
              <td>{formatDate(item.uploadedAt)}</td>
              <td>
                <DownloadButton document={item} onDownload={onDownload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}