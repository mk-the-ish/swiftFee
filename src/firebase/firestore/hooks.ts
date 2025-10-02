'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

// Custom hook for a collection
export function useCollection<T extends DocumentData>(
  ref: CollectionReference | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
        setData([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const unsubscribe: Unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const newData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(newData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path]);

  const add = async (data: Omit<T, 'id'>) => {
    if (!ref) throw new Error("Collection reference not available");
    return addDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };
  
  const update = async (id: string, data: Partial<T>) => {
    if (!ref) throw new Error("Collection reference not available");
    return updateDoc(doc(ref, id), { ...data, updatedAt: serverTimestamp() });
  };

  const remove = async (id: string) => {
    if (!ref) throw new Error("Collection reference not available");
    return deleteDoc(doc(ref, id));
  };


  return { data, loading, error, add, update, remove };
}

// Custom hook for a single document
export function useDoc<T extends DocumentData>(
  ref: DocumentReference | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
        setData(null);
        setLoading(false);
        return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}
