import { useState } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { Button, Card } from '../ui';
import { api } from '../../services/api';

interface StepAvatarProps {
  identifier: string;
  onComplete: (avatarUrl: string) => void;
}

interface ConfigCategory {
  key: string;
  label: string;
  emoji: string;
  options: { label: string; value: string }[];
}

const AVATAR_CONFIG: ConfigCategory[] = [
  {
    key: 'gender',
    label: 'Geschlecht',
    emoji: '👤',
    options: [
      { label: 'Männlich', value: 'male person' },
      { label: 'Weiblich', value: 'female person' },
      { label: 'Divers', value: 'person with androgynous appearance' },
    ],
  },
  {
    key: 'age',
    label: 'Alter',
    emoji: '🎂',
    options: [
      { label: '20-30', value: 'young adult in their twenties' },
      { label: '30-40', value: 'adult in their thirties' },
      { label: '40-50', value: 'adult in their forties' },
      { label: '50-60', value: 'mature adult in their fifties' },
      { label: '60+', value: 'senior person in their sixties or older' },
    ],
  },
  {
    key: 'hair_style',
    label: 'Frisur',
    emoji: '✂️',
    options: [
      { label: 'Kurz', value: 'short hair' },
      { label: 'Mittellang', value: 'medium-length hair' },
      { label: 'Lang', value: 'long hair' },
      { label: 'Locken', value: 'curly hair' },
      { label: 'Zurückgekämmt', value: 'slicked-back hair' },
      { label: 'Glatze', value: 'bald head, no hair' },
    ],
  },
  {
    key: 'hair_color',
    label: 'Haarfarbe',
    emoji: '💇',
    options: [
      { label: 'Blond', value: 'blonde hair' },
      { label: 'Braun', value: 'brown hair' },
      { label: 'Schwarz', value: 'black hair' },
      { label: 'Rot', value: 'red hair' },
      { label: 'Grau / Weiß', value: 'gray or white hair' },
    ],
  },
  {
    key: 'face_shape',
    label: 'Gesichtsform',
    emoji: '🔲',
    options: [
      { label: 'Oval', value: 'oval face shape' },
      { label: 'Rund', value: 'round face shape' },
      { label: 'Eckig', value: 'square jawline' },
      { label: 'Schmal', value: 'slim, narrow face' },
    ],
  },
  {
    key: 'facial_hair',
    label: 'Bart',
    emoji: '🧔',
    options: [
      { label: 'Kein Bart', value: 'clean-shaven, no facial hair' },
      { label: 'Dreitagebart', value: 'stubble beard' },
      { label: 'Vollbart', value: 'full beard' },
      { label: 'Schnurrbart', value: 'mustache' },
      { label: 'Kinnbart', value: 'goatee' },
    ],
  },
  {
    key: 'glasses',
    label: 'Brille',
    emoji: '👓',
    options: [
      { label: 'Keine Brille', value: 'no glasses' },
      { label: 'Brille', value: 'wearing glasses' },
      { label: 'Sonnenbrille', value: 'wearing sunglasses' },
    ],
  },
  {
    key: 'eye_color',
    label: 'Augenfarbe',
    emoji: '👁️',
    options: [
      { label: 'Braun', value: 'brown eyes' },
      { label: 'Blau', value: 'blue eyes' },
      { label: 'Grün', value: 'green eyes' },
      { label: 'Grau', value: 'gray eyes' },
      { label: 'Bernstein', value: 'amber eyes' },
    ],
  },
  {
    key: 'clothing',
    label: 'Kleidung',
    emoji: '👔',
    options: [
      { label: 'Anzug & Krawatte', value: 'wearing a professional suit and tie' },
      { label: 'Business Casual', value: 'wearing business casual clothing, button shirt' },
      { label: 'Hemd', value: 'wearing a dress shirt' },
      { label: 'Polo-Shirt', value: 'wearing a polo shirt' },
      { label: 'T-Shirt', value: 'wearing a casual t-shirt' },
      { label: 'Bluse', value: 'wearing a blouse' },
    ],
  },
  {
    key: 'build',
    label: 'Statur',
    emoji: '🏋️',
    options: [
      { label: 'Schlank', value: 'slim build' },
      { label: 'Normal', value: 'average build' },
      { label: 'Kräftig', value: 'stocky, broad-shouldered build' },
      { label: 'Sportlich', value: 'athletic, fit build' },
    ],
  },
];

export default function StepAvatar({ identifier, onComplete }: StepAvatarProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const cat of AVATAR_CONFIG) {
      defaults[cat.key] = cat.options[0].value;
    }
    return defaults;
  });
  const [freeText, setFreeText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectOption(categoryKey: string, value: string) {
    setSelections(prev => ({ ...prev, [categoryKey]: value }));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateAvatar(identifier, selections, freeText);
      // Cache-bust: append timestamp so browser reloads the image
      setAvatarUrl(`${result.avatarUrl}?t=${Date.now()}`);
      // Scroll to top to show the avatar
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Avatar generation error:', err);
      setError('Avatar-Generierung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {/* Avatar preview */}
      {avatarUrl && (
        <Card padding="md">
          <img
            src={avatarUrl}
            alt="Generierter Avatar"
            className="w-full max-w-xs mx-auto rounded-xl shadow-glow"
          />
        </Card>
      )}

      {/* Configurator */}
      {AVATAR_CONFIG.map(category => (
        <Card key={category.key} padding="md">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{category.emoji}</span>
            <h3 className="font-semibold text-txt-primary text-sm">{category.label}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {category.options.map(opt => {
              const isSelected = selections[category.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectOption(category.key, opt.value)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-accent text-white shadow-glow'
                      : 'bg-bg-surface border border-border text-txt-secondary hover:border-accent hover:text-txt-primary'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      {/* Free text */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✏️</span>
          <h3 className="font-semibold text-txt-primary text-sm">Besonderheiten</h3>
        </div>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="z.B. Sommersprossen, Narbe, markantes Kinn, freundliches Lächeln..."
          rows={2}
          className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent transition-colors resize-none"
        />
      </Card>

      {/* Actions */}
      {avatarUrl ? (
        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={handleGenerate} loading={generating}>
            <RefreshCw className="w-4 h-4" /> Neu generieren
          </Button>
          <Button fullWidth onClick={() => onComplete(avatarUrl)}>
            Weiter
          </Button>
        </div>
      ) : (
        <Button fullWidth onClick={handleGenerate} loading={generating}>
          <Wand2 className="w-5 h-5" /> Avatar generieren
        </Button>
      )}

      {/* Skip option */}
      {!avatarUrl && (
        <Button variant="ghost" fullWidth onClick={() => onComplete('')}>
          Ohne Avatar fortfahren
        </Button>
      )}
    </div>
  );
}
