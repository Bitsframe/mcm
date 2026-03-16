"use client";

import { Button } from '@/components/ui/button';
import React, { useContext, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { signOut } from '@/actions/supabase_auth/action';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
const passwordSchema = z.object({
  newPassword: z.string()
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one special character"),
  retypePassword: z.string()
});

const Security = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    retypePassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    retypePassword: false
  });

  const [errors, setErrors] = useState<{
    newPassword?: string;
    retypePassword?: string;
  }>({});

  const router = useRouter();
  const { userProfile } = useContext(AuthContext);
  const { t } = useTranslation(translationConstant.SETTINGS);

  const passwordRules = [
    {
      label: t("Settings_k19"),
      test: (val: string) => /[A-Z]/.test(val)
    },
    {
      label: t("Settings_k20"),
      test: (val: string) => /[0-9]/.test(val)
    },
    {
      label: t("Settings_k21"),
      test: (val: string) => /[^A-Za-z0-9]/.test(val)
    }
  ];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse(passwords);

    if (!result.success) {
      const formatted = result.error.format();
      setErrors({
        newPassword: formatted.newPassword?._errors?.[0],
      });
      toast.error(formatted.newPassword?._errors?.[0] || "Invalid input");
      return;
    }

    if (passwords.newPassword !== passwords.retypePassword) {
      setErrors({ retypePassword: "Passwords do not match" });
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axios.post('/api/admin/users/change-password', {
        id: userProfile.id,
        password: passwords.newPassword
      }, { withCredentials: true });

      await signOut();
      router.push('/login');
      toast.success("Password has been changed! Please login again.");
    } catch (error: any) {
      console.log("Error:", error);
      // toast.error("Something went wrong while changing the password");
    }
  };

  const handleReset = () => {
    setPasswords({
      newPassword: '',
      retypePassword: ''
    });
    setShowPassword({
      newPassword: false,
      retypePassword: false
    });
    setErrors({});
  };

  return (
    <div className="min-h-fit bg-background dark:bg-gray-900">
  <div className="bg-white dark:bg-[#0E1725] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="p-3 border-b dark:border-gray-700">
      <h1 className="text-base font-medium text-gray-900 dark:text-white">
        {t("Settings_k11")}
      </h1>
    </div>

    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {t("Settings_k12")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t("Settings_k14")}</label>
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
              <ul className="text-xs mt-2 space-y-1">
                {passwordRules.map((rule, idx) => {
                  const isValid = rule.test(passwords.newPassword);
                  return (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 ${
                        isValid ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">{t("Settings_k15")}</label>
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
              {errors.retypePassword && (
                <p className="text-xs text-red-500">{errors.retypePassword}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-start mt-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            >
              {t("Settings_k9")}
            </button>
            <Button
              type="submit"
              className="bg-[#0066FF] hover:bg-blue-600 px-5 text-sm rounded-lg"
            >
              {t("Settings_k17")}
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
