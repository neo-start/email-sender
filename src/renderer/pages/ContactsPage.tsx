import { observer } from 'mobx-react-lite'
import { useStore } from '../App'
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Users, Upload, UserPlus, FileText, Tag, Calendar, Mail, Search, Download, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Label } from '../components/ui/Label'

interface ImportPreview {
  contacts: Array<{ name: string; email: string; group: string; tags: string[] }>
  duplicates: string[]
  invalid: number
}

export const ContactsPage = observer(() => {
  const store = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ count: number; duplicates: number } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')

  // 手动添加表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addGroup, setAddGroup] = useState('')
  const [addError, setAddError] = useState('')

  // 选择文件后解析预览
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const existingEmails = new Set(store.contacts.map(c => c.email.toLowerCase()))
        const duplicates: string[] = []
        let invalid = 0

        const contacts = (results.data as any[]).reduce<ImportPreview['contacts']>((acc, row) => {
          if (!row.name || !row.email) { invalid++; return acc }
          if (existingEmails.has(row.email.toLowerCase())) {
            duplicates.push(row.email)
            return acc
          }
          acc.push({
            name: row.name,
            email: row.email,
            group: row.group || 'default',
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          })
          return acc
        }, [])

        setImportPreview({ contacts, duplicates, invalid })
      },
    })
  }

  const handleImportCSV = async () => {
    if (!importPreview) return
    setIsImporting(true)

    const now = new Date().toISOString()
    const contacts = importPreview.contacts.map(c => ({
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: c.name,
      email: c.email,
      group: c.group,
      tags: c.tags,
      createdAt: now,
      updatedAt: now,
    }))

    await store.addContacts(contacts)
    setImportResult({ count: contacts.length, duplicates: importPreview.duplicates.length })
    setImportFile(null)
    setImportPreview(null)
    setIsImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancelImport = () => {
    setImportFile(null)
    setImportPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddContact = async () => {
    setAddError('')
    if (!addName.trim()) { setAddError('请输入姓名'); return }
    if (!addEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail)) {
      setAddError('请输入有效的邮箱地址')
      return
    }
    if (store.contacts.some(c => c.email.toLowerCase() === addEmail.toLowerCase())) {
      setAddError('该邮箱已存在')
      return
    }

    const now = new Date().toISOString()
    await store.addContact({
      id: `contact_${Date.now()}`,
      name: addName.trim(),
      email: addEmail.trim(),
      group: addGroup.trim() || 'manual',
      tags: [],
      createdAt: now,
      updatedAt: now,
    })

    setAddName(''); setAddEmail(''); setAddGroup(''); setShowAddForm(false)
  }

  const handleExportCSV = () => {
    const csv = store.exportContactsCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteContact = async (id: string) => {
    await store.deleteContact(id)
  }

  const filteredContacts = store.contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.group ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">联系人管理</h1>
        <p className="text-muted-foreground">管理联系人列表，支持 CSV 导入和手动添加</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV 导入卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-2">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>CSV 导入</CardTitle>
                <CardDescription>批量导入联系人数据</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 导入结果 */}
            {importResult && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  成功导入 <strong>{importResult.count}</strong> 个联系人
                  {importResult.duplicates > 0 && `，跳过 ${importResult.duplicates} 个重复`}
                </p>
                <button onClick={() => setImportResult(null)} className="ml-auto text-green-600 hover:text-green-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {!importFile ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="csvFile">选择 CSV 文件</Label>
                  <Input
                    ref={fileInputRef}
                    id="csvFile"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-2 font-medium text-sm">CSV 格式要求</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>必须包含 <code className="bg-background px-1 rounded">name</code> 和 <code className="bg-background px-1 rounded">email</code> 列</li>
                    <li>可选列：<code className="bg-background px-1 rounded">group</code>、<code className="bg-background px-1 rounded">tags</code>（逗号分隔）</li>
                    <li>UTF-8 编码</li>
                  </ul>
                </div>
              </>
            ) : (
              /* 导入预览 */
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{importFile.name}</span>
                  <button onClick={handleCancelImport} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {importPreview && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-2">
                        <p className="text-lg font-bold text-green-700">{importPreview.contacts.length}</p>
                        <p className="text-xs text-green-600">可导入</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                        <p className="text-lg font-bold text-amber-700">{importPreview.duplicates.length}</p>
                        <p className="text-xs text-amber-600">重复跳过</p>
                      </div>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2">
                        <p className="text-lg font-bold text-red-700">{importPreview.invalid}</p>
                        <p className="text-xs text-red-600">格式无效</p>
                      </div>
                    </div>
                    {importPreview.contacts.length > 0 && (
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium mb-1">预览（前3条）</p>
                        {importPreview.contacts.slice(0, 3).map((c, i) => (
                          <div key={i} className="text-muted-foreground">{c.name} — {c.email}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {importFile ? (
              <div className="flex w-full gap-2">
                <Button variant="outline" onClick={handleCancelImport} className="flex-1">取消</Button>
                <Button
                  onClick={handleImportCSV}
                  disabled={!importPreview || importPreview.contacts.length === 0 || isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />导入中...</>
                  ) : (
                    <>确认导入 {importPreview?.contacts.length ?? 0} 个</>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                选择 CSV 文件
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* 手动添加卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-2">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>手动添加</CardTitle>
                <CardDescription>单个添加联系人</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddForm ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="addName">姓名 *</Label>
                  <Input
                    id="addName"
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    placeholder="联系人姓名"
                    onKeyDown={e => e.key === 'Enter' && handleAddContact()}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addEmail">邮箱 *</Label>
                  <Input
                    id="addEmail"
                    type="email"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    onKeyDown={e => e.key === 'Enter' && handleAddContact()}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addGroup">分组</Label>
                  <Input
                    id="addGroup"
                    value={addGroup}
                    onChange={e => setAddGroup(e.target.value)}
                    placeholder="默认: manual"
                    onKeyDown={e => e.key === 'Enter' && handleAddContact()}
                  />
                </div>
                {addError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {addError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>填写姓名、邮箱和分组</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>自动检测重复邮箱</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>批量添加建议使用 CSV 导入</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {showAddForm ? (
              <div className="flex w-full gap-2">
                <Button variant="outline" onClick={() => { setShowAddForm(false); setAddError('') }} className="flex-1">取消</Button>
                <Button onClick={handleAddContact} className="flex-1">
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                手动添加联系人
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* 联系人列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>联系人列表</CardTitle>
                <CardDescription>
                  共 {store.contacts.length} 个联系人
                  {searchQuery && `，筛选出 ${filteredContacts.length} 个`}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索联系人..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              {store.contacts.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  导出 CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {store.contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">暂无联系人</h3>
              <p className="mt-2 text-sm text-muted-foreground">请先导入 CSV 文件或手动添加联系人</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>分组</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead className="text-right">添加时间</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => (
                    <TableRow key={contact.id} className="hover:bg-muted/50 group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-medium">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {contact.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {contact.group}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((tag, i) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                              <Tag className="mr-1 h-3 w-3" />{tag}
                            </span>
                          ))}
                          {(!contact.tags || contact.tags.length === 0) && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(contact.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 p-1 rounded"
                          title="删除联系人"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {store.contacts.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              显示 {filteredContacts.length} 个联系人
            </div>
          </CardFooter>
        )}
      </Card>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总联系人</p>
                <p className="text-2xl font-bold">{store.contacts.length}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">分组数量</p>
                <p className="text-2xl font-bold">
                  {new Set(store.contacts.map(c => c.group)).size}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">最近添加</p>
                <p className="text-2xl font-bold">
                  {store.contacts.length > 0
                    ? new Date(Math.max(...store.contacts.map(c => new Date(c.createdAt).getTime())))
                      .toLocaleDateString('zh-CN')
                    : '-'
                  }
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
