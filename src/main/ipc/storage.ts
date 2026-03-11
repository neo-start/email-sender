import { IpcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

const DATA_DIR = path.join(app.getPath('userData'), 'data')

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export function setupStorageHandlers(ipcMain: IpcMain) {
  ipcMain.handle('storage:load', async () => {
    await ensureDataDir()
    const read = async (file: string) => {
      try {
        return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf-8'))
      } catch {
        return null
      }
    }
    return {
      emailConfig: await read('config.json'),
      contacts: (await read('contacts.json')) ?? [],
      sendHistory: (await read('history.json')) ?? [],
      templates: (await read('templates.json')) ?? [],
    }
  })

  ipcMain.handle('storage:saveTemplates', async (_, templates) => {
    await ensureDataDir()
    await fs.writeFile(path.join(DATA_DIR, 'templates.json'), JSON.stringify(templates, null, 2))
  })

  ipcMain.handle('storage:saveConfig', async (_, config) => {
    await ensureDataDir()
    await fs.writeFile(path.join(DATA_DIR, 'config.json'), JSON.stringify(config, null, 2))
  })

  ipcMain.handle('storage:saveContacts', async (_, contacts) => {
    await ensureDataDir()
    await fs.writeFile(path.join(DATA_DIR, 'contacts.json'), JSON.stringify(contacts, null, 2))
  })

  ipcMain.handle('storage:saveHistory', async (_, history) => {
    await ensureDataDir()
    await fs.writeFile(path.join(DATA_DIR, 'history.json'), JSON.stringify(history, null, 2))
  })

  ipcMain.handle('storage:backup', async () => {
    await ensureDataDir()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(DATA_DIR, 'backups')
    await fs.mkdir(backupDir, { recursive: true })
    const files = ['config.json', 'contacts.json', 'history.json']
    for (const file of files) {
      try {
        await fs.copyFile(
          path.join(DATA_DIR, file),
          path.join(backupDir, `${file.replace('.json', '')}-${timestamp}.json`)
        )
      } catch { /* file may not exist */ }
    }
    return timestamp
  })
}
