'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getQuotations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('quotations')
    .select('*, rfqs(title), vendors(name)')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createQuotation(quotationData: {
  rfq_id: string
  vendor_id: string
  total_amount: number
  valid_until: string
  notes?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotations')
    .insert([quotationData])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('quotations', { expire: 0 })
  return data[0]
}

export async function updateQuotation(
  id: string,
  quotationData: Partial<{
    status: string
    total_amount: number
    valid_until: string
    notes: string
  }>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotations')
    .update({
      ...quotationData,
      updated_at: new Date(),
    })
    .eq('id', id)
    .select()

  if (error) {
    throw error
  }

  revalidateTag('quotations', { expire: 0 })
  return data[0]
}

export async function addQuotationItem(quotationId: string, item: {
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_items')
    .insert([
      {
        quotation_id: quotationId,
        ...item,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('quotations', { expire: 0 })
  return data[0]
}

export async function getQuotationItems(quotationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
