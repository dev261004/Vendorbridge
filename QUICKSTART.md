# VendorBridge ERP - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Start Development Server
```bash
pnpm dev
```
App runs at `http://localhost:3000`

---

## 📝 Create Your Account

### Step 1: Sign Up
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter email and password
4. Click "Sign up"
5. Check email for confirmation (if enabled)
6. Login with credentials

### Step 2: You're In!
Dashboard displays with 0 vendors, RFQs, etc.

---

## 🏢 Add Your First Vendor

### Step 1: Navigate to Vendors
1. Click "Vendors" in sidebar
2. Click "Add Vendor" button

### Step 2: Fill Form
- **Name**: Acme Corp
- **Email**: contact@acme.com
- **Phone**: +1-555-0100
- **Address**: 123 Business St
- **City**: New York
- **Country**: USA

### Step 3: Save
Click "Add Vendor" → Vendor appears in table!

---

## 📋 Create Your First RFQ

### Step 1: Navigate to RFQs
1. Click "RFQs" in sidebar
2. Click "Add RFQ" button

### Step 2: Fill RFQ Details
- **Title**: Office Supplies
- **Description**: Need office furniture
- **Estimated Budget**: $5000
- **Due Date**: 30 days from today

### Step 3: Add Items (if available)
- Item: Office Chairs
- Quantity: 10
- Unit: pcs
- Estimated Price: $300/pc

### Step 4: Create
Click "Create RFQ" → RFQ appears in list!

---

## 💼 View Purchase Orders

### Step 1: Go to POs
1. Click "Purchase Orders" in sidebar

### Step 2: Create from Quotation
Once vendors submit quotations:
1. Go to "Quotations"
2. Click "Accept" on a quotation
3. System creates PO automatically

### Step 3: Track Status
View all POs with delivery dates and status

---

## 📄 Manage Invoices

### Step 1: Go to Invoices
1. Click "Invoices" in sidebar

### Step 2: Create Invoice
1. Click "Add Invoice"
2. Select PO
3. Enter invoice number
4. Add items and due date
5. Save

### Step 3: Track Payments
- Pending: Not yet paid
- Paid: Payment received
- Overdue: Past due date

---

## 🌙 Switch Theme

### Light/Dark Mode
1. Click the sun/moon icon in sidebar (top right)
2. Theme switches immediately
3. Preference saved automatically

---

## 📊 View Dashboard

### Dashboard Shows:
- Total vendors
- Active RFQs
- Pending quotations
- Purchase orders count
- Invoice summary
- Total spend

Click any card to drill down into details.

---

## 📈 Generate Reports

### Available Reports:
1. **Vendor Performance**
   - Ratings, quote acceptance rates
   - Price competitiveness

2. **Spending Analysis**
   - Total spend by category
   - Monthly trends

3. **Invoice Summary**
   - Paid vs pending
   - Overdue amounts

4. **RFQ Statistics**
   - Published RFQs
   - Average quote count
   - Acceptance rates

---

## ⚙️ Settings

### Account Settings:
1. Click "Settings" in sidebar
2. Update profile information
3. Change password
4. View audit log

---

## 🔐 Security Tips

1. **Never share credentials**
2. **Use strong passwords** (mix uppercase, lowercase, numbers, symbols)
3. **Enable email verification** for team members
4. **Review RLS policies** in Supabase
5. **Keep Supabase keys secret**

---

## 🐛 Quick Troubleshooting

### Can't Login?
- [ ] Email is correct?
- [ ] Password matches?
- [ ] Confirmed email (if required)?

### Data Not Saving?
- [ ] Check browser console for errors
- [ ] Verify all form fields are filled
- [ ] Check internet connection
- [ ] Try hard refresh (Ctrl+Shift+R)

### Theme Not Changing?
- [ ] Clear browser cache
- [ ] Check if theme button is visible
- [ ] Try incognito mode

### Slow Performance?
- [ ] Check network in DevTools
- [ ] Look for database timeouts
- [ ] Check Supabase status

---

## 📚 Full Documentation

For detailed info, see:
- **IMPLEMENTATION_GUIDE.md** - Complete feature list
- **DEPLOYMENT.md** - Production deployment
- **Database Schema** - Table structures
- **API Reference** - Server actions

---

## 🚀 Next Steps

1. ✅ Create account
2. ✅ Add vendors
3. ✅ Create RFQs
4. ✅ View quotations
5. ✅ Create purchase orders
6. ✅ Manage invoices
7. ✅ Generate reports
8. ✅ Invite team members
9. ✅ Deploy to production

---

## 💬 Common Questions

**Q: Can I delete a vendor?**
A: Yes, go to Vendors, click menu, select Delete. Related data follows RLS.

**Q: How many vendors can I have?**
A: Unlimited! Supabase scales automatically.

**Q: Can multiple users access the same data?**
A: Yes, share login credentials or implement team features.

**Q: Is my data safe?**
A: Yes! Uses Supabase RLS, encrypted connection, regular backups.

**Q: Can I export data?**
A: Future feature! For now, access via Supabase dashboard.

---

## 🎯 Pro Tips

1. **Use RFQ templates** for repeated purchases
2. **Set vendor ratings** after each order
3. **Review reports monthly** for spend optimization
4. **Archive old data** to keep system fast
5. **Backup regularly** using Supabase tools

---

## 📞 Getting Help

- Check IMPLEMENTATION_GUIDE.md for detailed docs
- Review error messages in browser console
- Check Supabase dashboard for database status
- Review GitHub issues for known problems

---

**Welcome to VendorBridge ERP! Happy procuring! 🎉**
