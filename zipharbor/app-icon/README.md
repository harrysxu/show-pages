# ZipHarbor App Icon

2026-10-01。新图标已接入 `ZipHarbor/ZipHarbor/Assets.xcassets/AppIcon.appiconset`。

## 设计

蓝紫渐变延续 App 的 `#5669EE` 主色。中央文件夹代表文件收纳与归档，打开的拉链及交错齿形代表压缩、解压。图标没有文字和格式缩写，避免小尺寸拥挤，也不依赖界面语言。深色版本保持相同轮廓，调整背景和文件夹明度。

原创矢量绘制并由 resvg 渲染为 PNG；本次未使用图像生成模型、第三方图片或 SF Symbols 图标截图。

## 交付文件

- [标准图标 PNG](zipharbor-icon-1024.png)
- [深色图标 PNG](zipharbor-icon-dark-1024.png)
- [标准 SVG 源稿](zipharbor-icon.svg)
- [深色 SVG 源稿](zipharbor-icon-dark.svg)
- [外观与尺寸预览](zipharbor-icon-preview.png)
- [可重复生成脚本](render-icon.py)

PNG 为 1024×1024、RGB、不含 alpha 通道，完整方形画布。系统负责应用桌面圆角；导出资源没有预先裁切圆角。预览中的圆角仅用于展示，并非真机截图。

Xcode 的 universal 图标用于 iOS 17 及后续系统；luminosity/dark 图标用于支持深色图标外观的系统。系统着色外观由 iOS 自动处理，没有新增第三张 tinted 资源。

此前的占位图保存在 `previous-app-icon.png`，移出 asset catalog 以避免未分配资源警告。产品代码与压缩引擎未改动。

## 生成

从工程根目录运行：

```sh
uv run --with resvg-py --with pillow docs/app-icon/render-icon.py
```

加 `--install` 同步 PNG 与 AppIcon 的 `Contents.json`。渲染过程确认输出尺寸和全画布不透明，然后转换为不带 alpha 的 RGB。安装版与 docs 原稿保持相同文件内容。

## 检查

已人工查看标准、深色及 60/40/29 px 缩小预览；没有文字、拉链轮廓与文件夹区分明确。通过 Xcode `actool` 对 iPhone/iPad、iOS 17 最低版本进行 asset catalog 编译。证据见 `asset-catalog-validation.log` 与 `validation.json`。

本轮仅更新图标资源。此前的功能与 UI 测试记录仍对应原验收构建；本轮未重新安装到 iPhone 14，也未宣称新图标已在真机桌面验收。
