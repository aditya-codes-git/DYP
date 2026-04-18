// Removing '@google/generative-ai' to use raw fetch for better error logging
import { SYSTEM_PROMPT } from './prompts.js';

const MODELS = [
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.5-flash",
  "gemini-2.0-flash"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runWithTimeout = async (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => {
      const err = new Error('TIMEOUT_EXCEEDED');
      err.status = 408;
      reject(err);
    }, timeoutMs))
  ]);
};

export const runGeminiAnalysis = async (apiKey, userMessage, requestedModel) => {
  let resolvedApiKey = apiKey;
  
  if (!resolvedApiKey) {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        resolvedApiKey = process.env.GEMINI_API_KEY;
      }
    } catch(e) {}
    try {
      if (!resolvedApiKey && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        resolvedApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
    } catch(e) {}
  }
  
  if (!resolvedApiKey) {
     throw new Error("Gemini API key is not defined in either Node or Vite environments.");
  }

  // Decide which priority list to use
  let modelPriority = [...MODELS];
  if (requestedModel && !modelPriority.includes(requestedModel)) {
     modelPriority = [requestedModel, ...MODELS];
  }

  for (const modelName of modelPriority) {
    let attempts = 0;
    const maxAttempts = 2; // For 429, 500, network errors
    
    while (attempts < maxAttempts) {
      attempts++;
      const startTime = Date.now();
      try {
         console.log(`[Gemini Client] Attempt ${attempts} using model: ${modelName}`);
         
         const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${resolvedApiKey}`;
         const promptContext = SYSTEM_PROMPT + "\n\n" + userMessage;
         
         const requestBody = {
           contents: [{ parts: [{ text: promptContext }] }],
           generationConfig: {
             temperature: 0.1,
             maxOutputTokens: 8192,
             responseMimeType: "application/json"
           }
         };

         const fetchPromise = fetch(url, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(requestBody)
         });
         
         const response = await runWithTimeout(fetchPromise, 16000);
         const bodyText = await response.text();

         if (!response.ok) {
           console.error(`[Gemini Client] Full API response on ${modelName} failure. Status: ${response.status}. Body:`, bodyText);
           const err = new Error(`API Error: ${response.status}`);
           err.status = response.status;
           err.bodyText = bodyText;
           throw err;
         }

         const dataJson = JSON.parse(bodyText);
         // The SDK response.text() equals candidates[0].content.parts[0].text
         const rawContent = dataJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
         const data = JSON.parse(rawContent);
         
         console.log(`[Gemini Client] Success with ${modelName} after ${Date.now() - startTime}ms`);
         return data;
         
      } catch (error) {
         console.error(`[Gemini Client] Error type on ${modelName} (Attempt ${attempts}): ${error.message}`);
         
         const is404 = error.status === 404;
         const is429 = error.status === 429;
         const isLimitZero = is429 && error.bodyText && error.bodyText.includes('limit: 0');
         const isTimeout = error.message === 'TIMEOUT_EXCEEDED' || error.status === 408;
         
         if (is404) {
           console.log(`[Gemini Client] Model ${modelName} not found or unsupported (404). Switching to next model.`);
           break; 
         } else if (is429) {
           if (isLimitZero) {
             console.log(`[Gemini Client] Quota limit is completely zero for ${modelName}. Switching model without retry.`);
             break;
           }
           if (attempts < maxAttempts) {
             const delay = Math.floor(Math.random() * 1000) + 500; 
             console.log(`[Gemini Client] Rate limit hit (429). Retrying in ${delay}ms...`);
             await sleep(delay);
             continue; 
           }
         } else if (isTimeout) {
            console.log(`[Gemini Client] Timeout exceeded 16s. Switching model.`);
            break; 
         } else {
           if (attempts < maxAttempts) {
             console.log(`[Gemini Client] Network or Server error. Retrying in 500ms...`);
             await sleep(500); 
             continue; 
           }
         }
         
         console.log(`[Gemini Client] Max attempts reached for ${modelName}. Moving to next model.`);
         break; 
      }
    }
  }
  
  throw new Error("All AI models failed");
};
