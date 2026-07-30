import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada.");
}

const google = createGoogleGenerativeAI({
  apiKey,
});

const modelId = process.env.GEMINI_MODEL;

if (!modelId) {
  throw new Error("GEMINI_MODEL não configurado.");
}

export const geminiModel = google(modelId);