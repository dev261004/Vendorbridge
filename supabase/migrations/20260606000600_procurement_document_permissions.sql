-- Match the hackathon role matrix for official procurement documents.
-- Procurement officers generate/update POs and invoices; admins can view analytics
-- but should not manage procurement documents.

drop policy if exists "Procurement users can manage purchase orders" on public.purchase_orders;
create policy "Procurement users can manage purchase orders"
  on public.purchase_orders for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );

drop policy if exists "Procurement users can manage purchase order items" on public.purchase_order_items;
create policy "Procurement users can manage purchase order items"
  on public.purchase_order_items for all
  to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_items.purchase_order_id
        and po.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_items.purchase_order_id
        and po.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  );

drop policy if exists "Procurement users can manage invoices" on public.invoices;
create policy "Procurement users can manage invoices"
  on public.invoices for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );

drop policy if exists "Procurement users can manage invoice items" on public.invoice_items;
create policy "Procurement users can manage invoice items"
  on public.invoice_items for all
  to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  );
