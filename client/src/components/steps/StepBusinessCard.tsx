import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { api } from '../../services/api';
import type { Visitor } from '../../types';

interface StepBusinessCardProps {
  identifier: string;
  onComplete: (visitorData: Partial<Visitor>) => void;
}

interface FormData {
  name: string;
  company: string;
  position: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  company: '',
  position: '',
  address: '',
  email: '',
  phone: '',
  website: '',
};

export default function StepBusinessCard({ identifier, onComplete }: StepBusinessCardProps) {
  const [phase, setPhase] = useState<'capture' | 'processing' | 'edit'>('capture');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setError('Kamera konnte nicht gestartet werden.');
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const preview = URL.createObjectURL(blob);
      setPhotoPreview(preview);
      setPhase('processing');

      try {
        const result = await api.uploadBusinessCard(identifier, blob);
        const ocr = result.ocr;
        setFormData({
          name: ocr.name ?? '',
          company: ocr.company ?? '',
          position: ocr.position ?? '',
          address: ocr.address ?? '',
          email: ocr.email ?? '',
          phone: ocr.phone ?? '',
          website: ocr.website ?? '',
        });
        setPhase('edit');
      } catch (err) {
        console.error('OCR error:', err);
        setError('OCR fehlgeschlagen. Bitte Daten manuell eingeben.');
        setPhase('edit');
      }
    }, 'image/jpeg', 0.85);
  }

  function handleRetake() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setFormData(EMPTY_FORM);
    setPhase('capture');
    setTimeout(() => startCamera(), 100);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const visitor = await api.updateVisitor(identifier, formData);
      onComplete(visitor);
    } catch (err) {
      console.error('Save error:', err);
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
  }

  if (error && phase === 'capture') {
    return (
      <Card padding="lg">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={() => { setError(null); setPhase('edit'); }}>
            Manuell eingeben
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === 'capture') {
    return (
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {!cameraReady ? (
            <Button fullWidth onClick={startCamera}>
              <Camera className="w-5 h-5" /> Kamera starten
            </Button>
          ) : (
            <Button fullWidth onClick={capturePhoto}>
              <Camera className="w-5 h-5" /> Aufnehmen
            </Button>
          )}

          <Button variant="ghost" fullWidth onClick={() => setPhase('edit')}>
            Ohne Foto fortfahren
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === 'processing') {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4">
          {photoPreview && (
            <img src={photoPreview} alt="Visitenkarte" className="w-full rounded-lg" />
          )}
          <div className="flex items-center gap-2 text-txt-secondary">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            OCR wird verarbeitet...
          </div>
        </div>
      </Card>
    );
  }

  // Edit phase
  return (
    <div className="flex flex-col gap-4">
      {photoPreview && (
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <img src={photoPreview} alt="Visitenkarte" className="h-16 rounded object-cover" />
            <Button variant="ghost" size="sm" onClick={handleRetake}>
              <RotateCcw className="w-4 h-4" /> Erneut fotografieren
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      <Card padding="lg">
        <div className="flex flex-col gap-3">
          <Input label="Name" value={formData.name} onChange={updateField('name')} />
          <Input label="Firma" value={formData.company} onChange={updateField('company')} />
          <Input label="Position" value={formData.position} onChange={updateField('position')} />
          <Input label="Adresse" value={formData.address} onChange={updateField('address')} />
          <Input label="E-Mail" type="email" value={formData.email} onChange={updateField('email')} />
          <Input label="Telefon" type="tel" value={formData.phone} onChange={updateField('phone')} />
          <Input label="Webseite" value={formData.website} onChange={updateField('website')} />
        </div>
      </Card>

      <Button fullWidth onClick={handleSubmit} loading={saving}>
        <Check className="w-5 h-5" /> Bestätigen
      </Button>
    </div>
  );
}
