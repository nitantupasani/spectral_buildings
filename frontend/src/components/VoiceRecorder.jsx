import React, { useState, useRef, useEffect } from 'react';
import { notesAPI } from '../api';

const VoiceRecorder = ({ buildingId, onClose, onVoiceNoteAdded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        setAutoTriggered(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (blob) => {
    if (!blob) return '';

    setIsTranscribing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-note.webm');

      const response = await notesAPI.transcribeVoice(formData);
      setTranscription(response.data.transcription || '');
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.response?.data?.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const uploadVoiceNote = async (blob, transcript) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('buildingId', buildingId);
      formData.append('audio', blob, 'voice-note.webm');
      formData.append('transcription', transcript);

      const response = await notesAPI.createVoice(formData);
      onVoiceNoteAdded(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload voice note');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const processRecording = async () => {
      setAutoProcessing(true);
      const transcript = await transcribeAudio(audioBlob);
      await uploadVoiceNote(audioBlob, transcript);
      setAutoProcessing(false);
    };

    if (audioBlob && !autoTriggered) {
      setAutoTriggered(true);
      processRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, autoTriggered]);

  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setAutoProcessing(false);
    setAutoTriggered(false);
    audioChunksRef.current = [];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎤 Record Voice Note</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ textAlign: 'center', padding: '20px' }}>
          {!isRecording && !audioBlob && (
            <button
              className="btn btn-primary"
              onClick={startRecording}
              style={{ fontSize: '16px', padding: '15px 30px' }}
            >
              Start Recording
            </button>
          )}

          {isRecording && (
            <div>
              <div className="recording-indicator" style={{ marginBottom: '20px' }}>
                <span className="recording-dot"></span>
                Recording...
              </div>
              <button
                className="btn btn-danger"
                onClick={stopRecording}
                style={{ fontSize: '16px', padding: '15px 30px' }}
              >
                Stop Recording
              </button>
            </div>
          )}

          {audioUrl && (
            <div style={{ marginTop: '20px' }}>
              <audio controls src={audioUrl} style={{ width: '100%' }} />
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={isTranscribing || loading || autoProcessing}
                >
                  Record Again
                </button>
              </div>

              <div className="form-group" style={{ marginTop: '20px', textAlign: 'left' }}>
                <label>Transcription</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={transcription}
                  readOnly
                  placeholder="Transcription will appear automatically after recording stops"
                />
              </div>
              {(isTranscribing || loading || autoProcessing) && (
                <div style={{ marginTop: '10px', color: 'var(--secondary-color)' }}>
                  {isTranscribing ? 'Transcribing...' : 'Uploading voice note...'}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="error" style={{ textAlign: 'center' }}>{error}</div>}

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px' }}>
          <strong>Note:</strong> For production use, integrate Whisper.js or send audio to backend for server-side transcription using OpenAI Whisper or similar models.
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
