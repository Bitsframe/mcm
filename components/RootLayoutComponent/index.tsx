'use client';
import { AuthContext } from '@/context';
import { CircularProgress } from '@mui/material';
import React, { useContext } from 'react';
import { Navbar } from '../Navbar';

const RootLayoutComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { checkingAuth, initialAuthCheckError } = useContext(AuthContext);

  return (
    checkingAuth ? (
      <div className='h-screen w-full grid place-items-center'>
        <CircularProgress />
      </div>
    ) : initialAuthCheckError ? (
      <div className='h-screen w-full grid place-items-center'>
        <h1 className='text-red-600 text-xl'>
          {initialAuthCheckError}
        </h1>
      </div>
    ) : (
      <div className={`relative flex h-screen`}>
        <section className="flex flex-col flex-grow">
          <Navbar width='233px' />

          <section
            className="flex-grow p-4 bg-gray-50"
            style={{ minHeight: "100vh" }}
          >
            {children}
          </section>
        </section>
      </div>
    )
  );
};

export default RootLayoutComponent;