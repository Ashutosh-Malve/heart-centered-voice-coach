import React, { useState } from 'react';
import { AppState, Scenario, AnalysisResult } from './types';
import ScenarioSelection from './components/ScenarioSelection';
import AudioRecorder from './components/AudioRecorder';
import FeedbackView from './components/FeedbackView';
import { analyzeAudioResponse } from './services/geminiService';
import { Activity } from 'lucide-react';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.SELECTION);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentState(AppState.RECORDING);
  };

  const handleCancelRecording = () => {
    setSelectedScenario(null);
    setCurrentState(AppState.SELECTION);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:audio/mp4;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRecordingComplete = async (blob: Blob) => {
    if (!selectedScenario) return;

    setCurrentState(AppState.ANALYZING);

    try {
      const base64Audio = await blobToBase64(blob);
      const result = await analyzeAudioResponse(base64Audio, selectedScenario.context);
      
      setAnalysisResult(result);
      setCurrentState(AppState.RESULTS);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Something went wrong with the AI analysis. Please try again.");
      setCurrentState(AppState.RECORDING); // Go back to allow retry
    }
  };

  const handleRetry = () => {
    setCurrentState(AppState.RECORDING);
    setAnalysisResult(null);
  };

  const handleNewScenario = () => {
    setSelectedScenario(null);
    setAnalysisResult(null);
    setCurrentState(AppState.SELECTION);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-serif font-semibold text-slate-800 tracking-tight">
              Heart<span className="text-sky-500">Voice</span>
            </h1>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Powered by Gemini 2.0 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {currentState === AppState.SELECTION && (
          <ScenarioSelection onSelect={handleScenarioSelect} />
        )}

        {(currentState === AppState.RECORDING || currentState === AppState.ANALYZING) && selectedScenario && (
          <AudioRecorder 
            scenario={selectedScenario} 
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleCancelRecording}
            isProcessing={currentState === AppState.ANALYZING}
          />
        )}

        {currentState === AppState.RESULTS && selectedScenario && analysisResult && (
          <FeedbackView 
            result={analysisResult} 
            scenario={selectedScenario} 
            onRetry={handleRetry}
            onNewScenario={handleNewScenario}
          />
        )}
      </main>
      
      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Heart-Centered Communication AI
      </footer>
    </div>
  );
};

export default App;
