import { observer } from "mobx-react-lite";
import { useStore } from "../App";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  XCircle,
  Loader2,
  BookTemplate,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { Checkbox } from "../components/ui/Checkbox";

interface LogEntry {
  index: number;
  name: string;
  email: string;
  success: boolean;
  error?: string;
  time: string;
}

export const SendPage = observer(() => {
  const store = useStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  // 发送进度日志
  const [sendLog, setSendLog] = useState<LogEntry[]>([]);
  const [sendTotal, setSendTotal] = useState(0); // 本次发送总数
  const [sendResult, setSendResult] = useState<{
    total: number;
    successCount: number;
    failedCount: number;
  } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到日志底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sendLog]);

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  // 分组筛选
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const groups = ["all", ...Array.from(new Set(store.contacts.map(c => c.group ?? "").filter(Boolean)))];
  const visibleContacts = groupFilter === "all"
    ? store.contacts
    : store.contacts.filter(c => c.group === groupFilter);

  const handleSelectAll = () => {
    const allVisible = visibleContacts.map(c => c.id);
    const allSelected = allVisible.every(id => selectedContacts.includes(id));
    if (allSelected) {
      setSelectedContacts(prev => prev.filter(id => !allVisible.includes(id)));
    } else {
      setSelectedContacts(prev => Array.from(new Set([...prev, ...allVisible])));
    }
  };

  // 模板
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !subject.trim() || !body.trim()) return;
    await store.addTemplate({
      id: `tpl_${Date.now()}`,
      name: newTemplateName.trim(),
      subject,
      body,
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTemplateName("");
    setSavingTemplate(false);
  };

  const handleLoadTemplate = (id: string) => {
    const tpl = store.templates.find(t => t.id === id);
    if (tpl) { setSubject(tpl.subject); setBody(tpl.body); setShowTemplates(false); }
  };

  const handleSend = async () => {
    if (!store.emailConfig || selectedContacts.length === 0 || !subject.trim() || !body.trim()) return;

    // 清空上次结果
    setSendLog([]);
    setSendResult(null);
    setSendTotal(selectedContacts.length);

    // 注册进度回调
    store.onProgressUpdate = (index, _total, job, success, error) => {
      const contact = store.contacts.find((c) => c.id === job.contactId);
      setSendLog((prev) => [
        ...prev,
        {
          index,
          name: contact?.name ?? "未知",
          email: contact?.email ?? job.contactId,
          success,
          error,
          time: new Date().toLocaleTimeString("zh-CN"),
        },
      ]);
    };

    // 创建发送任务
    selectedContacts.forEach((contactId) => {
      const contact = store.contacts.find((c) => c.id === contactId);
      if (!contact) return;

      const personalizedSubject = subject
        .replace(/{name}/g, contact.name)
        .replace(/{email}/g, contact.email);
      const personalizedBody = body
        .replace(/{name}/g, contact.name)
        .replace(/{email}/g, contact.email);

      store.addToQueue({
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        contactId: contact.id,
        templateId: "manual",
        subject: personalizedSubject,
        body: personalizedBody,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });

    try {
      const result = await store.startSending();
      setSendResult({
        total: result.total,
        successCount: result.successCount,
        failedCount: result.failedCount,
      });
      // 清空表单
      setSubject("");
      setBody("");
      setSelectedContacts([]);
    } catch (err) {
      // 错误已在 store.error 中
    } finally {
      store.onProgressUpdate = null;
    }
  };

  // 预览：使用第一个选中联系人
  const previewContact =
    selectedContacts.length > 0
      ? store.contacts.find((c) => c.id === selectedContacts[0])
      : null;

  const previewSubject = previewContact
    ? subject.replace(/{name}/g, previewContact.name).replace(/{email}/g, previewContact.email)
    : subject;

  const previewBody = previewContact
    ? body.replace(/{name}/g, previewContact.name).replace(/{email}/g, previewContact.email)
    : body;

  const canSend =
    !store.isSending &&
    !!store.emailConfig &&
    selectedContacts.length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">发送邮件</h1>
        <p className="text-muted-foreground">撰写个性化邮件并批量发送给联系人</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：联系人选择 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>选择联系人</CardTitle>
                    <CardDescription>
                      {selectedContacts.length}/{store.contacts.length} 已选择
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={store.isSending}>
                  {visibleContacts.length > 0 && visibleContacts.every(c => selectedContacts.includes(c.id)) ? "取消全选" : "全选"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {store.contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">暂无联系人</h3>
                  <p className="mt-2 text-sm text-muted-foreground">请先导入联系人</p>
                </div>
              ) : (
                <>
                  {/* 分组筛选 tabs */}
                  {groups.length > 1 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {groups.map(g => (
                        <button
                          key={g}
                          onClick={() => setGroupFilter(g)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            groupFilter === g
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {g === "all" ? `全部 (${store.contacts.length})` : `${g} (${store.contacts.filter(c => c.group === g).length})`}
                        </button>
                      ))}
                    </div>
                  )}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {visibleContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                        selectedContacts.includes(contact.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      } ${store.isSending ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => handleContactToggle(contact.id)}
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => handleContactToggle(contact.id)}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-xs font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-muted-foreground">已选择</span>
                <span className="font-medium">{selectedContacts.length} / {store.contacts.length} 个联系人</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 右侧：编辑 + 进度 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 邮件编辑卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>撰写邮件</CardTitle>
                  <CardDescription>
                    使用 <code className="bg-muted px-1 rounded">{`{name}`}</code> 和{" "}
                    <code className="bg-muted px-1 rounded">{`{email}`}</code> 个性化内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标签页 + 模板按钮 */}
              <div className="flex items-center justify-between border-b pb-1">
                <div className="flex space-x-2">
                  <Button
                    variant={activeTab === "compose" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("compose")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    撰写
                  </Button>
                  <Button
                    variant={activeTab === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("preview")}
                    disabled={!previewContact}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    预览
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowTemplates(v => !v); setSavingTemplate(false); }}
                    className="text-muted-foreground"
                  >
                    <BookTemplate className="mr-1 h-4 w-4" />
                    模板 ({store.templates.length})
                  </Button>
                  {(subject || body) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSavingTemplate(v => !v)}
                      className="text-muted-foreground"
                    >
                      <Save className="mr-1 h-4 w-4" />
                      保存
                    </Button>
                  )}
                </div>
              </div>

              {/* 保存模板面板 */}
              {savingTemplate && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <input
                    className="flex-1 rounded border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="模板名称..."
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}>保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSavingTemplate(false)}>取消</Button>
                </div>
              )}

              {/* 模板列表面板 */}
              {showTemplates && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  {store.templates.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-4">暂无模板，撰写邮件后点「保存」创建</p>
                  ) : store.templates.map(tpl => (
                    <div key={tpl.id} className="flex items-center gap-2 rounded-md bg-white border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tpl.subject}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleLoadTemplate(tpl.id)}>载入</Button>
                      <button
                        onClick={() => store.deleteTemplate(tpl.id)}
                        className="text-muted-foreground hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "compose" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">邮件主题</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="可使用 {name} {email} 变量"
                      disabled={store.isSending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">邮件内容</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="可使用 {name} {email} 变量"
                      rows={10}
                      disabled={store.isSending}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="border-b pb-2">
                    <p className="text-xs text-muted-foreground">收件人</p>
                    <p className="font-medium text-sm">
                      {previewContact?.name} ({previewContact?.email})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">主题</p>
                    <p className="font-medium">{previewSubject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">内容</p>
                    <div className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">{previewBody}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex w-full items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-sm">
                    {store.emailConfig ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        邮箱已连接
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-700">
                        <X className="h-4 w-4 text-red-500" />
                        请先配置邮箱
                      </span>
                    )}
                    {selectedContacts.length > 0 && (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {selectedContacts.length} 个联系人
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {store.isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送中 {store.sendProgress}%
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      发送给 {selectedContacts.length} 个联系人
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* 实时进度卡片：发送中或已完成时显示 */}
          {(store.isSending || sendLog.length > 0) && (
            <Card className={store.isSending ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-2 ${store.isSending ? "bg-blue-100" : "bg-green-100"}`}>
                      {store.isSending ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className={store.isSending ? "text-blue-800" : "text-green-800"}>
                        {store.isSending ? "发送进度" : "发送完成"}
                      </CardTitle>
                      {sendResult && (
                        <CardDescription className="text-green-700">
                          成功 {sendResult.successCount} 封，失败 {sendResult.failedCount} 封，共 {sendResult.total} 封
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {!store.isSending && (
                    <button
                      onClick={() => { setSendLog([]); setSendResult(null); }}
                      className="text-muted-foreground hover:text-foreground p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 进度条 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{sendLog.length} / {sendTotal} 封</span>
                    <span>{store.sendProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${store.isSending ? "bg-blue-500" : "bg-green-500"}`}
                      style={{ width: `${store.sendProgress}%` }}
                    />
                  </div>
                </div>

                {/* 统计行 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/60 p-2">
                    <p className="text-lg font-bold text-blue-700">
                      {store.isSending
                        ? store.sendQueue.filter(j => j.status === "sending").length
                        : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">发送中</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-2">
                    <p className="text-lg font-bold text-green-700">
                      {sendLog.filter(l => l.success).length}
                    </p>
                    <p className="text-xs text-muted-foreground">已成功</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-2">
                    <p className="text-lg font-bold text-red-700">
                      {sendLog.filter(l => !l.success).length}
                    </p>
                    <p className="text-xs text-muted-foreground">已失败</p>
                  </div>
                </div>

                {/* 实时日志 */}
                <div className="rounded-lg bg-white/70 border overflow-hidden">
                  <div className="px-3 py-2 border-b bg-white/50 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">发送日志</span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                    {sendLog.length === 0 && store.isSending && (
                      <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        准备发送...
                      </div>
                    )}
                    {sendLog.map((entry, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                          entry.success ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {entry.success ? (
                          <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate max-w-[120px]">{entry.name}</span>
                        <span className="text-muted-foreground truncate flex-1 text-xs">{entry.email}</span>
                        {entry.error && (
                          <span className="text-red-600 text-xs truncate max-w-[100px]" title={entry.error}>
                            {entry.error}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs flex-shrink-0">{entry.time}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* store 错误提示 */}
          {store.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{store.error}</p>
              <button onClick={() => store.clearError()} className="ml-auto text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
