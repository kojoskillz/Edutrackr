// 'use client'

// import { useState } from 'react';
// import { sendPasswordResetEmail } from 'firebase/auth';
// import { auth } from '@/app/Authentication-firebase/config';
// import Link from 'next/link';

// export default function ResetPasswordPage() {
//   const [email, setEmail] = useState('');
//   const [message, setMessage] = useState('');

//   const handleResetPassword = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!email) {
//       alert('Please enter your email');
//       return;
//     }

//     try {
//       await sendPasswordResetEmail(auth, email);
//       setMessage('Password reset email sent! Check your inbox.');
//       setEmail('');
//     } catch (error: unknown) {
//       console.error('Error sending password reset email:', error);
//       setMessage((error as Error).message);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-4 relative">
//       <form
//         onSubmit={handleResetPassword}
//         className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-5 z-10 relative"
//       >
//         <h2 className="text-3xl font-bold text-center text-blue-800">
//           Reset Password
//         </h2>
//         <p className="text-center text-gray-500 text-sm mb-4">
//           Enter your email to receive password reset instructions.
//         </p>

//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />

//         <button
//           type="submit"
//           className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
//         >
//           Send Reset Link
//         </button>

//         {message && (
//           <p className="text-center text-sm text-green-600">{message}</p>
//         )}

//         <p className="text-center text-sm text-gray-500">
//           Remembered your password?{' '}
//           <Link href="./login">
//             <span className="text-blue-500 underline cursor-pointer">
//                Login
//             </span>
//           </Link>
//         </p>
//       </form>
//     </div>
//   );
// }
