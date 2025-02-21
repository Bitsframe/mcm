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
    console.log("ERROR ->",error.message)

    // redirect(`/login?error_message=${error.message}`)
  }

  // revalidatePath('/', 'layout')

  return redirect('/')
}




export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error.message);

    // Redirect to a custom error page or login page with an error message
    return redirect(`/login?error_message=${error.message}`);
  }

  // Revalidate any paths if necessary (for example, layout or other pages)
  // revalidatePath('/', 'layout');

  // Redirect to the homepage or another page after successful sign out
  return redirect('/login');
}