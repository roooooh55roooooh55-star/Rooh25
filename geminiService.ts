
import { GoogleGenAI, Type } from "@google/genai";
import { Video, UserInteractions } from "./types";

export interface VideoInsight {
  summary: string;
  horrorLevel: number;
  tags: string[];
}

export async function suggestTags(title: string, category: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على عنوان فيديو الرعب: "${title}" والتصنيف: "${category}"، اقترح 5 أوسمة (tags) قصيرة. 
      يجب أن تشمل الاقتراحات أوسمة مثل (supernatural, haunted, ghost) إذا كانت مناسبة. 
      أرجعها كقائمة JSON فقط.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return ["supernatural", "haunted", "ghost", "رعب", "غموض"]; }
}

export async function getRecommendedFeed(allVideos: Video[], interactions: UserInteractions): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const likedVideos = allVideos.filter(v => interactions.likedIds.includes(v.id));
  const favoriteCategories = Array.from(new Set(likedVideos.map(v => v.category)));
  
  const videoContext = allVideos.map(v => ({ id: v.id, title: v.title, category: v.category }));
  
  const prompt = `
    أنت خبير في رعب المحتوى. المستخدم يحب هذه التصنيفات: ${JSON.stringify(favoriteCategories)}.
    الفيديوهات التي أعجب بها: ${likedVideos.map(v => v.title).join(', ')}.
    رتب قائمة الـ IDs التالية: ${JSON.stringify(videoContext.map(v => v.id))} 
    بحيث تظهر الفيديوهات التي تنتمي للتصنيفات المفضلة للمستخدم أولاً، متبوعة بالفيديوهات المشابهة في العنوان.
    أرجع فقط مصفوفة JSON تحتوي على الـ IDs المرتبة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : allVideos.map(v => v.id);
  } catch (e) {
    return allVideos.map(v => v.id).sort(() => Math.random() - 0.5);
  }
}
