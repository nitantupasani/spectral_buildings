import React, { useState, useRef, useEffect } from 'react';
import { notesAPI } from '../api';

const VoiceRecorder = ({ buildingId, channel, onClose, onVoiceNoteAdded }) => {
  const [title, setTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const convertToWav = async (blob) => {
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) {
      throw new Error('Offline audio processing is not supported in this browser.');
    }
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    try {
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      const targetSampleRate = 16000;
      const offlineContext = new OfflineCtx(
        decoded.numberOfChannels,
        Math.ceil(decoded.duration * targetSampleRate),
        targetSampleRate
      );
      const source = offlineContext.createBufferSource();
      source.buffer = decoded;
      source.connect(offlineContext.destination);
      source.start(0);
      const resampled = await offlineContext.startRendering();

      const numChannels = resampled.numberOfChannels;
      const sampleRate = resampled.sampleRate;
      const samples = resampled.length;
      const buffer = new ArrayBuffer(44 + samples * numChannels * 2);
      const view = new DataView(buffer);

      const writeString = (viewRef, offset, string) => {
        for (let i = 0; i < string.length; i++) {
          viewRef.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + samples * numChannels * 2, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, samples * numChannels * 2, true);

      const interleaved = new Float32Array(samples * numChannels);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = resampled.getChannelData(channel);
        for (let i = 0; i < samples; i++) {
          interleaved[i * numChannels + channel] = channelData[i];
        }
      }

      let offset = 44;
      for (let i = 0; i < interleaved.length; i++, offset += 2) {
        let sample = Math.max(-1, Math.min(1, interleaved[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      }

      return new Blob([view], { type: 'audio/wav' });
    } finally {
      audioContext.close();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        
        // Auto-transcribe after recording
        await transcribeAudio(blob);
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
      const wavBlob = await convertToWav(blob);

      // Use WAV for playback/upload after conversion
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const wavUrl = URL.createObjectURL(wavBlob);
      setAudioBlob(wavBlob);
      setAudioUrl(wavUrl);

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');

      const { data } = await notesAPI.transcribeVoice(formData);
      const transcript = data?.transcription || '';
      setTranscription(transcript);
      return transcript;
    } catch (err) {
      console.error('Transcription error:', err);

      setError(err.message || 'Failed to transcribe audio. Please try again.');
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setError('No audio recorded');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for this voice note.');
      return;
    }

    if (!buildingId && !channel) {
      setError('A building or channel is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (buildingId) formData.append('buildingId', buildingId);
      if (channel) formData.append('channel', channel);
      formData.append('title', title.trim());
      const extension = audioBlob?.type === 'audio/wav' ? 'wav' : 'webm';
      formData.append('audio', audioBlob, `voice-note.${extension}`);
      formData.append('transcription', transcription);
      formData.append('description', description);
      
      // Append all attachment files
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await notesAPI.createVoice(formData);
      onVoiceNoteAdded(response.data);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload voice note');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setDescription('');
    setAttachments([]);
    setTitle('');
    audioChunksRef.current = [];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            🎤 Record Voice Note
            {channel && (
              <span style={{ fontSize: '14px', color: 'var(--muted)', marginLeft: '6px' }}>
                for {channel} feed
              </span>
            )}
          </h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a short title for this voice note"
            required
          />
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
              
              <div className="form-group" style={{ marginTop: '20px', textAlign: 'left' }}>
                <label>Transcription {isTranscribing && <span style={{ color: 'var(--muted)' }}>(Transcribing...)</span>}</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="Transcription will appear automatically after recording stops. You can edit it if needed."
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px', textAlign: 'left' }}>
                <label>Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add additional notes, context, or description..."
                />
              </div>

              <div className="form-group" style={{ marginTop: '15px', textAlign: 'left' }}>
                <label>Attachments (Optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', marginBottom: '10px' }}
                >
                  📎 Add Files (Images, PDF, Excel, PowerPoint, etc.)
                </button>
                
                {attachments.length > 0 && (
                  <div className="note-attachments-preview" style={{ marginTop: '10px' }}>
                    {attachments.map((file, index) => (
                      <div key={index} className="note-attachment-chip">
                        <span style={{ fontSize: '14px' }}>📄 {file.name}</span>
                        <button type="button" onClick={() => removeAttachment(index)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={isTranscribing || loading}
                >
                  Record Again
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isTranscribing || loading}
                >
                  {loading ? 'Uploading...' : 'Submit Voice Note'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error" style={{ textAlign: 'center' }}>{error}</div>}

        <div style={{ marginTop: '20px', padding: '10px', background: 'var(--panel)', borderRadius: '8px', fontSize: '13px', color: 'var(--text)', border: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--primary)' }}>Note:</strong> For production use, integrate Whisper.js or send audio to backend for server-side transcription using OpenAI Whisper or similar models.
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
