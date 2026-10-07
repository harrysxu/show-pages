# PaperFlow 安全与数据处理说明

**面向技术评审、隐私审核和安全复核 · 版本 1.0 · 2026-10-04**

## 数据边界

PaperFlow 采用本地优先架构。PDF、图片、OCR 结果、签名、表单值、草稿和工作流程均写入应用容器、用户选择的 Files 位置或系统 App Group 暂存目录。当前版本没有 PaperFlow 自有账号、云端文件 API、远程 OCR 或上传接口。

```text
Files / Photos / Camera / Share Sheet
                │
                ▼
     本机导入与安全作用域 URL
                │
                ▼
     SwiftUI App + PaperFlowDomain
       ├─ PDFKit / QPDF 处理
       ├─ Vision 设备端 OCR
       ├─ 本地持久化与额度记录
       └─ Files / Share Sheet 导出
```

## 存储与生命周期

1. 原始文件导入到应用工作区后，以只读来源记录保存；处理操作生成新的文件记录。
2. 缩略图、草稿、撤销栈和批处理检查点只为恢复任务服务，可在设置中清理。
3. 分享扩展先写入带随机目录的 `.pending` 文件，复制完成并设置文件保护后再原子移动为可消费文件。
4. 主 App 使用窗口级占用标记消费 Inbox，避免启动和场景激活并发导致重复导入。
5. 密码文件在解锁完成或用户取消后分别清理 / 保留待重试状态，不把密码写入持久化快照。

## 加密与敏感操作

- App Group 暂存文件使用 `FileProtectionType.complete`。
- PDF 密码保护使用 QPDF 的 PDF 加密输出；用户密码不保存到工作区快照。
- 永久打码会生成新页面内容，移除文本层、注释、附件和元数据，并执行复制、搜索、文本提取和对象结构检查。
- 源文件默认不覆盖。删除工作区和个人信息需要用户主动操作。

## 权限和系统接口

应用只在对应任务触发时请求相机、照片和 Files 访问。没有后台上传任务，也没有用于广告或跨 App 跟踪的系统接口。`PrivacyInfo.xcprivacy` 声明当前数据收集数组为空；UserDefaults、文件时间和磁盘空间访问均用于本地设置、文件整理和输出前检查。

## 第三方组件

QPDF 用于 PDF 结构处理和加密，libjpeg 用于图像编码，Lucide 用于界面图标。组件在 App 包内运行，不会将文件发送给组件维护者。版本和许可证见 App 包内的 `QPDF-LICENSE.txt`、`JPEG-LICENSE.txt` 和 `LUCIDE-LICENSE.txt`。

## 审核证据

当前验收覆盖真实 PDF / TXT / Markdown 回读、表单值、OCR 输出、密码保护、分享扩展 Inbox、三语文案、Release 资源隔离和 arm64 模拟器构建。验收报告会列明设备、系统版本、证据文件及尚未覆盖的真实硬件 / 系统服务边界。

相关公开资料：

- [隐私政策](privacy-policy.md)
- [技术方案](technical-design.md)
- [App Review 测试说明](app-review-notes.md)
