import React, { useState, useRef } from 'react';
import { notesAPI } from '../api';

const EditNoteModal = ({ note, onClose, onNoteUpdated }) => {
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
            {(note.type === 'text' || note.type === 'link') && (
              <div className="form-group">
                <label>{note.type === 'link' ? 'URL' : 'Content'}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows="4"
                  style={{ width: '100%', padding: '8px', fontSize: '14px' }}
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
                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                  />
                </div>

                {/* Existing Attachments */}
                {attachments.length > 0 && (
                  <div className="form-group">
                    <label>Current Attachments</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {attachments.map((att, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px'
                        }}>
                          <span style={{ flex: 1, fontSize: '14px' }}>{att.originalName}</span>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(att.filename)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Attachments */}
                <div className="form-group">
                  <label>Add Attachments (Images, Audio, Documents)</label>
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
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    📎 Choose Files
                  </button>
                  
                  {newFiles.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      {newFiles.map((file, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '8px',
                          marginBottom: '8px',
                          backgroundColor: '#e0f2fe',
                          borderRadius: '6px'
                        }}>
                          <span style={{ flex: 1, fontSize: '14px' }}>
                            {file.type.startsWith('audio/') ? '🎵 ' : '📎 '}
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {note.type === 'image' && (
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <p style={{ color: 'var(--secondary-color)', margin: 0 }}>
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
