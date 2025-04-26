import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${inter.className}`}>
      <div className="w-full max-w-md p-4 rounded-lg shadow-lg bg-white dark:bg-slate-800">
        {children}
      </div>
    </div>
  );
} 