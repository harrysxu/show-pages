# PaperFlow App Review 测试说明

**版本 1.0 · 2026-10-04**

## 应用概览

PaperFlow（纸间）是 iPhone 和 iPad 上的本地 PDF 工作台。用户无需登录即可导入 PDF / 图片、扫描纸张、OCR、压缩、合并、拆分、签名、填写表单、批量处理并导出结果。

## 审核员快速路径

1. 从首页点击 **Import files**，选择系统示例文件，打开阅读器。
2. 在阅读器底部点击 **Process**，选择 **Compress**，选择档位并运行。结果页可以保存到 Files 或分享。
3. 返回首页点击 **Scan document**。没有相机的模拟器会显示照片入口；真实设备可以允许相机后扫描纸张。
4. 在工具页打开 **OCR**、**Sign**、**Organize** 或 **Protect**，每个任务都可以先查看选项再生成新的 PDF。
5. 从系统分享面板选择 PaperFlow，点击 **Import files**，打开 PaperFlow 后会自动消费 Inbox 并打开导入的 PDF。
6. 设置 → PaperFlow → Language 可以切换 English、简体中文和繁體中文；用户文件名和正文不会被翻译。

## 权益与购买

应用提供免费额度和一次性 Pro 买断。购买、恢复购买和撤销由 StoreKit 处理。审核环境可使用本地 StoreKit 配置验证流程；正式 App Store 商品、价格和家庭共享以 App Store Connect 配置为准。应用不会在启动、扫描或处理进度中强制弹出购买页面。

## 隐私与网络

PaperFlow 不要求账号，不上传用户文件，不依赖网络完成导入、OCR、PDF 处理或导出。相机和照片权限只在用户主动选择对应任务时请求。详细说明见 [隐私政策](privacy-policy.md) 和 [安全与数据处理说明](security-and-data.md)。

## 支持的环境

- 设备：iPhone 和 iPad。
- 最低部署目标：iOS / iPadOS 18.0。
- 当前验收：Apple Silicon arm64 模拟器，iOS / iPadOS 26.4、26.5 和 iOS 27.0。
- 真实相机、Apple Pencil、iPad 分屏、线上 App Store 沙盒和家庭共享需要对应硬件或服务环境。

## 审核资料索引

- [隐私政策](privacy-policy.md)
- [安全与数据处理说明](security-and-data.md)
- [技术方案](technical-design.md)

正式提交前，发行方应在 App Store Connect 中补齐支持邮箱、隐私联系信息、产品价格和审核备注中的测试账号字段（PaperFlow 本身不需要账号）。
