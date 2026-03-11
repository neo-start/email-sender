export interface Contact {
  id: string
  name: string
  email: string
  group?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface EmailConfig {
  provider: 'gmail' | 'smtp'
  email: string
  password?: string // 仅用于 SMTP
  oauthToken?: string // 用于 Gmail OAuth
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[] // 可用的变量，如 {name}, {email}
  createdAt: string
  updatedAt: string
}

export interface SendJob {
  id: string
  contactId: string
  templateId: string
  subject: string
  body: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
  error?: string
  sentAt?: string
  createdAt: string
}

export interface BatchSendConfig {
  batchSize: number
  delayBetweenBatches: number // 毫秒
  maxRetries: number
}