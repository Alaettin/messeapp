import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { api } from '../../services/api';

export default function AdminSettings() {
  const [ocrTimeout, setOcrTimeout] = useState('30');
  const [avatarTimeout, setAvatarTimeout] = useState('60');
  const [downloadTimeout, setDownloadTimeout] = useState('30');
  const [weatherCache, setWeatherCache] = useState('30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.adminGetSettings()
      .then(result => {
        const s = result.settings;
        if (s.ocr_timeout) setOcrTimeout(s.ocr_timeout);
        if (s.avatar_timeout) setAvatarTimeout(s.avatar_timeout);
        if (s.avatar_download_timeout) setDownloadTimeout(s.avatar_download_timeout);
        if (s.weather_cache_minutes) setWeatherCache(s.weather_cache_minutes);
      })
      .catch(err => {
        console.error(err);
        setError('Fehler beim Laden der Einstellungen.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.adminUpdateSettings({
        ocr_timeout: ocrTimeout,
        avatar_timeout: avatarTimeout,
        avatar_download_timeout: downloadTimeout,
        weather_cache_minutes: weatherCache,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center gap-2 py-8 text-txt-secondary">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Lade Einstellungen...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
          Einstellungen gespeichert.
        </div>
      )}

      <Card padding="md">
        <h3 className="font-semibold text-txt-primary mb-4">Timeouts (in Sekunden)</h3>
        <div className="flex flex-col gap-3">
          <Input
            label="OCR Timeout"
            type="number"
            min="5"
            max="120"
            value={ocrTimeout}
            onChange={(e) => setOcrTimeout(e.target.value)}
            helperText="Maximale Wartezeit für die Visitenkarten-Erkennung"
          />
          <Input
            label="Avatar-Generierung Timeout"
            type="number"
            min="10"
            max="300"
            value={avatarTimeout}
            onChange={(e) => setAvatarTimeout(e.target.value)}
            helperText="Maximale Wartezeit für die DALL-E Avatar-Erstellung"
          />
          <Input
            label="Avatar-Download Timeout"
            type="number"
            min="5"
            max="120"
            value={downloadTimeout}
            onChange={(e) => setDownloadTimeout(e.target.value)}
            helperText="Maximale Wartezeit für den Download des generierten Bildes"
          />
        </div>
      </Card>

      <Card padding="md">
        <h3 className="font-semibold text-txt-primary mb-4">Wetter</h3>
        <Input
          label="Wetter-Cache (in Minuten)"
          type="number"
          min="1"
          max="1440"
          value={weatherCache}
          onChange={(e) => setWeatherCache(e.target.value)}
          helperText="Wie lange Wetterdaten pro Adresse gecached werden"
        />
      </Card>

      <Button fullWidth onClick={handleSave} loading={saving}>
        <Save className="w-4 h-4" /> Speichern
      </Button>
    </div>
  );
}
