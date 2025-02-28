'use client'
import { Image404 } from '@/assets/images'
import Image from 'next/image'
import React from 'react'

const page = () => {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-100 p-4">
      <div className="px-3 h-full flex items-center justify-center">
        <Image onClick={() => window.location.href = '/'}    src={Image404} alt="404 Image" className="max-w-full h-auto cursor-pointer" />
      </div>
    </div>
  )
}

export default page
