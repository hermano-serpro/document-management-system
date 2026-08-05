import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export function UploadComponent({ onUploadSuccess }) {
  const [owner, setOwner] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setErrorMessage('');

    if (!owner.trim() || !file) {
      setErrorMessage('Informe owner e arquivo antes do upload');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedOwner = owner.trim();
      const created = await uploadDocument({ owner: normalizedOwner, file });
      setFeedback(`Upload concluido: ${created.originalName}`);
      setFile(null);
      event.target.reset();
      await onUploadSuccess(normalizedOwner);
    } catch (error) {
      setErrorMessage(error.message || 'Falha ao enviar arquivo');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Novo documento</h2>

      <label htmlFor="owner">Owner</label>
      <input
        id="owner"
        name="owner"
        type="text"
        placeholder="Ex.: user-123"
        value={owner}
        onChange={(event) => setOwner(event.target.value)}
      />

      <label htmlFor="file">Arquivo</label>
      <input
        id="file"
        name="file"
        type="file"
        onChange={(event) => {
          const selected = event.target.files && event.target.files[0];
          setFile(selected || null);
        }}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar documento'}
      </button>

      {feedback ? <p className="success-message">{feedback}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </form>
  );
}