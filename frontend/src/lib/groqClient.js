import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './prompts.js';

export const runGroqAnalysis = async (apiKey, userMessage) => {
  const startTime = Date.now();
  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    console.log(`[Groq Client] Starting analysis...`);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });
    
    const rawContent = completion.choices[0]?.message?.content || "";
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    
    const duration = Date.now() - startTime;
    console.log(`[Groq Client] Analysis successful. Time: ${duration}ms, Model: llama-3.3-70b-versatile`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Groq Client] Error after ${duration}ms:`, error);
    throw error;
  }
};
