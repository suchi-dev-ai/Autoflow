export enum AutomationType {
  PYTHON_SELENIUM = 'Python (Selenium)',
  PYTHON_PLAYWRIGHT = 'Python (Playwright)',
  JAVASCRIPT_PUPPETEER = 'Node.js (Puppeteer)',
  BASH = 'Shell Script',
  APP_SCRIPT = 'Google Apps Script'
}

export interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  complexity: 'Low' | 'Medium' | 'High';
  type: AutomationType;
  code: string;
  steps: string[];
}

export interface CapturedFrame {
  timestamp: number;
  dataUrl: string; // Base64 image
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
