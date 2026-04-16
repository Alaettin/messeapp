import { getOpenAI } from './openai.js';
import { getSetting } from '../db/index.js';

export async function generateAvatar(
  selections: Record<string, string>,
  freeText: string
): Promise<{ prompt: string; imageBuffer: Buffer }> {
  const isBald = selections.hair_style === 'bald head, no hair';

  // Build person description
  const desc: string[] = [];

  if (selections.gender) desc.push(selections.gender);
  if (selections.age) desc.push(selections.age);
  if (selections.build) desc.push(`with a ${selections.build}`);

  if (isBald) {
    desc.push('who is completely bald with a smooth shiny head and no hair whatsoever');
  } else {
    const hairParts: string[] = [];
    if (selections.hair_color) hairParts.push(selections.hair_color);
    if (selections.hair_style) hairParts.push(selections.hair_style);
    if (hairParts.length > 0) desc.push(`with ${hairParts.join(', ')}`);
  }

  if (selections.face_shape) desc.push(`a ${selections.face_shape}`);
  if (selections.facial_hair && selections.facial_hair !== 'clean-shaven, no facial hair') {
    desc.push(`and ${selections.facial_hair}`);
  }
  if (selections.glasses && selections.glasses !== 'no glasses') {
    desc.push(`${selections.glasses}`);
  }
  if (selections.clothing) desc.push(`${selections.clothing}`);

  const personDescription = desc.join(', ');
  const extras = freeText.trim() ? ` ${freeText.trim()}.` : '';

  const prompt = `A 3D rendered headshot of a ${personDescription}.${extras} The person is smiling warmly at the camera. Soft studio lighting, solid teal background color. Rendered in a warm, approachable 3D animation style similar to Disney or DreamWorks characters with smooth skin and expressive eyes. The image contains absolutely nothing else — no text, no icons, no shapes, no color palette, no swatches, no decorative elements, no borders, no frames anywhere in the image. Just the person on the plain background.`;

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
