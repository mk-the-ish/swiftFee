// Schemas for reference - the app uses SQLite with a Firestore-like wrapper
// These are not actively used but documented for reference

// Student schema properties
export const studentSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  name: { type: 'string' },
  grade: { type: 'string' },
  class: { type: 'string' },
  dateOfBirth: { type: 'string', format: 'date-time' },
  gender: { type: 'string', enum: ['Male', 'Female'] },
  guardianName: { type: 'string' },
  guardianPhone: { type: 'string' },
  address: { type: 'string' },
  status: { type: 'string', enum: ['active', 'graduated', 'transferred', 'entrant'] },
  tuitionOwing: { type: 'number' },
  levyOwing: { type: 'number' },
  buildingFundOwing: { type: 'number' }
};

// Bank account schema properties
export const bankAccountSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  bankName: { type: 'string' },
  branch: { type: 'string' },
  accountNumber: { type: 'string' },
  currency: { type: 'string', enum: ['USD', 'ZWG'] }
};

// Payment schema properties
export const paymentSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  studentId: { type: 'string' },
  studentName: { type: 'string' },
  receiptNumber: { type: 'string' },
  feeType: { type: 'string', enum: ['tuition', 'levy', 'building', 'exam'] },
  paymentMethod: { type: 'string', enum: ['Cash', 'Bank Transfer', 'Ecocash'] },
  amount: { type: 'number' },
  currency: { type: 'string', enum: ['USD', 'ZWG'] },
  amountInUSD: { type: 'number' },
  date: { type: 'string', format: 'date-time' },
  bankAccountId: { type: 'string' },
  depositAccountId: { type: 'string' },
  deposited: { type: 'boolean' },
  recordedById: { type: 'string' },
  recordedBy: { type: 'string' }
};

// Transaction schema properties
export const transactionSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  date: { type: 'string', format: 'date-time' },
  bankAccountId: { type: 'string' },
  type: { type: 'string', enum: ['incoming', 'outgoing'] },
  description: { type: 'string' },
  amount: { type: 'number' },
  currency: { type: 'string', enum: ['USD', 'ZWG'] },
  originalAmount: { type: 'number' },
  relatedPaymentId: { type: 'string' },
  recordedById: { type: 'string' },
  recordedBy: { type: 'string' },
  category: { type: 'string' }
};

// Note schema properties
export const noteSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  description: { type: 'string' },
  authorName: { type: 'string' },
  createdAt: { type: 'string', format: 'date-time' },
  authorId: { type: 'string' }
};

// Settings schema properties
export const settingSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  rate: { type: 'number' },
  lastUpdated: { type: 'string', format: 'date-time' }
};

// User schema properties
export const userSchemaProperties = {
  id: { type: 'string', maxLength: 100 },
  email: { type: 'string' },
  displayName: { type: 'string' },
  passwordHash: { type: 'string' },
  salt: { type: 'string' },
  createdAt: { type: 'string', format: 'date-time' }
};