import { useState } from 'react';
import { QrCode, CreditCard, FileText, Users, User } from 'lucide-react';
import { StepIndicator, Button } from '../components/ui';
import StepQrScan from '../components/steps/StepQrScan';
import StepBusinessCard from '../components/steps/StepBusinessCard';
import StepDocuments from '../components/steps/StepDocuments';
import StepContacts from '../components/steps/StepContacts';
import StepAvatar from '../components/steps/StepAvatar';
import StepComplete from '../components/steps/StepComplete';
import { api } from '../services/api';
import type { Visitor } from '../types';

const steps = [
  { label: 'QR-Scan', icon: <QrCode className="w-5 h-5" /> },
  { label: 'Visitenkarte', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Dokumente', icon: <FileText className="w-5 h-5" /> },
  { label: 'Kontakte', icon: <Users className="w-5 h-5" /> },
  { label: 'Avatar', icon: <User className="w-5 h-5" /> },
];

export default function Capture() {
  const [currentStep, setCurrentStep] = useState(1);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [_visitorData, setVisitorData] = useState<Partial<Visitor> | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  function handleStep1Complete(id: string) {
    setIdentifier(id);
    setCurrentStep(2);
  }

  function handleStep2Complete(data: Partial<Visitor>) {
    setVisitorData(data);
    setCurrentStep(3);
  }

  function handleStep3Complete(documentIds: number[]) {
    setSelectedDocIds(documentIds);
    setCurrentStep(4);
  }

  async function handleStep4Complete(contactIds: number[]) {
    if (identifier) {
      try {
        await api.saveSelections(identifier, selectedDocIds, contactIds);
      } catch (err) {
        console.error('Save selections error:', err);
      }
    }
    setCurrentStep(5);
  }

  function handleStep5Complete() {
    setCompleted(true);
  }

  function handleReset() {
    setCurrentStep(1);
    setIdentifier(null);
    setVisitorData(null);
    setSelectedDocIds([]);
    setCompleted(false);
  }

  function handleGoBack() {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  }

  if (completed && identifier) {
    return <StepComplete identifier={identifier} onReset={handleReset} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step);
        }}
      />

      {currentStep === 1 && (
        <StepQrScan onComplete={handleStep1Complete} />
      )}

      {currentStep === 2 && identifier && (
        <StepBusinessCard identifier={identifier} onComplete={handleStep2Complete} />
      )}

      {currentStep === 3 && identifier && (
        <StepDocuments identifier={identifier} onComplete={handleStep3Complete} />
      )}

      {currentStep === 4 && identifier && (
        <StepContacts identifier={identifier} onComplete={handleStep4Complete} />
      )}

      {currentStep === 5 && identifier && (
        <StepAvatar identifier={identifier} onComplete={handleStep5Complete} />
      )}

      {currentStep > 1 && (
        <Button variant="ghost" onClick={handleGoBack}>
          Zurück
        </Button>
      )}
    </div>
  );
}
