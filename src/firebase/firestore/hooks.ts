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
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useFirestore } from '../';

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
        if (err.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'list' }));
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path]);

  const add = async (data: Omit<T, 'id'>) => {
    if (!ref) throw new Error("Collection reference not available");
    const docData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    return addDoc(ref, docData)
        .catch(err => {
            if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: docData }));
            }
            throw err;
        });
  };
  
  const update = async (id: string, data: Partial<T>) => {
    if (!ref) throw new Error("Collection reference not available");
    const docRef = doc(ref, id);
    const updateData = { ...data, updatedAt: serverTimestamp() };
    return updateDoc(docRef, updateData)
        .catch(err => {
            if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: updateData }));
            }
            throw err;
        });
  };

  const remove = async (id: string) => {
    if (!ref) throw new Error("Collection reference not available");
     const docRef = doc(ref, id);
    return deleteDoc(docRef)
        .catch(err => {
            if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
            }
            throw err;
        });
  };


  return { data, loading, error, add, update, remove };
}

// Custom hook for a school-scoped collection
export function useSchoolCollection<T extends DocumentData>(
  schoolId: string | null,
  collectionName: string
) {
  const firestore = useFirestore();
  const ref = schoolId && firestore ? collection(firestore, 'schools', schoolId, collectionName) : null;
  return useCollection<T>(ref);
}

// Custom hook for aggregating data across all schools
export function useMultiSchoolAggregation<T extends DocumentData>(
  collectionName: string
) {
  const firestore = useFirestore();
  const { data: schools } = useCollection<{ id: string; name: string }>(
    firestore ? collection(firestore, 'schools') : null
  );

  const [allData, setAllData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || schools.length === 0) {
      setAllData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: Unsubscribe[] = [];

    const updateData = () => {
      const promises = schools.map(async (school) => {
        const schoolRef = collection(firestore, 'schools', school.id, collectionName);
        return new Promise<T[]>((resolve) => {
          const unsubscribe = onSnapshot(
            schoolRef,
            (snapshot) => {
              const schoolData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                schoolId: school.id,
                schoolName: school.name,
              })) as T[];
              resolve(schoolData);
            },
            (err) => {
              if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: schoolRef.path, operation: 'list' }));
              }
              setError(err);
              resolve([]);
            }
          );
          unsubscribes.push(unsubscribe);
        });
      });

      Promise.all(promises).then((schoolDataArrays) => {
        const aggregated = schoolDataArrays.flat();
        setAllData(aggregated);
        setLoading(false);
      });
    };

    updateData();

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [firestore, schools, collectionName]);

  return { data: allData, loading, error };
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
        if (err.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'get' }));
        }
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
