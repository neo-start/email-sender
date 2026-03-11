import { observer } from 'mobx-react-lite'
import { useStore } from '../App'
import { useState } from 'react'
import { Mail, Server, Shield, CheckCircle, AlertCircle, LogOut, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Label } from '../components/ui/Label'

export const ConnectorPage = observer(() => {
  const store = useStore()
  const [configType, setConfigType] = useState<'gmail' | 'smtp'>('gmail')

  // Gmail form
  const [gmailEmail, setGmailEmail] = useState('')
  const [gmailPassword, setGmailPassword] = useState('')
  const [showGmailPassword, setShowGmailPassword] = useState(false)

  // SMTP form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('587')

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [connectSuccess, setConnectSuccess] = useState('')

  const handleConnectGmail = async () => {
    setConnectError('')
    setConnectSuccess('')
    if (!gmailEmail.trim()) { setConnectError('请输入 Gmail 邮箱地址'); return }
    if (!gmailPassword.trim()) { setConnectError('请输入应用专用密码'); return }

    try {
      setIsConnecting(true)
      await store.setEmailConfig({
        provider: 'smtp',
        email: gmailEmail.trim(),
        password: gmailPassword.trim(),
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
      })
      setConnectSuccess('Gmail 连接成功！每日发送限制 500 封')
      setGmailEmail('')
      setGmailPassword('')
    } catch (err) {
      setConnectError('连接失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectSMTP = async () => {
    setConnectError('')
    setConnectSuccess('')
    if (!email.trim() || !password.trim()) { setConnectError('请填写邮箱和密码'); return }

    try {
      setIsConnecting(true)
      await store.setEmailConfig({
        provider: 'smtp',
        email: email.trim(),
        password: password.trim(),
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpSecure: true,
      })
      setConnectSuccess('SMTP 配置已验证成功')
      setPassword('')
    } catch (err) {
      setConnectError('连接失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await store.disconnectEmail()
    setConnectSuccess('')
    setConnectError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">邮箱连接器</h1>
        <p className="text-muted-foreground">连接你的邮箱账户，开始发送邮件</p>
      </div>

      {/* 已连接状态 */}
      {store.emailConfig && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-2">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">已连接</CardTitle>
                  <CardDescription className="text-green-700">邮箱配置已验证成功</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">在线</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  断开连接
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">邮箱地址</p>
                <p className="text-green-700">{store.emailConfig.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">提供商</p>
                <p className="text-green-700">{store.emailConfig.provider.toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">服务器</p>
                <p className="text-green-700">
                  {store.emailConfig.smtpHost}:{store.emailConfig.smtpPort}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 全局消息 */}
      {connectSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">{connectSuccess}</p>
        </div>
      )}
      {connectError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{connectError}</p>
        </div>
      )}

      {/* 配置类型选择器 */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={configType === 'gmail' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => { setConfigType('gmail'); setConnectError(''); setConnectSuccess('') }}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Gmail 连接
        </Button>
        <Button
          variant={configType === 'smtp' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => { setConfigType('smtp'); setConnectError(''); setConnectSuccess('') }}
          className="flex items-center gap-2"
        >
          <Server className="h-4 w-4" />
          SMTP 配置
        </Button>
      </div>

      {configType === 'gmail' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-2">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Gmail 连接</CardTitle>
                <CardDescription>使用 Gmail 应用专用密码连接</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="gmailEmail">Gmail 邮箱地址</Label>
                <Input
                  id="gmailEmail"
                  type="email"
                  value={gmailEmail}
                  onChange={e => setGmailEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  disabled={isConnecting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gmailPassword">应用专用密码（16位）</Label>
                <div className="relative">
                  <Input
                    id="gmailPassword"
                    type={showGmailPassword ? 'text' : 'password'}
                    value={gmailPassword}
                    onChange={e => setGmailPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    disabled={isConnecting}
                    onKeyDown={e => e.key === 'Enter' && handleConnectGmail()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGmailPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium text-sm">如何获取应用专用密码？</h4>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>登录 Google 账户，进入「安全性」设置</li>
                <li>开启「两步验证」</li>
                <li>搜索「应用专用密码」并生成</li>
                <li>选择「邮件」→「其他设备」，复制 16 位密码</li>
              </ol>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                每日最多 500 封
              </div>
              <div className="flex items-center gap-1 text-amber-700">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                需开启两步验证
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleConnectGmail}
              disabled={isConnecting || !gmailEmail || !gmailPassword}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />连接中...</>
              ) : '连接 Gmail 账户'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-2">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>SMTP 配置</CardTitle>
                <CardDescription>使用任意邮箱服务商的 SMTP 设置</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                disabled={isConnecting}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">密码 / 应用专用密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="密码"
                  disabled={isConnecting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="smtpHost">SMTP 服务器</Label>
                <Input
                  id="smtpHost"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  disabled={isConnecting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="smtpPort">端口</Label>
                <Input
                  id="smtpPort"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  placeholder="587"
                  disabled={isConnecting}
                  onKeyDown={e => e.key === 'Enter' && handleConnectSMTP()}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              常见配置：Gmail smtp.gmail.com:587 · QQ Mail smtp.qq.com:587 · 163 smtp.163.com:465
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleConnectSMTP}
              disabled={isConnecting || !email || !password}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />验证中...</>
              ) : '保存 SMTP 配置'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 安全提示 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">安全提示</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-amber-700 text-sm">
            <li>Gmail 请使用应用专用密码，不要使用账户登录密码</li>
            <li>所有配置存储在本地，不会上传到云端</li>
            <li>建议使用专用发信邮箱，与个人邮箱分开</li>
            <li>定期备份 data/ 文件夹中的数据</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
})
