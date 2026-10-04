# PaperFlow 真机验收记录

日期：2026-10-04。有线连接的 iPhone 14，iOS 27.0（24A437），Xcode 27.0（27A266a）。最低部署目标为 iOS / iPadOS 18.0；此设备不能证明 iOS 18 兼容性。

结论：主 App 和分享扩展已完成签名、安装与实际运行。首轮 35 个不同自动化用例均有通过证据；随后输出审计新增 1 个 OCR 文本用例，累计 36 个不同用例有通过记录。真实 Files 保存 / 导入、默认目录重启恢复、重名保护和分享扩展导入链路通过。完整输出与 UI 签收、纸张实拍及下文设备 / 服务条件仍待验收，不能据此标记全部真机测试完成。

## 构建与本轮变更

- 设备已配对，开发者模式已开启，已解锁并成功运行 App。
- Team `3LSP26D33P` 的主 App 和分享扩展均取得有效开发描述文件，包含 `group.com.xiaolongxu.PaperFlow` App Group 和测试设备。未移除扩展或 App Group。
- 主 App：`com.xiaolongxu.PaperFlow`；分享扩展：`com.xiaolongxu.PaperFlow.Share`。
- 首次签名请求因 Apple 连接错误失败；同步账号与描述文件后，真机 `build-for-testing` 成功。产品：`.native-build/DeviceQA/Build/Products/Debug-iphoneos/PaperFlow.app`。构建证据：[构建日志](../artifacts/device-qa/2026-10-04/paperflow-device-build-retry.log)。
- 此次仅调整测试代码：扫描 UI 测试区分真机与模拟器，并处理相机授权；StoreKit 测试在商品或交易缺失时立即失败，权益轮询避免重复查询商品。未修改生产购买逻辑或绕过真实购买权益。

## 自动化结果

| 批次 | 结果 | 证据与解释 |
| --- | --- | --- |
| 首次完整真机回归 | 35 项，34 通过、1 失败；其中 UI 16/16 | [完整结果摘要](../artifacts/device-qa/2026-10-04/full-regression-summary.json)、`full-regression.xcresult`、[完整日志](../artifacts/device-qa/2026-10-04/full-regression.log)。该 xcresult 的最终状态仍为 Failed，不能称为全绿。 |
| StoreKit 正确 Scheme 定向复测 | 1/1 通过 | [复测摘要](../artifacts/device-qa/2026-10-04/storekit-summary.json)、`storekit-scheme-targeted.xcresult`、[复测日志](../artifacts/device-qa/2026-10-04/storekit-targeted.log)。此用例与首次失败项相同，不重复计数。 |

首次完整回归直接使用生成的 `.xctestrun`，未激活 Scheme 的本地 StoreKit 配置。商品查询连接 Apple Sandbox 后返回 `4040003`，本地买断用例失败。改用工程 `PaperFlow` Scheme 的本地配置后，该用例验证买断、恢复、退款撤销及额度权益同步通过，全程没有真实付款。它不证明 App Store Connect 商品或线上沙盒购买可用。

期间一次选择器遗漏 Swift Testing 方法尾部 `()`，`storekit-scheme-retry.xcresult` 执行 0 个用例，不计入通过结果。正确复测命令如下；复用时需要换一个未存在的结果目录：

```sh
xcodebuild -project PaperFlow/PaperFlow.xcodeproj -scheme PaperFlow \
  -destination 'platform=iOS,id=00008110-000A2D043C8A401E' \
  -derivedDataPath .native-build/DeviceQA \
  -parallel-testing-enabled NO -collect-test-diagnostics never \
  '-only-testing:PaperFlowTests/PaperFlowTests/localStoreKitPurchaseRestoreAndRevocationUpdateVerifiedEntitlement()' \
  -resultBundlePath artifacts/device-qa/2026-10-04/storekit-scheme-targeted.xcresult \
  test-without-building
```

已覆盖的原生回归包括编辑后分享、打码确认、密码与权限保留、参数隔离、签名直接放置、页面顺序、OCR 额度和取消、工作空间 / 草稿恢复、批处理、流程上下文及扫描页面数据。UI 回归包含 19 路由巡检、压缩、OCR、合并、结果继续处理、深色设置持久化、流程暂停 / 恢复、连续数字输入、签名画板、横屏、大字号和扫描页面操作。

真机扫描 UI 回归确认相机授权与启动、拍摄 / 照片 / 闪光灯控件可用、照片取消、返回以及无相机降级提示未出现。扫描成页 / PDF 用例使用测试图片，不能替代真实纸张成像、闪光灯曝光或方向验收。

导出 54 张真机 UI 测试截图，见 [截图索引](../artifacts/device-qa/2026-10-04/screenshots/manifest.json)。已检查 [12 页关键布局合图](../artifacts/device-qa/2026-10-04/screenshots/layout-review.jpg)，本轮未发现新的布局阻塞；这不等同于所有画面逐像素与 HTML 原型一致的证明。

## 输出与 UI 补充审计

本轮补查发现并修正 OCR TXT / Markdown 与复制文字在页面重排后顺序 / 页码错误，以及 14 个 UI 图标资源缺失。新增真实文本文件回读用例，批量拆分补充每个 PDF 的页数与来源文字核对。真机修正后 21/21（20 项模型 + 1 项 OCR UI）通过，19 路由 UI 巡检再次通过，最终构建重新安装。之前“未修改生产逻辑”描述的是首轮真机准备；本轮修改了 OCR 文本输出逻辑和图标资源，购买逻辑未改。

原先 54 张截图已作合图复核，并保留图标修正后 19 张路由截图。输出内容验证、数据测试与视觉验收不能互相替代；范围、失败 / 修正证据及仍缺的验收见 [输出、数据与 UI 验收覆盖](acceptance-coverage.md)。

## 普通 App 的系统链路验收

以下操作使用普通启动的已签名 App，没有 `--ui-testing` 或 Pro 测试解锁。只处理 App 自带的示例 PDF 和本次生成的测试文件。

| 链路 | 实际操作与结果 | 截图 |
| --- | --- | --- |
| Files 保存与重新导入 | 压缩示例 PDF 后命名为 `202610.pdf`，用系统选择器保存到独立目录“我的 iPhone / 202610041500”。重新从 Files 导入，阅读器显示 8 页、879 KB，示例首页正确。 | [保存文件](../artifacts/device-qa/2026-10-04/files-saved-pdf.png)、[重新导入](../artifacts/device-qa/2026-10-04/files-reimported.png) |
| 默认目录书签恢复 | 将该 QA 目录设为默认导出目录，结束进程并重新启动后，设置恢复目录名称。随后再次重启，整理 PDF 并保存成功，无需再次选择目录。 | [重启恢复目录](../artifacts/device-qa/2026-10-04/default-folder-after-relaunch.png) |
| 防覆盖与副本可读性 | 倒序整理生成 `202610_整理.pdf`，连续保存两次。Files 中原文件、整理文件和 `202610_整理_2.pdf` 共存。再次导入 `_2` 副本，阅读器显示 8 页、879 KB，首页为倒序后的“项目计划附件”。 | [三个文件共存](../artifacts/device-qa/2026-10-04/files-duplicate-preserved.png)、[副本阅读](../artifacts/device-qa/2026-10-04/files-duplicate-reimported.png) |
| 真实分享扩展 | 系统分享菜单 → 更多 → 纸间 → 导入文件，扩展提示成功导入 1 个文件。重新启动主 App，消费共享收件箱并打开 `202610_整理.pdf`，页数、大小、首页正确。 | [扩展成功](../artifacts/device-qa/2026-10-04/share-extension-import-success.png)、[主 App 阅读](../artifacts/device-qa/2026-10-04/share-import-reader.png) |
| 收件箱不重复消费 | 分享导入后文件列表为 8 个，再次结束进程 / 启动仍为 8 个。此计数记录在补充导入 `_2` 副本之前。 | [首次消费后的列表](../artifacts/device-qa/2026-10-04/share-import-files.png)、[再次重启](../artifacts/device-qa/2026-10-04/share-after-second-relaunch.png) |
| 测试设置恢复与交付 | 默认导出目录已还原为“每次导出时选择位置”。App 已结束进程后普通启动到工作台，Device Hub 的键盘捕获保持关闭。 | [设置还原](../artifacts/device-qa/2026-10-04/default-folder-reset.png)、[普通启动工作台](../artifacts/device-qa/2026-10-04/normal-launch-home.png) |

此次普通压缩消耗 1 次免费额度，设置页确认压缩剩余 2/3、扫描和 OCR 各剩余 3/3。测试 PDF 保留在上述 QA 目录和 App 的最近文件中，方便复核。

`devicectl` 列出 App Group 收件箱时发生 StreamingAction 错误；根目录列表仅返回 Library，不能用它证明收件箱状态。分享扩展验收依据是实际扩展成功提示、主 App 阅读结果及重启前后文件计数，诊断 JSON 仅作辅助记录。

## 尚未完成的验收

- **真实纸张相机链路**：需要把后置镜头对准一张不含私人信息的纸质文档，四边可见。尚未验证手动成像、自动检测 / 拍摄、实际闪光曝光、横竖方向、边缘裁剪及实拍 PDF 清晰度。相机按钮可用不代表这些项目通过。
- **iOS 18 / iPadOS 18 兼容性**：本机仅有较新模拟器 runtime，当前 iPhone 为 iOS 27；仍需相应系统设备或 runtime。
- **真实 iPad**：系统分屏、多窗口、Apple Pencil 和硬件交互；已有 iPad 模拟器回归不能替代这些验收。
- **外部文件提供方生命周期**：iCloud 下载 / 恢复、提供方权限变化、默认目录被移动或失效等；本次已通过的是本机 QA 目录跨 App 重启的恢复与保存。
- **Apple 线上购买服务**：App Store Connect 沙盒购买、线上恢复与家庭共享；本地 StoreKit 通过不能替代该服务验收。

发布前需要补齐上述适用项目。本记录中的通过范围仅对应保留的测试结果及实际操作证据。
