# VendorBridge Database Setup

This project should use Supabase SQL migrations, not Prisma.

## Why Not Prisma

VendorBridge already depends on Supabase for:

- Authentication
- Row-level security policies
- Storage for RFQ attachments and invoice PDFs
- Server-side database access from Next.js

Prisma can work with PostgreSQL, but it does not manage Supabase Auth, RLS policies, storage policies, or trigger-based profile creation as naturally as SQL migrations. For this hackathon, direct Supabase migrations are faster and cleaner.

## Migration

The core schema is in:

```txt
supabase/migrations/20260606000100_vendorbridge_core_schema.sql
```

It creates:

- Organizations and user profiles
- Role-based profile data
- Vendors with category, GST number, rating, and status
- RFQs, RFQ line items, vendor invitations, and attachments
- Vendor quotations and quotation items
- Approval requests and approval steps
- Purchase orders and PO items
- Invoices and invoice items
- Activity logs and notifications
- Private Supabase Storage buckets for RFQ attachments and invoice PDFs
- RLS policies for internal users and vendors

## How To Apply

Recommended with Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternative:

1. Open the Supabase dashboard.
2. Go to SQL Editor.
3. Paste and run the migration SQL.

## Next Backend Step

After applying the schema, update the Next.js server actions to use these table names:

- `purchase_order_items` instead of `po_items`
- `purchase_order_id` instead of `po_id`
- `purchase_order_id` on invoices
- `status` on invoices instead of frontend-only `paymentStatus`
