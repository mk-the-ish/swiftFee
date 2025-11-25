'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/db/local-service';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount (simple session persistence)
  useEffect(() => {
    const storedUser = localStorage.getItem('swiftfee_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user');
        localStorage.removeItem('swiftfee_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      // 1. Find user by email
      const userDoc = db.collection('users').findOne('email', email);
      
      if (!userDoc) {
        throw new Error('Invalid email or password');
      }

      // 2. Verify password
      const isValid = verifyPassword(password, userDoc.passwordHash, userDoc.salt);
      
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // 3. Set session
      const userData: User = {
        id: userDoc.id,
        email: userDoc.email,
        displayName: userDoc.displayName,
      };
      
      setUser(userData);
      localStorage.setItem('swiftfee_user', JSON.stringify(userData));

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      // 1. Check if user exists
      const existingUser = db.collection('users').findOne('email', email);
      if (existingUser) {
        throw new Error('User already exists with this email.');
      }

      // 2. Hash password
      const { hash, salt } = hashPassword(password);

      // 3. Create user
      const userId = uuidv4();
      const newUser = {
        id: userId,
        email,
        displayName,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
      };

      await db.collection('users').doc(userId).set(newUser);

      // 4. Auto sign-in
      const userData: User = {
        id: userId,
        email,
        displayName,
      };
      
      setUser(userData);
      localStorage.setItem('swiftfee_user', JSON.stringify(userData));

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('swiftfee_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}