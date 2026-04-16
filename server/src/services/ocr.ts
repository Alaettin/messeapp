import fs from 'fs';
import { getOpenAI } from './openai.js';

export interface OcrResult {
  name: string | null;
  company: string | null;
  position: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

const EMPTY_RESULT: OcrResult = {
  name: null,
  company: null,
  position: null,
  address: null,
  email: null,
  phone: null,
  website: null,
};

export async function extractBusinessCard(imagePath: string): Promise<OcrResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set — returning empty OCR result');
    return EMPTY_RESULT;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Du bist ein OCR-Spezialist. Extrahiere folgende Felder aus dieser Visitenkarte als JSON:
{
  "name": "Vollständiger Name",
  "company": "Firmenname",
  "position": "Position/Titel",
  "address": "Vollständige Adresse",
  "email": "E-Mail-Adresse",
  "phone": "Telefonnummer",
  "website": "Webseite"
}
Gib NUR das JSON zurück, keine weiteren Erklärungen. Felder die nicht erkennbar sind: null.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';

  // Extract JSON from response (might be wrapped in markdown code block)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('OCR: Could not parse JSON from response:', text);
    return EMPTY_RESULT;
  }

  try {
    return JSON.parse(jsonMatch[0]) as OcrResult;
  } catch {
    console.error('OCR: Invalid JSON:', jsonMatch[0]);
    return EMPTY_RESULT;
  }
}
