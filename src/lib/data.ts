import type { Student, BankAccount } from './types';

// This file is no longer the source of truth, but can be used for reference
// or to seed the database during development.

export const STUDENTS: Student[] = [
  { id: 'S001', name: 'John Doe', grade: '5',class: 'yellow', dateOfBirth: '2014-05-10', gender: 'Male', guardianName: 'Richard Doe', guardianPhone: '555-1234', address: '123 Main St, Harare',status: 'active', tuitionOwing: 250, levyOwing: 50, buildingFundOwing: 100 },
  { id: 'S002', name: 'Jane Smith', grade: '7',class: 'blue', dateOfBirth: '2012-09-22', gender: 'Female', guardianName: 'Sarah Smith', guardianPhone: '555-5678', address: '456 Oak Ave, Bulawayo',status: 'active', tuitionOwing: 0, levyOwing: 25, buildingFundOwing: 0 },
  { id: 'S003', name: 'Peter Jones', grade: 'ECD A',class: 'red', dateOfBirth: '2019-02-15', gender: 'Male', guardianName: 'Emily Jones', guardianPhone: '555-9012', address: '789 Pine Ln, Harare',status: 'active', tuitionOwing: 150, levyOwing: 50, buildingFundOwing: 75 },
  { id: 'S004', name: 'Mary Williams', grade: '1',class: 'brown', dateOfBirth: '2018-11-30', gender: 'Female', guardianName: 'David Williams', guardianPhone: '555-3456', address: '101 Maple Dr, Mutare',status: 'active', tuitionOwing: 250, levyOwing: 0, buildingFundOwing: 100 },
  { id: 'S005', name: 'David Brown', grade: '3',class: 'purple', dateOfBirth: '2016-07-19', gender: 'Male', guardianName: 'Grace Brown', guardianPhone: '555-7890', address: '212 Cedar Ct, Gweru',status: 'active', tuitionOwing: 100, levyOwing: 10, buildingFundOwing: 50 },
];

export const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'B01', bankName: 'Standard Chartered', branch: 'Harare', accountNumber: '0123456789', currency: 'USD' },
  { id: 'B02', bankName: 'CABS', branch: 'Bulawayo', accountNumber: '9876543210', currency: 'ZWG' },
  { id: 'B03', bankName: 'CBZ Bank', branch: 'Harare', accountNumber: '5551234567', currency: 'USD' },
];
