'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, Circle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setEmail(data.email);
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        toast.success('Password reset successfully!');
      } else {
        setError(data.error || 'Failed to reset password');
        setStatus('error');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(to bottom right, #e8f5ed, white, #d4f5f5)'}}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
          >
            <Circle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {status === 'valid' ? 'Enter your new password below' : 'Reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-8 h-8 animate-spin" style={{color: '#06402B'}} />
              <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Invalid or Expired Link</h3>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link href="/">
                <Button className="text-white" style={{backgroundColor: '#06402B'}}>
                  Back to App
                </Button>
              </Link>
            </div>
          )}

          {status === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  Create a new password for<br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full text-white" 
                style={{backgroundColor: '#06402B'}}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="text-center py-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{backgroundColor: '#c5e6d1'}}
              >
                <Check className="w-8 h-8" style={{color: '#06402B'}} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Password Reset!</h3>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link href="/">
                <Button className="text-white" style={{backgroundColor: '#06402B'}}>
                  Go to Login
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/">
                <Button variant="outline">
                  Back to App
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom right, #e8f5ed, white, #d4f5f5)'}}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{color: '#06402B'}} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
