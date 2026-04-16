import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, KeyboardIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { api } from '../../services/api';
import type { Visitor } from '../../types';

interface StepQrScanProps {
  onComplete: (identifier: string) => void;
}

export default function StepQrScan({ onComplete }: StepQrScanProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [existingVisitor, setExistingVisitor] = useState<Partial<Visitor> | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const scannerDivId = 'qr-reader';

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner && scanningRef.current) {
      try {
        await scanner.stop();
      } catch {
        // Already stopped, ignore
      }
      scanningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'scan') return;

    let cancelled = false;

    // Small delay to ensure the DOM element exists
    const timer = setTimeout(async () => {
      if (cancelled) return;

      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopScanner();
            handleScannedValue(decodedText);
          },
          undefined
        );
        scanningRef.current = true;
      } catch (err) {
        console.error('QR Scanner start error:', err);
        if (!cancelled) {
          setError('Kamera nicht verfügbar. Bitte manuelle Eingabe nutzen.');
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [mode, stopScanner]);

  function extractIdentifier(value: string): string {
    try {
      const url = new URL(value);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || value;
    } catch {
      return value.trim();
    }
  }

  async function handleScannedValue(value: string) {
    const id = extractIdentifier(value);
    if (!id) return;
    await checkIdentifier(id, value);
  }

  async function checkIdentifier(id: string, raw?: string) {
    setChecking(true);
    setError(null);
    try {
      const result = await api.checkVisitor(id);
      if (result.exists && result.visitor) {
        setExistingVisitor(result.visitor);
        setPendingId(id);
        setScannedRaw(raw ?? id);
      } else {
        setConfirmedId(id);
        setScannedRaw(raw ?? id);
      }
    } catch (err) {
      setError('Fehler bei der Prüfung. Bitte erneut versuchen.');
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  async function confirmVisitor(id: string) {
    setChecking(true);
    try {
      await api.createVisitor(id);
      onComplete(id);
    } catch (err) {
      setError('Fehler beim Anlegen. Bitte erneut versuchen.');
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  function handleOverwrite() {
    if (pendingId) {
      setExistingVisitor(null);
      setPendingId(null);
      setConfirmedId(pendingId);
    }
  }

  function handleCancel() {
    setExistingVisitor(null);
    setPendingId(null);
  }

  // Confirmation screen
  if (confirmedId && scannedRaw) {
    // Build display: show full raw value with identifier highlighted
    const raw = scannedRaw;
    const idStart = raw.lastIndexOf(confirmedId);
    const hasContext = idStart > 0 && raw !== confirmedId;

    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-12 h-12 text-accent" />
          <h3 className="text-lg font-semibold text-txt-primary">Identifier erkannt</h3>
          <p className="text-base font-mono text-txt-secondary break-all text-center">
            {hasContext ? (
              <>
                {raw.substring(0, idStart)}
                <span className="text-accent font-semibold">{confirmedId}</span>
                {raw.substring(idStart + confirmedId.length)}
              </>
            ) : (
              <span className="text-accent font-semibold text-xl">{confirmedId}</span>
            )}
          </p>
          <div className="flex gap-3 w-full mt-2">
            <Button variant="ghost" fullWidth onClick={() => { setConfirmedId(null); setScannedRaw(null); }}>
              Zurück
            </Button>
            <Button fullWidth onClick={() => confirmVisitor(confirmedId)} loading={checking}>
              Weiter
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Overwrite warning
  if (existingVisitor && pendingId) {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="w-12 h-12 text-warning" />
          <h3 className="text-lg font-semibold text-txt-primary">Besucher bereits erfasst</h3>
          <div className="text-center text-txt-secondary">
            <p className="font-medium text-txt-primary">{existingVisitor.name || pendingId}</p>
            {existingVisitor.company && <p>{existingVisitor.company}</p>}
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Button variant="ghost" fullWidth onClick={handleCancel}>
              Abbrechen
            </Button>
            <Button variant="danger" fullWidth onClick={handleOverwrite} loading={checking}>
              Überschreiben
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'scan' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setError(null); setMode('scan'); }}
          className="flex-1"
        >
          <QrCode className="w-4 h-4" /> QR-Scan
        </Button>
        <Button
          variant={mode === 'manual' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { stopScanner(); setError(null); setMode('manual'); }}
          className="flex-1"
        >
          <KeyboardIcon className="w-4 h-4" /> Manuell
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {mode === 'scan' ? (
        <Card padding="md">
          <div
            id={scannerDivId}
            className="w-full rounded-lg overflow-hidden"
          />
          <p className="text-sm text-txt-muted text-center mt-3">
            QR-Code in den Rahmen halten
          </p>
        </Card>
      ) : (
        <Card padding="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) checkIdentifier(manualInput.trim());
            }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Identifier"
              placeholder="z.B. 12kjo213asd"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              autoFocus
            />
            <Button type="submit" fullWidth loading={checking} disabled={!manualInput.trim()}>
              Prüfen & Weiter
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
