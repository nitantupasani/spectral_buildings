import React, { useState, useEffect } from 'react';
import { notesAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const RevisionHistory = ({ noteId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [noteId]);

  const fetchHistory = async () => {
    try {
      const response = await notesAPI.getHistory(noteId);
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load revision history');
    } finally {
      setLoading(false);
    }
  };

  const renderChanges = (revision) => {
    const { changes, previousValues } = revision;
    const changesArray = changes.split(', ');
    
    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px' }}>
          Changes: {changes}
        </div>
        
        {changesArray.map((change, idx) => {
          if (change === 'content' && previousValues.content) {
            return (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Previous Content:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{previousValues.content}</div>
              </div>
            );
          }
          if (change === 'description') {
            return (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Previous Description:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{previousValues.description || '(none)'}</div>
              </div>
            );
          }
          if (change === 'transcription') {
            return (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Previous Transcription:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{previousValues.transcription || '(none)'}</div>
              </div>
            );
          }
          if ((change === 'added attachments' || change === 'removed attachments') && previousValues.attachments) {
            return (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Previous Attachments ({previousValues.attachments.length}):
                </div>
                {previousValues.attachments.length > 0 ? (
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {previousValues.attachments.map((att, i) => (
                      <li key={i} style={{ fontSize: '13px' }}>{att.originalName}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '13px', fontStyle: 'italic' }}>(none)</div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>Revision History</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}
          
          {error && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--danger-color)' }}>
              {error}
            </div>
          )}
          
          {!loading && !error && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--secondary-color)' }}>
              No revision history available
            </div>
          )}
          
          {!loading && !error && history.length > 0 && (
            <div>
              {history.map((revision, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: index === 0 ? '#f0fdf4' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>
                        {revision.editedBy?.username || 'Unknown User'}
                      </span>
                      {index === 0 && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          backgroundColor: '#10b981', 
                          color: 'white', 
                          borderRadius: '4px' 
                        }}>
                          Latest
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--secondary-color)' }}>
                      {formatDistanceToNow(new Date(revision.editedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {renderChanges(revision)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionHistory;
