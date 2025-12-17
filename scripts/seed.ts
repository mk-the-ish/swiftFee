import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample schools
    const schoolsRef = collection(db, 'schools');

    const school1 = await addDoc(schoolsRef, {
      name: 'Prim-Makomo Primary School',
      address: '123 Main St, Harare',
      contactInfo: 'info@primmakomo.edu',
      createdAt: new Date().toISOString(),
    });
    console.log('Created school 1:', school1.id);

    const school2 = await addDoc(schoolsRef, {
      name: 'Highlands Secondary School',
      address: '456 Oak Ave, Bulawayo',
      contactInfo: 'admin@highlands.edu',
      createdAt: new Date().toISOString(),
    });
    console.log('Created school 2:', school2.id);

    console.log('Sample schools created. Now go to /setup-accounts to create test user accounts.');

    // Seed some sample data for school 1
    const studentsRef = collection(db, 'schools', school1.id, 'students');
    const sampleStudents = [
      {
        id: 'MP2025070101',
        name: 'John Doe',
        grade: '1',
        class: 'blue',
        dateOfBirth: '2018-01-01',
        gender: 'Male',
        guardianName: 'Jane Doe',
        guardianPhone: '+263123456789',
        address: '123 Student St',
        status: 'active',
        tuitionOwing: 100,
        levyOwing: 50,
        buildingFundOwing: 25,
      },
      {
        id: 'MP2025070102',
        name: 'Jane Smith',
        grade: '2',
        class: 'green',
        dateOfBirth: '2017-02-02',
        gender: 'Female',
        guardianName: 'Bob Smith',
        guardianPhone: '+263987654321',
        address: '456 Student Ave',
        status: 'active',
        tuitionOwing: 120,
        levyOwing: 60,
        buildingFundOwing: 30,
      },
    ];

    for (const student of sampleStudents) {
      await setDoc(doc(studentsRef, student.id), student);
    }
    console.log('Created sample students');

    // Seed bank accounts
    const bankAccountsRef = collection(db, 'schools', school1.id, 'bankAccounts');
    await addDoc(bankAccountsRef, {
      bankName: 'ZB Bank',
      branch: 'Harare Main',
      accountNumber: '1234567890',
      currency: 'USD',
    });
    console.log('Created sample bank account');

    // Set exchange rate
    const exchangeRateRef = doc(db, 'settings', 'exchangeRate');
    // await setDoc(exchangeRateRef, {
    //   rate: 25.5,
    //   lastUpdated: new Date().toISOString(),
    // });
    // console.log('Set exchange rate');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();