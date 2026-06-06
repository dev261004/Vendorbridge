'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Receipt,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getActivityCenter,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/actions/activity'
import {
  ActivityCenterData,
  ActivityLogRecord,
  NotificationRecord,
} from '@/lib/activity'

type ActivityFilter =
  | 'all'
  | 'rfq'
  | 'approval'
  | 'invoice'
  | 'vendor'
  | 'quotation'
  | 'purchase_order'

const activityFilters: Array<{ label: string; value: ActivityFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'RFQs', value: 'rfq' },
  { label: 'Approvals', value: 'approval' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Vendors', value: 'vendor' },
  { label: 'Quotations', value: 'quotation' },
  { label: 'POs', value: 'purchase_order' },
]

export default function ActivityPage() {
  const [data, setData] = useState<ActivityCenterData>({
    role: null,
    activityLogs: [],
    notifications: [],
  })
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextData = await getActivityCenter()
      setData(nextData)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load activity logs.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const unreadNotifications = data.notifications.filter(
    (notification) => !notification.read_at
  )

  const stats = useMemo(
    () => ({
      unread: unreadNotifications.length,
      rfq: data.activityLogs.filter((log) => getActivityKind(log) === 'rfq')
        .length,
      approval: data.activityLogs.filter(
        (log) => getActivityKind(log) === 'approval'
      ).length,
      invoice: data.activityLogs.filter((log) => getActivityKind(log) === 'invoice')
        .length,
    }),
    [data.activityLogs, unreadNotifications.length]
  )

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return data.activityLogs.filter((log) => {
      const kind = getActivityKind(log)
      const matchesFilter = filter === 'all' || kind === filter
      const matchesSearch =
        !query ||
        [log.message, log.action, log.entity_type, JSON.stringify(log.metadata)]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [data.activityLogs, filter, searchQuery])

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return data.notifications.filter((notification) => {
      const kind = getNotificationKind(notification)
      const matchesFilter = filter === 'all' || kind === filter
      const matchesSearch =
        !query ||
        [notification.title, notification.message, notification.entity_type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [data.notifications, filter, searchQuery])

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      setActiveNotificationId(notificationId)
      setError(null)
      await markNotificationRead(notificationId)
      await loadActivity()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update notification.'
      )
    } finally {
      setActiveNotificationId(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setActiveNotificationId('all')
      setError(null)
      await markAllNotificationsRead()
      await loadActivity()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update notifications.'
      )
    } finally {
      setActiveNotificationId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Activity & Logs
          </h1>
          <p className="text-slate-400">
            Procurement updates, alerts, timeline events, and audit records.
          </p>
        </div>
        <Button
          onClick={loadActivity}
          className="w-fit bg-slate-700 text-white hover:bg-slate-600"
        >
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Unread Alerts"
          value={stats.unread}
          icon={<Bell className="size-5 text-yellow-400" />}
        />
        <StatCard
          title="RFQ Updates"
          value={stats.rfq}
          icon={<FileText className="size-5 text-blue-400" />}
        />
        <StatCard
          title="Approval Alerts"
          value={stats.approval}
          icon={<ShieldCheck className="size-5 text-green-400" />}
        />
        <StatCard
          title="Invoice Updates"
          value={stats.invoice}
          icon={<Receipt className="size-5 text-purple-400" />}
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search activity, notifications, entities, or actions..."
              className="border-slate-600 bg-slate-700 pl-9 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            disabled={unreadNotifications.length === 0 || activeNotificationId === 'all'}
            onClick={handleMarkAllRead}
            className="bg-slate-700 text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCheck className="mr-2 size-4" />
            Mark All Read
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {activityFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={
                filter === item.value
                  ? 'rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600'
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-500">
          Loading activity center...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="space-y-4">
            <PanelHeader
              title="Notifications"
              subtitle={`${filteredNotifications.length} alert(s)`}
              icon={<Bell className="size-5 text-yellow-400" />}
            />
            {filteredNotifications.length === 0 ? (
              <EmptyPanel message="No notifications found for the selected filters." />
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isUpdating={activeNotificationId === notification.id}
                  onMarkRead={() =>
                    handleMarkNotificationRead(notification.id)
                  }
                />
              ))
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <PanelHeader
                title="Activity Timeline"
                subtitle={`${filteredLogs.length} event(s)`}
                icon={<Activity className="size-5 text-blue-400" />}
              />
              {filteredLogs.length === 0 ? (
                <EmptyPanel message="No activity events found for the selected filters." />
              ) : (
                <div className="relative mt-5 space-y-4">
                  <div className="absolute bottom-2 left-4 top-2 w-px bg-slate-700" />
                  {filteredLogs.slice(0, 40).map((log) => (
                    <TimelineItem key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <PanelHeader
                title="Audit Logs"
                subtitle="Immutable procurement trail"
                icon={<ShieldCheck className="size-5 text-green-400" />}
              />
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-3 text-left font-medium text-slate-300">
                        Time
                      </th>
                      <th className="p-3 text-left font-medium text-slate-300">
                        Entity
                      </th>
                      <th className="p-3 text-left font-medium text-slate-300">
                        Action
                      </th>
                      <th className="p-3 text-left font-medium text-slate-300">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.slice(0, 25).map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-700 hover:bg-slate-700/40"
                      >
                        <td className="whitespace-nowrap p-3 text-slate-400">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="whitespace-nowrap p-3 text-slate-300">
                          {titleCase(log.entity_type)}
                        </td>
                        <td className="whitespace-nowrap p-3 text-slate-300">
                          {log.action}
                        </td>
                        <td className="min-w-80 p-3 text-slate-300">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  isUpdating,
  onMarkRead,
}: {
  notification: NotificationRecord
  isUpdating: boolean
  onMarkRead: () => void
}) {
  const kind = getNotificationKind(notification)
  const unread = !notification.read_at

  return (
    <article
      className={
        unread
          ? 'rounded-lg border border-blue-700 bg-blue-900/20 p-4'
          : 'rounded-lg border border-slate-700 bg-slate-800 p-4'
      }
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <CategoryBadge kind={kind} />
            {unread && (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                New
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white">{notification.title}</h3>
        </div>
        {unread && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isUpdating}
            onClick={onMarkRead}
            className="text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Read
          </Button>
        )}
      </div>
      <p className="text-sm text-slate-300">{notification.message}</p>
      <p className="mt-3 text-xs text-slate-500">
        {formatDateTime(notification.created_at)}
      </p>
    </article>
  )
}

function TimelineItem({ log }: { log: ActivityLogRecord }) {
  const kind = getActivityKind(log)
  const Icon = getKindIcon(kind)

  return (
    <div className="relative flex gap-4 pl-12">
      <span className="absolute left-0 top-0 z-10 rounded-full border border-slate-700 bg-slate-900 p-2 text-blue-400">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900/45 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryBadge kind={kind} />
          <span className="text-xs text-slate-500">
            {formatDateTime(log.created_at)}
          </span>
        </div>
        <p className="font-medium text-white">{log.message}</p>
        <p className="mt-1 text-xs text-slate-500">
          {titleCase(log.entity_type)} - {log.action}
        </p>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactElement
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function PanelHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: React.ReactElement
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <span className="text-sm text-slate-500">{subtitle}</span>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

function CategoryBadge({ kind }: { kind: ActivityFilter }) {
  const labels: Record<ActivityFilter, string> = {
    all: 'Activity',
    rfq: 'RFQ',
    approval: 'Approval',
    invoice: 'Invoice',
    vendor: 'Vendor',
    quotation: 'Quotation',
    purchase_order: 'PO',
  }
  const colors: Record<ActivityFilter, string> = {
    all: 'border-slate-600 bg-slate-700/30 text-slate-300',
    rfq: 'border-blue-700 bg-blue-900/30 text-blue-300',
    approval: 'border-green-700 bg-green-900/30 text-green-300',
    invoice: 'border-purple-700 bg-purple-900/30 text-purple-300',
    vendor: 'border-cyan-700 bg-cyan-900/30 text-cyan-300',
    quotation: 'border-yellow-700 bg-yellow-900/30 text-yellow-300',
    purchase_order: 'border-orange-700 bg-orange-900/30 text-orange-300',
  }

  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${colors[kind]}`}
    >
      {labels[kind]}
    </span>
  )
}

function getActivityKind(log: ActivityLogRecord): ActivityFilter {
  return normalizeKind(`${log.entity_type} ${log.action}`)
}

function getNotificationKind(notification: NotificationRecord): ActivityFilter {
  return normalizeKind(`${notification.entity_type || ''} ${notification.title}`)
}

function normalizeKind(value: string): ActivityFilter {
  const normalized = value.toLowerCase()

  if (normalized.includes('rfq')) return 'rfq'
  if (normalized.includes('approval')) return 'approval'
  if (normalized.includes('invoice')) return 'invoice'
  if (normalized.includes('vendor')) return 'vendor'
  if (normalized.includes('quotation')) return 'quotation'
  if (
    normalized.includes('purchase_order') ||
    normalized.includes('purchase order') ||
    normalized.includes('po.')
  ) {
    return 'purchase_order'
  }

  return 'all'
}

function getKindIcon(kind: ActivityFilter) {
  switch (kind) {
    case 'rfq':
      return FileText
    case 'approval':
      return ShieldCheck
    case 'invoice':
      return Receipt
    case 'vendor':
      return Users
    case 'quotation':
      return CheckCircle2
    case 'purchase_order':
      return Clock3
    default:
      return Activity
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
