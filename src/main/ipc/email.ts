import { IpcMain } from 'electron'
import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null
let currentConfig: { email: string; fromName?: string } | null = null

export function setupEmailHandlers(ipcMain: IpcMain) {
  ipcMain.handle('email:configure', async (_, config) => {
    currentConfig = { email: config.email, fromName: config.fromName }

    if (config.provider === 'gmail' && config.oauthToken) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { type: 'OAuth2', user: config.email, accessToken: config.oauthToken },
      })
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: { user: config.email, pass: config.password },
      })
    }

    await transporter.verify()
    return { success: true }
  })

  ipcMain.handle('email:send', async (_, { to, subject, body }) => {
    if (!transporter || !currentConfig) throw new Error('邮件发送器未配置')

    const from = currentConfig.fromName
      ? `${currentConfig.fromName} <${currentConfig.email}>`
      : currentConfig.email

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: body,
      headers: { 'List-Unsubscribe': `<mailto:${currentConfig.email}?subject=unsubscribe>` },
    })

    return { success: true, messageId: info.messageId }
  })

  ipcMain.handle('email:sendBatch', async (_, { emails, batchSize = 100, delay = 1000 }) => {
    if (!transporter || !currentConfig) throw new Error('邮件发送器未配置')

    const from = currentConfig.fromName
      ? `${currentConfig.fromName} <${currentConfig.email}>`
      : currentConfig.email

    const results: Array<{ success: boolean; email: string; messageId?: string; error?: string }> = []
    const totalBatches = Math.ceil(emails.length / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const batch = emails.slice(i * batchSize, (i + 1) * batchSize)
      const batchResults = await Promise.all(
        batch.map(async (mail: { to: string; subject: string; body: string }) => {
          try {
            const info = await transporter!.sendMail({
              from,
              to: mail.to,
              subject: mail.subject,
              html: mail.body,
              headers: { 'List-Unsubscribe': `<mailto:${currentConfig!.email}?subject=unsubscribe>` },
            })
            return { success: true, email: mail.to, messageId: info.messageId }
          } catch (err) {
            return { success: false, email: mail.to, error: (err as Error).message }
          }
        })
      )
      results.push(...batchResults)
      if (i < totalBatches - 1) await new Promise(r => setTimeout(r, delay))
    }

    return results
  })

  ipcMain.handle('email:status', () => ({
    configured: !!transporter,
    email: currentConfig?.email,
  }))
}
