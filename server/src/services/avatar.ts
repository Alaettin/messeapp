import { getOpenAI } from './openai.js';
import { getSetting } from '../db/index.js';

export async function generateAvatar(
  selections: Record<string, string>,
  freeText: string
): Promise<{ prompt: string; imageBuffer: Buffer }> {
  const isBald = selections.hair_style === 'bald head, no hair';

  const parts: string[] = [
    'Create a single portrait of exactly one person.',
    'Style: friendly, professional cartoon illustration, modern flat design, suitable as a profile picture.',
    'Composition: head and shoulders only, centered, one face, no duplicates, no multiple views.',
  ];

  // Gender & Age
  if (selections.gender) parts.push(`The person is a ${selections.gender}.`);
  if (selections.age) parts.push(`Age: ${selections.age}.`);

  // Hair
  if (isBald) {
    parts.push('The person is completely bald with no hair at all.');
  } else {
    if (selections.hair_color) parts.push(`Hair color: ${selections.hair_color}.`);
    if (selections.hair_style) parts.push(`Hairstyle: ${selections.hair_style}.`);
  }

  // Face
  if (selections.face_shape) parts.push(`Face shape: ${selections.face_shape}.`);
  if (selections.facial_hair) parts.push(`Facial hair: ${selections.facial_hair}.`);
  if (selections.glasses) parts.push(`${selections.glasses}.`);

  // Body & Clothing
  if (selections.build) parts.push(`Build: ${selections.build}.`);
  if (selections.clothing) parts.push(`Clothing: ${selections.clothing}.`);

  if (freeText.trim()) {
    parts.push(`Additional details: ${freeText.trim()}.`);
  }

  parts.push('Background: soft teal gradient (#00A587).');
  parts.push('Important: Show only ONE person, no collage, no multiple angles, no split views.');

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

  const dlTimeout = await getSetting('avatar_download_timeout', 30) * 1000;
  const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(dlTimeout) });
  if (!imageResponse.ok) {
    throw new Error(`Failed to download avatar image: ${imageResponse.status}`);
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  return { prompt, imageBuffer };
}
