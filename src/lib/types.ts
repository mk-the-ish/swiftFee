export type Grade = 'ECD A' | 'ECD B' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export type Class = 'blue' | 'brown' | 'green' |'maroon'|'orange'|'pink'|'purple'|'red'|'white'|'yellow';

export const gradeProgression: Grade[] = ['ECD A', 'ECD B', '1', '2', '3', '4', '5', '6', '7'];
export const classColors: Class[] = ['blue', 'brown', 'green', 'maroon', 'orange', 'pink', 'purple', 'red', 'white', 'yellow'];

export type FeeType = 'tuition' | 'levy' | 'building' | 'exam';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Ecocash';

export type StudentStatus = 'active' | 'graduated' | 'transferred';

export type Student = {
  id: string;
  name: string;
  grade: Grade;
  class: Class;
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

export type Note = {
  id: string;
  description: string;
  authorName: string;
  createdAt: string;
  authorId: string;
};
