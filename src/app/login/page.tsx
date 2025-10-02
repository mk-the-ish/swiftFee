'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from '@/components/icons';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function LoginPageContent() {
    const { user, loading, signInWithGoogle } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Failed to sign in:', error);
            // You might want to show a toast message here
        }
    };
    
    if (loading || user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <Logo className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to SwiftFee Manager</CardTitle>
                    <CardDescription>Sign in to manage your school's finances.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in with Google'}
                    </Button>
                </CardContent>
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
