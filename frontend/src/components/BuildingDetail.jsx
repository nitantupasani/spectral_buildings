import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buildingsAPI, notesAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import AddNoteModal from './AddNoteModal';
import EditNoteModal from './EditNoteModal';
import RevisionHistory from './RevisionHistory';
import VoiceRecorder from './VoiceRecorder';
import LoadingScreen from './LoadingScreen';

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
  const [expandedNotes, setExpandedNotes] = useState(new Set());

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

  // Get the API base URL and ensure it's just the domain (no /api suffix)
  const getApiBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (apiUrl.includes('://')) {
      const url = new URL(apiUrl);
      return `${url.protocol}//${url.host}`;
    }
    return 'http://localhost:5000';
  };

  const apiUrl = getApiBaseUrl();

  const resolveFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    return `${apiUrl}${fileUrl}`;
  };

  const renderAttachments = (note) => {
    if (!note.attachments || note.attachments.length === 0) return null;

    return (
      <div className="note-attachments">
        <div className="note-attachments__header">Attachments</div>
        <div className="note-attachments__grid">
          {note.attachments.map((att, idx) => {
            const isImage = att.mimeType?.startsWith('image/');
            const isAudio = att.mimeType?.startsWith('audio/');
            const resolvedUrl = resolveFileUrl(att.fileUrl);

            if (isImage) {
              return (
                <button
                  type="button"
                  className="note-attachment-card image"
                  key={`${att.fileUrl}-${idx}`}
                  onClick={() => setViewingAttachment({ url: resolvedUrl, name: att.originalName, type: 'image' })}
                >
                  <img src={resolvedUrl} alt={att.originalName} />
                  <div className="note-attachment-card__meta">
                    <span>🖼️ {att.originalName}</span>
                  </div>
                </button>
              );
            }

            if (isAudio) {
              return (
                <div className="note-attachment-card audio" key={`${att.fileUrl}-${idx}`}>
                  <div className="note-attachment-card__meta">
                    <span>🎵 {att.originalName}</span>
                  </div>
                  <audio controls src={resolvedUrl} crossOrigin="anonymous" />
                </div>
              );
            }

            return (
              <button
                type="button"
                key={`${att.fileUrl}-${idx}`}
                className="note-attachment-card file"
                onClick={() => setViewingAttachment({ url: resolvedUrl, name: att.originalName, type: 'document' })}
              >
                <div className="note-attachment-card__meta">
                  <span>📎 {att.originalName}</span>
                  <span className="note-attachment-card__action">Open</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNoteContent = (note) => {
    let contentBlock;

    switch (note.type) {
      case 'link':
        contentBlock = (
          <a
            href={note.content}
            target="_blank"
            rel="noopener noreferrer"
            className="note-content note-link"
          >
            {note.content}
          </a>
        );
        break;

      case 'voice':
        contentBlock = (
          <div className="note-stack">
            <audio controls src={resolveFileUrl(note.fileUrl)} crossOrigin="anonymous" className="note-audio-player" />
            {note.transcription && (
              <div className="note-callout">
                <div className="note-callout__title">Transcription</div>
                <p className="note-callout__body">{note.transcription}</p>
              </div>
            )}
            {note.description && (
              <div className="note-callout muted">
                <div className="note-callout__title">Description</div>
                <p className="note-callout__body">{note.description}</p>
              </div>
            )}
          </div>
        );
        break;

      case 'image':
        contentBlock = (
          <div className="note-stack">
            <img src={resolveFileUrl(note.fileUrl)} alt="Note attachment" className="note-image" />
            {note.content !== 'Image attachment' && <p className="note-content">{note.content}</p>}
          </div>
        );
        break;

      default:
        contentBlock = <p className="note-content">{note.content}</p>;
    }

    return (
      <>
        {contentBlock}
        {renderAttachments(note)}
      </>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading building details" />;
  }

  if (!building) {
    return <div className="card">Building not found</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>{building.name}</h2>
        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>📍 {building.address}</p>
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
          <span style={{ marginLeft: '16px', fontSize: '14px', color: 'var(--muted)' }}>
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

        <div className="summary-card">
          <div className="summary-card__header">
            <div>
              <div className="eyebrow">Summary</div>
              <p className="summary-card__body">Add the latest status or building overview here.</p>
            </div>
          </div>
        </div>

        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
            No notes yet. Add the first note!
          </p>
        ) : (
          <div className="note-tiles">
            {notes.map((note) => (
              <div key={note._id} className={`note-tile ${expandedNotes.has(note._id) ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="note-tile__header"
                  onClick={() => {
                    setExpandedNotes((prev) => {
                      const next = new Set(prev);
                      next.has(note._id) ? next.delete(note._id) : next.add(note._id);
                      return next;
                    });
                  }}
                >
                  <div className="note-tile__title-row">
                    <div className="note-tile__title">{note.title || 'Untitled post'}</div>
                    <div className="note-tile__meta">
                      <span className="note-user">{note.user.username}</span>
                      <span className="note-dot">•</span>
                      <span className="note-timestamp">
                        {new Date(note.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="note-tile__badges">
                    <span className={`note-type-badge note-type-${note.type}`}>{note.type}</span>
                    <span className="note-time-compact">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </button>

                {expandedNotes.has(note._id) && (
                  <div className="note-tile__body">
                    <div className="note-tile__toolbar">
                      {note.editHistory && note.editHistory.length > 0 && (
                        <button
                          className="btn btn-secondary btn-compact"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingHistory(note._id);
                          }}
                        >
                          View History
                        </button>
                      )}
                      <button
                        className="btn btn-primary btn-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(note);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    {note.editedBy && (
                      <div className="note-edited">
                        Edited by {note.editedBy.username} {formatDistanceToNow(new Date(note.editedAt), { addSuffix: true })}
                      </div>
                    )}
                    {renderNoteContent(note)}
                  </div>
                )}
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
