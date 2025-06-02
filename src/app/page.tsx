import React from 'react';
import Image from "next/image";
import Link from 'next/link';

const Homepage = () => {
  return (
    <>
      <div className="grid m-auto items-center place-content-center min-h-screen bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 px-4 py-10 overflow-hidden">

        {/* Main Container */}
        <div className="bg-white shadow-2xl rounded-3xl w-full max-w-6xl grid place-content-center p-10">

          <div className="flex flex-col md:flex-row items-center justify-between">

            {/* Text and Button Section */}
            <div className="text-center md:text-left space-y-4 max-w-md mx-auto md:mx-0">
              <h1 className="text-5xl font-bold text-[#313ABC] leading-tight">
                EDUTRACK
              </h1>
              <h3 className="text-2xl font-semibold text-gray-700">
                School Management System
              </h3>

              <p className="text-lg text-gray-500 mb-6">
                A comprehensive platform for efficient school management, designed to streamline tasks and enhance learning.
              </p>

              <Link href="/Authentication-firebase/login">
                <button className="text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300 w-[12rem] h-[3rem] font-semibold rounded-full shadow-md transform hover:scale-105">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Image Section */}
            <div className="mt-10 md:mt-0">
              <Image
                src="/img1.png"
                width={500}
                height={500}
                alt="Edutrack illustration"
                className="object-cover h-[20rem] w-[20rem] md:h-[25rem] md:w-[25rem] rounded-lg "
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Homepage;
