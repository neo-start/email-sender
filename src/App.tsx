import { observer } from 'mobx-react-lite'
import { EmailStore } from './stores/emailStore'
import { createContext, useContext, useState } from 'react'
import { ConnectorPage } from './pages/ConnectorPage'
import { ContactsPage } from './pages/ContactsPage'
import { SendPage } from './pages/SendPage'
import { HistoryPage } from './pages/HistoryPage'
import { Mail, Users, Send, History, Loader2 } from 'lucide-react'
import { Button } from './components/ui/Button'
import './index.css'

// 创建 Store 上下文
const store = new EmailStore()
const StoreContext = createContext<EmailStore>(store)

export const useStore = () => useContext(StoreContext)

const App = observer(() => {
  const [currentPage, setCurrentPage] = useState<'connector' | 'contacts' | 'send' | 'history'>('connector')

  const navItems = [
    { id: 'connector', label: '邮箱连接', icon: <Mail className="h-4 w-4" /> },
    { id: 'contacts', label: '联系人', icon: <Users className="h-4 w-4" /> },
    { id: 'send', label: '发送邮件', icon: <Send className="h-4 w-4" /> },
    { id: 'history', label: '发送记录', icon: <History className="h-4 w-4" /> },
  ]

  return (
    <StoreContext.Provider value={store}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">邮件发送工具</h1>
                <p className="text-sm text-gray-500">个人使用版本</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {store.emailConfig && (
                <div className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700 md:flex">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  已连接: {store.emailConfig.email}
                </div>
              )}
            </div>
          </div>
          
          <nav className="container mx-auto border-t px-4">
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "secondary" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setCurrentPage(item.id as any)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-8">
          {store.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : store.error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
              <div className="flex items-center gap-2 text-destructive">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">错误</span>
              </div>
              <p className="mt-2 text-sm">{store.error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => store.clearError()}
              >
                清除错误
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {currentPage === 'connector' && <ConnectorPage />}
              {currentPage === 'contacts' && <ContactsPage />}
              {currentPage === 'send' && <SendPage />}
              {currentPage === 'history' && <HistoryPage />}
            </div>
          )}
        </main>

        <footer className="border-t bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600">邮件发送工具 - 个人使用版本</p>
                <p className="text-xs text-gray-500">数据存储在本地 data/ 文件夹</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  联系人: {store.contacts.length} | 
                  发送记录: {store.sendHistory.length} | 
                  等待发送: {store.sendQueue.length}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </StoreContext.Provider>
  )
})

export default App