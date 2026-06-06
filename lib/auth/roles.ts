export type AppRole =
  | 'admin'
  | 'procurement_officer'
  | 'manager'
  | 'vendor'

export const roleOptions: Array<{
  value: AppRole
  label: string
  description: string
}> = [
  {
    value: 'procurement_officer',
    label: 'Procurement Officer',
    description: 'Creates RFQs, compares quotations, and generates documents.',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    description: 'Submits quotations and tracks RFQs, POs, and invoices.',
  },
  {
    value: 'manager',
    label: 'Manager / Approver',
    description: 'Reviews and approves procurement requests.',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manages users, vendors, workflows, and analytics.',
  },
]

export const publicSignupRoleOptions = roleOptions.filter((role) =>
  ['admin', 'procurement_officer'].includes(role.value)
)

export const roleLabels = roleOptions.reduce<Record<AppRole, string>>(
  (labels, role) => {
    labels[role.value] = role.label
    return labels
  },
  {} as Record<AppRole, string>
)

export const dashboardRouteRoles: Array<{
  href: string
  roles: AppRole[]
}> = [
  {
    href: '/dashboard',
    roles: ['admin', 'procurement_officer', 'manager', 'vendor'],
  },
  {
    href: '/dashboard/vendors',
    roles: ['admin'],
  },
  {
    href: '/dashboard/rfqs',
    roles: ['procurement_officer', 'vendor'],
  },
  {
    href: '/dashboard/quotations',
    roles: ['procurement_officer', 'vendor'],
  },
  {
    href: '/dashboard/approvals',
    roles: ['manager'],
  },
  {
    href: '/dashboard/purchase-orders',
    roles: ['procurement_officer', 'vendor'],
  },
  {
    href: '/dashboard/invoices',
    roles: ['procurement_officer', 'vendor'],
  },
  {
    href: '/dashboard/reports',
    roles: ['admin'],
  },
  {
    href: '/dashboard/settings',
    roles: ['admin', 'procurement_officer', 'manager', 'vendor'],
  },
]

export function isAppRole(value: unknown): value is AppRole {
  return roleOptions.some((role) => role.value === value)
}

export function canAccessDashboardRoute(pathname: string, role: AppRole) {
  const matchingRoute = dashboardRouteRoles
    .filter((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]

  if (!matchingRoute) {
    return true
  }

  return matchingRoute.roles.includes(role)
}

export function getDefaultDashboardRoute(role: AppRole) {
  switch (role) {
    case 'admin':
      return '/dashboard/vendors'
    case 'procurement_officer':
      return '/dashboard/rfqs'
    case 'manager':
      return '/dashboard/approvals'
    case 'vendor':
      return '/dashboard/quotations'
    default:
      return '/dashboard'
  }
}
