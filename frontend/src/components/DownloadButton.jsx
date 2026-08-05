export function DownloadButton({ document, onDownload }) {
  return (
    <button type="button" onClick={() => onDownload(document)}>
      Download
    </button>
  );
}