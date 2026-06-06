'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getInvoices() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*, vendors(name), purchase_orders(po_number)')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createInvoice(invoiceData: {
  po_id: string
  vendor_id: string
  invoice_number: string
  total_amount: number
  due_date: string
  notes?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        ...invoiceData,
        status: 'pending',
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('invoices', { expire: 0 })
  return data[0]
}

export async function updateInvoice(
  id: string,
  invoiceData: Partial<{
    status: string
    total_amount: number
    due_date: string
    notes: string
  }>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...invoiceData,
      updated_at: new Date(),
    })
    .eq('id', id)
    .select()

  if (error) {
    throw error
  }

  revalidateTag('invoices', { expire: 0 })
  return data[0]
}

export async function addInvoiceItem(invoiceId: string, item: {
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoice_items')
    .insert([
      {
        invoice_id: invoiceId,
        ...item,
      },
    ])
    .select()

  if (error) {
    throw error
  }

  revalidateTag('invoices', { expire: 0 })
  return data[0]
}

export async function getInvoiceItems(invoiceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}
