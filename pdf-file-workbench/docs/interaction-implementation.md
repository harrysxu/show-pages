# PaperFlow 交互简化实施记录

日期：2026-10-01。范围：iOS / iPadOS 原生应用，保留现有功能，依据用户确认的 [交互评审](interaction-ux.md) 实施。HTML 原型尚未同步；后续 UI 验收应以本轮原生实现与截图为准。

## 用户路径

| 场景 | 当前行为 |
| --- | --- |
| 首页与文件 | 默认不选示例；首次使用不展示空流程区；最近文件菜单直接进入常用处理；iPad 工具分组折叠 |
| 导入与返回 | 从工具导入后进入该工具；批处理导入留在批处理并选中新文件；取消清理待执行上下文；返回恢复文件、页码、选择与范围 |
| 阅读 | 处理入口直接可见；阅读模式、适应方式与背景优先，数值选项折叠 |
| 压缩 | 默认平衡档位；大小限制可选；无目标时只按档位执行，不反复降质；空值 / 无效目标提示并阻止执行 |
| 整理与合并 | 页面网格为主体；选择后固定旋转 / 提取 / 删除；完成固定；合并展示可调整的文件顺序，普通任务直接生成结果 |
| 签名与表单 | 在签署任务中创建签名后直接放到当前页；资料管理仅保存到库；完成签署固定；表单与标注保留独立模式 |
| OCR | 默认识别并生成可搜索 PDF；提取文字可按页查看、修改、搜索和复制；复用已有识别结果不重复计次 |
| 页码与水印 | 常用内容、位置与范围摘要直接可见；完整参数按需展开；只执行当前工具的输出选项 |
| 打码与保护 | 打码应用 / 分享保留永久处理确认；密码保护默认只改变保护状态，权限与隐私清理独立选择 |
| 批处理 | 参数在当前面板内编辑；导入与选文件保留任务；合并顺序明确；固定开始 / 继续 / 保存全部结果 |
| 常用流程 | 步骤参数分组折叠；人工步骤统一下一步；OCR 未识别时先识别；可暂停到首页、恢复或确认结束 |
| 结果与设置 | 结果页固定保存 / 分享；继续处理选择工具并携带生成文件；比较、重命名等放更多菜单；设置分组，清理位于数据管理 |
| 快捷指令试运行 | 明确选择文件与流程；OCR 和合并实际生成输出 |

## 输出与数据行为

- 编辑分享先生成实际 PDF，包含当前页面顺序、标注、签名和表单内容；有打码区域时必须确认安全重建。
- 编辑加密文件后的分享保留来源密码与权限，避免生成不受保护的分享副本。
- 单工具显式构建输出选项；导出接口要求传入选项，不再从全局配置隐式取值。
- PDFKit 页面组装遗漏的目录附件通过 QPDF 恢复。普通非栅格输出、默认加密保留附件；用户明确清理或永久打码时按相应语义移除。
- 压缩 `targetMB = 0` 表示不限制大小。负数与非有限值不能执行；显式目标达不到时保留结果与警告。
- 多文件导入遇到加密文件时保留前面已导入的文件，解锁后继续处理剩余文件。
- 撤销恢复编辑状态；切换文档重置单次范围，返回原任务恢复范围；测试工作空间使用独立目录避免相互覆盖。

## 布局修订

- 整理、签署、OCR、页码、水印、打码、保护、批处理与结果页主命令固定，参数与内容单独滚动。
- 整理页在内容高度小于 300 点时采用紧凑顶部，给缩略图保留可用空间。
- 签名预览在低高度下保持可读宽度并支持滚动；签名画板适应弹层尺寸，保存固定。
- 输入框使用最小高度与垂直内边距适配大字号；数值输入保留本地文本，允许清空后连续输入。
- iPad 数字输入采用带完成键的键盘类型；系统开关保留固有尺寸，移除造成裁切的缩放。
- 小于 800 点的应用窗口宽度使用紧凑布局。系统分屏实际操作仍列为待验收项。

## 验证证据

以下路径均相对于仓库根目录；模拟器 runtime 均为 26.5。

| 测试 | 结果 | 证据 |
| --- | --- | --- |
| Swift Package | 19 项处理集成 + 9 项领域测试通过 | `artifacts/native-ui/interaction-optimized/package-tests.log` |
| 原生模型全量 | 19 项、3 个 suite 通过，含 StoreKit 本地购买 / 恢复 / 撤销 | `artifacts/native-ui/interaction-optimized/native-final.xcresult` |
| iPhone 14 基础 UI | 12 项通过，包含 19 路由巡检 | `artifacts/native-ui/interaction-optimized/iphone.xcresult` |
| iPad Air 11 基础 UI | 12 项通过，包含 19 路由巡检 | `artifacts/native-ui/interaction-optimized/ipad.xcresult` |
| iPhone 补充 UI | 流程、合并、数字输入、横屏签名画板、大字号 / 横屏 5 项通过 | `artifacts/native-ui/interaction-optimized/iphone-final.xcresult` |
| iPad 补充 UI | 流程、合并、数字输入、签名画板通过；大字号 / 横屏最终复测通过 | `ipad-verified.xcresult` 的 4 项通过记录与 `ipad-layout.xcresult` 的 2 项通过记录，均在上述目录 |
| iPhone SE 3 | 小屏大字号 / 横屏、数字输入、横屏签名画板 3 项通过 | `artifacts/native-ui/interaction-optimized/compact.xcresult` |
| 最后批处理修订 | 10 项交互模型 + iPhone 批处理 UI 通过 | `artifacts/native-ui/interaction-optimized/batch-validation.xcresult` |
| 最后批处理修订，iPad | 无效大小提示 / 阻止启动、关闭限制后实际处理并进入保存结果状态通过 | `artifacts/native-ui/interaction-optimized/ipad-batch-validation.xcresult` |

UI 测试共有 16 个独立方法。基础集与补充集包含重复场景，表中次数不可直接相加为独立用例数。iPad 早期大字号检查使用虚拟布局节点定位预览失败，改用真实页面图片标识并等待后，最终布局复测通过。早期失败结果保留用于诊断，不作为最终通过证据。

截图在上述目录的 `iphone/`、`ipad/`、`iphone-final/`、`ipad-layout/`、`compact/`、`batch-validation/` 和 `ipad-batch-validation/` 子目录；各自 `manifest.json` 对应测试与可读名称。已人工检查小屏竖横屏整理、签名、页码、水印、OCR、保护、数字键盘与签名画板，以及 iPad 签名布局和键盘可达性。主命令测试检查可点击性与屏幕范围，签名预览检查真实图片宽度；输出测试读取实际 PDF，核对文字、顺序、密码权限、附件及打码后不可提取内容。

主要验证命令：

```sh
swift test --package-path PaperFlow/Packages/PaperFlowKit

xcodebuild -project PaperFlow/PaperFlow.xcodeproj -scheme PaperFlow \
  -destination 'platform=iOS Simulator,id=A47073E5-EF1E-4888-A1AF-73D2EA012B7C' \
  -derivedDataPath .native-build/SignedSim CODE_SIGN_IDENTITY=- \
  -parallel-testing-enabled NO -only-testing:PaperFlowTests test

xcodebuild -project PaperFlow/PaperFlow.xcodeproj -scheme PaperFlow \
  -destination 'platform=iOS Simulator,id=645C8CC2-8437-46B6-B615-ED8CB626F396' \
  -derivedDataPath .native-build/InteractionPad CODE_SIGN_IDENTITY=- \
  -parallel-testing-enabled NO -only-testing:PaperFlowUITests test
```

StoreKit 测试曾临时添加独立的 localhost / 127.0.0.1 代理绕过项，测试结束已恢复原配置。DEBUG 的 Pro UI fixture 仅在 `--ui-testing` 与 `--pro-fixture` 同时存在时启用，真实 StoreKit 测试不使用此绕过。

## 验收边界

2026-10-04 更新：真机签名环境已解决，iPhone 14 / iOS 27.0 已完成原生与 UI 回归、本机 Files 目录跨重启书签恢复和真实分享扩展验收，见 [真机验收记录](device-testing.md)。仍无 iOS 18 模拟器 runtime；真实 iOS 18 兼容性、纸张实拍 / 自动拍摄 / 闪光曝光 / 方向、Apple Pencil、系统分屏 / 多窗口、iCloud 等外部提供方与目录失效生命周期、App Store Connect 沙盒购买及家庭共享仍待验收。测试图片不能证明真实拍摄通过。输出与完整视觉验收的覆盖边界见 [验收覆盖](acceptance-coverage.md)。

首次使用者的任务可用性测试尚未执行，需要实际观察扫描、签署、压缩、合并与 OCR 的完成情况。HTML 原型同步是后续文档一致性工作，本轮没有修改原型。
