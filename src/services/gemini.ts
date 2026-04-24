import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "missing_key";
export const ai = new GoogleGenAI({ apiKey });
