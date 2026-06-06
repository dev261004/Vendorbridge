-- Restrict RFQ creation and management to procurement officers only.
-- Admins keep RFQ visibility through the existing select policies, but cannot
-- create, edit, publish, close, assign vendors, or add RFQ attachment records.

drop policy if exists "Procurement users can manage rfqs" on public.rfqs;
create policy "Procurement users can manage rfqs"
  on public.rfqs for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );

drop policy if exists "Procurement users can manage rfq items" on public.rfq_items;
create policy "Procurement users can manage rfq items"
  on public.rfq_items for all
  to authenticated
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  )
  with check (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.organization_id = public.current_user_organization_id()
        and public.current_user_role() = 'procurement_officer'
    )
  );

drop policy if exists "Procurement users can manage invitations" on public.rfq_vendor_invitations;
create policy "Procurement users can manage invitations"
  on public.rfq_vendor_invitations for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );

drop policy if exists "Procurement users can manage rfq attachments" on public.rfq_attachments;
create policy "Procurement users can manage rfq attachments"
  on public.rfq_attachments for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );
