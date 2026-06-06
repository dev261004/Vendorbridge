-- VendorBridge core ERP schema
-- Designed for Supabase Auth + RLS, no Prisma required.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum (
    'admin',
    'procurement_officer',
    'manager',
    'vendor',
    'finance'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.vendor_status as enum (
    'pending',
    'active',
    'blocked',
    'inactive'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.rfq_status as enum (
    'draft',
    'published',
    'closed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.rfq_invitation_status as enum (
    'invited',
    'viewed',
    'quoted',
    'declined'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quotation_status as enum (
    'draft',
    'submitted',
    'under_review',
    'selected',
    'accepted',
    'rejected',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_request_status as enum (
    'pending',
    'approved',
    'rejected',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_step_status as enum (
    'pending',
    'approved',
    'rejected',
    'skipped'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.purchase_order_status as enum (
    'generated',
    'sent',
    'acknowledged',
    'partial_delivery',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.invoice_status as enum (
    'draft',
    'pending_payment',
    'paid',
    'overdue',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gst_number text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text default 'India',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  role public.app_role not null default 'procurement_officer',
  first_name text,
  last_name text,
  phone text,
  country text,
  avatar_url text,
  additional_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'general',
  gst_number text,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text default 'India',
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  status public.vendor_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, gst_number)
);

alter table public.profiles
  add column if not exists vendor_id uuid references public.vendors(id) on delete set null;

create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_number text not null,
  title text not null,
  category text not null,
  description text,
  deadline date not null,
  status public.rfq_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rfq_number)
);

create table if not exists public.rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  estimated_unit_price numeric(14, 2) check (estimated_unit_price is null or estimated_unit_price >= 0),
  specifications text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rfq_vendor_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  status public.rfq_invitation_status not null default 'invited',
  invited_at timestamptz not null default now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  unique (rfq_id, vendor_id)
);

create table if not exists public.rfq_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'rfq-attachments',
  storage_path text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  quotation_number text not null,
  status public.quotation_status not null default 'draft',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  gst_percent numeric(5, 2) not null default 0 check (gst_percent >= 0),
  gst_amount numeric(14, 2) not null default 0 check (gst_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  delivery_days integer check (delivery_days is null or delivery_days >= 0),
  valid_until date,
  payment_terms text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, quotation_number),
  unique (rfq_id, vendor_id)
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  rfq_item_id uuid references public.rfq_items(id) on delete set null,
  item_name text not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  total_price numeric(14, 2) not null default 0 check (total_price >= 0),
  delivery_days integer check (delivery_days is null or delivery_days >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  status public.approval_request_status not null default 'pending',
  current_step integer not null default 1,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  final_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quotation_id)
);

create table if not exists public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references public.approval_requests(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  step_order integer not null,
  approver_id uuid references auth.users(id) on delete set null,
  approver_role public.app_role,
  status public.approval_step_status not null default 'pending',
  remarks text,
  action_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (approval_request_id, step_order)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rfq_id uuid references public.rfqs(id) on delete set null,
  quotation_id uuid references public.quotations(id) on delete set null,
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  po_number text not null,
  status public.purchase_order_status not null default 'generated',
  po_date date not null default current_date,
  delivery_date date,
  payment_terms text,
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  gst_amount numeric(14, 2) not null default 0 check (gst_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  notes text,
  generated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, po_number)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  quotation_item_id uuid references public.quotation_items(id) on delete set null,
  item_name text not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  total_price numeric(14, 2) not null default 0 check (total_price >= 0),
  received_quantity numeric(14, 2) not null default 0 check (received_quantity >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'pending_payment',
  invoice_date date not null default current_date,
  due_date date not null,
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  cgst_percent numeric(5, 2) not null default 0 check (cgst_percent >= 0),
  sgst_percent numeric(5, 2) not null default 0 check (sgst_percent >= 0),
  cgst_amount numeric(14, 2) not null default 0 check (cgst_amount >= 0),
  sgst_amount numeric(14, 2) not null default 0 check (sgst_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  pdf_bucket text default 'invoice-pdfs',
  pdf_path text,
  email_sent_to text,
  email_sent_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  purchase_order_item_id uuid references public.purchase_order_items(id) on delete set null,
  item_name text not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  total_price numeric(14, 2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_activity_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Activity logs are immutable';
end;
$$;

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_user_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.vendor_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_user_is_internal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'procurement_officer', 'manager', 'finance')
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  requested_role public.app_role;
  requested_vendor_id uuid;
begin
  requested_role :=
    case
      when new.raw_user_meta_data->>'role' in ('admin', 'procurement_officer', 'manager', 'vendor', 'finance')
        then (new.raw_user_meta_data->>'role')::public.app_role
      else 'procurement_officer'::public.app_role
    end;

  if nullif(new.raw_user_meta_data->>'organization_id', '') is not null then
    new_organization_id := (new.raw_user_meta_data->>'organization_id')::uuid;
  else
    insert into public.organizations (name, email, created_by)
    values (
      coalesce(nullif(new.raw_user_meta_data->>'organization_name', ''), split_part(new.email, '@', 1) || '''s Organization'),
      new.email,
      new.id
    )
    returning id into new_organization_id;
  end if;

  if nullif(new.raw_user_meta_data->>'vendor_id', '') is not null then
    requested_vendor_id := (new.raw_user_meta_data->>'vendor_id')::uuid;
  end if;

  insert into public.profiles (
    id,
    organization_id,
    role,
    vendor_id,
    first_name,
    last_name,
    phone,
    country,
    avatar_url,
    additional_info
  )
  values (
    new.id,
    new_organization_id,
    requested_role,
    requested_vendor_id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'additional_info'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

drop trigger if exists rfqs_set_updated_at on public.rfqs;
create trigger rfqs_set_updated_at
  before update on public.rfqs
  for each row execute function public.set_updated_at();

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

drop trigger if exists approval_requests_set_updated_at on public.approval_requests;
create trigger approval_requests_set_updated_at
  before update on public.approval_requests
  for each row execute function public.set_updated_at();

drop trigger if exists approval_steps_set_updated_at on public.approval_steps;
create trigger approval_steps_set_updated_at
  before update on public.approval_steps
  for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at
  before update on public.purchase_orders
  for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists activity_logs_prevent_update on public.activity_logs;
create trigger activity_logs_prevent_update
  before update on public.activity_logs
  for each row execute function public.prevent_activity_log_mutation();

drop trigger if exists activity_logs_prevent_delete on public.activity_logs;
create trigger activity_logs_prevent_delete
  before delete on public.activity_logs
  for each row execute function public.prevent_activity_log_mutation();

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_vendor_id_idx on public.profiles(vendor_id);
create index if not exists vendors_organization_id_idx on public.vendors(organization_id);
create index if not exists vendors_status_idx on public.vendors(status);
create index if not exists vendors_category_idx on public.vendors(category);
create index if not exists rfqs_organization_status_idx on public.rfqs(organization_id, status);
create index if not exists rfq_items_rfq_id_idx on public.rfq_items(rfq_id);
create index if not exists rfq_vendor_invitations_rfq_id_idx on public.rfq_vendor_invitations(rfq_id);
create index if not exists rfq_vendor_invitations_vendor_id_idx on public.rfq_vendor_invitations(vendor_id);
create index if not exists quotations_rfq_id_idx on public.quotations(rfq_id);
create index if not exists quotations_vendor_id_idx on public.quotations(vendor_id);
create index if not exists approval_requests_status_idx on public.approval_requests(organization_id, status);
create index if not exists purchase_orders_vendor_id_idx on public.purchase_orders(vendor_id);
create index if not exists invoices_purchase_order_id_idx on public.invoices(purchase_order_id);
create index if not exists invoices_status_idx on public.invoices(organization_id, status);
create index if not exists activity_logs_organization_created_idx on public.activity_logs(organization_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.rfqs enable row level security;
alter table public.rfq_items enable row level security;
alter table public.rfq_vendor_invitations enable row level security;
alter table public.rfq_attachments enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_steps enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Organization members can view organization" on public.organizations;
create policy "Organization members can view organization"
  on public.organizations for select
  to authenticated
  using (id = public.current_user_organization_id());

drop policy if exists "Authenticated users can create organization" on public.organizations;
create policy "Authenticated users can create organization"
  on public.organizations for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Admins can update organization" on public.organizations;
create policy "Admins can update organization"
  on public.organizations for update
  to authenticated
  using (id = public.current_user_organization_id() and public.current_user_role() = 'admin')
  with check (id = public.current_user_organization_id() and public.current_user_role() = 'admin');

drop policy if exists "Users can view own profile and internal users can view organization profiles" on public.profiles;
create policy "Users can view own profile and internal users can view organization profiles"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can manage organization profiles" on public.profiles;
create policy "Admins can manage organization profiles"
  on public.profiles for all
  to authenticated
  using (organization_id = public.current_user_organization_id() and public.current_user_role() = 'admin')
  with check (organization_id = public.current_user_organization_id() and public.current_user_role() = 'admin');

drop policy if exists "Members can view organization vendors" on public.vendors;
create policy "Members can view organization vendors"
  on public.vendors for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or id = public.current_user_vendor_id()
  );

drop policy if exists "Procurement users can manage vendors" on public.vendors;
create policy "Procurement users can manage vendors"
  on public.vendors for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Internal users and invited vendors can view rfqs" on public.rfqs;
create policy "Internal users and invited vendors can view rfqs"
  on public.rfqs for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or exists (
      select 1
      from public.rfq_vendor_invitations rvi
      where rvi.rfq_id = rfqs.id
        and rvi.vendor_id = public.current_user_vendor_id()
    )
  );

drop policy if exists "Procurement users can manage rfqs" on public.rfqs;
create policy "Procurement users can manage rfqs"
  on public.rfqs for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Visible rfq items can be selected" on public.rfq_items;
create policy "Visible rfq items can be selected"
  on public.rfq_items for select
  to authenticated
  using (exists (select 1 from public.rfqs r where r.id = rfq_items.rfq_id));

drop policy if exists "Procurement users can manage rfq items" on public.rfq_items;
create policy "Procurement users can manage rfq items"
  on public.rfq_items for all
  to authenticated
  using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer')
    )
  )
  with check (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_items.rfq_id
        and r.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer')
    )
  );

drop policy if exists "Internal users and invited vendors can view invitations" on public.rfq_vendor_invitations;
create policy "Internal users and invited vendors can view invitations"
  on public.rfq_vendor_invitations for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Procurement users can manage invitations" on public.rfq_vendor_invitations;
create policy "Procurement users can manage invitations"
  on public.rfq_vendor_invitations for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Vendors can update own invitation response" on public.rfq_vendor_invitations;
create policy "Vendors can update own invitation response"
  on public.rfq_vendor_invitations for update
  to authenticated
  using (vendor_id = public.current_user_vendor_id())
  with check (vendor_id = public.current_user_vendor_id());

drop policy if exists "Visible rfq attachments can be selected" on public.rfq_attachments;
create policy "Visible rfq attachments can be selected"
  on public.rfq_attachments for select
  to authenticated
  using (exists (select 1 from public.rfqs r where r.id = rfq_attachments.rfq_id));

drop policy if exists "Procurement users can manage rfq attachments" on public.rfq_attachments;
create policy "Procurement users can manage rfq attachments"
  on public.rfq_attachments for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Internal users and own vendors can view quotations" on public.quotations;
create policy "Internal users and own vendors can view quotations"
  on public.quotations for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Vendors and internal users can manage quotations" on public.quotations;
create policy "Vendors and internal users can manage quotations"
  on public.quotations for all
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  )
  with check (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Visible quotation items can be selected" on public.quotation_items;
create policy "Visible quotation items can be selected"
  on public.quotation_items for select
  to authenticated
  using (exists (select 1 from public.quotations q where q.id = quotation_items.quotation_id));

drop policy if exists "Quotation owners can manage quotation items" on public.quotation_items;
create policy "Quotation owners can manage quotation items"
  on public.quotation_items for all
  to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and (
          (q.organization_id = public.current_user_organization_id() and public.current_user_is_internal())
          or q.vendor_id = public.current_user_vendor_id()
        )
    )
  )
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_items.quotation_id
        and (
          (q.organization_id = public.current_user_organization_id() and public.current_user_is_internal())
          or q.vendor_id = public.current_user_vendor_id()
        )
    )
  );

drop policy if exists "Internal users can view approval requests" on public.approval_requests;
create policy "Internal users can view approval requests"
  on public.approval_requests for select
  to authenticated
  using (organization_id = public.current_user_organization_id() and public.current_user_is_internal());

drop policy if exists "Procurement and managers can manage approval requests" on public.approval_requests;
create policy "Procurement and managers can manage approval requests"
  on public.approval_requests for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer', 'manager')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer', 'manager')
  );

drop policy if exists "Internal users can view approval steps" on public.approval_steps;
create policy "Internal users can view approval steps"
  on public.approval_steps for select
  to authenticated
  using (organization_id = public.current_user_organization_id() and public.current_user_is_internal());

drop policy if exists "Approvers can update assigned approval steps" on public.approval_steps;
create policy "Approvers can update assigned approval steps"
  on public.approval_steps for update
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and (
      approver_id = auth.uid()
      or approver_role = public.current_user_role()
      or public.current_user_role() = 'admin'
    )
  )
  with check (
    organization_id = public.current_user_organization_id()
    and (
      approver_id = auth.uid()
      or approver_role = public.current_user_role()
      or public.current_user_role() = 'admin'
    )
  );

drop policy if exists "Procurement users can create approval steps" on public.approval_steps;
create policy "Procurement users can create approval steps"
  on public.approval_steps for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Internal users and own vendors can view purchase orders" on public.purchase_orders;
create policy "Internal users and own vendors can view purchase orders"
  on public.purchase_orders for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Procurement users can manage purchase orders" on public.purchase_orders;
create policy "Procurement users can manage purchase orders"
  on public.purchase_orders for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer')
  );

drop policy if exists "Visible purchase order items can be selected" on public.purchase_order_items;
create policy "Visible purchase order items can be selected"
  on public.purchase_order_items for select
  to authenticated
  using (exists (select 1 from public.purchase_orders po where po.id = purchase_order_items.purchase_order_id));

drop policy if exists "Procurement users can manage purchase order items" on public.purchase_order_items;
create policy "Procurement users can manage purchase order items"
  on public.purchase_order_items for all
  to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_items.purchase_order_id
        and po.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer')
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_items.purchase_order_id
        and po.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer')
    )
  );

drop policy if exists "Internal users and own vendors can view invoices" on public.invoices;
create policy "Internal users and own vendors can view invoices"
  on public.invoices for select
  to authenticated
  using (
    (organization_id = public.current_user_organization_id() and public.current_user_is_internal())
    or vendor_id = public.current_user_vendor_id()
  );

drop policy if exists "Procurement and finance users can manage invoices" on public.invoices;
create policy "Procurement and finance users can manage invoices"
  on public.invoices for all
  to authenticated
  using (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer', 'finance')
  )
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_role() in ('admin', 'procurement_officer', 'finance')
  );

drop policy if exists "Visible invoice items can be selected" on public.invoice_items;
create policy "Visible invoice items can be selected"
  on public.invoice_items for select
  to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id));

drop policy if exists "Procurement and finance users can manage invoice items" on public.invoice_items;
create policy "Procurement and finance users can manage invoice items"
  on public.invoice_items for all
  to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer', 'finance')
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.organization_id = public.current_user_organization_id()
        and public.current_user_role() in ('admin', 'procurement_officer', 'finance')
    )
  );

drop policy if exists "Organization members can view activity logs" on public.activity_logs;
create policy "Organization members can view activity logs"
  on public.activity_logs for select
  to authenticated
  using (organization_id = public.current_user_organization_id());

drop policy if exists "Authenticated users can create activity logs in own organization" on public.activity_logs;
create policy "Authenticated users can create activity logs in own organization"
  on public.activity_logs for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and actor_id = auth.uid()
  );

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Internal users can create notifications" on public.notifications;
create policy "Internal users can create notifications"
  on public.notifications for insert
  to authenticated
  with check (
    organization_id = public.current_user_organization_id()
    and public.current_user_is_internal()
  );

insert into storage.buckets (id, name, public)
values
  ('rfq-attachments', 'rfq-attachments', false),
  ('invoice-pdfs', 'invoice-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "VendorBridge storage files are readable by authenticated users" on storage.objects;
create policy "VendorBridge storage files are readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('rfq-attachments', 'invoice-pdfs'));

drop policy if exists "VendorBridge storage files can be uploaded by authenticated users" on storage.objects;
create policy "VendorBridge storage files can be uploaded by authenticated users"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('rfq-attachments', 'invoice-pdfs'));

drop policy if exists "VendorBridge storage files can be updated by authenticated users" on storage.objects;
create policy "VendorBridge storage files can be updated by authenticated users"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('rfq-attachments', 'invoice-pdfs'))
  with check (bucket_id in ('rfq-attachments', 'invoice-pdfs'));
