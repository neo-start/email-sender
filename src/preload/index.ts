import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage
  storage: {
    load: () => ipcRenderer.invoke('storage:load'),
    saveConfig: (config: unknown) => ipcRenderer.invoke('storage:saveConfig', config),
    saveContacts: (contacts: unknown) => ipcRenderer.invoke('storage:saveContacts', contacts),
    saveHistory: (history: unknown) => ipcRenderer.invoke('storage:saveHistory', history),
    saveTemplates: (templates: unknown) => ipcRenderer.invoke('storage:saveTemplates', templates),
    backup: () => ipcRenderer.invoke('storage:backup'),
  },
  // Email
  email: {
    configure: (config: unknown) => ipcRenderer.invoke('email:configure', config),
    send: (opts: { to: string; subject: string; body: string }) =>
      ipcRenderer.invoke('email:send', opts),
    sendBatch: (opts: { emails: unknown[]; batchSize?: number; delay?: number }) =>
      ipcRenderer.invoke('email:sendBatch', opts),
    status: () => ipcRenderer.invoke('email:status'),
  },
})
