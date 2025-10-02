'use client';

import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a development-only component to surface Firestore permission errors
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(
        'Firestore Permission Error:',
        error.toString()
      );
      // In a real app, you might use a toast or other UI element to show this
      toast({
        variant: 'destructive',
        title: 'Firestore Permission Error',
        description: error.message,
        duration: 20000,
      });
      
      // We re-throw the error here so that Next.js Development Overlay can pick it up
      // and show the rich error context.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
