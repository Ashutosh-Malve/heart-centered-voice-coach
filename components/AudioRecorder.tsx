import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { Scenario } from '../types';

interface AudioRecorderProps {
  scenario: Scenario;
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ scenario, onRecordingComplete, onCancel, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Visualizer setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Recorder setup
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp4' }); // Gemini likes mp4/webm
        setAudioBlob(blob);
        stopVisualizer();
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      drawVisualizer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f8fafc'; // Match background
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on height/loudness - soft colors
        const r = 56 + (barHeight + (25 * (i/dataArray.length)));
        const g = 189;
        const b = 248;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        // Center the bars vertically
        ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      
      {/* Scenario Card Context */}
      <div className="bg-white w-full rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-2">Selected Scenario</h3>
        <h2 className="text-2xl font-serif text-slate-800 mb-2">{scenario.title}</h2>
        <p className="text-slate-600 italic mb-4">"{scenario.context}"</p>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <p className="text-indigo-900 font-medium text-sm">
            <span className="font-bold">Goal:</span> {scenario.goal}
          </p>
        </div>
      </div>

      {/* Visualizer / Placeholder */}
      <div className="relative w-full h-48 bg-slate-100 rounded-3xl overflow-hidden mb-8 border border-slate-200 flex items-center justify-center">
        {isRecording ? (
           <canvas ref={canvasRef} width={600} height={192} className="w-full h-full" />
        ) : audioBlob ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-slate-500 font-medium">Recording Complete</p>
            <p className="text-slate-400 text-sm">{formatTime(recordingTime)}</p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Press record when you are centered and ready.</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {!isRecording && !audioBlob && (
          <>
            <button onClick={onCancel} className="px-6 py-3 text-slate-500 hover:text-slate-700 font-medium">
              Back
            </button>
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
          </>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-900 shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <Square className="w-6 h-6 text-white fill-current" />
          </button>
        )}

        {audioBlob && !isProcessing && (
          <>
            <button
              onClick={resetRecording}
              className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Redo
            </button>
            <button
              onClick={() => onRecordingComplete(audioBlob)}
              className="px-8 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200 flex items-center gap-2 transition-colors font-medium"
            >
              Analyze
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {isProcessing && (
           <div className="flex flex-col items-center">
             <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
             <p className="text-slate-500 text-sm animate-pulse">Analyzing centeredness...</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
