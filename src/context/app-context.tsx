
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Student, Payment, BankAccount, Transaction, ExchangeRate, Note, StatementCategory, Grade, Class } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc, updateDoc, writeBatch, DocumentReference, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getExpenseCategory, getPaymentCategory, classIdMap, gradeProgression } from '@/lib/utils';


interface AppContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => Promise<void>;
  updateStudentBalances: (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => Promise<void>;
  bulkUpgradeGrades: () => Promise<void>;
  bulkBillStudents: (values: { tuition: number; levy: number; buildingFund: number; }) => Promise<void>;
  bulkUpdateStudentIds: () => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<DocumentReference | undefined>;

  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'category'> & {category?: StatementCategory}) => Promise<void>;

  exchangeRate: ExchangeRate | null;
  setExchangeRate: (rate: number) => Promise<void>;
  
  markPaymentsAsDeposited: (paymentIds: string[]) => Promise<void>;

  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const { data: students = [] } = useCollection<Student>(firestore ? collection(firestore, 'students') : null);
  const { data: payments = [] } = useCollection<Payment>(firestore ? collection(firestore, 'payments') : null);
  const { data: bankAccounts = [] } = useCollection<BankAccount>(firestore ? collection(firestore, 'bankAccounts') : null);
  const { data: transactions = [] } = useCollection<Transaction>(firestore ? collection(firestore, 'transactions') : null);
  const { data: exchangeRate } = useDoc<ExchangeRate>(firestore ? doc(firestore, 'settings', 'exchangeRate') : null);
  const { data: notes = [] } = useCollection<Note>(firestore ? collection(firestore, 'notes') : null);

  const setExchangeRate = async (rate: number) => {
    if (!firestore) return;
    const rateRef = doc(firestore, 'settings', 'exchangeRate');
    const data = { rate, lastUpdated: new Date().toISOString() };
    setDoc(rateRef, data)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: rateRef.path, operation: 'update', requestResourceData: data }));
      });
  };

  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    if (!firestore) return;

    // 1. Count existing students in the same grade and class for the relevant year
    const isEntrantForNextYear = studentData.status === 'entrant';
    const targetYearOffset = isEntrantForNextYear ? 1 : 0;

    const studentsInClass = students.filter(s => {
        const studentIsEntrant = s.status === 'entrant';
        const studentYearOffset = studentIsEntrant ? 1 : 0;
        return s.grade === studentData.grade && s.class === studentData.class && studentYearOffset === targetYearOffset;
    });
    const studentIndex = (studentsInClass.length + 1).toString().padStart(2, '0');

    // 2. Calculate graduation year
    const currentYear = new Date().getFullYear() + targetYearOffset; // Adjust year for entrants
    const gradeIndex = gradeProgression.indexOf(studentData.grade as Grade);
    const yearsToGraduate = gradeProgression.length - 1 - gradeIndex;
    const graduationYear = (currentYear + yearsToGraduate).toString().slice(-2);

    // 3. Get class code
    const classCode = classIdMap[studentData.class as Class] || '99';

    // 4. Assemble new ID
    const newId = `MP${graduationYear}${classCode}${studentIndex}`;

    const newStudent: Student = {
        ...studentData,
        id: newId,
    };

    const studentRef = doc(firestore, 'students', newId);

    setDoc(studentRef, newStudent)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'create', requestResourceData: newStudent }));
      });
  };

  const updateStudent = async (id: string, data: Partial<Omit<Student, 'id'>>) => {
      if (!firestore) return;
      const studentRef = doc(firestore, 'students', id);
      updateDoc(studentRef, data)
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: data }));
        });
  };

  const addBankAccount = async (account: Omit<BankAccount, 'id'>) => {
    if (!firestore) return;
    const ref = collection(firestore, 'bankAccounts');
    addDoc(ref, account)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: account }));
      });
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'category'> & {category?: StatementCategory}) => {
    if (!firestore) return;

    let category: StatementCategory;
    if (transaction.category) {
        category = transaction.category;
    } else if (transaction.type === 'incoming' && transaction.relatedPaymentId) {
        const payment = payments.find(p => p.id === transaction.relatedPaymentId);
        category = getPaymentCategory(payment);
    } else {
        category = getExpenseCategory(transaction.description);
    }
    
    const finalTransaction = { ...transaction, category };

    const ref = collection(firestore, 'transactions');
    addDoc(ref, finalTransaction)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: finalTransaction }));
      });
  }
  
  const updateStudentBalances = async (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => {
      if (!firestore) return;
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const owingKey = `${feeType}Owing` as keyof Student;
      const currentOwing = (student[owingKey] as number) || 0;
      const newOwing = currentOwing - amount;
      
      const updateData = { [owingKey]: newOwing };
      const studentRef = doc(firestore, 'students', studentId);

      updateDoc(studentRef, updateData)
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: updateData }));
        });
  };

  const bulkUpgradeGrades = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);

    // Get a fresh copy of students for processing
    const allStudents: Student[] = [...students];

    // First, change 'entrant' to 'active'
    allStudents.forEach(student => {
      if (student.status === 'entrant') {
        const studentRef = doc(firestore, 'students', student.id);
        batch.update(studentRef, { status: 'active' });
        // Update the local copy so the next step works on the correct status
        student.status = 'active'; 
      }
    });

    // Then, upgrade 'active' students
    allStudents.forEach(student => {
      if (student.status === 'active') {
        const studentRef = doc(firestore, 'students', student.id);
        const currentGradeIndex = gradeProgression.indexOf(student.grade as Grade);
        
        if (student.grade === '7') {
            batch.update(studentRef, { status: 'graduated' });
        } else {
            const nextGradeIndex = currentGradeIndex + 1;
            if (nextGradeIndex < gradeProgression.length) {
                batch.update(studentRef, { grade: gradeProgression[nextGradeIndex] });
            }
        }
      }
    });

    batch.commit()
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/students', operation: 'update', requestResourceData: { 'note': 'bulk grade upgrade' } }));
        });
  };

  const bulkBillStudents = async (values: { tuition: number; levy: number; buildingFund: number; }) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    students.forEach(student => {
        if(student.status === 'active') {
          const studentRef = doc(firestore, 'students', student.id);
          const updateData = {
            tuitionOwing: student.tuitionOwing + values.tuition,
            levyOwing: student.levyOwing + values.levy,
            buildingFundOwing: student.buildingFundOwing + values.buildingFund,
          };
          batch.update(studentRef, updateData);
        }
    });
    batch.commit()
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/students', operation: 'update', requestResourceData: { 'note': 'bulk billing' } }));
        });
  };

  const markPaymentsAsDeposited = async (paymentIds: string[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    paymentIds.forEach(id => {
      const paymentRef = doc(firestore, 'payments', id);
      batch.update(paymentRef, { deposited: true });
    });
    batch.commit()
      .catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/payments', operation: 'update', requestResourceData: { 'note': 'mark as deposited' } }));
      });
  };

  const bulkUpdateStudentIds = async () => {
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const studentsCollection = collection(firestore, "students");

    // 1. Delete all existing students
    for (const student of students) {
        const studentRef = doc(studentsCollection, student.id);
        batch.delete(studentRef);
    }
    
    // 2. Group students by grade and class
    const studentsByClass = students.reduce((acc, student) => {
        const key = `${student.grade}-${student.class}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    // 3. Generate new IDs and add students back
    for (const classGroup of Object.values(studentsByClass)) {
        classGroup.forEach((student, index) => {
            const currentYear = new Date().getFullYear();
            const gradeIndex = gradeProgression.indexOf(student.grade as Grade);
            const yearsToGraduate = gradeProgression.length - 1 - gradeIndex;
            const graduationYear = (currentYear + yearsToGraduate).toString().slice(-2);
            
            const classCode = classIdMap[student.class] || '99';
            const studentIndex = (index + 1).toString().padStart(2, '0');
            
            const newId = `MP${graduationYear}${classCode}${studentIndex}`;
            
            const newStudentData = { ...student, id: newId };
            const newStudentRef = doc(studentsCollection, newId);
            batch.set(newStudentRef, newStudentData);
        });
    }

    try {
        await batch.commit();
    } catch (err) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/students', operation: 'write', requestResourceData: { 'note': 'bulk student ID update' } }));
    }
  };
  
  const addPayment = async (payment: Omit<Payment, 'id'>): Promise<DocumentReference | undefined> => { 
      if (firestore) {
           const ref = collection(firestore, 'payments');
           try {
              const docRef = await addDoc(ref, payment);
              return docRef;
           } catch(err: any) {
              errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: payment }));
              return undefined;
          }
      }
      return undefined;
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
    if (!firestore) return;
    const ref = collection(firestore, 'notes');
    const data = { ...note, createdAt: new Date().toISOString() };
    addDoc(ref, data).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
  }

  const deleteNote = async (id: string) => {
      if (!firestore) return;
      const noteRef = doc(firestore, 'notes', id);
      deleteDoc(noteRef).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: noteRef.path, operation: 'delete' }));
      });
  }

  const contextValue = useMemo(() => ({
    students,
    addStudent,
    updateStudent,
    updateStudentBalances,
    bulkUpgradeGrades,
    bulkBillStudents,
    bulkUpdateStudentIds,
    payments,
    addPayment,
    bankAccounts,
    addBankAccount,
    transactions,
    addTransaction,
    exchangeRate: exchangeRate ?? { rate: 1, lastUpdated: '' },
    setExchangeRate,
    markPaymentsAsDeposited,
    notes,
    addNote,
    deleteNote,
  }), [students, updateStudent, addStudent, payments, bankAccounts, transactions, exchangeRate, firestore, addBankAccount, addTransaction, bulkUpgradeGrades, bulkBillStudents, notes, addNote, deleteNote]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

    