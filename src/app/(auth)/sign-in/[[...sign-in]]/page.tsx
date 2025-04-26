import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
      }}
    />
  );
} 