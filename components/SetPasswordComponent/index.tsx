'use client';
import React, { useContext, useState } from 'react'
import { Input_Component } from '../Input_Component';
import axios from 'axios';
import { AuthContext } from '@/context';
import { toast } from 'react-toastify';
import { signOut } from '@/actions/supabase_auth/action';
import { useRouter } from 'next/navigation';
const SetPasswordComponent = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { userProfile } = useContext(AuthContext);


  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post('/api/admin/users/change-password', { id: userProfile.id, password });
      toast.success("Password has been changed!, please login again");
      await signOut()
      await router.replace('/login')
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Error: ${error?.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className='w-full h-screen flex justify-center items-center'>

      <div className='w-[500px] px-4 py-5 bg-white rounded-md min-h-[200px]'>
        <h1 className='mb-3 text-xl font-bold text-center text-slate-900'>Change Password</h1>
        <div className=' h-[200px] flex flex-col justify-center'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            {error && <p className='text-red-600'>{error}</p>}

            <Input_Component
              label='Password'
              value={password}
              passwordEye
              placeholder="Password"
              border="border-[1px] border-gray-300 rounded-md"
              onChange={(e: any) => setPassword(e)}
            />

            <button
              type="submit"
              className="bg-black border-2 border-black text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:border-gray-400 col-span-3 w-full"
            >Set Password
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default SetPasswordComponent
