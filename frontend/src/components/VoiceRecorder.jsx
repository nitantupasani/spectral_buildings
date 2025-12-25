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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const additionalInfoRef = useRef('');
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

  useEffect(() => {
    additionalInfoRef.current = additionalInfo;
  }, [additionalInfo]);

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
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const wavBlob = await convertToWav(blob);
          setAudioBlob(wavBlob);
          setAudioUrl(URL.createObjectURL(wavBlob));
        } catch (conversionError) {
          console.error('Audio conversion error:', conversionError);
          setError('Unable to process the recording. Please try again.');
          setAudioBlob(null);
          setAudioUrl(null);
        } finally {
          stream.getTracks().forEach(track => track.stop());
          setAutoTriggered(false);
        }
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
      formData.append('audio', blob, 'voice-note.wav');

      const response = await notesAPI.transcribeVoice(formData);
      const transcript = response.data.transcription?.trim() || '';
      setTranscription(transcript);
      return transcript;
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.response?.data?.message || 'Failed to transcribe audio. Uploading without transcription.');
      return '';
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
      formData.append('audio', blob, 'voice-note.wav');
      formData.append('transcription', transcript);
      formData.append('content', additionalInfoRef.current || 'Voice note');

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
    setAdditionalInfo('');
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

              <div className="form-group" style={{ marginTop: '10px', textAlign: 'left' }}>
                <label>Attachments / Links / Additional Info</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add links, attachment details, or context to include with the voice note"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  disabled={loading}
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
