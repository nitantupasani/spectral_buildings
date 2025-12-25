import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buildingsAPI, notesAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import AddNoteModal from './AddNoteModal';
import VoiceRecorder from './VoiceRecorder';

const BuildingDetail = () => {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
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
            <audio controls src={`${apiUrl}${note.fileUrl}`} />
            {note.transcription && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <strong>Transcription:</strong> {note.transcription}
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
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="note-time">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
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
    </div>
  );
};

export default BuildingDetail;
