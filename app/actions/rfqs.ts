'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getRFQs() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getRFQById(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createRFQ(rfqData: {
  title: string
  description: string
  estimated_budget?: number
  due_date: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('rfqs')
    .insert([
      {
        ...rfqData,
        user_id: user.id,
        status: 'draft',
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('rfqs')
  return data[0]
}

export async function updateRFQ(
  id: string,
  rfqData: Partial<{
    title: string
    description: string
    estimated_budget: number
    due_date: string
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
    .from('rfqs')
    .update({
      ...rfqData,
      updated_at: new Date(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    throw error
  }

  revalidateTag('rfqs')
  return data[0]
}

export async function deleteRFQ(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('rfqs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }

  revalidateTag('rfqs')
}

export async function addRFQItem(rfqId: string, item: {
  item_name: string
  quantity: number
  unit: string
  estimated_unit_price?: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rfq_items')
    .insert([
      {
        rfq_id: rfqId,
        ...item,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('rfqs')
  return data[0]
}

export async function getRFQItems(rfqId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rfq_items')
    .select('*')
    .eq('rfq_id', rfqId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
