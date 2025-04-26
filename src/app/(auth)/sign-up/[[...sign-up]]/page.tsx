import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
      }}
    />
  );
} 