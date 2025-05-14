'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function LoginPage() {
  const auth = useAuth()
  if (!auth) {
    throw new Error('AuthContext is not initialized. Ensure you are wrapping your component tree with AuthProvider.')
  }
  const { login } = auth
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const success = login(form.username, form.password)
    if (success) {
      router.push('/dashboard')
    } else {
      // In a real application, you'd want a more user-friendly error display
      // than alert(), like a state variable that shows an error message on the page.
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-4 relative">
      {/* Background with Animated Education Icons */}
      {/* Added Tailwind keyframes for floating icons */}
      <style jsx>{`
        @keyframes floating-icons {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-floating-icons {
          animation: floating-icons 6s ease-in-out infinite;
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        {/* Pencil Icon */}
        <div className="absolute top-1/4 left-1/4 animate-floating-icons" style={{ animationDelay: '0s' }}>
          {/* Replaced placeholder SVG paths with actual pencil icon path */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white w-12 h-12 animate-bounce"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        {/* Book Icon */}
        <div className="absolute top-1/2 right-1/4 animate-floating-icons" style={{ animationDelay: '2s' }}>
          {/* Replaced placeholder SVG paths with actual book icon path */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white w-12 h-12 animate-ping"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        {/* Graduation Cap Icon */}
        <div className="absolute bottom-1/4 left-1/4 animate-floating-icons" style={{ animationDelay: '4s' }}>
           {/* Replaced placeholder SVG paths with actual graduation cap icon path */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white w-12 h-12 animate-bounce"
          >
            <path d="M21.42 10.98l-6.17-6.17a6.41 6.41 0 0 0-9.09 0L2.58 10.98A6.41 6.41 0 0 0 0 15.58v.84a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5v-.84a6.41 6.41 0 0 0-2.58-4.6z" />
            <path d="M10 12.5v6" />
             <path d="M14 12.5v6" />
             <path d="M12 18.5v1.5" />
          </svg>
        </div>
        {/* Another Pencil Icon */}
        <div className="absolute bottom-1/2 right-1/4 animate-floating-icons" style={{ animationDelay: '6s' }}>
           {/* Replaced placeholder SVG paths with actual pencil icon path */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white w-12 h-12 animate-ping"
          >
             <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
      </div>

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
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '} {/* Corrected: Escaped the apostrophe */}
          <span
            onClick={() => router.push('/signup')}
            className="text-blue-700 hover:underline cursor-pointer" // Changed text color for better contrast
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  )
}
