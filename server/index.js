import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import cors from "cors";

// Define the secret parameter (requires setting it up in Firebase Secrets)
const openRouterApiKey = defineSecret("OPENROUTER_API_KEY");

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'google/gemma-3-4b-it:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'arcee-ai/trinity-mini:free',
];

const corsHandler = cors({ origin: true });

async function tryModel(model, formattedMessages, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // To bypass openrouter limits for non-browsers, sometimes need standard headers
      // Since cloud functions run node, we just send standard JSON headers
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.error?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const msg = data.choices[0].message;
  return msg.content || msg.reasoning || 'No response content available.';
}

export const chat = onRequest({ secrets: [openRouterApiKey], cors: true }, async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid messages payload' });
        return;
      }

      const apiKey = openRouterApiKey.value();
      if (!apiKey) {
        logger.error("OPENROUTER_API_KEY secret is not set.");
        res.status(500).json({ error: 'Server configuration error.' });
        return;
      }

      let lastError;

      for (const model of MODELS) {
        try {
          logger.info(`Trying model: ${model}`);
          const result = await tryModel(model, messages, apiKey);
          res.json({ content: result });
          return;
        } catch (error) {
          logger.warn(`Model ${model} failed:`, error.message);
          lastError = error;
        }
      }

      logger.error('All models failed. Last error:', lastError);
      res.status(502).json({ error: lastError?.message || 'All models failed to respond.' });
    } catch (error) {
      logger.error("Chat function error:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});
