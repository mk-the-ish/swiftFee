'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // For Electron's file:// protocol, we need to use hash-based routing
    if (window.location.protocol === 'file:') {
      router.replace('#/dashboard');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
        <p>Loading...</p>
    </div>
  );
}
