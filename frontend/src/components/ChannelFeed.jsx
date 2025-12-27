import React, { useEffect, useMemo, useState } from 'react';
import ImportantLinks from './ImportantLinks';
import { formatDistanceToNow } from 'date-fns';
import { notesAPI } from '../api';
import AddNoteModal from './AddNoteModal';
import VoiceRecorder from './VoiceRecorder';
import RevisionHistory from './RevisionHistory';
import EditNoteModal from './EditNoteModal';
import LoadingScreen from './LoadingScreen';

const ChannelFeed = ({ channel, title, description, accent }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  const fetchNotes = async () => {
    try {
      const { data } = await notesAPI.getByChannel(channel);
      setNotes(data);
    } catch (err) {
      console.error('Failed to load channel feed', err);
    } finally {
      setLoading(false);
    }
  };

  const getApiBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (apiUrl.includes('://')) {
      const url = new URL(apiUrl);
      return `${url.protocol}//${url.host}`;
    }
    return 'http://localhost:5000';
  };

  const apiUrl = useMemo(() => getApiBaseUrl(), []);

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

  const handleNoteAdded = (note) => {
    setNotes((prev) => [note, ...prev]);
    setShowAddModal(false);
  };

  const handleVoiceAdded = (note) => {
    setNotes((prev) => [note, ...prev]);
    setShowVoiceModal(false);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes((prev) => prev.map((n) => (n._id === updatedNote._id ? updatedNote : n)));
    setEditingNote(null);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await notesAPI.delete(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error('Failed to delete note', err);
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading team knowledge" />;
  }

  return (
    <div className="card channel-card">
      <div className="channel-header" style={{ borderColor: accent }}>
        <div>
          <div className="eyebrow" style={{ color: accent }}>{channel.toUpperCase()}</div>
          <h3 className="channel-title">{title}</h3>
          <p className="channel-description">{description}</p>
        </div>
        <div className="channel-actions compact">
          <button className="btn btn-success btn-compact" onClick={() => setShowVoiceModal(true)}>
            🎤 Voice
          </button>
          <button className="btn btn-primary btn-compact" onClick={() => setShowAddModal(true)}>
            + Post
          </button>
        </div>
      </div>

      <div className="channel-body">
        <div className="channel-main">
          <div className="summary-card">
            <div className="summary-card__header">
              <div>
                <div className="eyebrow">Summary</div>
                <p className="summary-card__body">No summary added yet. Capture highlights for this stream here.</p>
              </div>
            </div>
          </div>

          <div className="note-section">
            <div className="note-section__header">
              <div className="eyebrow">Posts</div>
              <span className="note-section__hint">Latest updates, voice notes, and attachments appear here.</span>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-pill" style={{ borderColor: accent, color: accent }}>No posts yet</div>
                <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
                  Start the conversation with a quick announcement, duty note, or onboarding tip.
                </p>
              </div>
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
                              handleDelete(note._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        {note.editedBy && (
                          <div className="note-edited">Edited by {note.editedBy.username} {formatDistanceToNow(new Date(note.editedAt), { addSuffix: true })}</div>
                        )}
                        {renderNoteContent(note)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="channel-aside">
          <ImportantLinks channel={channel} />
        </aside>
      </div>

      {showAddModal && (
        <AddNoteModal
          channel={channel}
          onClose={() => setShowAddModal(false)}
          onNoteAdded={handleNoteAdded}
        />
      )}

      {showVoiceModal && (
        <VoiceRecorder
          channel={channel}
          onClose={() => setShowVoiceModal(false)}
          onVoiceNoteAdded={handleVoiceAdded}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelFeed;
