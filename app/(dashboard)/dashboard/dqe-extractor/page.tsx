import DQEExtractorLocal from '@/components/dqe/DQEExtractorLocal';

export const metadata = {
  title: 'DQE Extractor - CompaChantier',
  description: 'Extraction intelligente des données de Devis Quantitatif Estimatif',
};

export default function DQEExtractorPage() {
  return <DQEExtractorLocal />;
}
