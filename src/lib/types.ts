export type Grade = 'ECD A' | 'ECD B' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7';

export const gradeProgression: Grade[] = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

export type FeeType = 'tuition' | 'levy' | 'building' | 'exam';

export type Student = {
  id: string;
  name: string;
  grade: Grade;
  tuitionOwing: number;
  levyOwing: number;
  buildingFundOwing: number;
};

export type BankAccount = {
  id: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  currency: 'USD' | 'ZWG';
};

export type Payment = {
  id: string;
  studentId: string;
  studentName: string;
  feeType: FeeType;
  amount: number;
  currency: 'USD' | 'ZWG';
  amountInUSD: number;
  date: string;
  bankAccountId: string;
};
