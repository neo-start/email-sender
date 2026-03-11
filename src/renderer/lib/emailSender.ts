import { EmailConfig } from '../types'

export class EmailSender {
  async configure(config: EmailConfig) {
    const result = await window.electronAPI.email.configure(config)
    if (!result.success) throw new Error('邮件配置失败')
    return true
  }

  async sendEmail(to: string, subject: string, body: string) {
    return window.electronAPI.email.send({ to, subject, body })
  }

  async sendBatch(
    emails: Array<{ to: string; subject: string; body: string }>,
    batchSize = 100,
    delayBetweenBatches = 1000
  ) {
    return window.electronAPI.email.sendBatch({ emails, batchSize, delay: delayBetweenBatches })
  }

  checkGmailLimit(emailsCount: number) {
    const gmailDailyLimit = 500
    const recommendedBatchSize = 100
    if (emailsCount > gmailDailyLimit) {
      return { canSend: false, needsBatching: true, recommendedBatchSize, estimatedTime: Math.ceil(emailsCount / recommendedBatchSize) * 1000 }
    }
    if (emailsCount > recommendedBatchSize) {
      return { canSend: true, needsBatching: true, recommendedBatchSize, estimatedTime: Math.ceil(emailsCount / recommendedBatchSize) * 1000 }
    }
    return { canSend: true, needsBatching: false, recommendedBatchSize: emailsCount, estimatedTime: 0 }
  }

  async getStatus() {
    return window.electronAPI.email.status()
  }
}

export const emailSender = new EmailSender()
