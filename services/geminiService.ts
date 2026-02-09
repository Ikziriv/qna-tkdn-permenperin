
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserAnswer, Question, Language } from "../types";

export const getExpertAnalysis = async (
  user: UserProfile,
  answers: UserAnswer[],
  questions: Question[],
  language: Language
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert Senior Consultant specializing in Indonesian Ministry of Industry Regulations, specifically Peraturan Menteri Perindustrian No. 35 Tahun 2025 regarding TKDN (Tingkat Komponen Dalam Negeri) and BMP (Bobot Manfaat Perusahaan).
    
    The user is ${user.name}, who identifies as a ${user.role}.
    The final output MUST be written entirely in ${language === 'id' ? 'Indonesian' : 'English'}.
    
    Review their assessment performance on the following regulatory topics:
    ${answers.map((ans, idx) => {
      const q = questions.find(q => q.id === ans.questionId);
      const isCorrect = q?.correctAnswerIndex === ans.answerIndex;
      return `Regulation Topic: ${q?.category.en} | Result: ${isCorrect ? 'Mastered' : 'Needs Review'} | Context: ${q?.text.en}`;
    }).join('\n')}
    
    Based on the regulation Permenperin 35/2025, provide:
    1. A strategic executive summary of their regulatory readiness (2 sentences).
    2. Two key regulatory strengths identified (e.g., knowledge of Pasal 4 weights, BMP limits).
    3. One specific actionable compliance recommendation tailored to their role as a ${user.role} to improve their company's TKDN strategy.
    
    Maintain a high-level, professional, and authoritative tone. Use official terminology from the Indonesian regulation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || (language === 'id' ? "Analisis regulasi saat ini tidak tersedia." : "Regulatory analysis currently unavailable.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'id' 
      ? "Kami tidak dapat membuat wawasan regulasi personal saat ini, tetapi skor kepatuhan Anda siap di bawah." 
      : "We're unable to generate a personalized regulatory insight at this moment, but your compliance score is ready below.";
  }
};
