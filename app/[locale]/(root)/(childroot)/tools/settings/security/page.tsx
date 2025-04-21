"use client";

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Security = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    retypePassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    retypePassword: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'newPassword' | 'retypePassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your password change logic here
  };

  return (
    <div className="h-[80dvh] bg-background dark:bg-gray-900">
      <div className="bg-white dark:bg-[#0E1725] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-3 border-b dark:border-gray-700">
          <h1 className="text-base font-medium text-gray-900 dark:text-white">
            Security
          </h1>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Change Password
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handleChange}
                      className="w-full p-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded bg-[#f1f4f7] dark:bg-gray-800 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400"
                      onClick={() => togglePasswordVisibility('newPassword')}
                    >
                      {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Retype New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.retypePassword ? "text" : "password"}
                      name="retypePassword"
                      value={passwords.retypePassword}
                      onChange={handleChange}
                      className="w-full p-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded bg-[#f1f4f7] dark:bg-gray-800 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-gray-500 dark:text-gray-400"
                      onClick={() => togglePasswordVisibility('retypePassword')}
                    >
                      {showPassword.retypePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start mt-72">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  className="px-6 py-2 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                >
                  Reset
                </button>
                <Button 
                  type="submit"
                  className="bg-[#0066FF] hover:bg-blue-600 px-5 text-sm rounded-lg"
                >
                  Update
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Security;