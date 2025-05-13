'use server'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }

    // redirect(`/login?error_message=${error.message}`)
  }

  // revalidatePath('/', 'layout')

  return redirect('/')
}




export async function signOut() {
  try {
    const supabase = createClient();


    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      }
    }

    await supabase.auth.refreshSession();
    
    const loginUrl = `/login?t=${Date.now()}`;
    return redirect(loginUrl);
  } catch (error) {
    console.error('Error during sign out:', error);
    return redirect('/login');
  }
}