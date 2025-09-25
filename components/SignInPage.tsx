import React from 'react';
import { LoadingIcon } from './Icons';

declare const puter: any;

interface SignInPageProps {
  onSignIn: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignIn }) => {
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    if (typeof puter === 'undefined' || !puter.auth) {
        setError('Puter SDK not available. Cannot sign in.');
        setIsSigningIn(false);
        return;
    }
    try {
      await puter.auth.signIn();
      onSignIn();
    } catch (err: any) {
      console.error("Sign in failed:", err);
      if (err.message && !err.message.toLowerCase().includes('user cancelled')) {
        setError(err.message || 'An unknown error occurred during sign-in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-theme-bg p-4">
      <div className="w-full max-w-sm text-center bg-theme-surface backdrop-blur-2xl border border-theme-border rounded-4xl p-8 shadow-2xl animate-blur-in">
        <h1 className="text-3xl font-bold text-theme-text mb-2">Welcome to PiChat</h1>
        <p className="text-theme-text-secondary mb-6">Sign in with your Puter account to continue.</p>
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:bg-gray-400 disabled:shadow-none"
        >
          {isSigningIn ? <LoadingIcon className="w-5 h-5" /> : null}
          {isSigningIn ? 'Signing In...' : 'Sign in with Puter'}
        </button>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
};
