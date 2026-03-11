import { observer } from 'mobx-react-lite'
import { EmailStore } from './stores/emailStore'
import { createContext, useContext, useState } from 'react'
import { ConnectorPage } from './pages/ConnectorPage'
import { ContactsPage } from './pages/ContactsPage'
import { SendPage } from './pages/SendPage'
import { HistoryPage } from './pages/HistoryPage'
import { Mail, Users, Send, History, Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import './index.css'

const store = new EmailStore()
const StoreContext = createContext<EmailStore>(store)
export const useStore = () => useContext(StoreContext)

type Page = 'connector' | 'contacts' | 'send' | 'history'

const navItems = [
  { id: 'connector' as Page, label: '邮箱连接', icon: Mail, desc: '配置发件箱' },
  { id: 'contacts' as Page, label: '联系人', icon: Users, desc: '管理收件人' },
  { id: 'send' as Page, label: '发送邮件', icon: Send, desc: '批量发送' },
  { id: 'history' as Page, label: '发送记录', icon: History, desc: '历史与队列' },
]

const App = observer(() => {
  const [currentPage, setCurrentPage] = useState<Page>('connector')

  return (
    <StoreContext.Provider value={store}>
      <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">

        {/* ── 侧边栏 ── */}
        <aside className="flex w-[220px] flex-shrink-0 flex-col border-r bg-white shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-gray-900">邮件发送</p>
              <p className="mt-0.5 text-xs text-gray-400">批量工具</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 px-3 py-4">
            {navItems.map(item => {
              const Icon = item.icon
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium leading-none ${active ? 'text-white' : ''}`}>{item.label}</p>
                    <p className={`mt-0.5 text-xs ${active ? 'text-primary-foreground/70' : 'text-gray-400'}`}>{item.desc}</p>
                  </div>
                  {active && <ChevronRight className="h-3 w-3 text-white/60" />}
                </button>
              )
            })}
          </nav>

          {/* 底部状态 */}
          <div className="border-t px-4 py-4">
            {store.emailConfig ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-800">已连接</p>
                  <p className="truncate text-xs text-green-600">{store.emailConfig.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-amber-800">未连接邮箱</p>
                  <p className="text-xs text-amber-600">请先配置</p>
                </div>
              </div>
            )}

            <div className="mt-2.5 grid grid-cols-3 gap-1 text-center">
              {[
                { label: '联系人', value: store.contacts.length },
                { label: '历史', value: store.sendHistory.length },
                { label: '队列', value: store.sendQueue.length },
              ].map(s => (
                <div key={s.label} className="rounded-md bg-gray-50 px-1 py-1.5">
                  <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── 主内容 ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* 顶部面包屑 */}
          <header className="flex h-14 flex-shrink-0 items-center border-b bg-white px-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">邮件发送工具</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <span className="font-medium text-gray-900">
                {navItems.find(n => n.id === currentPage)?.label}
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {store.isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-500">加载中...</p>
                </div>
              </div>
            ) : store.error ? (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-6">
                <p className="font-medium text-red-800">出错了</p>
                <p className="mt-1 text-sm text-red-600">{store.error}</p>
                <button
                  onClick={() => store.clearError()}
                  className="mt-3 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                >
                  清除
                </button>
              </div>
            ) : (
              <div className="p-6">
                {currentPage === 'connector' && <ConnectorPage />}
                {currentPage === 'contacts' && <ContactsPage />}
                {currentPage === 'send' && <SendPage />}
                {currentPage === 'history' && <HistoryPage />}
              </div>
            )}
          </div>
        </main>
      </div>
    </StoreContext.Provider>
  )
})

export default App
