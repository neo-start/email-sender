# 邮件发送工具

基于 Electron + React + TypeScript 的桌面批量邮件发送工具。

## 功能

- **邮箱连接**：支持 Gmail（应用专用密码）和任意 SMTP，连接后可一键断开
- **联系人管理**：CSV 批量导入（带预览/重复检测）、手动添加、分组标签、搜索、删除、导出
- **批量发送**：按分组筛选收件人、变量替换 `{name}` `{email}`、邮件预览、实时进度条 + 滚动日志
- **模板**：保存/载入/删除常用邮件模板
- **发送记录**：历史查询（按状态过滤、关键词搜索）、失败重发、发送队列管理

## 技术栈

- Electron 41 + electron-vite
- React 19 + TypeScript
- MobX（状态管理）
- Tailwind CSS + CVA（UI）
- Nodemailer（邮件发送）
- PapaParse（CSV 解析）

## 开发

```bash
pnpm install
pnpm dev        # 启动开发模式（Electron 窗口）
pnpm build      # 构建
pnpm package    # 打包为可分发应用
```

## 数据存储

所有数据存储在本地：`~/Library/Application Support/email-sender/data/`
- `config.json` 邮箱配置
- `contacts.json` 联系人
- `history.json` 发送记录
- `templates.json` 邮件模板

## 使用说明

1. 打开「邮箱连接」，配置 Gmail 或 SMTP
2. 打开「联系人」，导入 CSV 或手动添加
3. 打开「发送邮件」，选择收件人、撰写内容、点击发送
4. 在「发送记录」查看历史，对失败邮件一键重发
