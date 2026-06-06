-- Restrict vendor management to admins only.
-- Procurement officers can still view organization vendors for RFQ assignment.

drop policy if exists "Procurement users can manage vendors" on public.vendors;
drop policy if exists "Admins can manage vendors" on public.vendors;

create policy "Admins can manage vendors"
  on public.vendors for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'admin'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'admin'
  );
