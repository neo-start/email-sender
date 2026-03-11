import { Contact, EmailConfig, SendJob } from '../types'

declare global {
  interface Window {
    electronAPI: {
      storage: {
        load: () => Promise<{ emailConfig: EmailConfig | null; contacts: Contact[]; sendHistory: SendJob[] }>
        saveConfig: (config: EmailConfig | null) => Promise<void>
        saveContacts: (contacts: Contact[]) => Promise<void>
        saveHistory: (history: SendJob[]) => Promise<void>
        backup: () => Promise<string>
      }
      email: {
        configure: (config: EmailConfig) => Promise<{ success: boolean }>
        send: (opts: { to: string; subject: string; body: string }) => Promise<{ success: boolean; messageId: string }>
        sendBatch: (opts: { emails: Array<{ to: string; subject: string; body: string }>; batchSize?: number; delay?: number }) => Promise<Array<{ success: boolean; email: string; messageId?: string; error?: string }>>
        status: () => Promise<{ configured: boolean; email?: string }>
      }
    }
  }
}

export async function loadAllData() {
  return window.electronAPI.storage.load()
}

export async function saveEmailConfig(config: EmailConfig | null) {
  await window.electronAPI.storage.saveConfig(config)
}

export async function saveContacts(contacts: Contact[]) {
  await window.electronAPI.storage.saveContacts(contacts)
}

export async function saveSendHistory(history: SendJob[]) {
  await window.electronAPI.storage.saveHistory(history)
}

export async function backupData() {
  return window.electronAPI.storage.backup()
}
