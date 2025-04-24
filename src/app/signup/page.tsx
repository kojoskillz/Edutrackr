'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const success = signup(form.username, form.password)
    if (success) {
      router.push('/dashboard')
    } else {
      alert('Username already exists.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-4 relative">
      {/* Background with Animated Education Icons */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        {/* Pencil Icon */}
        <div className="absolute top-1/4 left-1/4 animate-floating-icons">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white w-12 h-12 animate-bounce"
          >
            <path d="M12 0C8.686 0 6 2.686 6 6c0 3.313 2.686 6 6 6s6-2.687 6-6c0-3.314-2.686-6-6-6zM12 10c-2.211 0-4-1.79-4-4 0-2.209 1.789-4 4-4s4 1.791 4 4c0 2.21-1.789 4-4 4z" />
          </svg>
        </div>
        {/* Book Icon */}
        <div className="absolute top-1/2 right-1/4 animate-floating-icons">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white w-12 h-12 animate-ping"
          >
            <path d="M12 0C8.686 0 6 2.686 6 6c0 3.313 2.686 6 6 6s6-2.687 6-6c0-3.314-2.686-6-6-6zM12 10c-2.211 0-4-1.79-4-4 0-2.209 1.789-4 4-4s4 1.791 4 4c0 2.21-1.789 4-4 4z" />
          </svg>
        </div>
        {/* Graduation Cap Icon */}
        <div className="absolute bottom-1/4 left-1/4 animate-floating-icons">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white w-12 h-12 animate-bounce"
          >
            <path d="M22 9.172l-10-5.86-10 5.86V20h4v-6h12v6h4V9.172z" />
          </svg>
        </div>
        {/* Pencil Icon */}
        <div className="absolute bottom-1/2 right-1/4 animate-floating-icons">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white w-12 h-12 animate-ping"
          >
            <path d="M21 11V3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v3.172l1.586-1.586a2 2 0 1 1 2.828 2.828L12.828 8H19a1 1 0 0 0 1-1V3h-7v7h7a1 1 0 0 0 1-1V8h-2.828L12 6l-5.828 5.828L7 12h7z" />
          </svg>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-5 z-10 relative"
      >
        <h2 className="text-3xl font-bold text-center text-blue-800">
          Create Your Account
        </h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          Sign up to access your student dashboard
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
          className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
        >
          Sign Up
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <span
            onClick={() => router.push('/login')}
            className="text-blue-200 underline cursor-pointer"
          >
            Log in
          </span>
        </p>
      </form>
    </div>
  )
}
