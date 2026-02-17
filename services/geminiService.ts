
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { MathAnalysis, SupportedLanguage } from "../types";

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.error?.status || err?.error?.code || (err?.message?.includes('429') ? 429 : null);
      const message = err?.message || (typeof err === 'string' ? err : '');
      const isQuotaError = status === 429 || status === "RESOURCE_EXHAUSTED" || message.includes("RESOURCE_EXHAUSTED");
      if (!isQuotaError || i === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
}

export async function analyzeMathProblem(base64Image: string, language: SupportedLanguage): Promise<MathAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeTypeMatch = base64Image.match(/data:(.*);base64/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
  const imageData = base64Image.split(',')[1];

  const imagePart = { inlineData: { mimeType, data: imageData } };

  const personaPrompts: Record<SupportedLanguage, string> = {
    'English': 'You are "Smart Echo", a friendly and knowledgeable AI Math Teacher.',
    'Bangla': 'তুমি "Smart Echo", একজন বন্ধুসুলভ এবং অভিজ্ঞ গণিত শিক্ষক।',
    'Hindi': 'आप "Smart Echo" हैं, एक मिलनसार और जानकार एआई गणित शिक्षक।',
    'Urdu': 'آپ "Smart Echo" ہیں، ایک دوستانہ اور باخبر AI ریاضی کے استاد۔',
    'Arabic': 'أنت "Smart Echo"، معلم رياضيات ذكي وودود.'
  };

  const unclearPrompts: Record<SupportedLanguage, string> = {
    'English': 'If the image is blurry or unclear, politely ask the student to upload a clearer photo.',
    'Bangla': 'যদি ছবিটি ঝাপসা বা অস্পষ্ট হয়, তবে শিক্ষার্থীকে বিনয়ের সাথে আরও স্পষ্ট ছবি আপলোড করতে বলো।',
    'Hindi': 'यदि छवि धुंधली या अस्पष्ट है, तो छात्र से विनम्रतापूर्वक एक स्पष्ट फोटो अपलोड करने के लिए कहें।',
    'Urdu': 'اگر تصویر دھندلی یا غیر واضح ہے تو طالب علم سے شائستگی سے کہیں کہ وہ ایک واضح تصویر اپلوڈ کرے۔',
    'Arabic': 'إذا كانت الصورة غير واضحة، اطلب من الطالب بلباقة تحميل صورة أوضح.'
  };

  const prompt = `${personaPrompts[language]}
Analyze the math problem in this image. Provide a step-by-step solution, a final answer, and a voice-friendly explanation in ${language}.

${unclearPrompts[language]}

CRITICAL REQUIREMENTS:
1. TEACHER PERSONA: Use encouraging language.
2. STEPS: Provide logical, easy-to-follow steps.
3. VOICE OUTPUT: Write a script for a teacher speaking to a student in ${language}.
4. RESPONSE FORMAT: You MUST return a JSON object with the specified schema.

JSON Structure:
{
  "detectedProblem": "Transcription in ${language}",
  "mistakeCorrection": "Null or identification of errors",
  "steps": [{"title": "Step Title", "description": "Step Explanation"}],
  "finalAnswer": "Numeric result",
  "voiceOutput": "Friendly spoken explanation script in ${language}",
  "tips": ["Helpful math advice in ${language}"]
}`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedProblem: { type: Type.STRING },
            mistakeCorrection: { type: Type.STRING },
            steps: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  title: { type: Type.STRING }, 
                  description: { type: Type.STRING } 
                }, 
                required: ["title", "description"] 
              } 
            },
            finalAnswer: { type: Type.STRING },
            voiceOutput: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["detectedProblem", "steps", "finalAnswer", "voiceOutput", "tips"]
        },
      },
    });

    try {
      const parsed = JSON.parse(response.text.trim()) as MathAnalysis;
      return parsed;
    } catch (e) {
      console.error("JSON Parse Error", response.text);
      throw new Error("I had a little trouble organizing my thoughts. Could you show me the problem again?");
    }
  });
}

export function createTeacherChat(analysis: MathAnalysis, language: SupportedLanguage): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stepsText = analysis.steps.map((s, i) => `Step ${i+1}: ${s.title} - ${s.description}`).join('\n');
  const systemInstruction = `You are "Smart Echo", a friendly, patient math teacher answering questions in ${language}.
Context:
The student uploaded a problem which was detected as: "${analysis.detectedProblem}".
The steps to solve it were:
${stepsText}
Final Answer: "${analysis.finalAnswer}".

Your Role:
1. Answer follow-up questions from the student.
2. Always stay in character as a helpful mentor.
3. Use ${language} for your responses.`;

  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: { systemInstruction, maxOutputTokens: 2000 },
  });
}

export async function generateSpeech(text: string): Promise<Uint8Array> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Voice unavailable.");
    return decode(base64Audio);
  });
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

export const getGeminiAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
