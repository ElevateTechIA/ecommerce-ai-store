import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

export function getFlashModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
}
