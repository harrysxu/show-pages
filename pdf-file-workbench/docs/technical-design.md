# PDF 与文件工作台技术方案

## 1. 文档目的

本文把 `requirements.md` 和 `competitive-analysis.md` 中的产品目标转换为可实现的技术方案。方案假设从零开始开发 iPhone 和 iPad 原生应用，一次性完成已经规划的 P0、P1、后续版本能力，并为所有高风险功能定义实现方式、数据边界和验收条件。

本文中的“完整版本”包含：扫描、OCR、PDF 阅读与搜索、页面管理、合并/拆分、压缩、签名、标注、表单填写、永久打码、密码保护、批处理、模板、水印、页码、Shortcuts、Share Extension、iPad 拖放和 Apple Pencil，以及购买、恢复购买和家庭共享。

文档中明确暂缓的自有云盘、账号系统、在线协作、任意已有文本/图片编辑、高保真 Office 双向转换、AI 摘要/问答/翻译、语音功能和依赖服务器的 OCR 不在本版本范围内。这些能力会改变本地优先和无账号的核心架构，不能作为隐含需求加入。

## 2. 目标与约束

### 2.1 产品目标

- 用户从 Files、照片、相机或 Share Sheet 进入后，可以围绕一个明确任务完成处理并直接得到真实文件。
- 默认在设备本地完成导入、OCR、处理和导出，不上传用户文件，不要求登录。
- iPhone 和 iPad 使用同一套领域模型和处理引擎，界面根据屏幕尺寸、分屏状态和输入方式适配。
- 原始文件默认只读，所有处理生成新的 revision 或新文件；覆盖和删除必须显式确认。
- 处理前显示页数、源文件大小、预计输出大小、需要的权限和预计耗时。
- 处理过程中不弹出购买页面；付费提示只出现在任务结果、批量操作或高级选项处。

### 2.2 非功能目标

| 维度 | 目标 |
|---|---|
| 可用性 | 新用户首次打开后 60 秒内可以导入或扫描并开始处理 |
| 可靠性 | 10 页以内的常规 PDF 在设备端完成 OCR；处理失败不破坏源文件 |
| 兼容性 | 输出文件能在系统预览、Adobe Acrobat、PDF Expert 和常见浏览器中打开 |
| 性能 | 页面缩略图首屏尽量在 500 ms 内出现；长任务可取消、可恢复进度 |
| 隐私 | 文件内容、OCR 文本和签名不出设备；诊断日志默认不包含文件内容 |
| 可访问性 | VoiceOver、Dynamic Type、键盘导航、Reduce Motion、深色模式可用 |
| 可维护性 | 核心处理引擎与 UI 解耦，可用纯 Swift 测试和固定 PDF 样本回归 |

### 2.3 平台最低版本和版本策略

建议把版本策略定为“可安装下限 + 推荐支持下限 + 当前主测版本”三层，而不是只跟随最新系统。这里的版本号以正式开发时 App Store Connect 和 Xcode 的实际支持情况再复核一次。

| 层级 | iPhone/iPad | 用途 |
|---|---|---|
| 可安装下限 | iOS/iPadOS 18.0 | 本项目只支持 iPhone 与 iPad，使用统一的 SwiftData、SwiftUI、PDFKit、Vision 和 App Intents 实现 |
| 推荐支持下限 | iOS/iPadOS 18.0 | 正式支持线，减少系统 PDF、SwiftUI 和 Vision 行为差异 |
| 主测版本 | 推荐下限所在大版本的最新正式小版本 | 产品验收、性能门槛和 TestFlight 主要基线 |
| 追踪版本 | 当前最新正式大版本 | 提前发现系统升级后的兼容问题，不立即把它设为最低版本 |

因此，本项目的实际决策是：最低部署目标和正式支持线统一设为 **iOS/iPadOS 18.0**。这样可以让原生 PDF、SwiftUI、Vision、App Intents、拖放和多窗口行为使用同一套实现，避免为了旧系统保留两套持久化和界面路径。

工程工具链使用正式版 Xcode 和对应的 Swift 6.x，采用当时最新稳定 SDK，不使用 beta SDK 作为发布构建。打开严格并发检查，所有新系统能力通过 `@available` 和平台适配器隔离。最低版本上的核心流程不能依赖推荐版本专属 API：

- iOS/iPadOS：最低线支持文档扫描、照片选择器、Share Extension、Apple Pencil 基础输入、拖放、PDF 阅读和页面操作；OCR 选择设备可用的最高 Vision revision。
- 推荐版本可以启用更稳定的 SwiftUI 导航、App Intents、PDFKit 和系统 Vision revision，但必须保留最低线的可用降级路径。

版本之外还需要控制硬件基线：A12 设备作为“能运行”的兼容性样本；A14 或更新的 iPhone/iPad 作为 OCR、扫描、批处理和性能验收基线。这样可以避免应用虽然安装在旧设备上，却无法达到 10 页 OCR 和大文件处理的体验目标。

## 3. 完整功能范围

### 3.1 应用入口和文件接入

1. 首页任务入口：扫描、签名、压缩、合并/拆分、导入文件。
2. Files 导入：支持单选、多选、iCloud Drive 和第三方 File Provider；处理 security-scoped URL。
3. 照片库导入：使用 `PHPickerViewController`/`PhotosPicker`，支持多张图片并保留用户选择范围。
4. 相机扫描：iPhone/iPad 使用 VisionKit 自动识别边缘、透视校正、多页扫描和重拍。
5. Share Extension：接收 PDF、图片和文档类型，写入 App Group 暂存目录后交给主应用；主应用未运行时也能完成接收。
6. 拖放：iPad 支持从 Files、照片、邮件和其他应用拖入；iPhone 支持系统允许的文件拖放和 Share Sheet 导入。
7. 文件类型：首版稳定支持 PDF、JPEG、PNG、HEIC、TIFF；其他类型显示不支持原因，不在本地偷偷转换。
8. 最近任务：显示最近处理过的文档引用、状态和再次执行入口，不复制原文件内容。
9. 文件重命名：单文件和批量重命名，支持模板变量（日期、序号、原文件名）。

### 3.2 阅读、搜索和页面管理

- PDF 阅读：单页、连续、缩略图、双页、适应宽度、适应页面、旋转、夜间/高对比度模式。
- 导航：页码跳转、上一页/下一页、文档目录、链接跳转和搜索结果定位。
- 搜索：搜索 OCR 文字和原生 PDF 文字，支持中文、英文、大小写和结果高亮。
- 页面操作：删除、复制、提取、插入图片/PDF、旋转 90/180/270 度、拖动重排、合并多个文件、拆分为单页或按范围拆分。
- 页面选择：连续范围、多选、全选和反选；所有危险操作显示影响页数。
- 页面预览：缩略图异步生成，内存压力过高时释放缓存并按需重建。
- 文档信息：页数、尺寸、方向、文件大小、创建/修改时间、加密状态和 OCR 状态。

### 3.3 扫描和 OCR

- 自动/手动快门、连续扫描、重拍、撤销上一页、调整顺序和裁切。
- 图像增强：原色、灰度、黑白、自动增强、去阴影、锐化；每页可以单独调整。
- OCR：设备端支持简体中文、繁体中文和英文；保存文字、置信度、段落和 bounding box。
- 可搜索 PDF：在页面图像上叠加可搜索文本层，保留页面外观。
- OCR 结果编辑：显示识别文本，允许用户修正文字；重新生成文本层而不改变原始页面图像。
- OCR 搜索和导出：搜索命中后定位页面；可将识别文本导出为 TXT/Markdown（只导出文字，不承诺版式还原）。
- OCR 质量指标：记录每页置信度、低置信度字符提示和用户手动修正数量，仅存本地。

### 3.4 签名、标注和表单

- 手写签名：PencilKit/触控板绘制、撤销重做、裁切空白、颜色和线宽。
- 图片签名：从照片或 Files 导入，自动去除纯色背景，可手动调整透明度。
- 签名库：保存、重命名、删除、默认签名；签名数据存 SwiftData/应用容器，不能写入源 PDF。
- 签名放置：拖动、缩放、旋转、复制到其他页面；导出时将签名固定到新 PDF。
- 基础标注：高亮、下划线、删除线、自由画笔、文本框、箭头、矩形、圆形、线条、便签。
- 标注属性：颜色、透明度、线宽、字体大小、字体颜色、前后顺序和复制粘贴。
- 标注编辑：选择、移动、缩放、删除、撤销/重做；兼容 PDFKit 原生 annotation 和应用自定义 annotation。
- 表单填写：识别 AcroForm 字段并支持文本框、复选框、单选框、下拉框；对于没有字段的静态表格提供“文本/勾选/签名”叠加模式。
- 表单导出：默认保留填写后的字段；提供“扁平化”选项，将字段和标注固定到新 PDF。

### 3.5 压缩、导出和保护

- 压缩预览：处理前显示源文件大小、页数、预计输出大小和预计质量损失。
- 压缩档位：轻度、平衡、强力和自定义；自定义包含目标 DPI、JPEG 质量、灰度/黑白、是否移除元数据。
- 压缩策略：对图片重采样和编码；保留矢量页面和文字时不栅格化；扫描页按页面独立处理。
- 目标大小：用户可以输入最大文件大小，算法迭代质量和 DPI；无法达到时给出可读性风险提示。
- 导出目标：保存到 Files、覆盖前另存为、AirDrop、邮件附件、消息和其他 Share Sheet 目标。
- 输出命名：原文件名 + 操作后缀，支持用户修改；不默认覆盖原文件。
- 密码保护：设置用户密码/所有者密码、打印/复制/修改权限；使用 PDF 加密输出并要求二次确认密码。
- 移除密码：打开受保护文档后验证密码，用户明确选择“移除保护”才导出未加密副本。
- 元数据：查看并编辑标题、作者、主题、关键词；导出时可选择移除元数据、附件和隐藏注释。

### 3.6 永久打码

- 标记模式：矩形、自由路径和文本匹配；显示待打码数量和影响页码。
- 应用打码：二次确认并明确“此操作不可撤销，源文件不会修改”。
- 安全实现：含打码区域的页面栅格化为新页面图像，移除原文本内容、注释、链接、隐藏图层、嵌入附件和相关元数据；必要时整份文档扁平化。
- 视觉样式：纯黑、白色或自定义颜色；默认黑色并可加入“已打码”覆盖文字。
- 结果验证：复制、搜索、文本提取和 PDF 对象扫描都不能取回遮挡内容；验证失败时禁止导出并保留未打码的源文件。

### 3.7 批处理、模板和自动化

- 批量压缩、合并、拆分、重命名、添加页码、添加水印和导出。
- 批处理队列：显示每个文件状态、进度、错误原因、重试和跳过；单项失败不影响其他项目。
- 模板：保存页面尺寸、页码位置、字体、颜色、水印、文件命名和压缩预设；模板不保存用户文件内容。
- 页码：起始页码、前缀/后缀、位置、边距、字体、奇偶页规则和跳过封面。
- 水印：文本或图片、透明度、角度、平铺/居中、前景/背景和应用页范围。
- Shortcuts/App Intents：导入文件、扫描结果处理、压缩、合并、重命名、导出；无 UI 任务必须有明确的输入/输出文件。
- iPad 多窗口：支持拖放文件到应用窗口、分屏处理和将结果拖到其他应用。

### 3.8 购买和权益

- 免费层：查看、搜索、基础标注、有限扫描/OCR、有限压缩/合并；用户至少可完整完成一次核心任务。
- Pro：无限 OCR、扫描、压缩、合并和批处理；高级签名、永久打码、密码保护、模板、水印、页码、Shortcuts 和高级导出。
- 购买模型：实现一次性买断和可选年订阅两种产品类型，首发界面默认展示买断，年订阅只在实际提供持续服务时启用；不使用默认周订阅。
- StoreKit 2：购买、恢复购买、家庭共享、价格本地化、交易验证、退款/撤销状态和离线缓存权益。
- 付费墙：不在启动、扫描和处理进度中打断；在结果页、批量入口或高级选项被点击时展示透明的权益、价格、周期和恢复购买入口。

## 4. 总体架构

### 4.1 工程目标和模块

采用 Swift 6、SwiftUI、Structured Concurrency 和 Swift Package Manager。iPhone 和 iPad 共用一个 iOS App target（`TARGETED_DEVICE_FAMILY = 1,2`）、领域层、处理引擎和大部分界面，平台层只负责设备 API 适配；Share Extension 单独作为 extension target 构建。

建议目录/模块如下：

```text
PDFWorkbench/
  App/                    # 启动、路由、依赖注入、生命周期
  Features/
    Home/                 # 任务入口和最近任务
    Import/               # Files、Photos、Share Extension、拖放
    Scanner/              # VisionKit/AVFoundation 扫描
    Viewer/               # PDF 阅读、搜索、缩略图
    Pages/                # 页面选择、重排、合并、拆分
    OCR/                  # Vision 识别、文本层、编辑和搜索
    Annotation/           # 标注、签名、表单
    Compression/          # 压缩预览和输出
    Redaction/            # 永久打码和验证
    Batch/                # 批处理、模板和队列
    Export/               # Files/Share Sheet/AirDrop/邮件
    Paywall/              # StoreKit 2 和权益
    Settings/             # 隐私、默认设置、诊断导出
  Domain/
    Models/               # 与平台无关的值类型和业务实体
    UseCases/             # 导入、处理、导出、权限和权益用例
    Repositories/         # 文档、任务、签名、模板、权益接口
  Processing/
    PDFCore/              # PDFKit、CGPDF、Core Graphics 封装
    OCRCore/              # Vision 和文本层写入
    ImageCore/            # 解码、采样、增强、压缩
    RedactionCore/        # 打码、扁平化、内容清理和验证
    JobCore/              # actor 队列、取消、断点和临时文件
  Persistence/
    SwiftData/            # 最近任务、签名、模板、设置、作业状态
    FileStore/             # 文件引用、security-scoped bookmark、暂存目录
  Platform/
    iOS/                    # VisionKit、PhotosPicker、PencilKit、拖放
    ShareExtension/        # NSExtension、App Group 文件交接
  AppIntents/
  Tests/
```

### 4.2 分层规则

- SwiftUI View 只负责状态展示和用户事件转发，不能直接操作 `PDFDocument` 或文件 URL。
- Use Case 负责业务流程，例如 `ImportDocumentUseCase`、`CompressDocumentUseCase`、`ApplyRedactionUseCase`。
- Processing 模块负责纯文件转换和计算，输入/输出使用临时目录和不可变参数。
- 所有长任务运行在专用 actor 中，不能在主线程读写大文件或渲染整本 PDF。
- Repository 通过协议注入，便于替换真实文件系统、内存测试仓库和故障注入实现。
- UI 状态以 `Observable`/`@MainActor` 管理；处理状态通过 `AsyncStream<ProgressEvent>` 回传。

### 4.3 任务执行模型

任何超过一页或可能超过 200 ms 的操作都创建 `ProcessingJob`：

1. 创建任务记录、输入文件引用、参数快照和预估资源。
2. 将源文件复制或安全链接到应用临时工作目录，源文件只读。
3. `ProcessingEngine` 在 `ProcessingActor` 中分阶段执行并写入临时输出。
4. 每个阶段更新进度、日志和可恢复 checkpoint；用户可以取消。
5. 完成后原子移动到用户选择的输出位置，写入新 revision 和摘要信息。
6. 失败时删除临时文件，保留错误码、可读提示和重试入口。

不在 SwiftData 中保存大文件二进制。数据库只保存文件 URL、书签、校验哈希、页数、大小、缩略图路径和处理状态。

## 5. 核心数据模型

### 5.1 SwiftData 实体

```text
DocumentRecord
  id: UUID
  displayName: String
  sourceURLBookmark: Data?
  localStagingURL: String?
  contentHash: String
  fileSize: Int64
  pageCount: Int
  mimeType: String
  isEncrypted: Bool
  ocrState: pending/running/ready/failed
  createdAt, updatedAt, lastOpenedAt

DocumentRevision
  id: UUID
  documentID: UUID
  parentRevisionID: UUID?
  operation: import/scan/ocr/merge/split/compress/annotate/redact/export
  outputURL: String
  contentHash: String
  parametersJSON: Data
  createdAt

SignatureAsset
  id: UUID
  name: String
  vectorDataOrPNGURL: String
  color, scale, createdAt, lastUsedAt

Template
  id: UUID
  name: String
  pageNumberStyleJSON: Data
  watermarkStyleJSON: Data
  compressionPresetJSON: Data
  filenamePattern: String

ProcessingJob
  id: UUID
  type: String
  inputRevisionIDs: [UUID]
  state: queued/running/cancelled/failed/completed
  progress: Double
  checkpointJSON: Data?
  errorCode: String?
  createdAt, completedAt

AppSettings
  defaultCompressionPreset
  defaultExportFolderBookmark
  preferredOCRLanguages
  privacyAndDiagnosticsFlags
```

### 5.2 文件引用和生命周期

- 外部文件以 security-scoped bookmark 记录；每次访问前 `startAccessingSecurityScopedResource()`，完成后配对调用停止访问。
- 应用沙盒暂存目录只保存正在处理或用户明确选择“保留副本”的文件；后台清理过期暂存文件。
- Share Extension 通过 App Group 写入唯一目录，主应用接管后删除 extension 临时副本。
- iCloud Drive 文件不假设本地一直可用；打开前检查下载状态，处理前显示下载进度和剩余空间。
- 每个导出文件写入临时路径、执行 fsync/关闭句柄后再原子 rename，避免生成半个 PDF。

## 6. 关键处理方案

### 6.1 扫描

#### iPhone/iPad

使用 `VNDocumentCameraViewController` 获取页面图像，监听扫描完成、取消和错误。保存原始图像和增强后的渲染图，页面模型中记录拍摄方向、裁切四边形、滤镜和重新处理参数。用户确认后才生成 PDF 和启动 OCR。

#### 质量要求

- 默认保存 200–300 DPI 等效输出；用户可在设置中选择质量。
- 低光、倾斜、阴影、重复页面和空白页面是固定回归样本。
- 页面顺序调整和重拍不能触发已确认页面的重复 OCR。

### 6.2 OCR 和可搜索 PDF

使用 `VNRecognizeTextRequest`，按设备能力选择 `.accurate` 或 `.fast`，识别语言为简体中文、繁体中文和英文。每页先用 ImageIO/Core Graphics 下采样到合理像素范围，再提交 Vision，避免整份高分辨率 PDF 占满内存。

OCR 结果包含原文、候选置信度、行/词 bounding box、语言和版本。文本层写入采用独立的 `SearchablePDFWriter`：

1. 将页面图像作为背景写入新 PDF。
2. 按 Vision 的坐标系转换到 PDF 坐标系。
3. 写入不可见但可搜索的文字内容，保持行位置和字符顺序。
4. 写入 OCR 版本、语言和页面状态到应用侧元数据，不把隐私文本写入诊断日志。
5. 使用系统预览、PDFKit、命令行文本提取和 Acrobat 对同一页执行搜索回归。

由于 PDFKit 没有完整公开的文本层编辑接口，文本层写入必须由 `SearchablePDFWriter` 封装 Core Graphics 和必要的低层 PDF 内容流生成；不能用黑色/透明文本注释冒充 OCR。无法保持搜索能力时，必须明确降级为图像 PDF 并提示用户。

OCR 编辑只修改文本层，不修改扫描图像；用户导出时可以选择保留或重新生成文本层。

### 6.3 PDF 页面操作

统一使用 `PDFDocument` 做页面级读取和大多数标注操作，用 `CGPDFDocument`/Core Graphics 做合并、重建和压缩。跨文档操作先复制页面资源到临时 `PDFDocument`，再通过 `PDFDocument.insert(_:at:)` 或自有 writer 输出，避免修改输入对象。

- 合并：按用户选择顺序拼接页面，检测加密文档并逐一要求密码。
- 拆分：按页范围生成多个输出文件，名称使用序号和原名。
- 旋转：优先修改 page rotation；需要固定方向时再重绘页面。
- 重排/删除/复制：在内存中只保留页面索引和缩略图，最终导出时执行真实页面复制。
- 插入图片：按页面尺寸和边距生成图像页，保留方向和 DPI 信息。

### 6.4 压缩

压缩器先扫描页面资源，再按策略处理：

- 矢量文字、路径和线条默认保留。
- 大于目标 DPI 的图片使用 Lanczos/系统高质量缩放后重新编码。
- 透明图像根据页面实际需要保留 alpha，否则转为不透明 JPEG。
- 扫描页支持彩色、灰度和黑白；文本层单独保留。
- 清理未使用资源、缩略图、嵌入附件和可选元数据。

目标大小采用多轮估算，优先降低图片质量和 DPI，达到下限仍无法满足时返回“无法在可读范围内达到目标”的结果，不输出不可用文件。处理前的预计大小来自抽样页面，不把估算当作保证。

### 6.5 签名、标注和表单

交互层使用 PDFKit 的 `PDFView`、`PDFAnnotation` 和自定义 overlay。自定义 overlay 只保存交互状态，导出时转换为 PDF annotation 或扁平化内容。签名采用 PencilKit `PKDrawing` 保存矢量数据，同时生成 PDF 可嵌入的透明 PNG；导出时按页面坐标和旋转矩阵合成。

AcroForm 字段通过 CGPDF 字典解析并映射为 SwiftUI 控件。填写结果优先写入字段值和外观流；用户选择扁平化时重新绘制页面并删除可编辑字段。

### 6.6 永久打码

打码必须保证原文无法通过复制、搜索、文本提取、注释反编辑或资源恢复。默认实现如下：

1. 标记阶段只保存 `RedactionMark`，不改变源文件。
2. 应用阶段对含标记的页面以至少 200–300 DPI 渲染。
3. 在渲染图上绘制打码区域，再生成新页面；删除该页面原有文字层、注释、链接和隐藏内容。
4. 清理文档级 metadata、embedded files、JavaScript、附件和未使用资源。
5. 对所有输出页面执行文本提取、搜索和对象扫描；验证任何打码区域不存在原字符串。
6. 验证通过后才允许导出，并把结果写成新 revision。

若用户要求保留未打码页面的矢量文字，可以只栅格化受影响页面；若 PDF 结构复杂、无法证明安全，则整份 PDF 扁平化，而不是冒险保留可恢复内容。

### 6.7 密码和加密

打开加密 PDF 时由 UI 请求密码，密码只在当前任务内存中使用，不写入 SwiftData、日志或 URL。验证成功后才允许页面读取和处理。输出通过 PDF 加密选项设置用户/所有者密码和权限；密码移除必须生成新的未加密副本，并在结果页明确显示状态。

## 7. 平台集成

| 能力 | iPhone/iPad |
|---|---|
| 文件导入 | `fileImporter`、UIDocumentPicker、PhotosPicker、Share Extension |
| 扫描 | VisionKit 文档相机 |
| 阅读/标注 | PDFKit/PDFView |
| 手写 | PencilKit、Apple Pencil |
| 分享 | Share Sheet、Share Extension、AirDrop、邮件附件 |
| 自动化 | App Intents、Shortcuts |
| 文件安全 | security-scoped URL、应用沙盒和 App Group |
| 购买 | StoreKit 2，按 Apple ID 同步权益 |

Share Extension 和主应用共用 `AppGroupFileHandoff`，不得直接共享 UI 状态。Extension 只负责接收和落盘，所有 PDF 处理都在主应用或后台任务中进行。

## 8. 隐私、安全和权限

- 相机、照片、文件权限在实际触发前说明用途；只申请完成当前操作所需的权限。
- 默认不启用网络上传；项目不包含自建文件服务器、账号登录和远程 OCR。
- 网络权限只用于 App Store/StoreKit、系统分享目标和用户主动打开的第三方服务；产品代码不读取无关文件。
- 应用容器和 App Group 暂存目录使用系统沙盒；任务完成后按保留策略删除临时文件。
- 签名、OCR 文本、密码和打码原文不能进入崩溃日志、分析事件或埋点。
- Privacy Manifest、Info.plist 用途说明、App Store 隐私标签和隐私政策必须与实际 API 使用一致。
- 删除、覆盖、移除密码、永久打码和清理历史记录都要二次确认。
- 导出前显示目标应用/位置和文件大小；分享失败时不自动重试到未知目标。

## 9. StoreKit 2 设计

定义统一的权益层，不让 UI 直接读取产品 ID：

```text
Entitlement
  canUseBasicViewer
  scanQuota
  ocrQuota
  compressionQuota
  canUseAdvancedSignature
  canRedact
  canProtectWithPassword
  canRunBatch
  canUseShortcuts
  canUseTemplates
```

`StoreKitService` 负责产品加载、购买、交易验证、`Transaction.updates` 监听、撤销/退款同步和恢复购买。`EntitlementStore` 缓存最近一次有效结果用于离线场景，并在下次联网或应用启动时重新验证。测试必须覆盖新购、重复购买、家庭成员、退款、撤销、卸载重装和跨设备恢复。

## 10. 错误处理和用户体验

所有错误归一化为可解释的 `AppError`：

- `permissionDenied`：说明需要哪一项系统权限以及去设置的入口。
- `fileUnavailable`：文件尚未下载、被移动或 security-scoped bookmark 失效。
- `passwordRequired/passwordIncorrect`：允许重试，不能将密码写入错误详情。
- `unsupportedPDF`：指出加密、损坏、格式特性或资源限制。
- `insufficientStorage`：显示需要空间和可清理的临时文件。
- `processingCancelled`：保留源文件，清理临时输出。
- `validationFailed`：禁止导出危险结果，提供重新处理或导出原始副本。

长任务统一显示阶段、当前页、总进度、取消和后台状态。操作必须支持撤销/重做；跨文件批处理使用“重试失败项”，不因为一个文件失败而让用户重新做完全部任务。

## 11. 测试方案

### 11.1 单元和集成测试

- 页面合并、拆分、旋转、复制、重排和插入的页数/顺序/尺寸。
- 压缩前后大小、DPI、透明度、文字可选性和视觉质量。
- OCR 坐标转换、中文/英文混排、旋转页面和多栏布局。
- 签名缩放/旋转、标注坐标、AcroForm 字段和扁平化。
- 打码后的复制、搜索、文本提取、附件和 metadata 清理。
- 密码保护/移除、权限标志和错误密码。
- 任务取消、断点、临时文件清理、磁盘不足和应用被杀后恢复。
- StoreKit 2 交易、恢复购买、家庭共享和撤销。

### 11.2 固定样本集

建立不包含真实个人信息的版本化 PDF 样本：中文合同、发票、证件、表格、多栏文档、扫描阴影、低分辨率图片、旋转页面、超大图片、加密 PDF、带附件 PDF、带 JavaScript/注释 PDF 和损坏文件。每次处理引擎变更都执行 golden file、文本提取和渲染像素差异测试。

### 11.3 真机和系统测试

- iPhone 小屏、标准屏和大屏；iPad 分屏、多窗口、拖放和 Apple Pencil。
- iOS/iPadOS 支持版本、深色模式、动态字体、VoiceOver、键盘导航和 Reduce Motion。
- 本地文件、iCloud Drive 未下载状态、第三方 File Provider、AirDrop、邮件附件和 Share Extension。
- 低存储、无网络、后台切换、锁屏、应用被系统终止和恢复购买。

### 11.4 性能门槛

- 10 页中文扫描 PDF OCR 在目标设备上完成时间和峰值内存记录在测试报告中。
- 100 页 PDF 缩略图按需加载，滚动不因全量解码产生明显卡顿。
- 处理期间主线程不执行整页渲染、OCR 或大文件复制。
- 连续批处理不会随文件数量线性积累内存；每个任务结束释放页面对象和图片缓存。

## 12. 构建、发布和质量门禁

1. 使用 Xcode Cloud 或同等 CI 构建 iOS、iPadOS、Share Extension 和测试目标。
2. CI 执行 SwiftFormat/SwiftLint、编译警告视为失败、单元测试、处理引擎集成测试和 PDF 样本回归。
3. 使用独立的 StoreKit Configuration 文件测试购买，不在开发环境调用真实购买。
4. 发布前检查沙盒 entitlement、App Group、文件类型 UTI、Info.plist 权限说明、Privacy Manifest 和 App Store 隐私问卷。
5. TestFlight 阶段使用真实设备验证扫描、OCR、签名、压缩、导出、打码、密码和恢复购买；记录不含文件内容的错误码和性能指标。
6. 发生处理失败时优先保留原文件和可复现参数；提供用户主动导出的诊断包，诊断包不包含文档内容，除非用户明确选择附加样本。

## 13. 实施顺序

这里的顺序是工程依赖顺序，不代表缩减为 MVP：

### 阶段一：基础骨架和文件安全

- 建立 iOS App target、Share Extension target、Swift Package、依赖注入和 App Group。
- 完成文件引用、security-scoped bookmark、暂存目录、任务状态机和错误模型。
- 完成首页、最近任务、导入/导出和基础 PDF 阅读。

### 阶段二：PDF 引擎和页面工作流

- 完成缩略图、搜索、页面选择、合并、拆分、旋转、重排、复制、提取和插入。
- 完成 Core Graphics 输出、文件原子写入和基础回归样本。

### 阶段三：扫描、图像和 OCR

- 完成 iOS/iPadOS 扫描、图像增强和质量设置。
- 完成 Vision OCR、文本层写入、OCR 编辑和搜索。

### 阶段四：签名、标注、表单和导出

- 完成 PDFKit 标注、PencilKit 签名、签名库、AcroForm 和扁平化。
- 完成压缩预览、目标大小、Files/Share Sheet/AirDrop/邮件导出。

### 阶段五：安全文档能力

- 完成永久打码、验证器、密码保护/移除、metadata/附件清理。
- 建立安全回归样本和“验证失败禁止导出”门禁。

### 阶段六：批处理、模板和 Apple 自动化

- 完成批量压缩/合并/拆分/重命名/页码/水印、模板、App Intents、Shortcuts、iPad 多窗口、拖放和 Pencil 优化。

### 阶段七：商业化和发布

- 完成 StoreKit 2、权益层、买断/年订阅、家庭共享、恢复购买和离线缓存。
- 完成可访问性、本地化、性能压测、CI、TestFlight、审核资料和隐私一致性检查。

## 14. 完整版验收清单

- 能从 Files、照片、相机、Share Extension 和拖放进入任务。
- 能扫描多页纸张，调整顺序、裁切、增强并生成可搜索中文/英文 PDF。
- 能阅读、搜索、标注、签名、填写表单并将结果导出为真实文件。
- 能合并、拆分、旋转、重排、提取、插入、重命名和批量处理 PDF。
- 能预览压缩结果和文件大小，按目标大小输出可读 PDF。
- 能永久打码并证明复制、搜索、文本提取和对象恢复都无法取得原文。
- 能设置和移除密码、控制打印/复制权限，并正确处理加密输入。
- 能添加页码、水印、模板，并运行 Shortcuts 自动化。
- 能在 iPhone 和 iPad 使用，支持 iPad 多窗口、拖放、Apple Pencil、深色模式和 VoiceOver。
- 能购买、恢复购买、家庭共享、卸载重装后恢复权益；付费提示不打断进行中的任务。
- 源文件在所有失败、取消和覆盖风险场景下保持不变；临时文件和敏感数据按策略清理。

## 15. 主要风险和需要提前验证的决策

1. **OCR 文本层兼容性**：PDFKit 对文本层写入能力有限，必须尽早验证自有 writer 在系统预览、Acrobat、PDF Expert 和文本提取工具中的搜索效果。
2. **永久打码安全性**：复杂 PDF、透明图层和附件可能包含隐藏副本；遇到无法证明安全的文档必须整页或整份栅格化。
3. **压缩与可读性**：目标大小和扫描文字清晰度存在冲突，需要用真实设备和中文小字号样本确定默认预设。
4. **大文件内存**：PDFKit 页面对象和高分辨率图像容易造成峰值内存，必须坚持按页处理和临时文件流转。
5. **加密 PDF 兼容性**：不同版本 PDF 加密、权限和字体嵌入行为差异较大，不能只用 PDFKit 的单一示例验收。
6. **StoreKit 地区价格**：文档中的竞品价格和我们的建议价格只能作为方向，最终以 App Store Connect 的实际地区价格和 TestFlight 购买数据为准。
7. **免费权益定义**：需要在产品规格中明确每月扫描/OCR、压缩/合并次数、单文件页数和批处理上限，避免 UI、StoreKit 和审核文案不一致。
