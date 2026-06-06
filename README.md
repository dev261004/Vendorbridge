# VendorBridge ERP - Procurement & Vendor Management System

![VendorBridge](https://img.shields.io/badge/VendorBridge-v1.0.0-blue)
![Status](https://img.shields.io/badge/Status-Production--Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 What is VendorBridge?

VendorBridge is a **complete, production-ready Procurement & Vendor Management ERP system** built with modern web technologies. It enables organizations to manage vendors, create RFQs, track quotations, manage purchase orders, and handle invoices efficiently.

### Key Highlights
- ✅ **Fully Functional**: All CRUD operations working
- ✅ **Database Integrated**: Real Supabase PostgreSQL backend
- ✅ **Secure**: Row-level security, authentication, data protection
- ✅ **Professional UI**: Dark/light theme, responsive design
- ✅ **Production Ready**: Deployed on Vercel with Supabase

---

## 📋 Features

### Core Modules

| Module | Features | Status |
|--------|----------|--------|
| **Authentication** | Email/password login, signup, session management | ✅ Complete |
| **Vendor Management** | Add, edit, delete vendors with ratings & status | ✅ Complete |
| **RFQ Management** | Create RFQs, add line items, publish to vendors | ✅ Complete |
| **Quotations** | Vendors submit quotations, accept/reject | ✅ Complete |
| **Purchase Orders** | Auto-generate from quotations, track delivery | ✅ Complete |
| **Invoices** | Create invoices, track payment status | ✅ Complete |
| **Reports** | Analytics, spending trends, vendor performance | ✅ Complete |
| **Theme System** | Dark/light mode with persistence | ✅ Complete |
| **Dashboard** | KPIs, statistics, quick access | ✅ Complete |

### Advanced Features
- 🔐 Row-level security (RLS) on all tables
- 📊 Real-time statistics and analytics
- 🎨 Professional dark/light theme toggle
- 📱 Fully responsive mobile design
- ⚡ Fast server-side rendering with Next.js
- 🔄 Real-time data synchronization
- 📋 Form validation with Zod
- 🎯 Type-safe with TypeScript

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account (free tier available)
- Modern web browser

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/vendorbridge-erp.git
cd vendorbridge-erp

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
# NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# are auto-provided by Supabase integration

# 4. Start development server
pnpm dev

# 5. Open http://localhost:3000 in your browser
```

### First Steps
1. **Sign up** with email and password
2. **Add vendors** through the vendor management page
3. **Create RFQs** to send to vendors
4. **Review quotations** from vendors
5. **Create purchase orders** from accepted quotations
6. **Track invoices** and payments

👉 **See QUICKSTART.md for a detailed 5-minute walkthrough**

---

## 📁 Project Structure

```
vendorbridge-erp/
├── app/
│   ├── actions/                 # Server actions for CRUD operations
│   │   ├── vendors.ts
│   │   ├── rfqs.ts
│   │   ├── quotations.ts
│   │   ├── purchase-orders.ts
│   │   └── invoices.ts
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── callback/route.ts
│   │   └── error/page.tsx
│   ├── dashboard/               # Dashboard and features
│   │   ├── page.tsx             # Main dashboard
│   │   ├── vendors/             # Vendor management
│   │   ├── rfqs/                # RFQ management
│   │   ├── quotations/          # Quotation management
│   │   ├── purchase-orders/     # PO management
│   │   ├── invoices/            # Invoice management
│   │   ├── reports/             # Analytics & reports
│   │   └── settings/            # User settings
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Auth redirect
│   └── globals.css              # Global styles with theme
├── components/
│   ├── DashboardNavigation.tsx   # Sidebar navigation
│   ├── VendorModal.tsx          # Vendor add/edit modal
│   ├── VendorTable.tsx          # Vendor list table
│   ├── RFQModal.tsx             # RFQ modal
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── proxy.ts
│   ├── theme-provider.tsx       # Theme context & provider
│   ├── types.ts                 # TypeScript types
│   ├── utils.ts                 # Utility functions
│   └── store.ts                 # Legacy Zustand store (deprecated)
├── middleware.ts                # Auth middleware
├── QUICKSTART.md                # 5-minute setup guide
├── IMPLEMENTATION_GUIDE.md      # Complete feature documentation
├── DEPLOYMENT.md                # Production deployment guide
└── README.md                    # This file
```

---

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui components
- **Styling**: TailwindCSS with custom theme
- **Forms**: React Hook Form + Zod validation
- **State**: Server actions + React hooks
- **Icons**: Lucide React

### Backend
- **Auth**: Supabase Authentication
- **Database**: Supabase PostgreSQL
- **Security**: Row-level security (RLS)
- **API**: Next.js server actions
- **Caching**: Next.js cache revalidation

### Deployment
- **Hosting**: Vercel (serverless)
- **Database**: Supabase cloud
- **CDN**: Vercel edge network

---

## 🔐 Security

### Authentication & Authorization
- Supabase email/password authentication
- Session-based with HTTP-only cookies
- Middleware-protected dashboard routes
- Automatic logout on session expiry

### Data Protection
- **RLS Policies**: All tables protected
- **User Isolation**: Users see only their data
- **SQL Injection Prevention**: Parameterized queries
- **CSRF Protection**: Built-in middleware
- **Input Validation**: Zod schemas on forms

### Infrastructure
- HTTPS by default on Vercel
- Secure Supabase connection
- Regular automated backups
- Environment variable isolation

---

## 📊 Database Schema

### Tables (10 total)
1. **vendors** - Supplier information
2. **rfqs** - Request for Quotation documents
3. **rfq_items** - Individual RFQ line items
4. **quotations** - Vendor quotation submissions
5. **quotation_items** - Quotation line items
6. **purchase_orders** - PO documents
7. **po_items** - PO line items
8. **invoices** - Vendor invoices
9. **invoice_items** - Invoice line items
10. **profiles** - User profile information

**Row-Level Security**: All tables have RLS enabled
**Relationships**: Proper foreign key constraints
**Triggers**: Auto-profile creation on signup

👉 **See IMPLEMENTATION_GUIDE.md for complete schema details**

---

## 🎨 Theme System

### Dark/Light Mode
- Persists to localStorage
- Applied via CSS custom properties
- Smooth theme transitions
- Context API for global state

### Usage
```tsx
import { useTheme } from '@/lib/theme-provider'

export function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  )
}
```

---

## 🔧 API Reference

### Server Actions

All CRUD operations are implemented as server actions:

```tsx
// Vendors
getVendors()
createVendor(data)
updateVendor(id, data)
deleteVendor(id)

// RFQs
getRFQs()
createRFQ(data)
updateRFQ(id, data)
deleteRFQ(id)

// And similar for quotations, POs, invoices...
```

👉 **See IMPLEMENTATION_GUIDE.md for complete API reference**

---

## 📈 Monitoring & Performance

### Built-in Features
- Vercel Web Analytics
- Supabase performance monitoring
- Error logging via browser console
- Database query statistics

### Optimization
- Server-side rendering for SEO
- Automatic static generation where possible
- Image optimization
- CSS-in-JS with TailwindCSS

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Visit vercel.com/new
# 3. Import the repository
# 4. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
# 5. Click Deploy

# Production URL: https://vendorbridge.vercel.app
```

👉 **See DEPLOYMENT.md for step-by-step deployment guide**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **QUICKSTART.md** | 5-minute setup and basic usage |
| **IMPLEMENTATION_GUIDE.md** | Complete feature documentation |
| **DEPLOYMENT.md** | Production deployment steps |
| **README.md** | This overview (you are here) |

---

## 🛠️ Development

### Available Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm run build

# Preview production build
pnpm start

# Run linter
pnpm run lint

# Type checking
pnpm run type-check

# Format code
pnpm run format
```

### Technology Stack

```json
{
  "runtime": "Node.js 18+",
  "framework": "Next.js 16",
  "react": "19.2+",
  "database": "Supabase (PostgreSQL)",
  "styling": "TailwindCSS 4",
  "ui": "shadcn/ui",
  "forms": "React Hook Form + Zod",
  "auth": "Supabase Auth",
  "deployment": "Vercel"
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Login not working?**
- Verify Supabase URL and keys
- Check email is confirmed
- Clear browser cache

**Data not saving?**
- Check browser console for errors
- Verify form validation passed
- Check Supabase database connection

**Theme not switching?**
- Clear localStorage
- Hard refresh (Ctrl+Shift+R)
- Check theme provider in layout

👉 **See IMPLEMENTATION_GUIDE.md for detailed troubleshooting**

---

## 📊 Project Statistics

- **Total Files**: 50+
- **Lines of Code**: 5000+
- **Database Tables**: 10
- **API Endpoints**: 30+
- **UI Components**: 20+
- **Pages**: 15
- **Test Coverage**: Foundation ready

---

## 🤝 Contributing

### Contribution Guidelines
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Zod for runtime validation

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Vercel](https://vercel.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

## 🚀 Roadmap

### Phase 2 (Planned)
- [ ] Email notifications
- [ ] PDF export for invoices
- [ ] Real-time collaboration
- [ ] Advanced analytics with charts
- [ ] File storage (documents, attachments)
- [ ] Team management & roles
- [ ] Audit logging
- [ ] API for third-party integrations

### Phase 3 (Future)
- [ ] Mobile app
- [ ] Multi-tenant support
- [ ] Advanced workflows
- [ ] AI-powered predictions
- [ ] Marketplace integration

---

## 💬 Support & Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Complete guides and tutorials
- **Examples**: Real-world usage examples

---

## 📞 Contact

- **Email**: support@vendorbridge.com
- **Twitter**: @vendorbridge
- **Website**: https://vendorbridge.dev

---

## 🎉 Getting Started

Ready to use VendorBridge?

1. **Read QUICKSTART.md** (5 minutes)
2. **Start development server** (`pnpm dev`)
3. **Create account** (email & password)
4. **Add vendors** and start managing procurement!

---

**Made with ❤️ for procurement teams worldwide**

---

### Quick Links
- [Quick Start Guide](./QUICKSTART.md)
- [Complete Documentation](./IMPLEMENTATION_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [GitHub Repository](https://github.com/yourusername/vendorbridge-erp)
- [Live Demo](https://vendorbridge.vercel.app)

---

*Last updated: June 2026 | Version 1.0.0*
