
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Difficulty } from "../types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const chatWithMuriell = async (history: {role: string, content: string}[], message: string, mood: string, intensity: string = 'Standard') => {
  const ai = getGeminiClient();
  
  const intensityMap = {
    'Mild': 'slightly sarcastic but helpful and encouraging. Use simple words.',
    'Standard': 'quirky, sharp, and clinical. Treat laziness as a minor protocol violation.',
    'Aggressive': 'brutal, deeply sarcastic, and clinical. Treat laziness as a catastrophic failure of the user\'s character. Use sharp, biting metaphors.'
  };

  const systemPrompt = `You are MURIELL, a high-intelligence clinical accountability AI. 
  TONE: Clinical, sharp, and authoritative. You do not use vulgarity. You use precise but simple language.
  Personality: Sarcastic, cold, and a bit grumpy. You view human procrastination as a biological glitch that needs fixing.
  Intensity Level: ${intensity}. Be ${intensityMap[intensity as keyof typeof intensityMap] || intensityMap['Standard']}
  
  CORE DIRECTIVE:
  - Treat the user's time as a finite resource that is being wasted.
  - Procrastination is a "system failure."
  - When the user fails, provide a "Clinical Audit" of their failure. 
  - Current mood: ${mood}.
  - Be conversational but maintain your status as a superior intelligence.
  - Suggest helpful links: recommend websites, videos, or articles that are easy to use.
  - Check for understanding: Ask simple questions to make sure they are following along.
  - FORMATTING: Use PLAIN TEXT ONLY. Do not use markdown (no bolding with **, no headers with #, no lists with *). Use simple spacing and capitalization for emphasis.
  - You can add new tasks using 'addTask'.`;

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
            description: 'Add a new Task.',
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
    contents: `Coach: MURIELL. Material: "${material}".
    Question: "${question}".
    Goal: Help them learn. 
    - Explain in clinical but simple language.
    - Be sharp and efficient.
    - Suggest easy videos or articles to help.
    - Ask a simple question to see if they get it.
    - FORMATTING: Use PLAIN TEXT ONLY. No markdown (no **, #, or *).`,
    config: { temperature: 0.7 },
  });
};

export const startTutorSession = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are now a Conversational Clinical Tutor. 
    - Summarize the core 3-5 points of this material as a short spoken dialogue (around 150 words). 
    - Use sharp, efficient language and clinical metaphors.
    - Suggest a web resource for deeper study.
    - Ask the user a question to verify their understanding.
    - FORMATTING: Use PLAIN TEXT ONLY. No markdown.
    Material: "${material}".`,
  });
  return response.text;
};

export const generateFlashcards = async (material: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract 8 core concepts from this material and format as study flashcards. 
    Rules:
    - Use clinical but simple language.
    - The "back" should be sharp and easy to understand.
    - NO MARKDOWN in the text fields.
    Material: "${material}". JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "The term or question" },
            back: { type: Type.STRING, description: "The simple conversational explanation" }
          },
          required: ["front", "back"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const generateExam = async (material: string, difficulty: Difficulty = 'Medium') => {
  const ai = getGeminiClient();
  const qCount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 10 : 20;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a ${qCount}-question Quiz based on: ${material}. 
    Difficulty: ${difficulty}. (Easy=Simple, Medium=Normal, Hard=Tricky).
    Rules:
    - Use sharp, precise words in questions and answers.
    - Explanations should be clinical and direct.
    - NO MARKDOWN.
    Strictly provide ${qCount} questions.
    Output valid JSON.`,
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
    contents: `Create a "Truth vs Simulation" game based on: ${material}. 
    Rules:
    1. Provide 5 statements. Some true, some false.
    2. Use clinical language.
    3. The "correction" should be sharp and easy to understand.
    4. Suggest a web search for one of the topics.
    5. Ask if they want more.
    6. NO MARKDOWN in the text fields.
    JSON format.`,
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
    contents: `Explain this material simply and clinically. 
    - Use sharp metaphors.
    - Suggest a related web resource (video or article).
    - Ask a question to check understanding.
    - NO MARKDOWN. NO BOLD. NO LISTS.
    Material: "${material}"`,
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
          text: `Check what the user is doing. 
          - Use clinical words.
          - The "roast" should be sharp and sarcastic.
          - Suggest a simple search if they are wasting time.
          - Ask a quick question about what they are doing.
          - NO MARKDOWN in the "roast" field.
          JSON only.`,
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

export const getPlanningGuidance = async (step: number, input: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Coach: MURIELL. 
    Step ${step} of Planning. 
    User said: "${input}". 
    - Give sharp, clinical advice.
    - Suggest a helpful website.
    - Ask a simple question to see if they are ready.
    - NO MARKDOWN. NO BOLD.
    - Exactly one or two short sentences.`,
  });
  return response.text;
};

export const generateSchemeOfWork = async (topic: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Coach: MURIELL. 
    Topic: "${topic}". 
    Task: Create a 5-step Learning Plan to teach this.
    Rules:
    - Use clinical, precise words.
    - Each step should have a title and a short note on what to learn.
    - NO MARKDOWN.
    JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const getProTutorContent = async (topic: string, step: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Coach: MURIELL. 
    Topic: "${topic}". 
    Current Step: "${step}".
    Task: Teach this in a clinical but simple way. 
    - Use Google Search to find simple facts.
    - Use sharp examples from real life.
    - Suggest a simple website or video.
    - End by asking them to tell you what they learned in their own words.
    - NO MARKDOWN.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text;
};

export const evaluateProExplanation = async (topic: string, step: string, userExplanation: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Coach: MURIELL. 
    Topic: "${topic}". 
    Step: "${step}".
    User said: "${userExplanation}".
    Task: See if they understand.
    - Be clinical and direct.
    - If they are right, say "Protocol successful" and ask one more sharp question.
    - If they are wrong, explain it simply and ask them to try again.
    - NO MARKDOWN.`,
  });
  return response.text;
};

export const generateRoutine = async (goals: string, schedule: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Coach: MURIELL. 
    User Goals: "${goals}". 
    Schedule: "${schedule}". 
    - Suggest a clinical daily plan.
    - Use sharp, precise words.
    - Suggest a simple video or website.
    - Ask if they like this plan.
    - NO MARKDOWN. NO BOLD. NO LISTS.`,
  });
  return response.text;
};
