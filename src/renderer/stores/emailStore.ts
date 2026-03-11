import { makeAutoObservable, runInAction } from 'mobx'
import { Contact, EmailConfig, EmailTemplate, SendJob } from '../types'
import { loadAllData, saveEmailConfig, saveContacts, saveSendHistory, backupData } from '../lib/storage'
import { emailSender } from '../lib/emailSender'

export class EmailStore {
  // 邮箱配置
  emailConfig: EmailConfig | null = null
  
  // 联系人列表
  contacts: Contact[] = []
  
  // 邮件模板
  templates: EmailTemplate[] = []
  
  // 发送任务队列
  sendQueue: SendJob[] = []
  
  // 发送历史
  sendHistory: SendJob[] = []
  
  // UI 状态
  isLoading = false
  error: string | null = null
  isSending = false
  sendProgress = 0

  constructor() {
    makeAutoObservable(this)
    this.loadData()
  }

  // 加载本地数据
  async loadData() {
    try {
      runInAction(() => {
        this.isLoading = true
        this.error = null
      })
      
      const data = await loadAllData()
      
      runInAction(() => {
        this.emailConfig = data.emailConfig
        this.contacts = data.contacts
        this.sendHistory = data.sendHistory
        
        // 如果已有邮箱配置，初始化邮件发送器
        if (this.emailConfig) {
          emailSender.configure(this.emailConfig).catch(err => {
            console.warn('邮件发送器初始化失败:', err)
          })
        }
      })
      
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : '加载数据失败'
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  // 设置邮箱配置
  async setEmailConfig(config: EmailConfig) {
    try {
      runInAction(() => {
        this.isLoading = true
        this.error = null
      })
      
      // 配置邮件发送器
      await emailSender.configure(config)
      
      // 保存配置
      await saveEmailConfig(config)
      
      runInAction(() => {
        this.emailConfig = config
      })
      
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : '邮箱配置失败'
      })
      throw err
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  // 添加联系人
  async addContact(contact: Contact) {
    runInAction(() => {
      this.contacts.push(contact)
    })
    await this.saveContacts()
  }

  // 批量添加联系人
  async addContacts(contacts: Contact[]) {
    runInAction(() => {
      this.contacts.push(...contacts)
    })
    await this.saveContacts()
  }

  // 删除联系人
  async deleteContact(id: string) {
    runInAction(() => {
      this.contacts = this.contacts.filter(c => c.id !== id)
    })
    await this.saveContacts()
  }

  // 清空联系人
  async clearContacts() {
    runInAction(() => {
      this.contacts = []
    })
    await this.saveContacts()
  }

  // 导出联系人为 CSV 字符串
  exportContactsCSV(): string {
    const header = 'name,email,group,tags'
    const rows = this.contacts.map(c =>
      `"${c.name}","${c.email}","${c.group ?? ''}","${(c.tags ?? []).join(',')}"`
    )
    return [header, ...rows].join('\n')
  }

  // 保存联系人
  private async saveContacts() {
    try {
      await saveContacts(this.contacts)
    } catch (err) {
      console.error('保存联系人失败:', err)
      // 尝试备份
      await backupData()
    }
  }

  // 添加发送任务到队列
  addToQueue(job: SendJob) {
    runInAction(() => {
      this.sendQueue.push(job)
    })
  }

  // 进度回调
  onProgressUpdate: ((index: number, total: number, job: SendJob, success: boolean, error?: string) => void) | null = null

  // 开始发送队列（逐条发送，实时更新进度）
  async startSending() {
    if (!this.emailConfig) {
      throw new Error('请先配置邮箱')
    }

    if (this.sendQueue.length === 0) {
      throw new Error('发送队列为空')
    }

    const total = this.sendQueue.length

    try {
      runInAction(() => {
        this.isSending = true
        this.sendProgress = 0
        this.error = null
        // 全部标记为 pending
        this.sendQueue.forEach(job => { job.status = 'pending' })
      })

      const results: Array<{ success: boolean; error?: string }> = []

      for (let i = 0; i < this.sendQueue.length; i++) {
        const job = this.sendQueue[i]
        const contact = this.contacts.find(c => c.id === job.contactId)

        // 标记为发送中
        runInAction(() => {
          job.status = 'sending'
        })

        let success = false
        let errorMsg: string | undefined

        if (!contact) {
          errorMsg = '找不到联系人'
        } else {
          try {
            const result = await emailSender.sendEmail(contact.email, job.subject, job.body)
            success = result.success
            if (!success && 'error' in result) errorMsg = result.error
          } catch (err) {
            errorMsg = err instanceof Error ? err.message : '发送失败'
          }
        }

        results.push({ success, error: errorMsg })

        runInAction(() => {
          if (success) {
            job.status = 'sent'
            job.sentAt = new Date().toISOString()
          } else {
            job.status = 'failed'
            job.error = errorMsg
          }
          this.sendProgress = Math.round(((i + 1) / total) * 100)
        })

        // 触发进度回调
        this.onProgressUpdate?.(i, total, job, success, errorMsg)

        // 发送间隔避免限流（每封间隔 300ms）
        if (i < this.sendQueue.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // 移动到历史记录
      runInAction(() => {
        this.sendHistory.push(...this.sendQueue)
        this.sendQueue = []
        this.sendProgress = 100
      })

      await saveSendHistory(this.sendHistory)

      const successCount = results.filter(r => r.success).length
      const failedCount = results.length - successCount

      return {
        success: true,
        total: results.length,
        successCount,
        failedCount,
        results,
      }

    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : '发送失败'
      })
      throw err
    } finally {
      runInAction(() => {
        this.isSending = false
      })
    }
  }

  // 清除错误
  clearError() {
    this.error = null
  }

  // 获取发送统计
  getSendStats() {
    const total = this.sendHistory.length
    const sent = this.sendHistory.filter(j => j.status === 'sent').length
    const failed = this.sendHistory.filter(j => j.status === 'failed').length
    const pending = this.sendQueue.length

    return { total, sent, failed, pending }
  }

  // 获取邮箱状态
  getEmailStatus() {
    return emailSender.getStatus()
  }
}