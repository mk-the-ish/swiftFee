
'use client';

import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const createUserWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service not available");
    return createUserWithEmailAndPassword(auth, email, password);
  }

  const signOut = async () => {
    if (!auth) throw new Error("Auth service not available");
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const reauthenticate = async (password: string) => {
    if (!auth || !auth.currentUser || !auth.currentUser.email) {
      throw new Error("User not authenticated or email not available.");
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    return reauthenticateWithCredential(auth.currentUser, credential);
  };


  return { user, loading, signInWithEmail, createUserWithEmail, signOut, reauthenticate };
}
