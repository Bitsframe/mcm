'use server'
import  { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

const allowedLocales = new Set(['en', 'es'])

export async function login(formData: FormData) {
  const supabase = createClient()

  const localeRaw = (formData.get('locale') as string) || 'en'
  const locale = allowedLocales.has(localeRaw) ? localeRaw : 'en'

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message, error.status)
    
    // Provide more specific error messages
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password' }
    } else if (error.message.includes('Email not confirmed')) {
      return { error: 'Please check your email and confirm your account' }
    } else if (error.message.includes('Too many requests')) {
      return { error: 'Too many login attempts. Please try again later' }
    } else {
      return { error: error.message }
    }

    // redirect(`/login?error_message=${error.message}`)
  }

  // revalidatePath('/', 'layout')

  redirect(`/${locale}`)
}




export async function signOut() {
  try {
    const supabase = createClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    }

    // Redirect to login (NEXT_REDIRECT is normal Next.js behavior)
    redirect('/login');
  } catch (error) {
    // If error is NEXT_REDIRECT, it's expected behavior - let it propagate
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error during sign out:', error);
    redirect('/login');
  }
}