'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/supabaseClient'; // Make sure path is correct
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful:', data.user);
      setEmail('');
      setPassword('');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('Login failed:', error);
      alert('Login failed: ' + error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-5 z-10 relative"
      >
        <h2 className="text-3xl font-bold text-center text-blue-800">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          Login to your student dashboard
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
        >
          Login
        </button>

        <div className="text-center text-sm text-gray-600">
          Forgot your password?{' '}
          <Link href="./reset_password" className="text-blue-500 hover:underline">
            Reset here
          </Link>
        </div>
      </form>
    </div>
  );
}
