import React from 'react';
import { AnalysisResult, Scenario } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FeedbackViewProps {
  result: AnalysisResult;
  scenario: Scenario;
  onRetry: () => void;
  onNewScenario: () => void;
}

const ScoreCard: React.FC<{ title: string; score: number; description: string; color: string }> = ({ title, score, description, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center h-full">
    <div className="relative w-24 h-24 mb-3">
        {/* Simple Circle Chart for individual metric */}
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <path
                className="text-slate-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                className={color}
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
            />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${color.replace('stroke-', 'text-')}`}>{score}</span>
        </div>
    </div>
    <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

const FeedbackView: React.FC<FeedbackViewProps> = ({ result, scenario, onRetry, onNewScenario }) => {
  const { scores, feedback } = result;

  const mainScoreData = [
    { name: 'Score', value: scores.overallCenteredness, fill: '#0ea5e9' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif text-slate-800">Analysis Results</h2>
          <p className="text-slate-500">Scenario: {scenario.title}</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onRetry} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 font-medium">
                Try Again
            </button>
            <button onClick={onNewScenario} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-900 font-medium">
                New Scenario
            </button>
        </div>
      </div>

      {/* Top Section: Overall Score & Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Main Score */}
        <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 to-indigo-400"></div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-4">Overall Centeredness</h3>
            <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={15} data={mainScoreData} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-serif font-medium text-slate-800">{scores.overallCenteredness}</span>
                    <span className="text-xs text-slate-400 mt-1">out of 100</span>
                </div>
            </div>
        </div>

        {/* AI Summary */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-indigo-50 shadow-sm flex flex-col justify-center">
            <h3 className="text-indigo-900 font-serif text-xl mb-3">Coach's Summary</h3>
            <p className="text-slate-700 leading-relaxed mb-4">{feedback.summary}</p>
            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Actionable Advice</h4>
                <p className="text-indigo-900 font-medium italic">"{feedback.specificActionableAdvice}"</p>
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <ScoreCard 
            title="Tonal Evenness" 
            score={scores.tonalEvenness} 
            description="Stability of pitch and lack of reactivity."
            color="stroke-emerald-500"
        />
        <ScoreCard 
            title="Acoustic Texture" 
            score={scores.acousticTexture} 
            description="Smoothness vs. roughness/aggression."
            color="stroke-sky-500"
        />
        <ScoreCard 
            title="Semantic Neutrality" 
            score={scores.semanticNeutrality} 
            description="Use of observation over judgment."
            color="stroke-violet-500"
        />
      </div>

      {/* Detailed Lists */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                What You Did Well
            </h3>
            <ul className="space-y-3">
                {feedback.positivePoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-1.5 shrink-0" />
                        {point}
                    </li>
                ))}
            </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Areas for Growth
            </h3>
            <ul className="space-y-3">
                {feedback.areasForImprovement.map((point, i) => (
                    <li key={i} className="flex gap-3 text-slate-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5 shrink-0" />
                        {point}
                    </li>
                ))}
            </ul>
        </div>
      </div>

    </div>
  );
};

export default FeedbackView;
