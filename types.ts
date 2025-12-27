export interface Scenario {
  id: string;
  title: string;
  description: string;
  context: string;
  goal: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface AnalysisResult {
  scores: {
    tonalEvenness: number;
    acousticTexture: number;
    semanticNeutrality: number;
    overallCenteredness: number;
  };
  feedback: {
    summary: string;
    positivePoints: string[];
    areasForImprovement: string[];
    specificActionableAdvice: string;
  };
}

export enum AppState {
  SELECTION = 'SELECTION',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
