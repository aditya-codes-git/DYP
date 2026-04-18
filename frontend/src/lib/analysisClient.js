import { supabase } from './supabaseClient';

/**
 * Unified analysis client — replaces geminiClient.js, groqClient.js,
 * aiDetectorClient.js, and sourceTracingClient.js.
 * All calls go through the Supabase Edge Function "analyze".
 */

// ═══ Pipeline 1: Stylometric Analysis ═══
// Replaces runGeminiAnalysis() and runGroqAnalysis()
// The Edge Function handles model routing (Groq for small, Gemini for large)
export const runStylometryAnalysis = async (userMessage) => {
  console.log(`[Stylometry Client] Sending ${userMessage.length} chars to Edge Function...`);
  const startTime = Date.now();

  const { data, error } = await supabase.functions.invoke('analyze', {
    body: { action: 'stylometry', userMessage },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }
  });

  if (error) {
    console.error(`[Stylometry Client] Failed after ${Date.now() - startTime}ms:`, error.message);
    throw new Error(`Stylometry failed: ${error.message}`);
  }

  console.log(`[Stylometry Client] Success in ${Date.now() - startTime}ms`);
  return data;
};

// ═══ Pipeline 2: AI Content Detection ═══
// Replaces runAIDetection()
export const runAIDetection = async (paragraphs) => {
  console.log(`[AI Detection Client] Sending ${paragraphs.length} paragraphs to Edge Function...`);
  const startTime = Date.now();

  const { data, error } = await supabase.functions.invoke('analyze', {
    body: { action: 'ai-detection', paragraphs },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }
  });

  if (error) {
    console.error(`[AI Detection Client] Failed after ${Date.now() - startTime}ms:`, error.message);
    throw new Error(`AI Detection failed: ${error.message}`);
  }

  console.log(`[AI Detection Client] Success in ${Date.now() - startTime}ms. Overall AI Score: ${data?.overall_ai_score}`);
  return data;
};

// ═══ Pipeline 3: Source Tracing ═══
// Replaces runSourceTracing() — this reconstructs the full tracing logic client-side
// using the Edge Function for API calls (Semantic Scholar, arXiv, Gemini query extraction)
export const runSourceTracing = async (flaggedParagraphs) => {
  if (!flaggedParagraphs || flaggedParagraphs.length === 0) {
    return {
      paragraph_traces: [],
      stitching_analysis: {
        stitching_detected: false,
        confidence: "low",
        distinct_source_count: 0,
        verdict: "Original Content",
        summary: "No flagged paragraphs were found for source tracing. The document appears to maintain original content throughout."
      }
    };
  }

  const results = [];

  // Process max 5 flagged paragraphs
  for (const paragraph of flaggedParagraphs.slice(0, 5)) {
    try {
      // Step 1: Extract search query via Edge Function → Gemini
      console.log(`[Source Tracing] Extracting search query for paragraph ${paragraph.id}...`);

      const queryPrompt = `Extract a precise 8-12 word academic search query from this paragraph that would find the original source paper if this paragraph was taken from an academic paper. Return ONLY the search query string, nothing else, no quotes, no explanation:\n\n${paragraph.text}`;

      const { data: queryData, error: queryError } = await supabase.functions.invoke('analyze', {
        body: { action: 'extract-query', userMessage: queryPrompt },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      const searchQuery = queryError ? null : queryData?.query;
      if (!searchQuery) {
        console.warn(`[Source Tracing] Could not extract query for paragraph ${paragraph.id}`);
        continue;
      }

      console.log(`[Source Tracing] Searching for paragraph ${paragraph.id}: "${searchQuery}"`);

      // Step 2: Search Semantic Scholar via Edge Function
      let papers = [];
      try {
        const { data: ssData } = await supabase.functions.invoke('analyze', {
          body: { action: 'source-tracing', searchQuery, source: 'semantic-scholar' },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        papers = ssData?.data || [];
      } catch (ssError) {
        console.warn(`[Source Tracing] Semantic Scholar error:`, ssError.message);
      }

      // Step 3: Search arXiv via Edge Function
      let arxivTitles = [];
      let arxivLinks = [];
      let arxivAuthors = [];
      try {
        const { data: arxivData } = await supabase.functions.invoke('analyze', {
          body: { action: 'source-tracing', searchQuery, source: 'arxiv' },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        const arxivText = arxivData?.xml || '';

        arxivTitles = [...arxivText.matchAll(/<title>(.*?)<\/title>/gs)]
          .slice(1)
          .map(m => m[1].replace(/\n/g, ' ').trim());
        arxivLinks = [...arxivText.matchAll(/<id>(.*?)<\/id>/gs)]
          .slice(1)
          .map(m => m[1].trim());
        arxivAuthors = [...arxivText.matchAll(/<name>(.*?)<\/name>/gs)]
          .map(m => m[1].trim());
      } catch (arxivError) {
        console.warn(`[Source Tracing] arXiv error:`, arxivError.message);
      }

      results.push({
        paragraph_id: paragraph.id,
        paragraph_preview: paragraph.text.substring(0, 150) + "...",
        search_query_used: searchQuery,
        semantic_scholar_matches: papers.map(p => ({
          title: p.title,
          authors: p.authors?.map(a => a.name).join(', ') || 'Unknown',
          year: p.year,
          venue: p.venue || 'N/A',
          citation_count: p.citationCount || 0,
          link: p.externalIds?.DOI
            ? `https://doi.org/${p.externalIds.DOI}`
            : `https://www.semanticscholar.org/paper/${p.paperId}`,
          abstract_preview: p.abstract ? p.abstract.substring(0, 200) + "..." : 'No abstract available'
        })),
        arxiv_matches: arxivTitles.map((title, i) => ({
          title,
          link: arxivLinks[i] || '',
          authors: arxivAuthors.slice(i * 3, i * 3 + 3).join(', ') || 'Unknown'
        }))
      });

      // Rate limit — wait 1 second between paragraphs
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (paragraphError) {
      console.warn(`[Source Tracing] Error processing paragraph ${paragraph.id}:`, paragraphError.message);
    }
  }

  // Step 4: Stitching analysis via Edge Function → Gemini
  if (results.length > 0) {
    try {
      const stitchingPrompt = `You are a plagiarism forensics expert. I searched academic databases for the source of flagged paragraphs in a research paper and found these potential matches. Analyze whether this evidence suggests the paper was stitched together from multiple external sources.

Search results:
${JSON.stringify(results, null, 2)}

Return ONLY valid JSON:
{
  "stitching_detected": true | false,
  "confidence": "low" | "medium" | "high",
  "distinct_source_count": number,
  "verdict": "Original Content" | "Possibly Sourced ⚠️" | "Likely Stitched From Multiple Sources 🚨",
  "summary": "3-4 sentence forensic summary of what the source tracing found, which paragraphs matched which papers, and what this implies about the document's originality."
}`;

      console.log(`[Source Tracing] Running stitching analysis on ${results.length} traced paragraphs...`);

      const { data: stitchingData, error: stitchingError } = await supabase.functions.invoke('analyze', {
        body: { action: 'stylometry', userMessage: stitchingPrompt },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (!stitchingError && stitchingData) {
        console.log(`[Source Tracing] Stitching analysis complete. Detected: ${stitchingData.stitching_detected}`);
        return {
          paragraph_traces: results,
          stitching_analysis: stitchingData,
        };
      }
    } catch (analysisError) {
      console.warn(`[Source Tracing] Stitching analysis failed:`, analysisError.message);
    }
  }

  return {
    paragraph_traces: results,
    stitching_analysis: {
      stitching_detected: false,
      confidence: "low",
      distinct_source_count: 0,
      verdict: "Original Content",
      summary: "Source tracing completed but stitching analysis could not be performed."
    }
  };
};
