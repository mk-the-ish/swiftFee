'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Student, Payment, BankAccount, Transaction } from '@/lib/types';
import { STUDENTS, BANK_ACCOUNTS } from '@/lib/data';

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  exchangeRate: number;
  setExchangeRate: React.Dispatch<React.SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(BANK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(13.5);

  const contextValue = useMemo(() => ({
    students,
    setStudents,
    payments,
    setPayments,
    bankAccounts,
    setBankAccounts,
    transactions,
    setTransactions,
    exchangeRate,
    setExchangeRate,
  }), [students, payments, bankAccounts, transactions, exchangeRate]);

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
