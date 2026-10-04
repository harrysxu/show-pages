# PaperFlow 模拟器功能与国际化验收

日期：2026-10-04。证据目录：`artifacts/simulator-acceptance/2026-10-04/`。

本轮完成了处理层、App 模型、主要操作流程及三语页面 / 弹层 / 菜单检查，并修正发现的问题。下文按实际设备、样例和断言记录结果，复测不会累计为新的独立用例；不能把通过记录推导为所有文件、参数、系统状态均无缺陷。

## 验收方法与文案范围

- iPhone 14、iPhone SE 第三代、iPad Air 11-inch M4 模拟器；实际运行系统为 iOS / iPadOS 26.4、26.5 和 iOS 27.0。
- 简体中文、繁体中文、英文分别检查全部 **19 个页面**：首页、文件、扫描、工具、阅读器、整理、压缩、签名 / 表单 / 标注、OCR、打码、保护、批处理、页码、水印、流程、个人资料、设置、Pro、快捷指令。
- 各语言实际打开 / 关闭 **35 个弹层或状态**，检查按钮、标签、开关、输入框、密码框、占位符、滑杆、文本编辑器和动态句子。英文另查最大无障碍字号，检查原始本地化键、未展开参数、无效复数与错误语言。
- 各语言展开高级参数和设置，实际执行搜索、德国地区逗号小数输入及压缩、图片水印导入入口、空文件列表、价格不可用后的重试；跨语言重启核对文件和自定义流程名称保持不变。
- 各语言实际展开 **14 组原生菜单** 并选择选项：批处理、OCR、页码、压缩、水印、保留期限、快捷指令、拆分、扫描、流程纸张与 PDF 表单选项。
- 模型与处理层回读实际 PDF、TXT、Markdown 和报告，检查页面内容、顺序、权限、持久化、额度及取消 / 恢复。表单同时使用固定 AcroForm PDF 验证复选框自定义导出值、单选互斥和下拉值。
- 系统设置实际切换 App 独立语言，主 App 不使用 `AppleLanguages` 覆盖；实际打开系统分享扩展、导入到 App Group、打开 PDF，检查文件数只增加一次、重启不重复导入、成功后无错误提示。
- 检查源码和编译后主 App / 分享扩展 / 公共包三语资源；构建 arm64 Release，检查调试验收入口和测试 PDF 不进入正式产物。

用户文件名、文档正文、PDF 原始字段标签和自定义流程名称保留原语言。UI 语言矩阵使用隔离工作区；罕见弹层入口、样例及商店失败注入仅在 `DEBUG` 且 `--ui-testing` 时可用。结果弹层由真实压缩生成，图片型中文样例的搜索先执行真实 OCR。系统分享导入测试使用普通 App Group 工作区。

## 实际结果

| 检查 | 最终通过记录与证据 |
| --- | --- |
| 公共包 / iOS 27.0 | **38 / 38**：20 项处理集成与 18 项领域测试，含实际 PDF 表单回读。[结果](../artifacts/simulator-acceptance/2026-10-04/package-ios27-retest-summary.json)。 |
| App 模型 / iOS 27.0 | **27 / 27 方法、31 次参数化执行**，含本地购买 / 恢复 / 撤销、三语输出回读和两个新增分享导入并发 / 密码重试用例。[结果](../artifacts/simulator-acceptance/2026-10-04/model-inbox-final-summary.json)。 |
| iPhone 14 / iOS 26.5 功能基线 | **37 / 37 方法、41 次执行**：21 项模型与 16 项原有 UI 回归；本地 StoreKit 另测。[结果](../artifacts/simulator-acceptance/2026-10-04/phone-regression-summary.json)。 |
| iPhone 14 三语页面 / 弹层 / 展开参数 | **14 / 14**，含三语各 19 路由、各 35 弹层及英文最大字号。[结果](../artifacts/simulator-acceptance/2026-10-04/phone-localization-summary.json)。 |
| iPad 三语页面 / 弹层 / 展开参数 | **14 / 14**，范围同上。[结果](../artifacts/simulator-acceptance/2026-10-04/ipad-localization-summary.json)。 |
| iPhone SE 三语矩阵 | 初轮 **11 / 14**，3 个展开参数方法因滚动驱动失败；这三个方法在 [定向复测](../artifacts/simulator-acceptance/2026-10-04/compact-controls-retest-summary.json) 通过。同批英文菜单仍失败，调整菜单滚动后在下列 20 项回归通过。历史失败保留：[矩阵](../artifacts/simulator-acceptance/2026-10-04/compact-localization-summary.json)。 |
| iPhone SE 菜单 / 表单与功能复测 | **20 / 20**：16 项原有 UI、英文 14 菜单、三语 PDF 复选框和大字号批注 / 结果操作。[结果](../artifacts/simulator-acceptance/2026-10-04/compact-functional-final-summary.json)。 |
| 三语原生菜单与表单 | **3 / 3**，各语言 14 组菜单，实际选择不同值；PDF 原始标签保留、复选框应用后重新打开正确。[结果](../artifacts/simulator-acceptance/2026-10-04/menu-forms-final-summary.json)。 |
| iPhone SE 最终主要布局回归 | **20 / 20**：16 项原有 UI、英文 19 路由最大字号、三语首页 / 压缩实际运行、批注 / 结果 / 扫描操作。[结果](../artifacts/simulator-acceptance/2026-10-04/compact-layout-completed-summary.json)。扫描提示与流程列表随后再定向修正，见下文。 |
| iPad 横屏与大字号 | 新建干净模拟器复测 **7 / 7**，三项原横屏失败均通过；最新布局再测 **4 / 4**，覆盖英文 19 路由、8 个任务页横竖屏主操作及三语批注 / 结果 / 扫描操作。[7 项结果](../artifacts/simulator-acceptance/2026-10-04/ipad-layout-retest-summary.json)、[4 项结果](../artifacts/simulator-acceptance/2026-10-04/ipad-layout-completed-summary.json)。 |
| iPad 三语首页和压缩大字号 | **1 / 1 方法**，三语实际进入扫描 / 返回、依次选择三个档位、实际压缩并打开结果。[结果](../artifacts/simulator-acceptance/2026-10-04/ipad-home-actions-final-summary.json)。 |
| iPhone 三语大字号批注 / 结果操作 | **2 / 2**，检查全宽按钮并实际返回扫描。[结果](../artifacts/simulator-acceptance/2026-10-04/phone-large-actions-final-summary.json)。 |
| 小屏三语相机提示与照片入口 | **4 / 4**：三语最大字号实际打开 / 取消照片选择并返回，另含扫描主要动作、横屏和大字号原有回归。[结果](../artifacts/simulator-acceptance/2026-10-04/compact-scan-final-summary.json)。 |
| 小屏三语流程列表最终修正 | **2 / 2**：三语最大字号流程名称和操作按钮、实际打开预览 / 编辑，以及原有暂停 / 恢复回归。[结果](../artifacts/simulator-acceptance/2026-10-04/compact-workflow-verified-summary.json)。 |
| iPad 三语扫描 / 流程最终修正 | **2 / 2**：最大字号相机提示、照片选择取消 / 返回及流程预览 / 编辑。[结果](../artifacts/simulator-acceptance/2026-10-04/ipad-scan-workflow-verified-summary.json)。 |
| iPhone 三语扫描 / 流程最终修正 | 流程方法已通过；同批繁体照片取消后返回等待曾失败，保留 [1 / 2 历史结果](../artifacts/simulator-acceptance/2026-10-04/phone-scan-workflow-verified-summary.json)。加入失败状态诊断后，扫描三语方法 **1 / 1** 通过，实际取消照片选择并返回首页。[扫描复测](../artifacts/simulator-acceptance/2026-10-04/phone-scan-cancel-diagnostics-summary.json)。 |
| 系统独立语言与分享 / iOS 26.4 | **2 / 2**，真实系统三语切换、扩展三语导入、正确打开、文件数 +1、重启不重复、无错误提示。[结果](../artifacts/simulator-acceptance/2026-10-04/share-inbox-final-summary.json)。 |
| 系统独立语言与分享 / iOS 27.0 | 真实系统三语切换方法通过于 [历史 1 / 2 批次](../artifacts/simulator-acceptance/2026-10-04/system-integration-ios27-picker-summary.json)，其中扩展启动检查失败。分享方法最终 **1 / 1**，三语实际导入、主 App 无路由覆盖正常启动后必须打开阅读器、文件数 +1、重启不重复、无错误提示。[最终结果](../artifacts/simulator-acceptance/2026-10-04/ios27-share-navigation-final-summary.json)。 |
| 本地 StoreKit / iOS 27.0 | **1 / 1** 真实购买 / 恢复 / 撤销，亦包含于最新 27 项模型回归。[结果](../artifacts/simulator-acceptance/2026-10-04/storekit-ios27-live-summary.json)。 |
| 翻译源码 | **901 个模板 / 32 条复数规则**，三语完整性、占位符一致性与缺失键审计通过。[最终审计](../artifacts/simulator-acceptance/2026-10-04/source-audit-delivery.json)。 |
| 正式构建 | 最新生产代码 arm64 Release 构建通过；主 App / 扩展 / 公共包编译后翻译及系统文案全部一致，调试入口和测试 PDF 未进入正式产物。[构建日志](../artifacts/simulator-acceptance/2026-10-04/release-delivery-build.log)、[资源审计](../artifacts/simulator-acceptance/2026-10-04/release-resources-delivery.json)、[隔离审计](../artifacts/simulator-acceptance/2026-10-04/release-isolation-delivery.json)。 |

## 发现的问题与修正

1. **价格加载停滞**：商店返回空商品 / 网络错误时可能一直显示加载。新增三语价格不可用、说明和重试；购买按钮依真实商品可用性禁用，权益仍依据验证交易。价格和权益的请求序号分离，避免刷新冲突。模型验证空商品、离线、重试和并发，UI 实际点击重试。
2. **PDF 复选框被识别成文本框**：PDFKit 的字段类型可能带 `/` 前缀，按钮导出值也不能依赖空的 `.choices`。统一字段类型，使用真实按钮状态作为导出值；固定 PDF 样例验证复选框和单选导出 / 重开。保留早期 [处理层失败](../artifacts/simulator-acceptance/2026-10-04/package-ios27-before-summary.json)。
3. **大字号英文挤断 / 按钮裁切**：批注工具、扫描预览 / 结果操作改用单列；首页导入和扫描、压缩档位 / 主按钮在无障碍字号下纵向排列。按钮高度随完整文字增长，装饰标题与 Tab 文字适度限制增长，保留完整无障碍标签。最大字号、小屏和 iPad 均实际操作复测。
4. **相机提示截断与流程名称挤断**：没有相机的提示和操作区域支持完整换行 / 滚动；流程名称和摘要取得完整行宽，大字号操作按钮另起一行。正常字号保留原布局。
5. **分享导入并发消费**：启动和场景激活可能同时读取同一 Inbox，虽导入成功却出现移除错误。共享工作区增加导入窗口占用，等待实际任务完成；密码等待保留占用，取消后释放；只删除空的 Inbox 父目录。新增两个窗口同时消费、加密文件取消 / 重试用例，验证仅导入一次、待处理文件保留、无错误和占用释放。
6. **测试驱动误判**：既有中文文件名 / PDF 原标签不视为英文界面漏翻译；弹层关闭按真实父状态断言；图片型样例先 OCR 再搜索；小屏菜单采用短距离滚动；批注工具查询限定当前弹层。新增流程测试最初误用未存在的弹层 ID，改为实际本地化标题；照片选择关闭后等待返回按钮恢复可点击。iOS 27 分享活动点击可见图标，避免 cell 中心位于图标与标题之间；扩展导入后主 App 正常启动，不使用会覆盖阅读器的 DEBUG 路由参数，并严格断言阅读器打开。以上修正不把失败记录删掉。

iOS 27 早期扩展导入后等待“Done”曾失败：[失败记录](../artifacts/simulator-acceptance/2026-10-04/ios27-share-icon-summary.json)。增加失败状态诊断后，三语导入及计数检查通过：[诊断复测](../artifacts/simulator-acceptance/2026-10-04/ios27-share-diagnostics-summary.json)；随后上表的严格导航复测亦通过。原等待失败和 iPhone 繁体照片取消等待失败的唯一原因尚未由诊断复现，不将它们描述为已确认的系统故障，也不计入通过批次。

## 截图与视觉复核

截图、合图和标签快照保留在每批结果对应的 `*-screenshots` 目录。已逐张查看 iPhone 14 的 54 张三语页面基线、42 张三语菜单、最终 9 张大字号操作及 3 张表单截图；最新 iPad 44 张布局与 15 张首页 / 压缩、iPhone SE 97 张功能 / 大字号、6 张相机提示、系统分享导入 15 张也已复核。流程修正后的小屏 5 张、iPad 扫描 / 流程 6 张、iPhone 扫描 / 流程 6 张及扫描取消复测 3 张已追加查看；对应提示、流程名称和按钮未见截断。iOS 27 分享诊断 9 张与最终正常启动 / 阅读器 10 张也已查看，三语扩展标题、按钮和完成提示正常，阅读器保留来源中文正文 / 文件名。

可浏览站点保存到 `/Users/long/github_space/show-pages/pdf-file-workbench`，包含文档 HTML、Markdown 原文、可筛选截图和交互原型。截图浏览按设备、语言、批次筛选；历史基线明确标注，后续修正以对应最终截图为准。HTML 原型保留其原始版本，不作为后续批准的交互简化和三语布局的完整像素签收。

站点含 12 份文档、933 张截图。检查本地 HTML 链接 / 锚点、资源和全部截图路径，均通过；桌面 1440 × 1000 与手机 390 × 844 实际浏览首页、验收报告和截图页，筛选、空结果、大图打开 / 关闭通过，无脚本错误或 HTTP 失败，未见页面横向溢出。浏览时发现手机批次选择器撑出视口，已修正并复测。站点首页深色样式亦有截图检查，这是文档站的验证，不等同于 App 深色模式验收。[链接检查](../artifacts/simulator-acceptance/2026-10-04/pages-links-delivery.json)、[浏览检查](../artifacts/simulator-acceptance/2026-10-04/pages-browser/verification.json)。站点尚未执行 Git 提交或推送。

截图复核只对应捕获状态；完整深色模式、VoiceOver、所有权限 / 错误 / 文件类型和全部参数组合未因此自动完成验收。

## 环境与尚需补齐的发布验收

- **最低系统**：部署目标仍为 iOS / iPadOS 18.0。当前 Xcode 下载目录未提供尝试下载的 iOS 18.0 / 18.5 运行时，本轮没有 18.0 实际运行证据。
- **StoreKit 历史环境失败**：Xcode 27.0 + iOS 26.4 / 26.5 的测试服务曾报 `not entitled for OctaneSaveConfigurationRequest`；未以模拟权益代替真实购买。匹配 iOS 27.0 运行时重启后实际购买 / 恢复 / 撤销通过；不据此断言早期失败的唯一根因。本地 StoreKit 通过不代表线上 App Store 沙盒或家庭共享通过。
- **架构**：仓库 QPDF 模拟器库只有 arm64，通用 x86_64 Release 链接失败；当前 Apple Silicon arm64 构建通过，不宣称支持 Intel 模拟器。
- **硬件 / 系统服务**：纸张实拍、自动捕获、闪光灯、OCR 实拍精度、Pencil、真实 iPad 分屏 / 多窗口生命周期、线上购买 / 家庭共享、完整 iCloud / 外部文件提供方仍需对应设备或服务证据。
- **UI 发布签收**：完整 VoiceOver、深色模式 / 对比度、快捷指令宿主三语实际运行、所有错误和字号 / 横屏组合，以及原型完整逐项视觉对照仍须补齐。此前真机最终交互被系统开发者验证弹窗阻止，详见 [国际化记录](internationalization.md)。

## 复现

在仓库根目录执行，替换设备 ID；同一模拟器不要同时运行两批测试，结果目录须为未存在路径。系统语言测试将“设置”进程的语言偏好设为英文、简体与繁体三种，避免单一语言偏好隐藏独立语言入口；主 App 仍由系统选择语言。

```sh
python3 scripts/localization/generate.py
python3 scripts/localization/audit.py
xcodebuild -project PaperFlow/PaperFlow.xcodeproj -scheme PaperFlow \
  -destination 'platform=iOS Simulator,id=<SIMULATOR-ID>' \
  -derivedDataPath .native-build/SimulatorAcceptance \
  -parallel-testing-enabled NO -collect-test-diagnostics never \
  -resultBundlePath artifacts/simulator-acceptance/reproduction.xcresult test
xcrun xcresulttool get test-results summary \
  --path artifacts/simulator-acceptance/reproduction.xcresult
python3 scripts/localization/audit.py --app-bundle <APP-BUNDLE>
```

公共包使用 `PaperFlowKit-Package` Scheme。单方法 StoreKit 筛选须保留 Swift Testing 标识的 `()`：`-only-testing:PaperFlowTests/PaperFlowTests/localStoreKitPurchaseRestoreAndRevocationUpdateVerifiedEntitlement()`。

展示站点重新生成命令：`python3 scripts/build-show-pages.py --output /Users/long/github_space/show-pages/pdf-file-workbench`，需要 Python Markdown 与 Pillow。脚本只生成站点，不执行 Git 提交或推送。
