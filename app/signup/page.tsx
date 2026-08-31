import { SignupForm } from '@/src/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up - HYROX Coach AI',
  description: 'Create your account and get a personalized HYROX training plan.',
};

export default function SignupPage() {
  return <SignupForm />;
}
