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

  // 开始发送队列
  async startSending() {
    if (!this.emailConfig) {
      throw new Error('请先配置邮箱')
    }

    if (this.sendQueue.length === 0) {
      throw new Error('发送队列为空')
    }

    try {
      runInAction(() => {
        this.isSending = true
        this.sendProgress = 0
        this.error = null
      })

      // 检查 Gmail 限制
      const limitCheck = emailSender.checkGmailLimit(this.sendQueue.length)
      
      if (!limitCheck.canSend) {
        throw new Error(`超过 Gmail 每日限制（500封），当前 ${this.sendQueue.length} 封`)
      }

      // 准备邮件数据
      const emails = this.sendQueue.map(job => {
        const contact = this.contacts.find(c => c.id === job.contactId)
        if (!contact) {
          throw new Error(`找不到联系人: ${job.contactId}`)
        }
        
        return {
          to: contact.email,
          subject: job.subject,
          body: job.body,
        }
      })

      // 发送邮件
      const batchSize = limitCheck.needsBatching ? limitCheck.recommendedBatchSize : emails.length
      const results = await emailSender.sendBatch(emails, batchSize, 1000)

      // 更新发送状态
      runInAction(() => {
        this.sendQueue.forEach((job, index) => {
          const result = results[index]
          if (result.success) {
            job.status = 'sent'
            job.sentAt = new Date().toISOString()
          } else {
            job.status = 'failed'
            job.error = 'error' in result ? result.error : undefined
          }
        })

        // 移动到历史记录
        this.sendHistory.push(...this.sendQueue)
        this.sendQueue = []
        this.sendProgress = 100
      })

      // 保存历史记录
      await saveSendHistory(this.sendHistory)

      // 返回发送结果
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