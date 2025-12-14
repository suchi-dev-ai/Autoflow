import { GoogleGenAI, Type } from "@google/genai";
import { CapturedFrame, WorkflowSuggestion, AutomationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert Workflow Automation Engineer. 
Your goal is to analyze a series of screenshots depicting a user's workflow in a web browser or desktop environment.
Based on the visual evidence, you must:
1. Reconstruct the step-by-step workflow.
2. Identify the intent of the user.
3. Suggest the best way to automate this task using code (Python Selenium, Playwright, or Puppeteer are preferred for web tasks).
4. Provide the actual executable code to automate the workflow.

Return the response in a structured JSON format.
`;

export const analyzeWorkflow = async (frames: CapturedFrame[]): Promise<WorkflowSuggestion[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare the image parts
  // We strictly use base64 data without the prefix for the API
  const imageParts = frames.map(frame => {
    // dataUrl is like "data:image/jpeg;base64,....."
    const base64Data = frame.dataUrl.split(',')[1];
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    };
  });

  const prompt = `
    Here is a recording of a task I perform manually. 
    Analyze these ${frames.length} frames (taken every 2 seconds).
    
    Output a JSON object with a list of suggestions.
    Each suggestion should have:
    - title: A short name for the automation.
    - description: What this script does.
    - complexity: 'Low', 'Medium', or 'High'.
    - type: One of 'Python (Selenium)', 'Python (Playwright)', 'Node.js (Puppeteer)', 'Shell Script'.
    - steps: An array of strings describing the logical steps identified.
    - code: The full code implementation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using flash for efficient multimodal processing
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              complexity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              type: { 
                type: Type.STRING, 
                enum: [
                  'Python (Selenium)', 
                  'Python (Playwright)', 
                  'Node.js (Puppeteer)', 
                  'Shell Script',
                  'Google Apps Script'
                ] 
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              code: { type: Type.STRING }
            },
            required: ['title', 'description', 'complexity', 'type', 'steps', 'code']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    const suggestions = JSON.parse(text) as WorkflowSuggestion[];
    // Add IDs if missing or ensure uniqueness (though schema requests id)
    return suggestions.map((s, idx) => ({ ...s, id: s.id || `sugg-${idx}` }));

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
