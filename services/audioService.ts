
import { GoogleGenAI } from "@google/genai";

// Manual implementation of base64 decoding following provided examples
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Robust implementation of audio decoding for raw PCM stream bytes from Gemini API
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const speakWithMuriell = async (text: string) => {
  try {
    // Create new instance per call to ensure latest key/context
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this in a sarcastic, slightly mean but sophisticated ghost voice: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) return;

    // Iterate through parts to find the audio content
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.includes('audio')) {
        const base64Audio = part.inlineData.data;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(
          decodeBase64(base64Audio),
          audioCtx,
          24000,
          1
        );
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        break;
      }
    }
  } catch (error) {
    console.error("Muriell Voice Error:", error);
  }
};

export const startListening = (onResult: (text: string) => void, onEnd: () => void) => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Voice input not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
  return recognition;
};
