import { getOpenAI } from './openai.js';
import { getSetting } from '../db/index.js';

export async function generateAvatar(
  selections: Record<string, string>,
  freeText: string
): Promise<{ prompt: string; imageBuffer: Buffer }> {
  const parts: string[] = [
    'Erstelle ein freundliches, professionelles Cartoon-Portrait im modernen Flat-Design-Stil.',
  ];

  if (selections.hair_color) {
    parts.push(`Die Person hat ${selections.hair_color} Haare.`);
  }
  if (selections.face_shape) {
    parts.push(`Das Gesicht ist ${selections.face_shape}.`);
  }
  if (selections.features) {
    parts.push(`Besondere Merkmale: ${selections.features}.`);
  }

  // Add any other selections not covered above
  for (const [key, value] of Object.entries(selections)) {
    if (!['hair_color', 'face_shape', 'features'].includes(key) && value) {
      parts.push(`${key}: ${value}.`);
    }
  }

  if (freeText.trim()) {
    parts.push(`Zusätzliche Beschreibung: ${freeText.trim()}.`);
  }

  parts.push('Hintergrund: sanfter Farbverlauf in Teal-Tönen (#00A587).');
  parts.push('Stil: Moderne Vektor-Illustration, freundlich, professionell, geeignet als Profilbild.');

  const prompt = parts.join(' ');

  const response = await getOpenAI().images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  }, { timeout: await getSetting('avatar_timeout', 60) * 1000 });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('DALL-E returned no image URL');
  }

  // Download the temporary URL immediately (30s timeout)
  const dlTimeout = await getSetting('avatar_download_timeout', 30) * 1000;
  const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(dlTimeout) });
  if (!imageResponse.ok) {
    throw new Error(`Failed to download avatar image: ${imageResponse.status}`);
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  return { prompt, imageBuffer };
}
