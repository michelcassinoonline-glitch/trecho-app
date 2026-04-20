import { createClient } from './supabase-client'

export async function getSession() {
  const client = createClient()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInWithGoogle() {
  const client = createClient()
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getBaseURL()}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const client = createClient()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

function getBaseURL() {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:3000`
}
