# ZipHarbor GitHub Pages 展示站

本站为独立静态 HTML/CSS，不依赖 Jekyll 主题、在线 Markdown 渲染、第三方字体或 CDN。源文档转换为 HTML 阅读页，另保留 Markdown 下载版。首页有中英文版本；产品与研发文档维持原中文内容。

## 入口与发布地址

仓库根目录启用 GitHub Pages 后的预期地址（保存文件不代表已经提交或上线）：

- 首页：https://harrysxu.github.io/show-pages/zipharbor/
- English：https://harrysxu.github.io/show-pages/zipharbor/en/
- 所有文档：https://harrysxu.github.io/show-pages/zipharbor/docs.html
- 隐私政策：https://harrysxu.github.io/show-pages/zipharbor/privacy.html
- 英文隐私政策：https://harrysxu.github.io/show-pages/zipharbor/en/privacy.html
- 技术支持：https://harrysxu.github.io/show-pages/zipharbor/support.html
- 英文技术支持：https://harrysxu.github.io/show-pages/zipharbor/en/support.html
- 交互原型：https://harrysxu.github.io/show-pages/zipharbor/app-prototype.html
- 截图对照：https://harrysxu.github.io/show-pages/zipharbor/migration-comparison.html

App Store Connect 现有地址不会因本地文件整理自动改变。新站上线并确认可访问后，才可将上述隐私/支持地址填入。

## 本地预览与同步

在 show-pages 仓库根目录运行 `python3 -m http.server 8765`，浏览 `http://localhost:8765/zipharbor/`。

同步开发工程文档并重建站点：

```sh
cd zipharbor
uv run --with markdown --with beautifulsoup4 scripts/sync-docs.py
```

可用 `--source /path/to/zip-app/docs --output /path/to/site` 指定路径。同步脚本只在目标目录生成文件，不修改开发工程中的原文档。

## 展示范围

包含需求、UI/UX、技术、迁移、历史及最新验收报告，原型、图标、命名截图、公开测试摘要和必要日志。原型保持原设计基线（ZipKit 旧名），不宣称截图与当前 UI 逐像素相同。完整 `.xcresult` 保留在开发目录，网页链接转到测试证据说明；重复 UUID 截图与临时 debug 截图未纳入。公开文本中的个人设备标识和本机用户名路径已替换，统计与结论不变。

开发文档原入口转换为 `README.html`；本文件是展示站维护说明。
