'use client';

import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { useAuth } from '../provider';
import { useRouter } from 'next/navigation';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Auth service not available");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    if (!auth) throw new Error("Auth service not available");
    await firebaseSignOut(auth);
    router.push('/login');
  };

  return { user, loading, signInWithGoogle, signOut };
}
