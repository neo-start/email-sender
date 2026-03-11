import { observer } from 'mobx-react-lite'
import { useStore } from '../App'
import { useState } from 'react'
import Papa from 'papaparse'
import { Users, Upload, UserPlus, FileText, Tag, Calendar, Mail, Search, Filter, Download } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { Label } from '../components/ui/Label'

export const ContactsPage = observer(() => {
  const store = useStore()
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImportCSV = () => {
    if (!importFile) {
      alert('请选择 CSV 文件')
      return
    }

    setIsImporting(true)
    
    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const contacts = results.data
          .filter((row: any) => row.email && row.name)
          .map((row: any) => ({
            id: `contact_${Date.now()}_${Math.random()}`,
            name: row.name,
            email: row.email,
            group: row.group || 'default',
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        
        store.addContacts(contacts)
        setIsImporting(false)
        alert(`成功导入 ${contacts.length} 个联系人`)
        setImportFile(null)
      },
      error: (error) => {
        console.error('CSV 解析错误:', error)
        alert('CSV 文件解析失败，请检查格式')
        setIsImporting(false)
      }
    })
  }

  const handleAddContact = () => {
    const name = prompt('请输入联系人姓名:')
    const email = prompt('请输入联系人邮箱:')
    
    if (name && email) {
      store.addContact({
        id: `contact_${Date.now()}`,
        name,
        email,
        group: 'manual',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      alert('联系人已添加')
    }
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
        <p className="text-muted-foreground">
          管理你的联系人列表，支持 CSV 导入和手动添加
        </p>
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
            <div className="space-y-2">
              <Label htmlFor="csvFile">选择 CSV 文件</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  className="flex-1"
                />
              </div>
              {importFile && (
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{importFile.name}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">CSV 格式要求</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>必须包含 <code>name</code> 和 <code>email</code> 列</li>
                <li>可选列：<code>group</code>, <code>tags</code></li>
                <li>标签列使用逗号分隔多个标签</li>
                <li>支持 UTF-8 编码</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleImportCSV}
              disabled={!importFile || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  导入 CSV 文件
                </>
              )}
            </Button>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>快速添加单个联系人</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>适用于少量联系人添加</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>批量添加建议使用 CSV 导入</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">联系人信息</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">姓名</p>
                  <p className="text-muted-foreground">必填，用于个性化邮件</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">邮箱</p>
                  <p className="text-muted-foreground">必填，用于发送邮件</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAddContact}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              手动添加联系人
            </Button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
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
              <p className="mt-2 text-sm text-muted-foreground">
                请先导入 CSV 文件或手动添加联系人
              </p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => (
                    <TableRow key={contact.id} className="hover:bg-muted/50">
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
                          {contact.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {tag}
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
              显示 {filteredContacts.length} 个联系人中的 {Math.min(filteredContacts.length, 10)} 个
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                导出 CSV
              </Button>
              <Button variant="outline" size="sm">
                批量操作
              </Button>
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