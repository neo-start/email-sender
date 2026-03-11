import { observer } from "mobx-react-lite";
import { useStore } from "../App";
import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";

export const SendPage = observer(() => {
  const store = useStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === store.contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(store.contacts.map((c) => c.id));
    }
  };

  const handleSend = async () => {
    if (!store.emailConfig) {
      alert("请先配置邮箱");
      return;
    }

    if (selectedContacts.length === 0) {
      alert("请选择至少一个联系人");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      alert("请填写邮件主题和内容");
      return;
    }

    // 确认发送
    const confirmSend = window.confirm(
      `确定要发送邮件给 ${selectedContacts.length} 个联系人吗？\n\n` +
        "注意：Gmail 每日限制 500 封邮件，超过限制将自动分批发送。",
    );

    if (!confirmSend) {
      return;
    }

    setIsSending(true);

    try {
      // 为每个选中的联系人创建发送任务
      const jobs = selectedContacts
        .map((contactId) => {
          const contact = store.contacts.find((c) => c.id === contactId);
          if (!contact) return null;

          // 替换变量
          let personalizedBody = body;
          let personalizedSubject = subject;

          personalizedBody = personalizedBody.replace(/{name}/g, contact.name);
          personalizedBody = personalizedBody.replace(
            /{email}/g,
            contact.email,
          );

          personalizedSubject = personalizedSubject.replace(
            /{name}/g,
            contact.name,
          );
          personalizedSubject = personalizedSubject.replace(
            /{email}/g,
            contact.email,
          );

          return {
            id: `job_${Date.now()}_${Math.random()}`,
            contactId: contact.id,
            templateId: "manual",
            subject: personalizedSubject,
            body: personalizedBody,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      // 添加到发送队列
      jobs.forEach((job) => {
        if (job) store.addToQueue(job);
      });

      // 开始发送
      const result = await store.startSending();

      alert(
        `邮件发送完成！\n\n` +
          `总计: ${result.total} 封\n` +
          `成功: ${result.successCount} 封\n` +
          `失败: ${result.failedCount} 封`,
      );

      // 清空表单
      setSubject("");
      setBody("");
      setSelectedContacts([]);
    } catch (error) {
      alert(
        "发送失败: " + (error instanceof Error ? error.message : "未知错误"),
      );
    } finally {
      setIsSending(false);
    }
  };

  // 预览邮件内容（使用第一个选中的联系人作为示例）
  const previewContact =
    selectedContacts.length > 0
      ? store.contacts.find((c) => c.id === selectedContacts[0])
      : null;

  const previewSubject = previewContact
    ? subject
        .replace(/{name}/g, previewContact.name)
        .replace(/{email}/g, previewContact.email)
    : subject;

  const previewBody = previewContact
    ? body
        .replace(/{name}/g, previewContact.name)
        .replace(/{email}/g, previewContact.email)
    : body;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">发送邮件</h1>
        <p className="text-muted-foreground">
          撰写个性化邮件并批量发送给联系人
        </p>
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
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedContacts.length === store.contacts.length
                    ? "取消全选"
                    : "全选"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">暂无联系人</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    请先导入联系人才能发送邮件
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {store.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        selectedContacts.includes(contact.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() =>
                            handleContactToggle(contact.id)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-medium">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      {contact.group && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {contact.group}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">已选择</span>
                  <span className="font-medium">
                    {selectedContacts.length} 个联系人
                  </span>
                </div>
                {selectedContacts.length > 500 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-700">
                      超过 Gmail 每日限制，将自动分批发送
                    </p>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 右侧：邮件编辑和预览 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>撰写邮件</CardTitle>
                  <CardDescription>
                    使用变量 {`{name}`} 和 {`{email}`} 个性化邮件内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 标签页切换 */}
              <div className="flex space-x-2 border-b">
                <Button
                  variant={activeTab === "compose" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("compose")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  撰写
                </Button>
                <Button
                  variant={activeTab === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("preview")}
                  className="flex items-center gap-2"
                  disabled={!previewContact}
                >
                  <Eye className="h-4 w-4" />
                  预览
                </Button>
              </div>

              {activeTab === "compose" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">邮件主题</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="邮件主题，可使用 {name} {email} 变量"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">邮件内容</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="邮件内容，可使用 {name} {email} 变量"
                      rows={12}
                    />
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="mb-2 font-medium">变量使用说明</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <code className="rounded bg-primary/10 px-2 py-1 font-mono">
                          {`{name}`}
                        </code>
                        <p className="text-muted-foreground">
                          替换为联系人姓名
                        </p>
                      </div>
                      <div className="space-y-1">
                        <code className="rounded bg-primary/10 px-2 py-1 font-mono">
                          {`{email}`}
                        </code>
                        <p className="text-muted-foreground">
                          替换为联系人邮箱
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">收件人</p>
                        <p className="text-sm text-muted-foreground">
                          {previewContact?.name} ({previewContact?.email})
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        预览模式
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          主题
                        </p>
                        <p className="font-medium">{previewSubject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          内容
                        </p>
                        <div className="mt-2 whitespace-pre-wrap rounded bg-muted p-3">
                          {previewBody}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>预览显示第一个选中联系人的个性化邮件内容</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex w-full items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">发送准备</p>
                  <div className="flex items-center gap-2 text-sm">
                    {store.emailConfig ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">邮箱已连接</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">请先配置邮箱</span>
                      </div>
                    )}
                    {selectedContacts.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">
                          {selectedContacts.length} 个联系人已选择
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    selectedContacts.length === 0 ||
                    !store.emailConfig
                  }
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      发送中...
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

          {/* 发送状态卡片 */}
          {store.sendQueue.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800">发送队列</CardTitle>
                    <CardDescription className="text-green-700">
                      正在处理邮件发送任务
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        待发送
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {
                          store.sendQueue.filter(
                            (job) => job.status === "pending",
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        已发送
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {
                          store.sendQueue.filter(
                            (job) => job.status === "sent",
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">失败</p>
                      <p className="text-2xl font-bold text-green-700">
                        {
                          store.sendQueue.filter(
                            (job) => job.status === "failed",
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-green-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${(store.sendQueue.filter((job) => job.status === "sent").length / store.sendQueue.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 发送统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  总联系人
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  已选择
                </p>
                <p className="text-2xl font-bold">{selectedContacts.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  邮箱状态
                </p>
                <p className="text-2xl font-bold">
                  {store.emailConfig ? "已连接" : "未连接"}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
