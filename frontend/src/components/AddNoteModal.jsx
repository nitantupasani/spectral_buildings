import React, { useState } from 'react';
import { notesAPI } from '../api';

const AddNoteModal = ({ buildingId, onClose, onNoteAdded }) => {
  const [noteType, setNoteType] = useState('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (noteType === 'text') {
        response = await notesAPI.createText({ buildingId, content });
      } else if (noteType === 'link') {
        response = await notesAPI.createLink({ buildingId, content });
      } else if (noteType === 'image') {
        const formData = new FormData();
        formData.append('buildingId', buildingId);
        formData.append('image', file);
        formData.append('content', content || 'Image attachment');
        response = await notesAPI.createImage(formData);
      }

      onNoteAdded(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Note</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Note Type</label>
            <select
              className="form-control"
              value={noteType}
              onChange={(e) => {
                setNoteType(e.target.value);
                setContent('');
                setFile(null);
              }}
            >
              <option value="text">Text</option>
              <option value="link">Link</option>
              <option value="image">Image</option>
            </select>
          </div>

          {noteType === 'text' && (
            <div className="form-group">
              <label>Content *</label>
              <textarea
                className="form-control"
                rows="4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Enter your note..."
              />
            </div>
          )}

          {noteType === 'link' && (
            <div className="form-group">
              <label>URL *</label>
              <input
                type="url"
                className="form-control"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="https://example.com"
              />
            </div>
          )}

          {noteType === 'image' && (
            <>
              <div className="form-group">
                <label>Image File *</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add a description..."
                />
              </div>
            </>
          )}

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
