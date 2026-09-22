# Markora GitHub Pages 文档

这个目录包含 Markora 的中英文隐私政策、用户协议、订阅说明、支持页面、数据请求说明，以及扫描/OCR/PDF 导出说明。公开文案以本目录为准，iOS 项目中的发布前模板不应直接作为最终政策发布。

## 页面评估与用途

- 隐私政策：说明设备端处理、恢复草稿、Apple 购买、文件同步、网站托管和支持平台的数据行为，供 App 内和 App Store 隐私政策入口使用。
- 用户协议：说明使用规则、内容权利、订阅及责任边界；应用许可另以 App Store 实际采用的 EULA 为准。
- 订阅说明：解释自动续期、取消、恢复和退款，在付费入口提供。
- 扫描/OCR/导出说明：作为用户协议的补充，说明辅助识别和重新排版的限制，不以笼统免责声明替代产品质量责任。
- 支持和数据删除：提供故障反馈与本地删除指引，避免误删共享资源。

无需再新建一份重复的通用免责声明，也不需要为当前不存在的账号或广告跟踪编造流程。

## 公开地址

基址：`https://harrysxu.github.io/show-pages/markora/`。下表为部署后的固定路径；英文页面在路径中增加 `-en`，例如 `privacy-en/`。

| 用途 | 路径 |
| --- | --- |
| 文档中心 | `/show-pages/markora/` |
| 隐私政策 | `/show-pages/markora/privacy/` |
| 用户协议 | `/show-pages/markora/terms/` |
| 订阅说明 | `/show-pages/markora/subscription/` |
| 支持 | `/show-pages/markora/support/` |
| 数据删除 | `/show-pages/markora/data-requests/` |
| 扫描/OCR/导出 | `/show-pages/markora/scan-notice/` |

App Store Connect 的 Privacy Policy URL 使用隐私政策地址，Support URL 使用支持地址。采用 Apple 标准 EULA 时，链接为 <https://www.apple.com/legal/internet-services/itunes/dev/stdeula/>；本地 StoreKit 测试配置不代表 App Store Connect 已完成配置。

更新网站不会自动更新 App 内硬编码的法律摘要。App 内若需展示完整内容，应接入已发布的对应链接或同步离线全文，并确保入口可见。新增扫描说明链接需部署验证后再接入 App。

提审参考文案保留在 [APP_STORE_CONNECT_COPY.md](APP_STORE_CONNECT_COPY.md)，它不是面向用户的政策，也不代表全部功能文案已按当前版本核验。

## 开启 GitHub Pages

如果使用仓库 `harrysxu/show-pages`：

1. 将本目录提交并推送到默认分支（通常是 `main`）。
2. 打开仓库 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择默认分支和 **`/ (root)`**，保存。
5. 等待 GitHub Actions / Pages 构建完成后，访问 `https://harrysxu.github.io/show-pages/markora/`。

页面通过 front matter 的 `permalink` 固定在 `/markora/` 路径下，GitHub 项目站点会加上 `/show-pages` 前缀。若改为独立仓库或自定义域名，需要一并核对 `baseurl` 和固定链接。

## 发布前检查

- 确认 GitHub 仓库的公开可见性满足您的发布计划。
- 确认 GitHub Issues 是您愿意公开提供的支持入口；不要在问题中接收敏感资料。
- 正式发布前，补充真实运营主体名称和可用于隐私请求的私密联系邮箱，并保持隐私政策、用户协议、支持页面与 App Store 信息一致。目前仅有公开 GitHub Issues 入口，不应在其中收集敏感个人信息；不要填写虚构主体或邮箱。
- 价格、税费、优惠和退款以 Apple App Store 页面为准，不要把测试环境金额直接写入公开页面。
- 每次发布后检查中英文页面、语言切换、相对链接和新增路径均可公开访问。2026-09-22 已验证线上既有中文隐私政策返回 HTTP 200；本次本地更新仍需提交、推送并等待 Pages 部署，不能据此认定新页面已上线。
