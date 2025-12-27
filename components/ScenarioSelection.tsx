import React, { useState } from 'react';
import { Scenario } from '../types';
import { MessageSquare, Briefcase, Home, Heart, Zap, Loader2, RefreshCw } from 'lucide-react';
import { generateScenarios } from '../services/geminiService';

interface ScenarioSelectionProps {
  onSelect: (scenario: Scenario) => void;
}

const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onSelect }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const newScenarios = await generateScenarios();
      setScenarios(newScenarios);
    } catch (err) {
      setError("Failed to load scenarios. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return <Home className="w-6 h-6 text-sky-500" />;
      case 'Intermediate': return <Briefcase className="w-6 h-6 text-indigo-500" />;
      case 'Advanced': return <Zap className="w-6 h-6 text-rose-500" />;
      default: return <MessageSquare className="w-6 h-6" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-700';
      case 'Intermediate': return 'bg-amber-100 text-amber-700';
      case 'Advanced': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-slate-800 mb-4">Heart-Centered Practice</h2>
        
        {scenarios.length === 0 && !loading && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto mb-8 text-left">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              Before you begin:
            </h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="text-sky-400">•</span>
                <span>Before you have a conversation, relax, bring your attention to your heart, and center yourself there.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">•</span>
                <span>Stay connected with your center as you speak.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">•</span>
                <span>Observe the tone of your voice and let it flow evenly. Remove any rise and fall in pitch, sharpness, or roughness.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">•</span>
                <span>Attune your speech to the balanced condition of your heart.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">•</span>
                <span>See if you can feel a relationship establishing with the original current within you.</span>
              </li>
            </ul>
          </div>
        )}

        {!loading && scenarios.length === 0 && (
          <button 
            onClick={fetchScenarios}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-full text-lg font-medium hover:bg-sky-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <RefreshCw className="w-5 h-5" />
            Generate Practice Scenario
          </button>
        )}
        
        {!loading && scenarios.length > 0 && (
          <button 
            onClick={fetchScenarios}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 hover:text-sky-600 transition-colors mb-8"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New Scenario
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
          <p className="text-slate-400 animate-pulse">Designing conflict scenario...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
            <p className="text-rose-500 mb-4">{error}</p>
            <button 
              onClick={fetchScenarios}
              className="text-sky-600 underline hover:text-sky-700"
            >
              Try Again
            </button>
        </div>
      ) : (
        scenarios.length > 0 && (
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => onSelect(scenario)}
                  className="w-full flex flex-col text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-sky-100 transition-all duration-300 group"
                >
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl w-fit group-hover:bg-sky-50 transition-colors">
                    {getIcon(scenario.difficulty)}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{scenario.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-sky-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                      Start Practice &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ScenarioSelection;
