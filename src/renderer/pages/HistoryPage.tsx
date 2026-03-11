import { observer } from 'mobx-react-lite'
import { useStore } from '../App'
import { useState } from 'react'
import {
  Search, Filter, Calendar, Mail, CheckCircle, XCircle, Clock,
  AlertCircle, Eye, RefreshCw, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { SendJob } from '../types'

export const HistoryPage = observer(() => {
  const store = useStore()
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'history' | 'queue'>('history')

  // 展开的行详情
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  // 待确认重发的 job id
  const [retryConfirmId, setRetryConfirmId] = useState<string | null>(null)
  const [retryLoading, setRetryLoading] = useState(false)

  const filteredHistory = store.sendHistory.filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false
    if (searchTerm) {
      const contact = store.contacts.find(c => c.id === job.contactId)
      const q = searchTerm.toLowerCase()
      return (
        job.subject.toLowerCase().includes(q) ||
        job.body.toLowerCase().includes(q) ||
        contact?.name.toLowerCase().includes(q) ||
        contact?.email.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = {
    total: store.sendHistory.length,
    sent: store.sendHistory.filter(j => j.status === 'sent').length,
    failed: store.sendHistory.filter(j => j.status === 'failed').length,
    pending: store.sendQueue.length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />已发送</Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />失败</Badge>
      case 'sending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />发送中</Badge>
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />等待中</Badge>
    }
  }

  const getContactInfo = (contactId: string) => {
    const contact = store.contacts.find(c => c.id === contactId)
    return contact ? (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          <span className="text-xs font-medium">{contact.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="font-medium text-sm">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{contact.email}</p>
        </div>
      </div>
    ) : (
      <span className="text-muted-foreground text-sm">未知联系人</span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未发送'
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const handleRetry = async (job: SendJob) => {
    setRetryLoading(true)
    const newJob: SendJob = {
      ...job,
      id: `retry_${Date.now()}_${job.id}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      error: undefined,
    }
    store.addToQueue(newJob)
    setRetryConfirmId(null)
    setRetryLoading(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedJobId(prev => prev === id ? null : id)
  }

  const renderDetailRow = (job: SendJob) => {
    const contact = store.contacts.find(c => c.id === job.contactId)
    return (
      <TableRow key={`detail-${job.id}`} className="bg-muted/30">
        <TableCell colSpan={5} className="p-0">
          <div className="px-6 py-4 space-y-3 border-t border-muted">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">收件人</p>
                <p className="font-medium">{contact?.name ?? '未知'}</p>
                <p className="text-muted-foreground">{contact?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">发送时间</p>
                <p>{formatDate(job.sentAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">邮件主题</p>
              <p className="font-medium text-sm">{job.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">邮件内容</p>
              <div className="rounded bg-muted p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {job.body}
              </div>
            </div>
            {job.error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">错误信息</p>
                  <p className="text-sm text-red-700">{job.error}</p>
                </div>
              </div>
            )}
            {job.status === 'failed' && (
              retryConfirmId === job.id ? (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 flex-1">确定重发这封邮件？</p>
                  <Button size="sm" variant="outline" onClick={() => setRetryConfirmId(null)}>取消</Button>
                  <Button size="sm" onClick={() => handleRetry(job)} disabled={retryLoading}>
                    {retryLoading ? '处理中...' : '确认重发'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRetryConfirmId(job.id)}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  重发此邮件
                </Button>
              )
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">发送记录</h1>
        <p className="text-muted-foreground">查看邮件发送历史记录和发送队列</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总计</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已发送</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">失败</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">等待中</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            发送历史
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            发送队列 ({store.sendQueue.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>发送历史记录</CardTitle>
                  <CardDescription>点击行可展开查看邮件详情</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 过滤器 */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">状态:</span>
                  {(['all', 'sent', 'failed'] as const).map(s => (
                    <Button
                      key={s}
                      variant={filterStatus === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(s)}
                    >
                      {s === 'all' ? `全部 (${stats.total})` : s === 'sent' ? `已发送 (${stats.sent})` : `失败 (${stats.failed})`}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索主题、内容或联系人..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {store.sendHistory.length === 0 ? '暂无发送记录' : '没有匹配的记录'}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {store.sendHistory.length === 0 ? '发送邮件后，记录将显示在这里' : '尝试其他搜索条件'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">状态</TableHead>
                        <TableHead>联系人</TableHead>
                        <TableHead>主题</TableHead>
                        <TableHead className="w-[160px]">发送时间</TableHead>
                        <TableHead className="w-[40px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map(job => (
                        <>
                          <TableRow
                            key={job.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpand(job.id)}
                          >
                            <TableCell>{getStatusBadge(job.status)}</TableCell>
                            <TableCell>{getContactInfo(job.contactId)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{job.subject}</p>
                                {job.error && (
                                  <div className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    {job.error}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(job.sentAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {expandedJobId === job.id
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              }
                            </TableCell>
                          </TableRow>
                          {expandedJobId === job.id && renderDetailRow(job)}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full text-center text-sm text-muted-foreground">
                显示 {filteredHistory.length} 条，共 {stats.total} 条
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-100 p-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>发送队列</CardTitle>
                  <CardDescription>等待发送的邮件将在下次点击发送时处理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {store.sendQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">发送队列为空</h3>
                  <p className="mt-2 text-sm text-muted-foreground">所有邮件都已处理完成</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">队列状态</p>
                      <p className="text-sm text-muted-foreground">{store.sendQueue.length} 封邮件等待发送</p>
                    </div>
                    <Button onClick={() => store.startSending()} className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      立即处理队列
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>联系人</TableHead>
                          <TableHead>主题</TableHead>
                          <TableHead className="w-[150px]">创建时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {store.sendQueue.map(job => (
                          <TableRow key={job.id}>
                            <TableCell>{getContactInfo(job.contactId)}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{job.subject}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(job.createdAt)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})
