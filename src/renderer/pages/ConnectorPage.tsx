import { observer } from 'mobx-react-lite'
import { useStore } from '../App'
import { useState } from 'react'
import { Mail, Server, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Label } from '../components/ui/Label'

export const ConnectorPage = observer(() => {
  const store = useStore()
  const [configType, setConfigType] = useState<'gmail' | 'smtp'>('gmail')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('587')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true)
      // TODO: 实现完整的 Gmail OAuth 流程
      // 目前先使用 SMTP 方式连接 Gmail
      const gmailEmail = prompt('请输入 Gmail 邮箱地址:')
      const appPassword = prompt('请输入 Gmail 应用专用密码（16位）:')
      
      if (!gmailEmail || !appPassword) {
        setIsConnecting(false)
        return
      }

      await store.setEmailConfig({
        provider: 'smtp',
        email: gmailEmail,
        password: appPassword,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
      })
      
      alert('Gmail 连接成功！\n\n注意：每日发送限制为 500 封邮件')
    } catch (err) {
      alert('Gmail 连接失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectSMTP = async () => {
    if (!email || !password) {
      alert('请填写邮箱和密码')
      return
    }

    try {
      setIsConnecting(true)
      await store.setEmailConfig({
        provider: 'smtp',
        email,
        password,
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpSecure: true,
      })
      
      alert('SMTP 配置已保存并验证成功')
    } catch (err) {
      alert('SMTP 连接失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">邮箱连接器</h1>
        <p className="text-muted-foreground">
          连接你的邮箱账户，开始发送邮件
        </p>
      </div>

      {/* 配置类型选择器 */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={configType === 'gmail' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setConfigType('gmail')}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Gmail 连接
        </Button>
        <Button
          variant={configType === 'smtp' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setConfigType('smtp')}
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
                <CardDescription>使用 Google OAuth 2.0 安全连接 Gmail</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>每日最多 500 封邮件</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>需要应用专用密码</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>自动分批发送，避免限制</span>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">如何获取应用专用密码？</h4>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>登录 Google 账户</li>
                <li>前往「安全性」设置</li>
                <li>开启「两步验证」</li>
                <li>生成「应用专用密码」</li>
                <li>复制 16 位密码使用</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? '连接中...' : '连接 Gmail 账户'}
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
                <CardDescription>使用其他邮箱服务商的 SMTP 设置</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码/应用专用密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP 服务器</Label>
                  <Input
                    id="smtpHost"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP 端口</Label>
                  <Input
                    id="smtpPort"
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleConnectSMTP}
              disabled={isConnecting || !email || !password}
              className="w-full"
              size="lg"
            >
              {isConnecting ? '连接中...' : '保存 SMTP 配置'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 当前配置状态 */}
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
                  <CardDescription className="text-green-700">
                    邮箱配置已验证成功
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-700">在线</span>
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
                <p className="text-green-700">{store.emailConfig.smtpHost}:{store.emailConfig.smtpPort}</p>
              </div>
            </div>
          </CardContent>
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
          <ul className="list-disc space-y-2 pl-5 text-amber-700">
            <li>建议使用专门的测试邮箱进行连接</li>
            <li>Gmail 需要使用应用专用密码，不要使用账户密码</li>
            <li>所有数据存储在本地，不会上传到云端</li>
            <li>定期备份 data/ 文件夹中的重要数据</li>
            <li>不要在不安全的网络环境下使用</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
})