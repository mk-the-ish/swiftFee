'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/hooks';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import { Logo } from '@/components/icons';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function LoginPageContent() {
    const { user, loading, signInWithEmail, createUserWithEmail } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: userData } = useDoc<User>(
        user?.uid && firestore ? doc(firestore, 'users', user.uid) : null
    );

    useEffect(() => {
        if (!loading && user) {
            if (userData) {
                // User document exists, proceed with normal flow
                if (userData.role === 'system_admin') {
                    router.push('/multi/dashboard');
                } else if (userData.schoolIds.length > 1) {
                    router.push('/select-school');
                } else {
                    router.push('/dashboard');
                }
            } else {
                // No user document found - create a default one for testing
                if (firestore) {
                    setDoc(doc(firestore, 'users', user.uid), {
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.email?.split('@')[0] || 'User',
                        role: user.email === 'admin@swiftfee.com' ? 'system_admin' :
                              user.email === 'schooladmin@swiftfee.com' ? 'school_admin' : 'teacher',
                        schoolIds: user.email === 'admin@swiftfee.com' ? ['R9qIAQsQUfWOfOPivv2L', 'kmFuyCd2JPSmuyfwumJH'] :
                                   user.email === 'schooladmin@swiftfee.com' ? ['R9qIAQsQUfWOfOPivv2L'] : [],
                        defaultSchoolId: user.email === 'admin@swiftfee.com' ? 'R9qIAQsQUfWOfOPivv2L' :
                                        user.email === 'schooladmin@swiftfee.com' ? 'R9qIAQsQUfWOfOPivv2L' : null,
                        createdAt: new Date().toISOString(),
                    }).then(() => {
                        // After creating user document, redirect appropriately
                        const role = user.email === 'admin@swiftfee.com' ? 'system_admin' :
                                    user.email === 'schooladmin@swiftfee.com' ? 'school_admin' : 'teacher';
                        if (role === 'system_admin') {
                            router.push('/multi/dashboard');
                        } else if (role === 'school_admin') {
                            router.push('/dashboard');
                        } else {
                            router.push('/dashboard');
                        }
                    }).catch((error) => {
                        console.error('Error creating user document:', error);
                        router.push('/setup-accounts');
                    });
                } else {
                    router.push('/setup-accounts');
                }
            }
        }
    }, [user, loading, userData, router, firestore]);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmail(email, password);
                // Create user document in Firestore
                if (firestore && userCredential.user) {
                    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
                        uid: userCredential.user.uid,
                        email: email,
                        displayName: email.split('@')[0], // Use email prefix as display name
                        role: 'teacher', // Default role, can be changed by admin
                        schoolIds: [], // Empty by default, assigned by admin
                        defaultSchoolId: null,
                        createdAt: new Date().toISOString(),
                    });
                }
                toast({ title: 'Account Created', description: 'Account created successfully! You can now log in.' });
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error: any) {
            console.error('Authentication failed:', error);
            setError(error.message || 'An unexpected error occurred.');
        }
    };
    
    if (loading || user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <form onSubmit={handleAuthAction}>
                    <CardHeader className="text-center">
                        <div className="mb-4 flex justify-center">
                            <Logo className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
                        <CardDescription>Enter your credentials to {isSignUp ? 'sign up' : 'sign in'}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                         {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="text-sm"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <FirebaseClientProvider>
            <LoginPageContent />
        </FirebaseClientProvider>
    )
}
