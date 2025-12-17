'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc } from '@/firebase/firestore/hooks';
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User, School } from '@/lib/types';

interface SchoolContextType {
  selectedSchoolId: string | null;
  setSelectedSchoolId: (id: string | null) => void;
  userData: User | null;
  schools: School[];
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const { data: userData } = useDoc<User>(
    user?.uid && firestore ? doc(firestore, 'users', user.uid) : null
  );

  const { data: allSchools } = useCollection<School>(
    firestore ? collection(firestore, 'schools') : null
  );

  const schools = allSchools.filter(school => userData?.schoolIds.includes(school.id)) || [];

  useEffect(() => {
    if (userData?.defaultSchoolId) {
      setSelectedSchoolId(userData.defaultSchoolId);
    } else if (userData?.schoolIds.length === 1) {
      setSelectedSchoolId(userData.schoolIds[0]);
    }
  }, [userData]);

  const value = {
    selectedSchoolId,
    setSelectedSchoolId,
    userData,
    schools,
    loading: !userData || !allSchools,
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}