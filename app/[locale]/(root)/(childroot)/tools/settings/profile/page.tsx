'use client';

import { Button } from "@/components/ui/button";
import Image from 'next/image';
import React, { useState, useRef, useContext, useEffect } from "react";
import { AuthContext } from "@/context";
import { toast } from "sonner";
import axios from "axios";
import { update_content_service } from "@/utils/supabase/data_services/data_services";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
interface UserData {
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
}

const Profile = () => {
  const { userProfile, userRole, setAuthState } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    email: '',
    role: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation(translationConstant.SETTINGS);
  useEffect(() => {
    if (userProfile) {
      setUserData({
        fullName: userProfile.full_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        email: userProfile.email || '',
        role: userRole || ''
      });
      
      if (userProfile.profile_pictures) {
        setProfileImage(userProfile.profile_pictures);
      }
    }
  }, [userProfile, userRole]);

  const handleImageClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;
  
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG/PNG/WEBP allowed');
      return;
    }
  
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('File too large (max 3MB)');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const token = localStorage.getItem('authToken') || '';
      
      const res = await fetch('/api/upload-profile', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }
  
      const data = await res.json();
      setUploadSuccess(true);
      setUserData(prev => ({
        ...prev,
        profileImage: data.url
      }));
  
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(
        error instanceof Error ? 
        error.message.replace('Error: ', '') : 
        'Upload failed. Please login again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use server-side endpoint to perform profile updates so RLS and auth are respected
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
          profileImage: userData.profileImage
        })
      });
      
      toast.success('Profile updated successfully');
      const userResponse = await axios.get('/api/user');
      const { role, permissions, locations, profile } = userResponse.data.data;
      setAuthState({
        checkingAuth: false,
        userProfile: profile,
        allowedLocations: locations,
        userRole: role,
        permissions: permissions,
        authError: null
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Profile update failed');
    }
  };

  const handleReset = () => {
    if (userProfile) {
      setUserData({
        fullName: userProfile.full_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        email: userProfile.email || '',
        role: userRole || '',
        profileImage: userProfile.profile_pictures || ''
      });
      setProfileImage(userProfile.profile_pictures || null);
    }
    setUploadError(null);
    setUploadSuccess(false);
    setSaveSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-background dark:bg-gray-900">
  <div className="sm:bg-white sm:dark:bg-[#0E1725] sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:shadow-sm sm:p-0 p-0 w-full sm:w-auto sm:mx-0 mx-0 flex sm:block justify-center items-start sm:justify-normal sm:items-stretch min-h-fit">
    <div className="w-full max-w-md mx-2 sm:mx-0 sm:max-w-none sm:w-auto bg-white dark:bg-[#0E1725] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm sm:rounded-lg sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:shadow-sm">
      <div className="p-4 border-b dark:border-gray-700">
        <h1 className="text-lg sm:text-base font-semibold text-gray-900 dark:text-white">{t("Settings_k4")}</h1>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-row items-center gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("Settings_k5")}
              </span>
              <div
                className="relative w-20 h-20 cursor-pointer rounded-full overflow-hidden"
                onClick={handleImageClick}
              >
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  {profileImage ? (
                    <>
                      <Image
                        src={profileImage}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-xs">{t("Settings_k16")}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
              {uploadError && (
                <p className="text-red-500 text-xs mt-1">{uploadError}</p>
              )}
              {uploadSuccess && (
                <p className="text-green-500 text-xs mt-1">{t("Settings_k22")}</p>
              )}
              {saveSuccess && (
                <p className="text-green-500 text-xs mt-1">{t("Settings_k23")}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleImageClick}
              disabled={isUploading}
              className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? t("Settings_k16") : t("Settings_k17")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                {t("Settings_k6")}
              </label>
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-[#f1f4f7] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                {t("Settings_k7")}
              </label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-[#f1f4f7] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                {t("Settings_k8")}
              </label>
              <input
                type="text"
                name="role"
                value={userData.role}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-start mt-6">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleReset}
                className="px-6 py-3 text-red-500 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
              >
                {t("Settings_k9")}
              </button>
              <Button 
                type="submit"
                className="bg-[#0066FF] hover:bg-blue-600 px-5 text-sm rounded-lg transition-colors"
                disabled={isUploading}
              >
                {t("Settings_k10")}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  </div>
</div>

  );
};

export default Profile;