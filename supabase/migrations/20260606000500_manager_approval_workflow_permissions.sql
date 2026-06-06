-- Align approval workflow permissions with the hackathon role matrix:
-- Procurement officers initiate approval after comparing quotations.
-- Managers approve/reject approval requests.
-- Admins and vendors cannot manage approval workflows.

drop policy if exists "Internal users can view approval requests" on public.approval_requests;
drop policy if exists "Procurement and managers can manage approval requests" on public.approval_requests;

create policy "Procurement officers and managers can view approval requests"
  on public.approval_requests for select
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('procurement_officer', 'manager')
  );

create policy "Procurement officers can create approval requests"
  on public.approval_requests for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
  );

create policy "Managers can resolve approval requests"
  on public.approval_requests for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
    and status in ('pending', 'approved', 'rejected')
  );

drop policy if exists "Internal users can view approval steps" on public.approval_steps;
drop policy if exists "Approvers can update assigned approval steps" on public.approval_steps;
drop policy if exists "Procurement users can create approval steps" on public.approval_steps;

create policy "Procurement officers and managers can view approval steps"
  on public.approval_steps for select
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('procurement_officer', 'manager')
  );

create policy "Procurement officers can create manager approval steps"
  on public.approval_steps for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
    and approver_role = 'manager'
  );

create policy "Managers can resolve assigned approval steps"
  on public.approval_steps for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
    and (
      approver_role = 'manager'
      or approver_id = auth.uid()
    )
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
    and (
      approver_role = 'manager'
      or approver_id = auth.uid()
    )
    and status in ('pending', 'approved', 'rejected')
  );

drop policy if exists "Procurement officers can move quotations into approval review" on public.quotations;
create policy "Procurement officers can move quotations into approval review"
  on public.quotations for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
    and status in ('submitted', 'under_review')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'procurement_officer'
    and status = 'under_review'
  );

drop policy if exists "Managers can resolve approval-linked quotations" on public.quotations;
create policy "Managers can resolve approval-linked quotations"
  on public.quotations for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
    and exists (
      select 1
      from public.approval_requests ar
      where ar.quotation_id = quotations.id
        and ar.organization_id = public.current_user_organization_id()
    )
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() = 'manager'
    and status in ('accepted', 'rejected')
    and exists (
      select 1
      from public.approval_requests ar
      where ar.quotation_id = quotations.id
        and ar.organization_id = public.current_user_organization_id()
    )
  );
