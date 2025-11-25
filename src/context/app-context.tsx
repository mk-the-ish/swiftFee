'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Student, Payment, BankAccount, Transaction, ExchangeRate, Note, StatementCategory, Grade, Class } from '@/lib/types';
import { getExpenseCategory, getPaymentCategory, classIdMap, gradeProgression } from '@/lib/utils';

// Import local DB hooks and service
import { useLocalCollection, useLocalDoc } from '@/hooks/use-local-db';
import { db } from '@/db/local-service';

interface AppContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => Promise<void>;
  updateStudentBalances: (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => Promise<void>;
  bulkUpgradeGrades: () => Promise<void>;
  bulkBillStudents: (values: { tuition: number; levy: number; buildingFund: number; }) => Promise<void>;
  bulkUpdateStudentIds: () => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<any>; // Return type depends on DB implementation, generally doc ref or ID

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
  // 1. Fetch Data using Local SQLite Hooks
  const { data: students = [] } = useLocalCollection<Student>('students');
  const { data: payments = [] } = useLocalCollection<Payment>('payments');
  const { data: bankAccounts = [] } = useLocalCollection<BankAccount>('bankAccounts');
  const { data: transactions = [] } = useLocalCollection<Transaction>('transactions');
  const { data: notes = [] } = useLocalCollection<Note>('notes');
  
  // Single document for settings
  const { data: exchangeRate } = useLocalDoc<ExchangeRate>('settings', 'exchangeRate');

  // 2. Data Mutation Functions (Using SQLite Service Wrapper)

  const setExchangeRate = async (rate: number) => {
    const data = { rate, lastUpdated: new Date().toISOString() };
    // Upsert the exchange rate document
    await db.collection('settings').doc('exchangeRate').set(data);
  };

  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    // 1. Count existing students in the same grade and class
    const studentsInClass = students.filter(s => s.grade === studentData.grade && s.class === studentData.class);
    const studentIndex = (studentsInClass.length + 1).toString().padStart(2, '0');

    // 2. Calculate graduation year
    const currentYear = new Date().getFullYear();
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

    await db.collection('students').doc(newId).set(newStudent);
  };

  const updateStudent = async (id: string, data: Partial<Omit<Student, 'id'>>) => {
      await db.collection('students').doc(id).update(data);
  };

  const addBankAccount = async (account: Omit<BankAccount, 'id'>) => {
    await db.collection('bankAccounts').add(account);
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'category'> & {category?: StatementCategory}) => {
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
    await db.collection('transactions').add(finalTransaction);
  }
  
  const updateStudentBalances = async (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const owingKey = `${feeType}Owing` as keyof Student;
      const currentOwing = (student[owingKey] as number) || 0;
      const newOwing = currentOwing - amount;
      
      const updateData = { [owingKey]: newOwing };
      await db.collection('students').doc(studentId).update(updateData);
  };

  const bulkUpgradeGrades = async () => {
    const batch = db.batch();
    const allStudents: Student[] = [...students];

    // First, change 'entrant' to 'active'
    allStudents.forEach(student => {
      if (student.status === 'entrant') {
        const studentRef = db.collection('students').doc(student.id);
        batch.update(studentRef, { status: 'active' });
        // Update local ref to avoid double processing if needed
        student.status = 'active'; 
      }
    });

    // Then, upgrade 'active' students
    allStudents.forEach(student => {
      if (student.status === 'active') {
        const studentRef = db.collection('students').doc(student.id);
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

    await batch.commit();
  };

  const bulkBillStudents = async (values: { tuition: number; levy: number; buildingFund: number; }) => {
    const batch = db.batch();
    students.forEach(student => {
        if(student.status === 'active') {
          const studentRef = db.collection('students').doc(student.id);
          const updateData = {
            tuitionOwing: student.tuitionOwing + values.tuition,
            levyOwing: student.levyOwing + values.levy,
            buildingFundOwing: student.buildingFundOwing + values.buildingFund,
          };
          batch.update(studentRef, updateData);
        }
    });
    await batch.commit();
  };

  const markPaymentsAsDeposited = async (paymentIds: string[]) => {
    const batch = db.batch();
    paymentIds.forEach(id => {
      const paymentRef = db.collection('payments').doc(id);
      batch.update(paymentRef, { deposited: true });
    });
    await batch.commit();
  };

  const bulkUpdateStudentIds = async () => {
    const batch = db.batch();

    // 1. Delete all existing students
    for (const student of students) {
        const studentRef = db.collection('students').doc(student.id);
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
            const newStudentRef = db.collection('students').doc(newId);
            
            // Re-insert with new ID
            batch.set(newStudentRef, newStudentData);
        });
    }

    await batch.commit();
  };
  
  const addPayment = async (payment: Omit<Payment, 'id'>): Promise<any> => { 
      try {
        const result = await db.collection('payments').add(payment);
        // Returns object { id: string } based on our local-service implementation
        return result; 
      } catch(err) {
        console.error("Failed to add payment", err);
        return undefined;
      }
  };

  const addNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
    const data = { ...note, createdAt: new Date().toISOString() };
    await db.collection('notes').add(data);
  }

  const deleteNote = async (id: string) => {
      await db.collection('notes').doc(id).delete();
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
  }), [students, updateStudent, addStudent, payments, bankAccounts, transactions, exchangeRate, addBankAccount, addTransaction, bulkUpgradeGrades, bulkBillStudents, notes, addNote, deleteNote]);

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