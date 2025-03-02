'use client'
import Link from 'next/link'
import { Logo } from '@/assets/images'
import { Button } from '@/components/ui/button'
import Notf from "@/public/assets/Notf.png"
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import React from 'react'

const Page = () => {
  return (
    <div className='bg-[#E1EAF2] text-center flex flex-col items-center justify-center min-h-screen relative'>
      <div>
        <Image src={Logo} alt="Logo" className="w-48 opacity-90 mx-auto" />
      </div>

      <div className='text-4xl font-semibold px-4'>
        Oops! Looks like this page needs a check-up. Let's get you back on track!
      </div>

      <div className='relative font-extrabold text-[300px] text-[#C8D2D8] leading-none'>
        4
        <span className="relative inline-block w-[180px] h-[180px] md:w-[220px] md:h-[220px]">
          <span className="absolute inset-0 flex items-center justify-center text-[#C8D2D8] z-0">
            0
          </span>
          <Image 
            src={Notf} 
            alt="Zero Icon" 
            layout="fill" 
            objectFit="contain"
            className="absolute inset-0 z-10"
          />
        </span>
        4
      </div>

      <div className="flex items-center gap-4 mt-4">
        <Link href="/" passHref>
          <Button className='bg-[#C8D2D8] text-black border-2 border-black rounded-full transition-colors duration-300 hover:bg-[#C8D2D8] hover:text-black flex items-center gap-2'>
            <ArrowLeft size={20} />
            Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Page
