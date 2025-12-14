import React, { useState } from 'react';
import { AppState, CapturedFrame, WorkflowSuggestion } from './types';
import Recorder from './components/Recorder';
import AnalysisResult from './components/AnalysisResult';
import { analyzeWorkflow } from './services/geminiService';
import { Cpu, Github, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFramesCaptured = async (frames: CapturedFrame[]) => {
    try {
      if (frames.length === 0) {
        throw new Error("No frames captured.");
      }
      setAppState(AppState.ANALYZING);
      const result = await analyzeWorkflow(frames);
      setSuggestions(result);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze workflow.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Cpu size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AutoFlow
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded bg-slate-900/50 hidden md:block">
              Powered by Gemini 2.5
            </span>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Hero Section (only when Idle) */}
        {appState === AppState.IDLE && (
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Turn <span className="text-blue-500">Manual Work</span> into <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Automated Scripts</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Record your screen while performing a repetitive task. Our AI analyzes the visual workflow and generates the Python or JavaScript code to automate it.
            </p>
          </div>
        )}

        {/* App Container */}
        <div className="w-full max-w-5xl mx-auto">
          
          {/* Error Banner */}
          {appState === AppState.ERROR && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 flex items-center gap-4 text-red-200">
              <AlertCircle size={24} />
              <div>
                <h4 className="font-semibold">Analysis Failed</h4>
                <p className="text-sm opacity-80">{error}</p>
                <button onClick={handleReset} className="text-sm underline mt-2 hover:text-white">Try Again</button>
              </div>
            </div>
          )}

          {/* Conditional Rendering based on state */}
          {(appState === AppState.IDLE || appState === AppState.RECORDING || appState === AppState.ANALYZING) && (
            <Recorder 
              appState={appState} 
              setAppState={setAppState} 
              onFramesCaptured={handleFramesCaptured} 
            />
          )}

          {appState === AppState.RESULTS && (
            <AnalysisResult 
              suggestions={suggestions} 
              onReset={handleReset} 
            />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
