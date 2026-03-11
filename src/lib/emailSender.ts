import nodemailer from 'nodemailer'
import { EmailConfig } from '@/types'

// 邮件发送器类
export class EmailSender {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null

  // 配置邮件发送器
  async configure(config: EmailConfig) {
    this.config = config
    
    if (config.provider === 'gmail' && config.oauthToken) {
      // Gmail OAuth 配置
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.email,
          accessToken: config.oauthToken,
        },
      })
    } else if (config.provider === 'smtp') {
      // SMTP 配置
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.email,
          pass: config.password,
        },
      })
    } else {
      throw new Error('无效的邮箱配置')
    }

    // 测试连接
    try {
      await this.transporter.verify()
      console.log('邮件服务器连接成功')
      return true
    } catch (error) {
      console.error('邮件服务器连接失败:', error)
      this.transporter = null
      throw error
    }
  }

  // 发送单封邮件
  async sendEmail(to: string, subject: string, body: string, fromName?: string) {
    if (!this.transporter || !this.config) {
      throw new Error('邮件发送器未配置')
    }

    const from = fromName 
      ? `${fromName} <${this.config.email}>`
      : this.config.email

    const mailOptions = {
      from,
      to,
      subject,
      html: body,
      // 添加退订链接
      headers: {
        'List-Unsubscribe': `<mailto:${this.config.email}?subject=unsubscribe>`,
      },
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('邮件发送成功:', info.messageId)
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      }
    } catch (error) {
      console.error('邮件发送失败:', error)
      throw error
    }
  }

  // 批量发送邮件（带速率限制）
  async sendBatch(
    emails: Array<{ to: string; subject: string; body: string }>,
    batchSize = 100,
    delayBetweenBatches = 1000
  ) {
    if (!this.transporter || !this.config) {
      throw new Error('邮件发送器未配置')
    }

    const results = []
    const totalBatches = Math.ceil(emails.length / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize
      const end = start + batchSize
      const batch = emails.slice(start, end)

      console.log(`发送批次 ${i + 1}/${totalBatches}: ${batch.length} 封邮件`)

      // 发送当前批次
      const batchPromises = batch.map(email => 
        this.sendEmail(email.to, email.subject, email.body)
          .then(result => ({ ...result, email: email.to }))
          .catch(error => ({ 
            success: false, 
            error: error.message, 
            email: email.to 
          }))
      )

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 如果不是最后一批，等待延迟
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    return results
  }

  // 检查 Gmail 发送限制
  checkGmailLimit(emailsCount: number): {
    canSend: boolean
    needsBatching: boolean
    recommendedBatchSize: number
    estimatedTime: number // 毫秒
  } {
    const gmailDailyLimit = 500
    const recommendedBatchSize = 100
    const delayBetweenBatches = 1000

    if (emailsCount > gmailDailyLimit) {
      return {
        canSend: false,
        needsBatching: true,
        recommendedBatchSize,
        estimatedTime: Math.ceil(emailsCount / recommendedBatchSize) * delayBetweenBatches,
      }
    }

    if (emailsCount > recommendedBatchSize) {
      const batches = Math.ceil(emailsCount / recommendedBatchSize)
      return {
        canSend: true,
        needsBatching: true,
        recommendedBatchSize,
        estimatedTime: batches * delayBetweenBatches,
      }
    }

    return {
      canSend: true,
      needsBatching: false,
      recommendedBatchSize: emailsCount,
      estimatedTime: 0,
    }
  }

  // 获取发送状态
  getStatus() {
    return {
      configured: !!this.transporter,
      provider: this.config?.provider,
      email: this.config?.email,
    }
  }
}

// 单例实例
export const emailSender = new EmailSender()