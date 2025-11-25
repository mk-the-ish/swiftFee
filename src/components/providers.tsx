'use client';

import { AuthProvider } from '@/context/auth-context';
import { AppProvider } from '@/context/app-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </AuthProvider>
  );
}