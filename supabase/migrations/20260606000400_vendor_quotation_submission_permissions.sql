-- Enforce the quotation role matrix:
-- Vendors can create and edit their own draft/submitted quotations.
-- Procurement officers can view non-draft quotations for comparison.
-- Admins and managers cannot submit or compare quotations through this module.

drop policy if exists "Internal users and own vendors can view quotations" on public.quotations;
create policy "Internal users and own vendors can view quotations"
  on public.quotations for select
  to authenticated
  using (
    (
      organization_id = public.current_user_organization_id()
      and public.current_user_role() = 'procurement_officer'
      and status <> 'draft'
    )
    or (
      organization_id = public.current_user_organization_id()
      and public.current_user_role() = 'manager'
      and exists (
        select 1 from public.approval_requests ar
        where ar.quotation_id = quotations.id
      )
    )
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Visible quotation items can be selected" on public.quotation_items;
create policy "Visible quotation items can be selected"
  on public.quotation_items for select
  to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and (
          (
            q.organization_id = public.current_user_organization_id()
            and public.current_user_role() = 'procurement_officer'
            and q.status <> 'draft'
          )
          or (
            q.organization_id = public.current_user_organization_id()
            and public.current_user_role() = 'manager'
            and exists (
              select 1 from public.approval_requests ar
              where ar.quotation_id = q.id
            )
          )
          or q.vendor_id = public.current_user_vendor_id()
        )
    )
  );

drop policy if exists "Vendors and internal users can manage quotations" on public.quotations;
drop policy if exists "Vendors can create own quotations" on public.quotations;
create policy "Vendors can create own quotations"
  on public.quotations for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and vendor_id = public.current_user_vendor_id()
    and public.current_user_role() = 'vendor'
    and status in ('draft', 'submitted')
  );

drop policy if exists "Vendors can update own editable quotations" on public.quotations;
create policy "Vendors can update own editable quotations"
  on public.quotations for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and vendor_id = public.current_user_vendor_id()
    and public.current_user_role() = 'vendor'
    and status in ('draft', 'submitted')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and vendor_id = public.current_user_vendor_id()
    and public.current_user_role() = 'vendor'
    and status in ('draft', 'submitted')
  );

drop policy if exists "Quotation owners can manage quotation items" on public.quotation_items;
drop policy if exists "Vendors can manage own editable quotation items" on public.quotation_items;
create policy "Vendors can manage own editable quotation items"
  on public.quotation_items for all
  to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_user_organization_id()
        and q.vendor_id = public.current_user_vendor_id()
        and public.current_user_role() = 'vendor'
        and q.status in ('draft', 'submitted')
    )
  )
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and q.organization_id = public.current_user_organization_id()
        and q.vendor_id = public.current_user_vendor_id()
        and public.current_user_role() = 'vendor'
        and q.status in ('draft', 'submitted')
    )
  );
