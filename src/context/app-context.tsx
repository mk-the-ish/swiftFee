'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Student, Payment, BankAccount, Transaction, ExchangeRate } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface AppContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  updateStudentBalances: (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => Promise<void>;
  bulkUpgradeGrades: () => Promise<void>;
  bulkBillStudents: (values: { tuition: number; levy: number; buildingFund: number; }) => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;

  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;

  exchangeRate: ExchangeRate | null;
  setExchangeRate: (rate: number) => Promise<void>;
  
  markPaymentsAsDeposited: (paymentIds: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const { data: students = [], add: addStudent, update: updateStudent } = useCollection<Student>(firestore ? collection(firestore, 'students') : null);
  const { data: payments = [], add: addPayment, update: updatePayment } = useCollection<Payment>(firestore ? collection(firestore, 'payments') : null);
  const { data: bankAccounts = [], add: addBankAccount } = useCollection<BankAccount>(firestore ? collection(firestore, 'bankAccounts') : null);
  const { data: transactions = [], add: addTransaction } = useCollection<Transaction>(firestore ? collection(firestore, 'transactions') : null);
  const { data: exchangeRate } = useDoc<ExchangeRate>(firestore ? doc(firestore, 'settings', 'exchangeRate') : null);


  const setExchangeRate = async (rate: number) => {
    if (!firestore) return;
    const rateRef = doc(firestore, 'settings', 'exchangeRate');
    await setDoc(rateRef, { rate, lastUpdated: new Date().toISOString() });
  };
  
  const updateStudentBalances = async (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => {
      if (!firestore) return;
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const owingKey = `${feeType}Owing` as keyof Student;
      const currentOwing = (student[owingKey] as number) || 0;
      const newOwing = Math.max(0, currentOwing - amount);

      await updateStudent(studentId, { [owingKey]: newOwing });
  };

  const bulkUpgradeGrades = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    students.forEach(student => {
      const studentRef = doc(firestore, 'students', student.id);
      const currentGradeIndex = gradeProgression.indexOf(student.grade);
      const nextGradeIndex = currentGradeIndex + 1;
      const newGrade = nextGradeIndex < gradeProgression.length ? gradeProgression[nextGradeIndex] : student.grade;
      batch.update(studentRef, { grade: newGrade });
    });
    await batch.commit();
  };

  const bulkBillStudents = async (values: { tuition: number; levy: number; buildingFund: number; }) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    students.forEach(student => {
      const studentRef = doc(firestore, 'students', student.id);
      batch.update(studentRef, {
        tuitionOwing: student.tuitionOwing + values.tuition,
        levyOwing: student.levyOwing + values.levy,
        buildingFundOwing: student.buildingFundOwing + values.buildingFund,
      });
    });
    await batch.commit();
  };

  const markPaymentsAsDeposited = async (paymentIds: string[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    paymentIds.forEach(id => {
      const paymentRef = doc(firestore, 'payments', id);
      batch.update(paymentRef, { deposited: true });
    });
    await batch.commit();
  };

  const contextValue = useMemo(() => ({
    students,
    addStudent: async (student) => { if (firestore) await addDoc(collection(firestore, 'students'), student) },
    updateStudent,
    updateStudentBalances,
    bulkUpgradeGrades,
    bulkBillStudents,
    payments,
    addPayment: async (payment) => { if (firestore) await addDoc(collection(firestore, 'payments'), payment) },
    bankAccounts,
    addBankAccount: async (account) => { if (firestore) await addDoc(collection(firestore, 'bankAccounts'), account) },
    transactions,
    addTransaction: async (transaction) => { if (firestore) await addDoc(collection(firestore, 'transactions'), transaction) },
    exchangeRate: exchangeRate ?? { rate: 1, lastUpdated: '' },
    setExchangeRate,
    markPaymentsAsDeposited,
  }), [students, updateStudent, payments, bankAccounts, transactions, exchangeRate, firestore]);

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

// Need to define this type, was missing before
const gradeProgression = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
