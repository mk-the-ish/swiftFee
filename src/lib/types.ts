
export type Grade = 'R' | 'ECD A' | 'ECD B' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

export type Class = 'blue' | 'brown' | 'green' |'maroon'|'orange'|'pink'|'purple'|'red'|'white'|'yellow';

export const gradeProgression: string[] = ['R','ECD A', 'ECD B', '1', '2', '3', '4', '5', '6', '7'];

export const classColors: Class[] = ['blue', 'brown', 'green', 'maroon', 'orange', 'pink', 'purple', 'red', 'white', 'yellow'];

export const classIdMap: Record<Class, string> = {
    'blue': '00',
    'brown': '01',
    'green': '02',
    'maroon': '03',
    'orange': '04',
    'pink': '05',
    'purple': '06',
    'red': '07',
    'white': '08',
    'yellow': '09'
};

export type FeeType = 'tuition' | 'levy' | 'building' | 'exam';

export type StatementCategory = FeeType | 'stationery' | 'salaries' | 'utilities' | 'maintenance' | 'other';

export const statementCategories: StatementCategory[] = ['tuition', 'levy', 'building', 'exam', 'stationery', 'salaries', 'utilities', 'maintenance', 'other'];

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Ecocash';

export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'entrant';

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
  depositAccountId?: string; // For cash deposits
  deposited: boolean;
  recordedById: string;
  recordedBy: string;
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
  recordedById: string;
  recordedBy: string;
  category: StatementCategory;
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

export type AdminLog = {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
}

