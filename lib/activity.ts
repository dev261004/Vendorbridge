export interface ActivityLogRecord {
  id: string
  organization_id: string | null
  actor_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  message: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface NotificationRecord {
  id: string
  organization_id: string | null
  user_id: string
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

export interface ActivityCenterData {
  role: string | null
  activityLogs: ActivityLogRecord[]
  notifications: NotificationRecord[]
}
