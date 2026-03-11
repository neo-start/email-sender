import fs from 'fs/promises'
import path from 'path'
import { Contact, EmailConfig, SendJob } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 存储接口
export interface StorageData {
  emailConfig: EmailConfig | null
  contacts: Contact[]
  sendHistory: SendJob[]
}

// 初始化默认数据
const defaultData: StorageData = {
  emailConfig: null,
  contacts: [],
  sendHistory: [],
}

// 加载所有数据
export async function loadAllData(): Promise<StorageData> {
  await ensureDataDir()
  
  try {
    const [configData, contactsData, historyData] = await Promise.allSettled([
      fs.readFile(CONFIG_FILE, 'utf-8').then(JSON.parse),
      fs.readFile(CONTACTS_FILE, 'utf-8').then(JSON.parse),
      fs.readFile(HISTORY_FILE, 'utf-8').then(JSON.parse),
    ])

    return {
      emailConfig: configData.status === 'fulfilled' ? configData.value : null,
      contacts: contactsData.status === 'fulfilled' ? contactsData.value : [],
      sendHistory: historyData.status === 'fulfilled' ? historyData.value : [],
    }
  } catch (error) {
    console.warn('加载数据失败，使用默认数据:', error)
    return defaultData
  }
}

// 保存邮箱配置
export async function saveEmailConfig(config: EmailConfig | null) {
  await ensureDataDir()
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// 保存联系人
export async function saveContacts(contacts: Contact[]) {
  await ensureDataDir()
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2))
}

// 保存发送历史
export async function saveSendHistory(history: SendJob[]) {
  await ensureDataDir()
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))
}

// 备份数据
export async function backupData() {
  await ensureDataDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(DATA_DIR, 'backups')
  
  try {
    await fs.mkdir(backupDir, { recursive: true })
    
    await Promise.all([
      fs.copyFile(CONFIG_FILE, path.join(backupDir, `config-${timestamp}.json`)),
      fs.copyFile(CONTACTS_FILE, path.join(backupDir, `contacts-${timestamp}.json`)),
      fs.copyFile(HISTORY_FILE, path.join(backupDir, `history-${timestamp}.json`)),
    ])
    
    console.log('数据备份完成:', timestamp)
  } catch (error) {
    console.error('数据备份失败:', error)
  }
}

// 清理旧备份（保留最近7天）
export async function cleanupOldBackups() {
  const backupDir = path.join(DATA_DIR, 'backups')
  
  try {
    await fs.access(backupDir)
    const files = await fs.readdir(backupDir)
    
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    
    for (const file of files) {
      const filePath = path.join(backupDir, file)
      const stats = await fs.stat(filePath)
      
      if (stats.mtimeMs < sevenDaysAgo) {
        await fs.unlink(filePath)
        console.log('删除旧备份:', file)
      }
    }
  } catch (error) {
    // 备份目录不存在，忽略
  }
}