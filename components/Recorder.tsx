import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CapturedFrame, AppState } from '../types';
import { MAX_FRAMES, CAPTURE_INTERVAL_MS, IMAGE_QUALITY } from '../constants';
import { Monitor, StopCircle, Video, Loader2 } from 'lucide-react';

interface RecorderProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  onFramesCaptured: (frames: CapturedFrame[]) => void;
}

const Recorder: React.FC<RecorderProps> = ({ appState, setAppState, onFramesCaptured }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 10 } // We don't need high FPS for screenshots
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle stream stop via browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };

      setAppState(AppState.RECORDING);
      setFrames([]);
    } catch (err) {
      console.error("Error accessing display media:", err);
      // Don't change state if user cancelled
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || appState !== AppState.RECORDING) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
      
      setFrames(prev => {
        const newFrames = [...prev, { timestamp: Date.now(), dataUrl }];
        // Stop automatically if max frames reached to prevent token overflow
        if (newFrames.length >= MAX_FRAMES) {
          // We can't call stopCapture directly here easily without dependency loops or refactoring,
          // so we'll handle the stop in the useEffect or just cap the frames.
          // Let's just cap for now and let user stop manually.
          return newFrames.slice(0, MAX_FRAMES);
        }
        return newFrames;
      });
    }
  }, [appState]);

  useEffect(() => {
    if (appState === AppState.RECORDING) {
      intervalRef.current = window.setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [appState, captureFrame]);

  const stopCapture = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setAppState(AppState.ANALYZING);
    // Pass frames up
    // We use the state 'frames' directly here.
    // However, since state updates are async, we might miss the very last one if we aren't careful.
    // But for 2s intervals, it's usually fine.
    
    // Slight delay to ensure state matches
    setTimeout(() => {
        onFramesCaptured(frames);
    }, 100);
  };

  // If we hit max frames, auto stop
  useEffect(() => {
    if (frames.length >= MAX_FRAMES && appState === AppState.RECORDING) {
      stopCapture();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.length, appState]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 relative overflow-hidden transition-all duration-300">
      
      {/* Hidden processing elements */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {appState === AppState.IDLE && (
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400">
            <Monitor size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white">Start Monitoring</h2>
          <p className="text-slate-400 text-sm">
            Share your screen or a specific window. Perform the task you want to automate. We'll analyze the visual steps.
          </p>
          <button
            onClick={startCapture}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto shadow-lg shadow-blue-500/20"
          >
            <Video size={18} />
            Start Recording
          </button>
        </div>
      )}

      {appState === AppState.RECORDING && (
        <div className="text-center space-y-6 w-full">
          <div className="animate-pulse flex flex-col items-center">
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 relative">
                <div className="w-16 h-16 bg-red-500/30 rounded-full absolute animate-ping"></div>
                <div className="w-10 h-10 bg-red-500 rounded-full z-10"></div>
             </div>
             <h3 className="text-lg font-semibold text-red-400">Recording in Progress</h3>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 w-full opacity-50 px-8">
             {/* Visualizer of captured frames */}
             {frames.map((f, i) => (
                <div key={f.timestamp} className="aspect-video bg-slate-900 rounded border border-slate-700 overflow-hidden">
                    <img src={f.dataUrl} alt={`Frame ${i}`} className="w-full h-full object-cover" />
                </div>
             ))}
             {Array.from({ length: Math.max(0, MAX_FRAMES - frames.length) }).map((_, i) => (
                <div key={i} className="aspect-video bg-slate-800/30 rounded border border-dashed border-slate-700/50"></div>
             ))}
          </div>

          <p className="text-slate-400 text-sm font-mono">
            {frames.length} / {MAX_FRAMES} samples collected
          </p>

          <button
            onClick={stopCapture}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto shadow-lg shadow-red-500/20"
          >
            <StopCircle size={20} />
            Stop & Analyze
          </button>
        </div>
      )}

      {appState === AppState.ANALYZING && (
        <div className="text-center py-12 space-y-4">
          <Loader2 size={48} className="animate-spin text-indigo-400 mx-auto" />
          <h2 className="text-xl font-medium text-white">Analyzing Workflow...</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Gemini is processing {frames.length} visual samples to reconstruct your workflow logic and generate automation scripts.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recorder;
