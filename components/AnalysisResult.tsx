import React from 'react';
import { WorkflowSuggestion, AppState } from '../types';
import CodeBlock from './CodeBlock';
import { Zap, ArrowLeft, Terminal, FileCode, PlayCircle } from 'lucide-react';

interface AnalysisResultProps {
  suggestions: WorkflowSuggestion[];
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ suggestions, onReset }) => {
  const [selectedId, setSelectedId] = React.useState<string>(suggestions[0]?.id || '');

  const selectedSuggestion = suggestions.find(s => s.id === selectedId) || suggestions[0];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          New Recording
        </button>
        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-medium border border-green-400/20">
          <Zap size={12} />
          Analysis Complete
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar: Suggestions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Proposed Automations</h3>
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              onClick={() => setSelectedId(suggestion.id)}
              className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                selectedId === suggestion.id 
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  selectedId === suggestion.id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {suggestion.type.includes('Python') ? <Terminal size={18} /> : 
                   suggestion.type.includes('Shell') ? <FileCode size={18} /> : <PlayCircle size={18} />}
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${
                    suggestion.complexity === 'Low' ? 'border-green-500/30 text-green-400' :
                    suggestion.complexity === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                    'border-red-500/30 text-red-400'
                }`}>
                  {suggestion.complexity} Complexity
                </span>
              </div>
              <h4 className={`font-medium ${selectedId === suggestion.id ? 'text-blue-300' : 'text-slate-200'}`}>
                {suggestion.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content: Code and Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSuggestion && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedSuggestion.title}</h2>
                <p className="text-slate-400 leading-relaxed">{selectedSuggestion.description}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Workflow Steps Identified</h3>
                <ul className="space-y-2">
                  {selectedSuggestion.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 mt-0.5">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  Generated Script
                  <span className="text-xs normal-case font-normal text-slate-500">
                    {selectedSuggestion.type}
                  </span>
                </h3>
                <CodeBlock 
                  code={selectedSuggestion.code} 
                  language={selectedSuggestion.type.toLowerCase().includes('python') ? 'python' : 'javascript'} 
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AnalysisResult;
