# PaperFlow 国际化实现与验收

日期：2026-10-04。主 App、分享扩展、公共包和系统集成已接入**简体中文 `zh-Hans`、繁体中文 `zh-Hant`、英文 `en`**。最低版本继续为 iOS / iPadOS 18.0。最新模拟器功能与三语验收结果见 [模拟器验收报告](simulator-testing.md)。本页保留国际化实现及此前真机证据；整体发布验收边界仍见 [acceptance-coverage.md](acceptance-coverage.md)。

## 使用方式

默认跟随系统的语言偏好；系统未匹配到支持的语言时使用英文。也支持 iOS 的 App 独立语言设置：系统设置 → App → PaperFlow（纸间 / 紙間）→ 语言。应用内不增加语言选择步骤。“识别语言”仍只控制 OCR，界面语言与地区、OCR 语言相互独立。

语言查找使用系统选中的 Bundle 本地化；日期、数值显示与输入使用地区设置。繁体脚本及台湾、香港、澳门中文匹配繁体资源。真实系统设置三语切换与分享扩展三语导入已在 iOS 26.4、27.0 模拟器通过；27.0 最终分享复测还严格检查无路由覆盖的正常启动后打开 PDF。快捷指令宿主的实际三语运行仍需单独验收。常规页面矩阵使用 `AppleLanguages` / `AppleLocale` 启动参数，系统集成测试不覆盖主 App 的语言选择。

## 已实现范围

| 范围 | 实现 |
| --- | --- |
| 主 App | 全部 19 路由、导航、按钮、弹层、输入提示、空状态、处理进度、错误、结果、设置、隐私、Pro 与无障碍标签已接入翻译。 |
| 公共包 | `PaperFlowDomain` 使用独立资源 Bundle；领域错误、处理 / 持久化提示、动态参数与复数经统一入口输出。 |
| 系统信息 | 主 App 和分享扩展都有三语 `InfoPlist.strings`；包括显示名、相机权限理由和文档类型标签。 |
| 分享扩展 | 导入标题、按钮、状态和失败提示使用自己的 String Catalog 与复数资源。 |
| 快捷指令 | App Intents 标题、参数、摘要、结果对话与 App Shortcuts 短语提供三语资源；默认值在执行阶段生成，保存流程可用三语内置名称匹配。 |
| 文档输出 | OCR TXT / Markdown 页标题、自动导出后缀、报告标签、默认水印和新建内容的默认名称已本地化。 |
| 内置示例 | 保留原简体 PDF；新增 4 份英文及 4 份繁体示例，总计 38 页，繁体字体嵌入 PDF。仅首次初始化使用相应语言的示例。 |
| 地区输入 | 压缩大小接受地区小数分隔符，如英文界面 + 德国地区的 `1,5`；回填也使用逗号。兼容点小数，拒绝空值、混合分隔符、单位字符、非正数与非有限值。 |
| 商品配置 | 本地 StoreKit 商品有 `zh_CN`、`zh_TW`、`en_US` 名称和描述；价格继续使用 `Product.displayPrice`。这不代表线上 App Store Connect 元数据已配置。 |

当前翻译清单包含 **901 个文案模板**，生成 **32 条复数规则**。主 App / 扩展使用 `.xcstrings`，Swift Package 使用 `.strings` / `.stringsdict`。每个目标显式查找自己的资源，编译后的 App 包另有核查。

## 数据兼容与输出正确性

- 持久化状态与处理操作沿用原有存储值；显示文字通过语义适配器本地化，不用翻译结果判断业务状态。
- 用户命名、流程重命名、文档正文、OCR 原文、已导入文件及既有文件路径不随语言切换改写。内置默认流程按 `builtinID` 显示翻译，自定义名称保留原文。
- 兼容 `{原名}` / `{日期}` / `{序号}`，新增 `{original}` / `{date}` / `{index}` 别名。固定文件命名日期仍为 Gregorian `yyyy-MM-dd`；不会再次展开用户文件名中看似占位符的文字。
- 文案插值只替换模板原有占位符；用户文本中的 `{0}`、`{date}` 等保持原样。
- 新批处理 / 任务错误可保存可重新渲染的本地化信息；旧 JSON 无需迁移，无法识别的历史错误保留原始详情。
- 首次初始化现在立即保存示例工作区，避免终止后按新语言重新生成示例，从而改变文件名。此问题已在真机复测。
- 三种语言的 TXT / Markdown 导出均回读实际文件，核对原文与实际页码；三语报告回读核对用户名称、页数和时间。

## 布局处理

沿用已批准的色值、字体、图标和主要操作流程。截图复核发现 iPad 英文首页快捷操作挤断单词、大字号下侧栏及双列编辑区过窄；快捷操作改为按文字所需宽度自适应列数，无障碍字号使用单列编辑与紧凑导航，工具列表使用单列。正常字号下保留原布局规则。

小屏无障碍字号下，标题和顶部操作按钮分行排列，签名 / 表单 / 批注等分段选项横向滚动，选择器高度随文字增长。页面使用独立的无障碍容器，避免页面标识覆盖内部滚动控件标识。阅读器底部的“Process”在空间充足时完整显示，空间不足时显示图标，并保留完整的无障碍标签。小屏测试实际执行了横向滚动和批注模式切换。

最新模拟器复核还修正了大字号首页导入 / 扫描并排挤断、压缩档位 / 底部按钮、批注工具双列、结果 / 扫描预览操作、无相机提示截断和流程名称被操作按钮挤断。按钮支持完整换行，相关操作在无障碍字号采用纵向排列；相机提示可滚动，流程控制另起一行。

iPhone 横屏支持改为标准 `UISupportedInterfaceOrientations` 配置，iPad 使用独立 `~ipad` 配置。真机扫描、签名板横屏，以及 8 个任务页的大字号竖横屏操作可见性测试通过；这不代表全部横屏组合完成验收。

## 测试与证据

本节为此前国际化实现批次的历史证据（当时 899 模板）；后续价格失败处理增加两个模板，当前资源审计为 901 模板 / 32 条复数规则。最新模拟器结果以 [模拟器验收报告](simulator-testing.md) 为准。

证据目录：`artifacts/internationalization/2026-10-04/`。

| 检查 | 实际结果与证据 |
| --- | --- |
| 源码 / 资源审计 | 899 模板、三语完整性、占位符、英文中文残留及缺失键检查通过：[source-audit.json](../artifacts/internationalization/2026-10-04/source-audit.json)。 |
| 最终 App 包审计 | 主 App、分享扩展、公共包三语资源与系统名称均在构建产物中：[device-bundle-audit.json](../artifacts/internationalization/2026-10-04/device-bundle-audit.json)。 |
| Swift Package | macOS 下 19 项处理集成 + 18 项领域测试通过，含 9 项新增国际化测试：[package-final.log](../artifacts/internationalization/2026-10-04/package-final.log)。 |
| iPhone 14 真机模型 / 输出 | iOS 27.0：22 个方法通过，两个三语参数化方法共增加 4 次执行，设备记录为 26 次通过；含真实 TXT / Markdown / 报告回读、数据兼容、本地购买 / 恢复 / 撤销：[device-model-final-summary.json](../artifacts/internationalization/2026-10-04/device-model-final-summary.json)。 |
| iPhone 真机英文 UI | 一个方法遍历 19 路由；早期文件保留测试通过：[device-summary.json](../artifacts/internationalization/2026-10-04/device-summary.json)。两个 UI 方法与模型方法不重复累加成“全新用例数”。 |
| 真机跨语言用户数据 | 中文创建自定义流程后，英文重启仍保留名称中的 `{date}` 和原中文文件名；内置流程显示英文：[device-persistence-after-summary.json](../artifacts/internationalization/2026-10-04/device-persistence-after-summary.json)。 |
| iPad 三语 UI | iPad Air 11-inch (M4) / iPadOS 26.5 模拟器：布局修正后 7 / 7 方法通过，含三语各 19 路由、德国地区输入和实际压缩结果、英文弹层 / 大字号、回退及文件 / 自定义流程保留：[ipad-ui-after-summary.json](../artifacts/internationalization/2026-10-04/ipad-ui-after-summary.json)。 |
| 小屏英文 UI | iPhone SE (3rd generation) / iOS 26.5 模拟器：3 / 3 方法通过，含英文 19 路由、弹层 / 大字号和跨语言用户数据保留：[compact-ui-after-summary.json](../artifacts/internationalization/2026-10-04/compact-ui-after-summary.json)。 |
| 最终大字号交互复测 | 最新标题、分段滚动、选择器及阅读器底部布局变更后，小屏与 iPad 各 1 / 1 方法通过，实际从阅读器进入签名页并切换批注模式：[compact-accessibility-after-summary.json](../artifacts/internationalization/2026-10-04/compact-accessibility-after-summary.json)、[ipad-accessibility-after-summary.json](../artifacts/internationalization/2026-10-04/ipad-accessibility-after-summary.json)。这是上述用例的复测，不能重复累加为独立用例数。 |
| 真机横屏 / 大字号 | iPhone 14 / iOS 27.0：扫描横屏、签名板横屏、8 个任务路由大字号竖横屏，共 3 / 3 方法通过：[device-orientation-final-summary.json](../artifacts/internationalization/2026-10-04/device-orientation-final-summary.json)。执行时间早于最终标题、分段、选择器及阅读器底部调整。 |
| 最终真机构建 / 安装 | 最终代码构建通过，主 App 与扩展签名检查通过，已安装到 iPhone 14。普通启动接口返回成功，但后续 UI 截图显示系统开发者验证弹窗阻止操作：[device-build-final.log](../artifacts/internationalization/2026-10-04/device-build-final.log)、[device-signature-final.log](../artifacts/internationalization/2026-10-04/device-signature-final.log)、[device-launch-final.log](../artifacts/internationalization/2026-10-04/device-launch-final.log)。不能把接口成功作为正常交互通过的证据。 |
| 最终真机大字号交互 | 1 个方法未通过：系统“无法验证 App，需要互联网连接以验证开发者”弹窗覆盖应用，文档信息未能打开；[结果](../artifacts/internationalization/2026-10-04/device-accessibility-after-summary.json)、[阻塞截图](../artifacts/internationalization/2026-10-04/device-accessibility-after-screenshots/032C7E4D-EFB0-4E5B-8403-5CB1BF52C20C.png)。最终视觉调整已在小屏 / iPad 模拟器通过，真机复测须先完成系统验证。 |
| 示例 PDF | 8 份新增 PDF 的 38 页全部渲染、核对页数和文字并人工查看；未见空白字体、裁切或重叠：[verification.json](../artifacts/internationalization/2026-10-04/samples/verification.json)。 |

真机英文 20 张截图、iPad 三语基线 64 张截图已经逐张复核；修正后的 iPad 66 张、小屏 25 张、真机横屏 / 大字号 18 张及最终模拟器大字号交互各 5 张截图、合图索引已保留。最终布局调整的相关截图已追加复核，小屏正常字号阅读器另有 [截图](../artifacts/internationalization/2026-10-04/compact-reader-final.png)。截图只覆盖捕获的页面状态，不能据此宣称所有弹层、深色模式、错误或权限状态均已逐项视觉签收。

失败记录保留：早期切换语言后示例未持久化的问题已修正；加强后的流程保留 UI 测试最初没有清除编辑器预填名称，测试输入已修正并真机通过。小屏分段控件最初被页面标识覆盖，新增无障碍容器后已复测通过。

此前 iPhone 模拟器回归 16 项中 13 项通过、3 项横屏等待超时：[iphone-regression-final-summary.json](../artifacts/internationalization/2026-10-04/iphone-regression-final-summary.json)。对应横屏检查后来在真机通过，仍保留模拟器失败证据。早期模拟器 StoreKit 服务未返回商品，部分测试结束阶段挂起；不完整 `.xcresult` 不作为通过证据。后续匹配 iOS 27.0 运行时的真实购买 / 恢复 / 撤销及完整模型回归已通过，见最新模拟器报告；线上沙盒购买尚未测试。

真机中途一次测试启动被系统以“Developer App Certificate is not trusted”拒绝：[device-large-picker-final.log](../artifacts/internationalization/2026-10-04/device-large-picker-final.log)。检查确认团队、授权设备、有效期和签名均匹配，未修改系统信任设置。重新构建安装后普通启动接口返回成功，但最后一次交互测试截图仍出现“无法验证 App，需要互联网连接”系统弹窗。以上失败不计为测试通过。

继续真机复测前，需要手机能够访问互联网，并在“设置 → 通用 → VPN 与设备管理”中验证 / 信任 `Apple Development: xiaolong xu (HY7V43DS7R)`。此要求来自设备系统弹窗和 Xcode 的恢复建议，不是应用新增的用户操作流程；不能通过修改 App 文案或绕过设备信任解决。

## 维护与复现

在仓库根目录执行：

```sh
python3 scripts/localization/generate.py
python3 scripts/localization/audit.py
python3 scripts/localization/audit.py --app-bundle .native-build/InternationalizationDevice/Build/Products/Debug-iphoneos/PaperFlow.app
swift test --package-path PaperFlow/Packages/PaperFlowKit
```

`translations.json` 为翻译的统一来源；修改后生成三个目标资源。新增 UI 文案使用 `AppL10n` / `ShareL10n`，公共包使用 `DomainL10n`。动态句子传入类型化参数，避免拆分句子拼接；系统 App Intents 元数据保留编译期本地化键。

`generate_samples.py` 可重新生成新增示例，需要 ReportLab 与 macOS Arial Unicode 字体；仅在示例内容修改时运行，并重新渲染检查。已有用户工作区不进行样例或名称迁移。

## 尚未完成的发布验收

- 完成设备系统开发者验证后，复测最终版本的真机大字号阅读器、文档信息、签名 / 批注切换。
- iOS / iPadOS 18.0 最低版本设备、真实 iPad 分屏 / 多窗口 / Pencil。
- 补齐真实权限弹窗、分享扩展全部错误分支和快捷指令宿主的三语运行。系统 App 独立语言及扩展成功导入已取得模拟器证据。
- 三语完整 VoiceOver、罕见错误 / 权限状态、深色模式和对比度，以及所有字号、横屏与分屏组合。19 路由、35 弹层、14 组菜单及部分错误 / 空状态已有三语模拟器证据。
- App Store Connect 三语商品 / 商店元数据、线上沙盒购买与家庭共享。
- 所有生成 PDF 的参数组合、真实拍摄 OCR 精度与完整原型逐项视觉对照。

这些项目不阻止三语代码接入完成，但在补齐证据前不能宣称国际化或整个 App 已完成发布签收。
