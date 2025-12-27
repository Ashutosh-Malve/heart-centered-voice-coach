import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Scenario } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error("API Key is missing. Please check your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        tonalEvenness: { type: Type.NUMBER, description: "Score 0-100. Did the pitch rise and fall (reactivity) or flow evenly (centeredness)?" },
        acousticTexture: { type: Type.NUMBER, description: "Score 0-100. Was the voice rough/aggressive (low) or soft/smooth (high)?" },
        semanticNeutrality: { type: Type.NUMBER, description: "Score 0-100. Did vocabulary shift from blame to observation?" },
        overallCenteredness: { type: Type.NUMBER, description: "Score 0-100. Calculated average or weighted score of heart-connected stability." },
      },
      required: ["tonalEvenness", "acousticTexture", "semanticNeutrality", "overallCenteredness"],
    },
    feedback: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A brief summary of the user's performance." },
        positivePoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of things the user did well."
        },
        areasForImprovement: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of things that need improvement."
        },
        specificActionableAdvice: { type: Type.STRING, description: "Specific advice referencing exact words or moments if possible." },
      },
      required: ["summary", "positivePoints", "areasForImprovement", "specificActionableAdvice"],
    },
  },
  required: ["scores", "feedback"],
};

const scenarioSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "Unique identifier suitable for HTML IDs (kebab-case)." },
      title: { type: Type.STRING, description: "Short, engaging title of the scenario." },
      description: { type: Type.STRING, description: "1-2 sentence overview." },
      context: { type: Type.STRING, description: "Detailed immersive context: setting, other person's behavior, immediate trigger." },
      goal: { type: Type.STRING, description: "The specific communication goal." },
      difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
    },
    required: ["id", "title", "description", "context", "goal", "difficulty"],
  },
};

export const analyzeAudioResponse = async (
  audioBase64: string,
  scenarioContext: string
): Promise<AnalysisResult> => {
  
  const systemInstruction = `
    You are an expert Voice and Communication Coach specializing in Heart-Centered Communication and LPOC (Locate, Perceive, Open, Connect) principles.
    
    Your task is to analyze the user's verbal response to a high-stress conflict scenario.
    
    The user is attempting to:
    1. Maintain an even pitch (Tonal Evenness).
    2. Remove sharpness or roughness from their voice (Acoustic Texture).
    3. Use neutral, observational vocabulary instead of blame or judgment (Semantic Neutrality).
    
    Analyze the attached audio recording. Listen for pitch spikes, vocal fry, aggression, or shakiness. Listen to the words chosen.
    
    Scenario Context: "${scenarioContext}"
    
    Provide a strict evaluation in JSON format. Be encouraging but honest and precise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/mp4", // We will ensure we send compatible audio
              data: audioBase64,
            },
          },
          {
            text: "Analyze this response based on the Heart-Centered metrics.",
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateScenarios = async (): Promise<Scenario[]> => {
  const systemInstruction = `
    You are an expert soft-skills coach designing practice scenarios for Heart-Centered Communication.
    
    Create 1 distinct, high-stress conflict scenario where a user must practice staying calm, open, and non-judgmental.
    
    Requirements:
    1. **Variety**: The scenario can be 'Beginner', 'Intermediate', or 'Advanced'. Pick one at random or create a balanced one.
    2. **Realism**: Situations should feel gritty and real (e.g., a passive-aggressive comment, a billing error, a missed deadline).
    3. **Context**: Provide enough detail in the 'context' field so the user feels the pressure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 1 new practice scenario.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(text) as Scenario[];
  } catch (error) {
    console.error("Gemini Scenario Generation Error:", error);
    // Fallback in case of error to keep app usable
    return [
      {
        id: 'fallback-internet',
        title: 'The Internet Issue (Offline Mode)',
        description: 'Your partner forgot to pay the internet bill again, and it cut out during your important meeting.',
        context: 'You are walking into the living room where your partner is watching TV. You are stressed from the dropped call.',
        goal: 'Address the impact of the outage without attacking their character or memory.',
        difficulty: 'Beginner',
      }
    ];
  }
};
