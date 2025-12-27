import React, { useRef, useState } from 'react';
import { notesAPI } from '../api';

const AddNoteModal = ({ buildingId, channel, onClose, onNoteAdded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!buildingId && !channel) {
        throw new Error('A building or channel is required to post a note.');
      }

      const formData = new FormData();
      if (buildingId) formData.append('buildingId', buildingId);
      if (channel) formData.append('channel', channel);
      formData.append('title', title);
      formData.append('content', content);

      attachments.forEach((file) => formData.append('attachments', file));

      const response = await notesAPI.createText(formData);
      onNoteAdded(response.data);
      setTitle('');
      setContent('');
      setAttachments([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Add Note
            {channel && <span style={{ fontSize: '14px', color: 'var(--muted)', marginLeft: '6px' }}>to {channel} feed</span>}
          </h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Give this post a clear title"
            />
          </div>

          <div className="form-group">
            <label>Note</label>
            <textarea
              className="form-control"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder={
                channel
                  ? 'Share updates, decisions, or links for the Brighter Control team...'
                  : 'Share updates, decisions, or links for this building...'
              }
            />
          </div>

          <div className="form-group">
            <label>Attachments (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => fileInputRef.current?.click()}
            >
              📎 Add attachments
            </button>

            {attachments.length > 0 && (
              <div className="note-attachments-preview">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="note-attachment-chip">
                    <span>
                      {file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('audio/') ? '🎵' : '📎'} {file.name}
                    </span>
                    <button type="button" onClick={() => removeAttachment(index)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
              Supported: images, audio clips, and documents up to 50MB total.
            </p>
          </div>

          {error && <div className="error">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
