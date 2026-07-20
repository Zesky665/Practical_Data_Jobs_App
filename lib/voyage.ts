/**
 * Voyage AI embedding wrapper — server-only.
 *
 * Calls the Voyage REST API to embed text into a 1024-dim vector using the
 * voyage-3 model. No SDK dependency — the API is a single POST endpoint.
 *
 * Hard-fails on non-2xx responses (PLAN.md §0 convention #3: never discard
 * an error silently — a missing/broken embedding would corrupt the vector
 * index and make search silently wrong).
 *
 * Token limit: voyage-3 supports up to 32K input tokens. Text exceeding
 * that is truncated with a warning. No chunking in the first pass — single
 * PDFs should fit comfortably.
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
const VOYAGE_MAX_TOKENS = 32000;

/** Estimate tokens as ~4 chars per token (rough heuristic for truncation). */
const CHARS_PER_TOKEN = 4;

export interface EmbedResult {
  vector: number[];
  model: string;
}

/**
 * Embed a text string into a 1024-dim vector via Voyage AI.
 * Truncates input exceeding the model's token limit.
 * Throws on any API error — callers must handle failure.
 */
export async function embedText(text: string): Promise<EmbedResult> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VOYAGE_API_KEY is not set. Add it to .env.local for local dev, or Vercel env vars for prod.",
    );
  }

  const maxChars = VOYAGE_MAX_TOKENS * CHARS_PER_TOKEN;
  let input = text;
  if (input.length > maxChars) {
    console.warn(
      `[voyage] Text is ${input.length} chars, truncating to ${maxChars} chars (~${VOYAGE_MAX_TOKENS} tokens).`,
    );
    input = input.slice(0, maxChars);
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [input],
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Voyage API error (${response.status}): ${body.slice(0, 500)}`,
    );
  }

  const json = (await response.json()) as {
    data: { embedding: number[] }[];
    model: string;
  };

  const embedding = json.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error(
      "Voyage API returned an empty embedding. Check the input text.",
    );
  }

  return { vector: embedding, model: json.model };
}
