import { PredictorForm } from '@/src/components/predictor/PredictorForm';

export const metadata = {
  title: 'HYROX Time Predictor | HYROX Coach AI',
  description: 'Get a free estimate of your HYROX finish time based on your 5K fitness and race details.',
};

export default function PredictorPage() {
  return (
    <main>
      <PredictorForm />
    </main>
  );
}
