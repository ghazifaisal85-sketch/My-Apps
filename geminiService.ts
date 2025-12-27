
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (subscribers: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `بصفتك مساعد ذكي لمكتب "المؤمن نت"، قم بتحليل بيانات المشتركين التالية وقدم تقريراً مختصراً باللغة العربية يشمل:
    1. عدد المشتركين الذين تنتهي اشتراكاتهم قريباً (خلال 3 أيام).
    2. إجمالي الديون المستحقة.
    3. نصيحة سريعة لتحسين التحصيل المالي.
    
    البيانات: ${JSON.stringify(subscribers)}`,
  });
  return response.text;
};

export const generateReminderMessage = async (subscriberName: string, debt: number, expiryDate: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `اكتب رسالة تذكير احترافية وودودة لمشترك إنترنت اسمه "${subscriberName}" من مكتب "المؤمن نت".
    تفاصيل المشترك:
    - تاريخ الانتهاء: ${expiryDate}
    - المبلغ المطلوب (دين): ${debt} دينار.
    اجعل الرسالة جاهزة للإرسال عبر واتساب.`,
  });
  return response.text;
};
