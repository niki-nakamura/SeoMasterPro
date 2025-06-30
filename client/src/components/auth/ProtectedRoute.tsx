import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth in development if Supabase not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setUser({ id: 'dev-user', email: 'dev@example.com' } as User);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in with GitHub to access this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSignIn} 
              className="w-full"
              size="lg"
            >
              Sign in with GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* User menu in top right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
          <img 
            src={user.user_metadata?.avatar_url} 
            alt={user.user_metadata?.full_name || 'User'} 
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium">
            {user.user_metadata?.full_name || user.email}
          </span>
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}