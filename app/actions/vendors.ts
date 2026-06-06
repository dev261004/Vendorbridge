'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getVendors() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createVendor(vendorData: {
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert([
      {
        ...vendorData,
        user_id: user.id,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('vendors')
  return data[0]
}

export async function updateVendor(
  id: string,
  vendorData: Partial<{
    name: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    rating: number
    status: string
  }>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('vendors')
    .update({
      ...vendorData,
      updated_at: new Date(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    throw error
  }

  revalidateTag('vendors')
  return data[0]
}

export async function deleteVendor(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }

  revalidateTag('vendors')
}
