import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buildingsAPI, notesAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import AddNoteModal from './AddNoteModal';
import EditNoteModal from './EditNoteModal';
import RevisionHistory from './RevisionHistory';
import VoiceRecorder from './VoiceRecorder';

const BuildingDetail = () => {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  useEffect(() => {
    fetchBuilding();
    fetchNotes();
  }, [id]);

  const fetchBuilding = async () => {
    try {
      const response = await buildingsAPI.getOne(id);
      setBuilding(response.data);
    } catch (error) {
      console.error('Error fetching building:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await notesAPI.getByBuilding(id);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
    setShowModal(false);
  };

  const handleVoiceNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
    setShowVoiceRecorder(false);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes(notes.map(note => note._id === updatedNote._id ? updatedNote : note));
    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesAPI.delete(noteId);
      setNotes(notes.filter(note => note._id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const renderNoteContent = (note) => {
    // Get the API base URL and ensure it's just the domain (no /api suffix)
    const getApiBaseUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      // Extract just the domain part
      if (apiUrl.includes('://')) {
        const url = new URL(apiUrl);
        return `${url.protocol}//${url.host}`;
      }
      return 'http://localhost:5000';
    };
    
    const apiUrl = getApiBaseUrl();

    const resolveFileUrl = (fileUrl) => {
      if (!fileUrl) return '';
      // If the stored URL is already absolute (e.g., older data with localhost),
      // use it as-is; otherwise prefix with the API host.
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return fileUrl;
      }
      return `${apiUrl}${fileUrl}`;
    };
    
    switch (note.type) {
      case 'text':
        return <p className="note-content">{note.content}</p>;
      
      case 'link':
        return (
          <a
            href={note.content}
            target="_blank"
            rel="noopener noreferrer"
            className="note-content"
            style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
          >
            {note.content}
          </a>
        );
      
      case 'voice':
        return (
          <div>
            <audio controls src={resolveFileUrl(note.fileUrl)} crossOrigin="anonymous" />
            {note.transcription && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <strong>Transcription:</strong> {note.transcription}
              </div>
            )}
            {note.description && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
                <strong>Description:</strong> {note.description}
              </div>
            )}
            {note.attachments && note.attachments.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Attachments:</strong>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {note.attachments.map((att, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {att.mimeType?.startsWith('image/') ? (
                          <img 
                            src={resolveFileUrl(att.fileUrl)} 
                            alt={att.originalName}
                            onClick={() => setViewingAttachment({ url: resolveFileUrl(att.fileUrl), name: att.originalName, type: 'image' })}
                            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px', cursor: 'pointer' }}
                          />
                        ) : att.mimeType?.startsWith('audio/') ? (
                          <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '13px', marginBottom: '4px', color: 'var(--secondary-color)' }}>
                              🎵 {att.originalName}
                            </div>
                            <audio controls src={resolveFileUrl(att.fileUrl)} crossOrigin="anonymous" style={{ width: '100%' }} />
                          </div>
                        ) : (
                          <button
                            onClick={() => setViewingAttachment({ url: resolveFileUrl(att.fileUrl), name: att.originalName, type: 'document' })}
                            style={{ 
                              color: 'var(--primary-color)', 
                              textDecoration: 'underline',
                              background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                          }}
                        >
                          📎 {att.originalName}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div>
            <img src={`${apiUrl}${note.fileUrl}`} alt="Note attachment" className="note-image" />
            {note.content !== 'Image attachment' && <p className="note-content">{note.content}</p>}
          </div>
        );
      
      default:
        return <p className="note-content">{note.content}</p>;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!building) {
    return <div className="card">Building not found</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>{building.name}</h2>
        <p style={{ color: 'var(--secondary-color)', marginTop: '8px' }}>📍 {building.address}</p>
        {building.description && (
          <p style={{ marginTop: '16px' }}>{building.description}</p>
        )}
        <div style={{ marginTop: '16px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              backgroundColor: building.status === 'active' ? '#d1fae5' : '#fee2e2',
              color: building.status === 'active' ? '#065f46' : '#991b1b'
            }}
          >
            {building.status}
          </span>
          <span style={{ marginLeft: '16px', fontSize: '14px', color: 'var(--secondary-color)' }}>
            Onboarded: {new Date(building.onboardedDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Notes & Comments</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-success" onClick={() => setShowVoiceRecorder(true)}>
              🎤 Voice Note
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add Note
            </button>
          </div>
        </div>

        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--secondary-color)', padding: '20px' }}>
            No notes yet. Add the first note!
          </p>
        ) : (
          <div>
            {notes.map((note) => (
              <div key={note._id} className="note-item">
                <div className="note-header">
                  <div>
                    <span className="note-user">{note.user.username}</span>
                    <span className={`note-type-badge note-type-${note.type}`} style={{ marginLeft: '10px' }}>
                      {note.type}
                    </span>
                    {note.editedBy && (
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--secondary-color)', fontStyle: 'italic' }}>
                        (edited by {note.editedBy.username} {formatDistanceToNow(new Date(note.editedAt), { addSuffix: true })})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="note-time">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    {note.editHistory && note.editHistory.length > 0 && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setViewingHistory(note._id)}
                      >
                        View History
                      </button>
                    )}
                    </span>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => setEditingNote(note)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleDeleteNote(note._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {renderNoteContent(note)}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddNoteModal
          buildingId={id}
          onClose={() => setShowModal(false)}
          onNoteAdded={handleNoteAdded}
        />
      )}

      {showVoiceRecorder && (
        <VoiceRecorder
          buildingId={id}
          onClose={() => setShowVoiceRecorder(false)}
          onVoiceNoteAdded={handleVoiceNoteAdded}
        />
      )}

      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}

      {viewingHistory && (
        <RevisionHistory
          noteId={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {viewingAttachment && (
        <div 
          className="modal-overlay" 
          onClick={() => setViewingAttachment(null)}
          style={{ zIndex: 1000 }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h3>{viewingAttachment.name}</h3>
              <button className="close-btn" onClick={() => setViewingAttachment(null)}>&times;</button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {viewingAttachment.type === 'image' ? (
                <img 
                  src={viewingAttachment.url} 
                  alt={viewingAttachment.name}
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              ) : (
                <iframe
                  src={viewingAttachment.url}
                  style={{ width: '100%', height: '80vh', border: 'none' }}
                  title={viewingAttachment.name}
                />
              )}
              <div style={{ marginTop: '20px' }}>
                <a 
                  href={viewingAttachment.url} 
                  download={viewingAttachment.name}
                  className="btn btn-primary"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingDetail;
