import React, { useState, useRef } from 'react';
import { notesAPI } from '../api';

const EditNoteModal = ({ note, onClose, onNoteUpdated }) => {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [description, setDescription] = useState(note.description || '');
  const [transcription, setTranscription] = useState(note.transcription || '');
  const [attachments, setAttachments] = useState(note.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles([...newFiles, ...files]);
  };

  const removeNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (filename) => {
    setRemovedAttachments([...removedAttachments, filename]);
    setAttachments(attachments.filter(att => att.filename !== filename));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Only include fields that are editable for this note type
      if (title) {
        formData.append('title', title);
      }

      if (note.type === 'text' || note.type === 'link') {
        formData.append('content', content);
      }
      
      if (note.type === 'voice') {
        if (transcription !== undefined) formData.append('transcription', transcription);
        if (description !== undefined) formData.append('description', description);
      }

      // Add new files
      newFiles.forEach(file => {
        if (file.type.startsWith('audio/')) {
          formData.append('audio', file);
        } else {
          formData.append('attachments', file);
        }
      });

      // Add removed attachments list
      if (removedAttachments.length > 0) {
        formData.append('removeAttachments', JSON.stringify(removedAttachments));
      }

      const response = await notesAPI.update(note._id, formData);
      onNoteUpdated(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Note</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-control"
              />
            </div>

            {(note.type === 'text' || note.type === 'link') && (
              <div className="form-group">
                <label>{note.type === 'link' ? 'URL' : 'Content'}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows="4"
                  className="form-control"
                />
              </div>
            )}

            {note.type === 'voice' && (
              <>
                <div className="form-group">
                  <label>Transcription</label>
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    rows="3"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="form-control"
                  />
                </div>

              </>
            )}

            {note.type !== 'image' && (
              <div className="form-group">
                <label>Attachments</label>

                {attachments.length > 0 && (
                  <div className="note-attachments-preview">
                    {attachments.map((att, idx) => (
                      <div key={att.filename || idx} className="note-attachment-chip">
                        <span style={{ flex: 1, fontSize: '14px' }}>
                          {att.mimeType?.startsWith('audio/') ? '🎵 ' : att.mimeType?.startsWith('image/') ? '🖼️ ' : '📎 '}
                          {att.originalName}
                        </span>
                        <button type="button" onClick={() => removeExistingAttachment(att.filename)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  📎 Add files
                </button>

                {newFiles.length > 0 && (
                  <div className="note-attachments-preview" style={{ marginTop: '12px' }}>
                    {newFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="note-attachment-chip">
                        <span style={{ flex: 1, fontSize: '14px' }}>
                          {file.type.startsWith('audio/') ? '🎵 ' : file.type.startsWith('image/') ? '🖼️ ' : '📎 '}
                          {file.name}
                        </span>
                        <button type="button" onClick={() => removeNewFile(idx)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '10px' }}>
                  Attach images, audio clips, or documents. Existing files can be removed above.
                </p>
              </div>
            )}

            {note.type === 'image' && (
              <div className="note-callout muted">
                <p style={{ color: 'var(--text)', margin: 0 }}>
                  Image notes cannot be edited. You can delete and create a new one if needed.
                </p>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {note.type !== 'image' && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;
