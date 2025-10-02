import type { Student, BankAccount } from './types';

export const STUDENTS: Student[] = [
  { id: 'S001', name: 'John Doe', grade: 'Grade 5', tuitionOwing: 250, levyOwing: 50, buildingFundOwing: 100 },
  { id: 'S002', name: 'Jane Smith', grade: 'Grade 7', tuitionOwing: 0, levyOwing: 25, buildingFundOwing: 0 },
  { id: 'S003', name: 'Peter Jones', grade: 'ECD A', tuitionOwing: 150, levyOwing: 50, buildingFundOwing: 75 },
  { id: 'S004', name: 'Mary Williams', grade: 'Grade 1', tuitionOwing: 250, levyOwing: 0, buildingFundOwing: 100 },
  { id: 'S005', name: 'David Brown', grade: 'Grade 3', tuitionOwing: 100, levyOwing: 10, buildingFundOwing: 50 },
];

export const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'B01', bankName: 'Standard Chartered', branch: 'Harare', accountNumber: '0123456789', currency: 'USD' },
  { id: 'B02', bankName: 'CABS', branch: 'Bulawayo', accountNumber: '9876543210', currency: 'ZWG' },
  { id: 'B03', bankName: 'CBZ Bank', branch: 'Harare', accountNumber: '5551234567', currency: 'USD' },
];
