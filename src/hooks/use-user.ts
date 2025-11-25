import { useAuth } from '@/context/auth-context';

// This hook mimics the API of your previous Firebase hook
// so you don't have to refactor every page.
export function useUser() {
  const { user, loading, signIn, signUp, signOut, error } = useAuth();

  return {
    user,
    loading,
    // Map new auth functions to what might have been expected
    signInWithEmail: signIn,
    createUserWithEmail: signUp,
    signOut,
    error
  };
}