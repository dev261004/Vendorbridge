'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getPurchaseOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, vendors(name), quotations(total_amount)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getPurchaseOrderById(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createPurchaseOrder(poData: {
  quotation_id?: string
  vendor_id: string
  po_number: string
  total_amount: number
  delivery_date: string
  notes?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert([
      {
        ...poData,
        user_id: user.id,
        status: 'draft',
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('purchase-orders')
  return data[0]
}

export async function updatePurchaseOrder(
  id: string,
  poData: Partial<{
    status: string
    total_amount: number
    delivery_date: string
    notes: string
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
    .from('purchase_orders')
    .update({
      ...poData,
      updated_at: new Date(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    throw error
  }

  revalidateTag('purchase-orders')
  return data[0]
}

export async function addPOItem(poId: string, item: {
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('po_items')
    .insert([
      {
        po_id: poId,
        ...item,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('purchase-orders')
  return data[0]
}

export async function getPOItems(poId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('po_items')
    .select('*')
    .eq('po_id', poId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
