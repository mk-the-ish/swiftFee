
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Student, Payment, BankAccount, Transaction, ExchangeRate, Note, StatementCategory, Grade, Class, AdminLog } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase/firestore/hooks';
import { collection, doc, setDoc, addDoc, updateDoc, writeBatch, DocumentReference, deleteDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getExpenseCategory, getPaymentCategory, classIdMap, gradeProgression } from '@/lib/utils';


interface AppContextType {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>, actor?: { userId: string, userName: string }) => Promise<void>;
  updateStudentBalances: (studentId: string, feeType: 'tuition' | 'levy' | 'building', amount: number) => Promise<void>;
  bulkUpgradeGrades: (actor: { userId: string, userName: string }) => Promise<void>;
  bulkBillStudents: (values: { tuition: number; levy: number; buildingFund: number; }, actor: { userId: string, userName: string }) => Promise<void>;
  billStudent: (studentId: string, values: { tuition: number; levy: number; buildingFund: number; }, actor: { userId: string, userName: string }) => Promise<void>;
  bulkUpdateStudentIds: () => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<DocumentReference | undefined>;
  deletePayment: (paymentId: string, studentId: string, actor: { userId: string, userName: string }) => Promise<void>;


  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'category'> & {category?: StatementCategory}) => Promise<void>;

  exchangeRate: ExchangeRate | null;
  setExchangeRate: (rate: number) => Promise<void>;
  
  markPaymentsAsDeposited: (paymentIds: string[], studentId: string) => Promise<void>;

  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  adminLogs: AdminLog[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  const { data: students = [] } = useCollection<Student>(firestore ? collection(firestore, 'students') : null);
  // Payments are now fetched on-demand or with a more complex listener, since they are in subcollections.
  const [payments, setPayments] = useState<Payment[]>([]);
  const { data: bankAccounts = [] } = useCollection<BankAccount>(firestore ? collection(firestore, 'bankAccounts') : null);
  const { data: transactions = [] } = useCollection<Transaction>(firestore ? collection(firestore, 'transactions') : null);
  const { data: exchangeRate } = useDoc<ExchangeRate>(firestore ? doc(firestore, 'settings', 'exchangeRate') : null);
  const { data: notes = [] } = useCollection<Note>(firestore ? collection(firestore, 'notes') : null);
  const { data: adminLogs = [] } = useCollection<AdminLog>(firestore ? collection(firestore, 'admin_logs') : null);
  
  useEffect(() => {
    if (!firestore || students.length === 0) {
      setPayments([]);
      return;
    }

    const fetchAllPayments = async () => {
      const allPayments: Payment[] = [];
      for (const student of students) {
        const paymentsRef = collection(firestore, 'students', student.id, 'feesPayments');
        const paymentsSnap = await getDocs(paymentsRef);
        paymentsSnap.forEach(doc => {
          allPayments.push({ id: doc.id, ...doc.data() } as Payment);
        });
      }
      setPayments(allPayments);
    };

    fetchAllPayments();

    // Set up listeners for each student's payments
    const unsubscribers = students.map(student => {
      const paymentsRef = collection(firestore, 'students', student.id, 'feesPayments');
      return onSnapshot(paymentsRef, snapshot => {
        // This is a simple way to refetch all payments. A more optimized approach
        // would be to update the state partially.
        fetchAllPayments();
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [students, firestore]);

  const addAdminLog = async (action: string, details: string, actor: { userId: string, userName: string }) => {
    if (!firestore) return;
    const log: Omit<AdminLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userId: actor.userId,
        userName: actor.userName,
        action,
        details
    };
    const ref = collection(firestore, 'admin_logs');
    addDoc(ref, log).catch(err => console.error("Failed to add admin log:", err));
  };

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
    const currentYear = new Date().getFullYear();
    const adjustedCurrentYear = currentYear + (isEntrantForNextYear ? 1 : 0);
    const gradeIndex = gradeProgression.indexOf(studentData.grade as Grade);
    const yearsToGraduate = gradeProgression.length - 1 - gradeIndex;
    const graduationYear = (adjustedCurrentYear + yearsToGraduate).toString().slice(-2);

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

  const updateStudent = async (id: string, data: Partial<Omit<Student, 'id'>>, actor?: { userId: string, userName: string }) => {
      if (!firestore) return;
      const studentRef = doc(firestore, 'students', id);
      const studentBefore = students.find(s => s.id === id);

      updateDoc(studentRef, data)
        .then(() => {
            if (actor && studentBefore && data.status && studentBefore.status !== data.status) {
                addAdminLog('Change Student Status', `Changed status of ${studentBefore.name} (${id}) from ${studentBefore.status} to ${data.status}`, actor);
            }
        })
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

  const bulkUpgradeGrades = async (actor: { userId: string, userName: string }) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);

    // Get a fresh copy of students for processing
    const allStudents: Student[] = [...students];
    let upgradedCount = 0;
    let activatedCount = 0;

    // First, change 'entrant' to 'active'
    allStudents.forEach(student => {
      if (student.status === 'entrant') {
        const studentRef = doc(firestore, 'students', student.id);
        batch.update(studentRef, { status: 'active' });
        activatedCount++;
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
            upgradedCount++;
        } else {
            const nextGradeIndex = currentGradeIndex + 1;
            if (nextGradeIndex < gradeProgression.length) {
                batch.update(studentRef, { grade: gradeProgression[nextGradeIndex] });
                upgradedCount++;
            }
        }
      }
    });

    batch.commit()
        .then(() => {
            addAdminLog('New Year Upgrade', `Upgraded ${upgradedCount} students and activated ${activatedCount} entrants.`, actor);
        })
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/students', operation: 'update', requestResourceData: { 'note': 'bulk grade upgrade' } }));
        });
  };

  const billStudent = async (studentId: string, values: { tuition: number; levy: number; buildingFund: number; }, actor: { userId: string, userName: string }) => {
    if (!firestore) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const studentRef = doc(firestore, 'students', studentId);
    const updateData = {
        tuitionOwing: student.tuitionOwing + values.tuition,
        levyOwing: student.levyOwing + values.levy,
        buildingFundOwing: student.buildingFundOwing + values.buildingFund,
    };
    updateDoc(studentRef, updateData)
        .then(() => {
             addAdminLog('Individual Billing', `Billed ${student.name} (${studentId}): Tuition +${values.tuition}, Levy +${values.levy}, Building +${values.buildingFund}`, actor);
        })
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: updateData }));
        });
  };

  const bulkBillStudents = async (values: { tuition: number; levy: number; buildingFund: number; }, actor: { userId: string, userName: string }) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    let billedCount = 0;
    students.forEach(student => {
        if(student.status === 'active') {
          billedCount++;
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
        .then(() => {
            addAdminLog('Bulk Billing', `Billed ${billedCount} active students: Tuition +${values.tuition}, Levy +${values.levy}, Building +${values.buildingFund}`, actor);
        })
        .catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/students', operation: 'update', requestResourceData: { 'note': 'bulk billing' } }));
        });
  };

  const markPaymentsAsDeposited = async (paymentIds: string[], studentId: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    paymentIds.forEach(id => {
      const paymentRef = doc(firestore, 'students', studentId, 'feesPayments', id);
      batch.update(paymentRef, { deposited: true });
    });
    batch.commit()
      .catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `/students/${studentId}/feesPayments`, operation: 'update', requestResourceData: { 'note': 'mark as deposited' } }));
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
           const ref = collection(firestore, 'students', payment.studentId, 'feesPayments');
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

  const deletePayment = async (paymentId: string, studentId: string, actor: { userId: string, userName: string }) => {
    if (!firestore) return;
    const paymentRef = doc(firestore, 'students', studentId, 'feesPayments', paymentId);
    const studentRef = doc(firestore, 'students', studentId);
    
    try {
        const paymentDoc = await getDoc(paymentRef);
        const paymentData = paymentDoc.data() as Payment;

        if (!paymentData) {
            throw new Error("Payment not found.");
        }

        const studentDoc = await getDoc(studentRef);
        const studentData = studentDoc.data() as Student;

        if (!studentData) {
            throw new Error("Student not found.");
        }
        
        const owingKey = `${paymentData.feeType}Owing` as keyof Student;
        const currentOwing = (studentData[owingKey] as number) || 0;
        const newOwing = currentOwing + paymentData.amountInUSD;

        const batch = writeBatch(firestore);
        batch.delete(paymentRef);
        batch.update(studentRef, { [owingKey]: newOwing });

        await batch.commit();
        addAdminLog('Delete Payment', `Deleted payment ${paymentId} (${formatCurrency(paymentData.amount, paymentData.currency)}) for student ${studentData.name} (${studentId}).`, actor);

    } catch (err) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({ path: paymentRef.path, operation: 'delete' }));
    }
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
    billStudent,
    bulkUpdateStudentIds,
    payments,
    addPayment,
    deletePayment,
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
    adminLogs,
  }), [students, payments, bankAccounts, transactions, exchangeRate, firestore, notes, adminLogs]);

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

    