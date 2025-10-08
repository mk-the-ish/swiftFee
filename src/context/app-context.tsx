'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Student, Payment, BankAccount, Transaction, ExchangeRate } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc, updateDoc, writeBatch, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface AppContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => Promise<void>;
  updateStudentBalances: (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => Promise<void>;
  bulkUpgradeGrades: () => Promise<void>;
  bulkBillStudents: (values: { tuition: number; levy: number; buildingFund: number; }) => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<DocumentReference | undefined>;

  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;

  exchangeRate: ExchangeRate | null;
  setExchangeRate: (rate: number) => Promise<void>;
  
  markPaymentsAsDeposited: (paymentIds: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const gradeProgression = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const { data: students = [], add: addStudentToCollection, update: updateStudentInCollection } = useCollection<Student>(firestore ? collection(firestore, 'students') : null);
  const { data: payments = [], add: addPaymentToCollection } = useCollection<Payment>(firestore ? collection(firestore, 'payments') : null);
  const { data: bankAccounts = [], add: addBankAccountToCollection } = useCollection<BankAccount>(firestore ? collection(firestore, 'bankAccounts') : null);
  const { data: transactions = [], add: addTransactionToCollection } = useCollection<Transaction>(firestore ? collection(firestore, 'transactions') : null);
  const { data: exchangeRate } = useDoc<ExchangeRate>(firestore ? doc(firestore, 'settings', 'exchangeRate') : null);


  const setExchangeRate = async (rate: number) => {
    if (!firestore) return;
    const rateRef = doc(firestore, 'settings', 'exchangeRate');
    const data = { rate, lastUpdated: new Date().toISOString() };
    setDoc(rateRef, data)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: rateRef.path, operation: 'update', requestResourceData: data }));
      });
  };

  const addStudent = async (student: Omit<Student, 'id'>) => {
      if (!firestore) return;
      const ref = collection(firestore, 'students');
      addDoc(ref, student).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: student }));
      });
  }

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

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!firestore) return;
    const ref = collection(firestore, 'transactions');
    addDoc(ref, transaction)
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: transaction }));
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
    students.forEach(student => {
      if (student.status === 'active') {
        const studentRef = doc(firestore, 'students', student.id);
        const currentGradeIndex = gradeProgression.indexOf(student.grade);
        
        if (student.grade === 'Grade 7') {
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

  const contextValue = useMemo(() => ({
    students,
    addStudent,
    updateStudent,
    updateStudentBalances,
    bulkUpgradeGrades,
    bulkBillStudents,
    payments,
    addPayment,
    bankAccounts,
    addBankAccount,
    transactions,
    addTransaction,
    exchangeRate: exchangeRate ?? { rate: 1, lastUpdated: '' },
    setExchangeRate,
    markPaymentsAsDeposited,
  }), [students, updateStudent, addStudent, payments, bankAccounts, transactions, exchangeRate, firestore, addBankAccount, addTransaction, bulkUpgradeGrades, bulkBillStudents]);

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
