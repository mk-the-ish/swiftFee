export type Grade = 'ECD A' | 'ECD B' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7';

export const gradeProgression: Grade[] = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

export type FeeType = 'tuition' | 'levy' | 'building' | 'exam';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Ecocash';

export type StudentStatus = 'active' | 'graduated' | 'transferred';

export type Student = {
  id: string;
  name: string;
  grade: Grade;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  guardianName: string;
  guardianPhone: string;
  address: string;
  status: StudentStatus;
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
  receiptNumber: string;
  feeType: FeeType;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: 'USD' | 'ZWG';
  amountInUSD: number;
  date: string;
  bankAccountId?: string; // For non-cash payments
  depositAccountId?: string; // For cash payments
  deposited: boolean;
};

export type Transaction = {
  id: string;
  date: string;
  bankAccountId: string;
  type: 'incoming' | 'outgoing';
  description: string;
  amount: number; // in USD
  currency: 'USD' | 'ZWG';
  originalAmount: number;
  relatedPaymentId?: string;
};

export type ExchangeRate = {
    rate: number;
    lastUpdated: string;
};
