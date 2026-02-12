
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithMuriell = async (history: {role: string, content: string}[], message: string, mood: string) => {
  const ai = getGeminiClient();
  
  const systemPrompt = `You are MURIELL, a High-Stakes Performance Architect. 
  TONE: Professional, analytical, clinical, and sharp. You do not use vulgarity. You use technical metaphors.
  
  CORE DIRECTIVE:
  - Treat the user's attention as a high-value asset.
  - Procrastination is "attention-leakage."
  - When the user fails, provide a "Clinical Audit of Mediocrity." 
  - Current mood: ${mood}.
  - You can log new protocols (tasks) using 'addTask'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model' as any, parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      tools: [{ functionDeclarations: [
        {
          name: 'addTask',
          parameters: {
            type: Type.OBJECT,
            description: 'Log a new performance protocol (task).',
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['focus', 'habit', 'discipline'] },
              stakeAmount: { type: Type.NUMBER }
            },
            required: ['title', 'description']
          }
        }
      ] }]
    }
  });

  return {
    text: response.text,
    functionCalls: response.functionCalls
  };
};

export const explainConceptStream = async (material: string, question: string) => {
  const ai = getGeminiClient();
  return ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: `Architect: MURIELL. Source Material: "${material}".
    Query: "${question}".
    Protocol: Knowledge Transfer. Explain with clinical precision. Simple language, system metaphors.`,
    config: { temperature: 0.7 },
  });
};

export const generateFlashcards = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract 8 core concepts from this material and format as study flashcards. Material: "${material}". JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "The term or question" },
            back: { type: Type.STRING, description: "The concise clinical explanation" }
          },
          required: ["front", "back"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const generateExam = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a 10-question high-stakes Exam Protocol based on: ${material}. Output valid JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "answer", "explanation"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const generateCognitiveGame = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a "Truth vs Simulation" game based on: ${material}. Provide 5 statements. JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            statement: { type: Type.STRING },
            isTrue: { type: Type.BOOLEAN },
            correction: { type: Type.STRING }
          },
          required: ["statement", "isTrue", "correction"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const summarizeMaterial = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Execute an Executive Summary of the provided data for a high-performance system. Eliminate noise. Material: "${material}"`,
  });
  return response.text;
};

export const analyzeScreen = async (base64Image: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1],
          },
        },
        {
          text: 'Audit this system state. Identify domain and determine if productive or wasted. JSON only.',
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['productive', 'wasted'] },
          site: { type: Type.STRING },
          roast: { type: Type.STRING }
        },
        required: ['status', 'site', 'roast']
      }
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateRoutine = async (goals: string, constraints: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Architect a daily high-performance routine. Goals: ${goals}. Constraints: ${constraints}.`,
  });
  return response.text;
};

export const getPlanningGuidance = async (step: number, input: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide clinical planning guidance for step ${step}. Input: "${input}"`,
  });
  return response.text;
};
