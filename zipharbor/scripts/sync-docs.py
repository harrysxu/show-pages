#!/usr/bin/env python3
"""Build the standalone Pages site from ZipHarbor's development documentation.

uv run --with markdown --with beautifulsoup4 scripts/sync-docs.py
"""
from pathlib import Path
import argparse
import html
import json
import os
import re
import shutil
from urllib.parse import urlsplit, unquote

import markdown
from bs4 import BeautifulSoup

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[3] / 'zip-app' / 'docs')
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1])
args = parser.parse_args()
source, output = args.source.resolve(), args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
if not source.is_dir():
    raise SystemExit(f'Document source does not exist: {source}')

def public_text(value):
    # Public copies retain test results while omitting personal device identifiers.
    value = re.sub(r'00008110-000A2D043C8A401E', 'IPHONE14_UDID', value)
    value = value.replace('徐晓龙的iPhone', 'iPhone 14 验收设备')
    return value.replace('/Users/long/', '/Users/USER/')

def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')

def relative(path, other):
    return Path(os.path.relpath(other, path.parent)).as_posix()

def shell(path, title, content, *, en=False, aside='', source_link=''):
    prefix = relative(path, output / 'index.html')[:-len('index.html')]
    home = prefix + ('en/index.html' if en else 'index.html')
    labels = ('Home', 'Support', 'Privacy', 'Documents') if en else ('首页', '技术支持', '隐私政策', '产品文档')
    language = 'en' if en else 'zh-CN'
    nav = ''.join(f'<a href="{href}">{label}</a>' for href, label in zip(
        [home, prefix + ('en/support.html' if en else 'support.html'),
         prefix + ('en/privacy.html' if en else 'privacy.html'), prefix + 'docs.html'], labels))
    footer = 'Local archive tools for iPhone and iPad.' if en else '面向 iPhone 和 iPad 的本地压缩文件工具。'
    download = f'<p class="source-link"><a href="{html.escape(source_link)}" download>下载 Markdown 文档</a></p>' if source_link else ''
    return f'''<!doctype html>
<html lang="{language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{html.escape(title)} · ZipHarbor"><title>{html.escape(title)} · ZipHarbor</title>
<link rel="icon" href="{prefix}app-icon/zipharbor-icon.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}assets/site.css"></head>
<body><a class="skip" href="#main">{'Skip to content' if en else '跳转到正文'}</a>
<header class="site-header"><a class="brand" href="{home}"><img src="{prefix}app-icon/zipharbor-icon-1024.png" width="36" height="36" alt="">ZipHarbor</a><nav aria-label="{'Navigation' if en else '网站导航'}">{nav}</nav></header>
<main id="main" class="{'with-toc' if aside else ''}">{aside}<article>{content}{download}</article></main>
<footer><span>ZipHarbor · {footer}</span><a href="{prefix}docs.html">{'Product documents (中文)' if en else '产品、设计与验收文档'}</a></footer>
</body></html>'''

css = '''
:root{color-scheme:light;--bg:#f3f5fa;--paper:#fff;--ink:#171c2e;--muted:#626b82;--line:#dfe3ee;--blue:#4354d3;--soft:#eef0ff}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:100px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif}a{color:var(--blue);text-underline-offset:4px}a:hover{text-decoration-thickness:2px}button,input{font:inherit}button{cursor:pointer}img{max-width:100%;height:auto}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #5669ee;outline-offset:4px}.skip{position:absolute;top:-100px;left:16px;padding:10px;background:var(--paper);z-index:10}.skip:focus{top:8px}
.site-header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:16px max(24px,calc((100vw - 1200px)/2));border-bottom:1px solid var(--line);background:#f3f5faf2;backdrop-filter:blur(14px)}.brand{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:750;text-decoration:none;color:var(--ink);white-space:nowrap}.brand img{border-radius:9px;flex-shrink:0}.site-header nav{display:flex;gap:22px;flex-wrap:wrap}.site-header nav a{font-size:14px;text-decoration:none}.site-header nav a:hover{text-decoration:underline}
main{max-width:1100px;margin:36px auto;padding:0 24px}article{min-width:0;background:var(--paper);border:1px solid var(--line);border-radius:24px;padding:40px;overflow-wrap:anywhere}h1{font-size:32px;line-height:1.35;letter-spacing:-.6px;margin:0 0 24px}h2{font-size:23px;margin:36px 0 16px;line-height:1.5}h3{font-size:18px;margin:26px 0 10px}p{margin:14px 0}li{margin:5px 0}blockquote{margin:18px 0;padding:10px 18px;border-left:4px solid #5669ee;background:var(--soft);border-radius:0 12px 12px 0}blockquote p{margin:8px 0}code{font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;background:#eef0f6;border-radius:5px;padding:2px 5px}pre{max-width:100%;overflow-x:auto;background:#171c2e;color:#f4f6ff;padding:20px;border-radius:14px}pre code{padding:0;background:none;color:inherit}ul,ol{padding-left:26px}.table-scroll{max-width:100%;overflow-x:auto;margin:20px 0;border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.7}td,th{border-bottom:1px solid var(--line);padding:12px 14px;min-width:120px;text-align:left;vertical-align:top}th{background:var(--soft);font-weight:650}tr:last-child td{border-bottom:0}.kicker{font-size:12px;font-weight:700;letter-spacing:.09em;color:var(--blue)}.muted{color:var(--muted)}.note{border:1px solid var(--line);border-radius:14px;padding:16px;background:#f7f8fc}.source-link{border-top:1px solid var(--line);padding-top:20px;margin-top:32px;font-size:14px}
.with-toc{max-width:1300px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:26px;align-items:start}.toc-panel{position:sticky;top:100px;max-height:calc(100vh - 130px);overflow:auto;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;font-size:13px;line-height:1.6}.toc-panel ul{list-style:none;padding-left:10px}.toc-panel a{text-decoration:none}.toc-panel summary{font-weight:700;cursor:pointer}.toc-panel ul ul ul{display:none}
.hero{display:grid;grid-template-columns:1.25fr 1fr;gap:44px;align-items:center;padding:16px 0 38px}.hero h1{font-size:46px;margin:14px 0 20px}.hero p{color:var(--muted)}.hero-icon{width:100px;border-radius:23px;box-shadow:0 10px 24px #5669ee26}.hero-screen{width:240px;margin:auto;border:7px solid #171c2e;border-radius:36px;display:block;box-shadow:0 22px 65px #171c2e20}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 20px;background:#5669ee;color:white;border:1px solid transparent;border-radius:12px;text-decoration:none;font-weight:650}.button.secondary{background:var(--soft);color:var(--blue);border-color:#dde1fc}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{display:block;padding:22px;border:1px solid var(--line);border-radius:18px;background:var(--paper);text-decoration:none;color:var(--ink)}a.card:hover{border-color:#8894f2;background:#fafbff}.card h2,.card h3{margin:0 0 9px;font-size:18px}.card p{margin:0;color:var(--muted);font-size:14px}.card .number{display:block;color:var(--blue);font-size:12px;font-weight:750;margin-bottom:8px}.language-switch{display:flex;justify-content:flex-end;font-size:14px;margin:0 0 24px}.search{width:100%;padding:12px 16px;border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink);margin:8px 0 20px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.gallery figure{margin:0;min-width:0;border:1px solid var(--line);border-radius:16px;padding:12px;background:#f8f9fc}.gallery img{display:block;width:100%;height:330px;object-fit:contain}.gallery figcaption{font-size:12px;line-height:1.5;margin-top:12px}.files{display:grid;gap:8px;list-style:none;padding:0}.files a{display:block;border:1px solid var(--line);padding:10px 14px;border-radius:10px;font-size:14px}footer{max-width:1200px;margin:40px auto;padding:24px;display:flex;justify-content:space-between;gap:20px;color:var(--muted);font-size:13px;border-top:1px solid var(--line)}[hidden]{display:none!important}
@media(max-width:900px){.with-toc{display:block}.toc-panel{position:static;max-height:260px;margin-bottom:18px}.hero{gap:20px}.hero h1{font-size:36px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.site-header{position:static;display:block;padding:16px 18px}.site-header nav{gap:16px;margin-top:14px}.site-header nav a{font-size:13px}main{margin:22px auto;padding:0 14px}article{padding:24px 20px;border-radius:18px}h1{font-size:27px}h2{font-size:21px}.hero{grid-template-columns:1fr;padding:0 0 24px}.hero h1{font-size:34px}.hero-screen{width:210px}.cards{grid-template-columns:1fr}.gallery{gap:10px}.gallery img{height:260px}footer{flex-direction:column;padding:20px 18px;margin-top:26px}.actions .button{flex:1}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{.site-header,.toc-panel,footer,.source-link{display:none}.with-toc{display:block}main{max-width:none;margin:0;padding:0}article{border:0;padding:0}pre{white-space:pre-wrap}.table-scroll{overflow:visible}a{color:inherit}}
'''
write(output / 'assets/site.css', css)

# Copy display assets and structured test evidence. xcresult bundles stay local.
copied = []
uuid_image = re.compile(r'^[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}\.png$', re.I)
for src in sorted(source.rglob('*')):
    if not src.is_file() or '.DS_Store' in src.parts or any(p.endswith('.xcresult') for p in src.parts):
        continue
    rel = src.relative_to(source)
    if src.name in ('debug.png', 'debug2.png'):
        continue
    if uuid_image.match(src.name) and not any(p.startswith('files-import-') for p in rel.parts):
        continue
    if src.suffix not in ('.md', '.html', '.png', '.svg', '.log', '.json', '.py', '.mp4', '.zip'):
        continue
    dst = output / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix in ('.md', '.log', '.json'):
        write(dst, public_text(src.read_text(encoding='utf-8')))
    else:
        shutil.copy2(src, dst)
    copied.append(rel.as_posix())

rendered = []
def fix_links(soup, page):
    for element in soup.find_all(['a', 'img']):
        attribute = 'href' if element.name == 'a' else 'src'
        link = element.get(attribute)
        if not link or urlsplit(link).scheme or link.startswith(('#', '//')):
            continue
        parts = urlsplit(link)
        if parts.path.endswith('.md'):
            element[attribute] = parts.path[:-3] + '.html' + ('#' + parts.fragment if parts.fragment else '')
        elif parts.path.endswith('.xcresult'):
            element[attribute] = relative(page, output / 'test-artifacts.html') + '#local-results'
            element['title'] = '原始 Xcode 结果包保留在开发工程；查看公开测试证据说明'
    for table in soup.find_all('table'):
        wrapper = soup.new_tag('div', attrs={'class': 'table-scroll', 'tabindex': '0', 'role': 'region', 'aria-label': '文档数据表'})
        table.wrap(wrapper)

for original in sorted(source.rglob('*.md')):
    if any(p.endswith('.xcresult') for p in original.parts):
        continue
    rel = original.relative_to(source)
    page = (output / rel).with_suffix('.html')
    raw = public_text(original.read_text(encoding='utf-8'))
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists', 'attr_list'])
    soup = BeautifulSoup(md.convert(raw), 'html.parser')
    fix_links(soup, page)
    title = soup.h1.get_text(' ', strip=True) if soup.h1 else original.stem
    aside = f'<details class="toc-panel" open><summary>本页目录</summary>{md.toc}</details>'
    intro = '<p class="kicker">产品文档 / 历史记录与验收范围以文中日期为准</p>'
    if rel.parts[0] in ('migration-evidence', 'app-icon'):
        intro += f'<p class="note">公开展示版提供截图、摘要与日志。完整 Xcode 测试结果包保留在开发工程，见 <a href="{relative(page, output / "test-artifacts.html")}">测试证据说明</a>。</p>'
    write(page, shell(page, title, intro + str(soup), aside=aside, source_link=rel.name))
    rendered.append(rel.with_suffix('.html').as_posix())

# Preserve the interactive prototype; only adapt comparison-page document links.
comparison = output / 'migration-comparison.html'
soup = BeautifulSoup(comparison.read_text(), 'html.parser')
fix_links(soup, comparison)
back = soup.new_tag('p')
back.append(BeautifulSoup('<a href="docs.html">← 返回文档目录</a> · <a href="10-iPhone14真机验收-20261001.html">最新真机验收报告</a>', 'html.parser'))
soup.main.insert(0, back)
write(comparison, str(soup))

# Directory index pages make screenshot links work on Pages, which has no directory listing.
dirs = sorted({(output / item).parent for item in copied if '/' in item and not item.endswith('.md')})
for directory in dirs:
    files = sorted(p for p in directory.iterdir() if p.is_file() and p.name not in ('index.html', 'README.html', 'README.md'))
    images = [p for p in files if p.suffix in ('.png', '.svg')]
    others = [p for p in files if p not in images]
    children = sorted(p for p in directory.iterdir() if p.is_dir() and any(p.iterdir()))
    title = '截图与证据 · ' + directory.relative_to(output).as_posix()
    content = f'<p class="kicker">验收与设计素材</p><h1>{html.escape(title)}</h1>'
    if (directory / 'README.html').exists():
        content += '<p><a href="README.html">查看资源说明</a></p>'
    if children:
        content += '<ul class="files">' + ''.join(f'<li><a href="{d.name}/">{html.escape(d.name)}</a></li>' for d in children) + '</ul>'
    if images:
        content += '<div class="gallery">' + ''.join(f'<figure><a href="{html.escape(p.name)}"><img src="{html.escape(p.name)}" loading="lazy" alt="{html.escape(p.stem)}"></a><figcaption>{html.escape(p.stem)}</figcaption></figure>' for p in images) + '</div>'
    if others:
        content += '<h2>摘要、日志与附件</h2><ul class="files">' + ''.join(f'<li><a href="{html.escape(p.name)}">{html.escape(p.name)}</a></li>' for p in others) + '</ul>'
    page = directory / 'index.html'
    write(page, shell(page, title, content))

groups = [
    ('产品与界面', [('01-产品需求文档.html', '产品需求文档', '用户需求、竞品、功能范围和业务逻辑'), ('02-UI-UX设计文档.html', 'UI/UX 设计文档', '信息架构、视觉规范和完整交互'), ('app-prototype.html', '交互式 HTML 原型', '体验首页、压缩、解压、任务和设置'), ('app-icon/README.html', 'App Icon', '标准与深色图标、SVG 源稿和尺寸预览')]),
    ('当前工程与验收', [('05-新工程迁移与功能映射.html', '迁移与功能映射', '新工程的能力对齐与产品边界'), ('06-新工程技术架构.html', '新工程技术架构', '模块职责、任务状态与文件安全'), ('07-新工程最终验收报告.html', '最终验收报告', '测试结果、性能和已确认的边界'), ('08-UI-UX原型对照验收.html', 'UI/UX 原型对照验收', '结构、视觉和交互的逐页核验'), ('migration-comparison.html', '原型与 App 截图对照', '切换页面与真机 / 模拟器截图'), ('09-模拟器图标与最终产品验收-20261001.html', '模拟器验收 · 2026-10-01', '35/35 通过，含新图标和合成媒体'), ('10-iPhone14真机验收-20261001.html', 'iPhone 14 真机验收 · 2026-10-01', '核心 21/21；UI 13 通过、1 跳过'), ('test-artifacts.html', '测试证据与截图', '公开摘要、日志、截图和本地结果包说明')]),
    ('历史方案', [('03-技术方案文档.html', '原工程技术方案', '历史架构；当前实现以新工程技术架构为准'), ('04-功能对齐与验收报告.html', '原工程验收报告', '保留早期开发记录及修复过程'), ('README.html', '开发文档入口', '原项目文档目录和交付说明')])
]
content = '<p class="kicker">ZIPHARBOR / 产品文档</p><h1>从需求到验收，集中浏览。</h1><p class="muted">文档提供 HTML 阅读版和 Markdown 下载版；原型及截图对照可直接交互。历史设计不代表当前实现或最新测试状态。</p><label for="doc-search">查找文档</label><input class="search" id="doc-search" type="search" placeholder="搜索：原型、密码、技术、真机…"><p id="search-status" role="status" class="muted"></p>'
for title, items in groups:
    content += f'<section class="doc-group"><h2>{title}</h2><div class="cards">'
    for i, (href, name, description) in enumerate(items, 1):
        content += f'<a class="card doc-card" href="{href}"><span class="number">{i:02d}</span><h3>{name}</h3><p>{description}</p></a>'
    content += '</div></section>'
content += '''<script>const input=document.getElementById('doc-search');input.addEventListener('input',()=>{const query=input.value.trim().toLowerCase();let count=0;document.querySelectorAll('.doc-card').forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(query);if(!card.hidden)count++});document.querySelectorAll('.doc-group').forEach(group=>group.hidden=![...group.querySelectorAll('.doc-card')].some(card=>!card.hidden));document.getElementById('search-status').textContent=query?(count?'找到 '+count+' 份文档':'没有匹配的文档，请尝试其他关键词。'):'';});</script>'''
write(output / 'docs.html', shell(output / 'docs.html', '产品文档', content))

evidence = '''<p class="kicker">实际验收记录 / 2026-10-01</p><h1>测试证据与截图</h1><p>本页展示既有测试的摘要与截图，本次文档整理未重新运行 App 测试。通过项、跳过项及人工验收边界以各验收报告为准。</p>
<div class="cards"><a class="card" href="simulator-acceptance-20261001/summary.json"><h2>iPhone 14 模拟器</h2><p>35/35 通过，0 失败、0 跳过。查看 XCTest 摘要。</p></a><a class="card" href="iphone14-acceptance-20261001/ui-final2-summary.json"><h2>iPhone 14 真机 UI</h2><p>13 通过、1 跳过、0 失败；核心 21/21，Files 独立复测 1/1。查看 UI 摘要。</p></a></div>
<h2>截图与报告</h2><ul><li><a href="10-iPhone14真机验收-20261001.html">最新真机验收报告与边界</a></li><li><a href="iphone14-acceptance-20261001/screenshots/final-named/">最新真机关键截图</a></li><li><a href="simulator-acceptance-20261001/screenshots/">模拟器关键截图</a></li><li><a href="migration-comparison.html">原型与原生 App 对照</a></li><li><a href="migration-evidence/README.html">迁移验收证据索引（历史记录）</a></li><li><a href="migration-evidence/">迁移截图、结果摘要与日志</a></li></ul>
<h2 id="local-results">原始 Xcode 测试结果包</h2><p>完整 <code>.xcresult</code> 是 Xcode 专用测试归档，保存在开发工程的 <code>docs/**/results/</code>，未放入 GitHub Pages。展示版中的结果包链接指向本说明；原始 Markdown 中仍保留本地路径。网页提供可直接阅读的 JSON 摘要、测试列表、日志和截图。</p>
<p>公开文本中的个人设备标识和本机用户路径已替换；测试统计与结论未改动。真实云盘、本人 Face ID、真人 VoiceOver 等未验证项目请参阅报告。</p>'''
write(output / 'test-artifacts.html', shell(output / 'test-artifacts.html', '测试证据', evidence))

for en in (False, True):
    base = output / 'en' if en else output
    switch = f'<p class="language-switch"><a href="{"../" if en else "en/"}index.html" lang="{"zh-CN" if en else "en"}">{"简体中文" if en else "English"}</a></p>'
    headline = 'Your archives.<br>Handled with care.' if en else '压缩与解压，<br>清晰又可靠。'
    desc = 'Open archives, extract what you need, and pack files to share. ZipHarbor keeps archive processing on your iPhone or iPad, without an account or ads.' if en else '打开压缩包、提取需要的文件，再将资料打包分享。ZipHarbor 在 iPhone 和 iPad 上本地处理归档，无需注册，没有广告。'
    prefix = '../' if en else ''
    home = switch + f'<section class="hero"><div><img class="hero-icon" src="{prefix}app-icon/zipharbor-icon-1024.png" alt="ZipHarbor App Icon"><p class="kicker">ZIPHARBOR / IPHONE + IPAD</p><h1>{headline}</h1><p>{desc}</p><div class="actions"><a class="button" href="support.html">{"How to use" if en else "使用与帮助"}</a><a class="button secondary" href="{prefix}docs.html">{"Product documents" if en else "浏览全部文档"}</a></div></div><img class="hero-screen" src="{prefix}iphone14-acceptance-20261001/screenshots/final-named/{"home-dark-en" if en else "home-zh"}.png" alt="{"ZipHarbor on iPhone 14, English dark mode" if en else "ZipHarbor 在 iPhone 14 上的实际界面"}"></section>'
    cards = [('Open and inspect', 'Browse archive folders and preview supported files. ZIP, 7z, TAR and unencrypted RAR are among the supported formats.'), ('Create and protect', 'Create ZIP or standard 7z archives. Use ZIP AES encryption when password protection is needed.'), ('Choose your destination', 'Save through the system Files picker. Handle name conflicts and open or share the result.'), ('Local by design', 'Files are processed on your device. Cloud-provider transfers and sharing follow the services you choose.')] if en else [('查看归档', '浏览压缩包目录，预览系统支持的文件。可读取 ZIP、7z、TAR 和未加密 RAR 等格式。'), ('创建与加密', '创建 ZIP 或普通 7z。需要密码保护时，可使用 ZIP AES 加密。'), ('明确保存位置', '通过系统 Files 选择目标目录，处理重名冲突，完成后打开或分享结果。'), ('本地处理', '文件在设备上处理；云盘传输与分享由你选择的系统服务完成。')]
    home += '<div class="cards">' + ''.join(f'<div class="card"><h2>{t}</h2><p>{d}</p></div>' for t, d in cards) + '</div>'
    if not en:
        home += '<h2>查看产品设计与验收</h2><p>需求、UI/UX、技术方案和测试记录均已整理为网页。</p><div class="actions"><a class="button secondary" href="app-prototype.html">体验交互原型</a><a class="button secondary" href="migration-comparison.html">原型与 App 对照</a><a class="button secondary" href="test-artifacts.html">查看验收证据</a></div>'
    write(base / 'index.html', shell(base / 'index.html', 'Home' if en else '首页', home, en=en))

privacy_zh = '''<p class="language-switch"><a href="en/privacy.html" lang="en">English</a></p><h1>隐私政策</h1><p class="muted">生效日期：2026 年 10 月 4 日</p><p>ZipHarbor 由徐晓龙提供。文件处理在你的设备上完成；我们没有用于接收你的归档内容的服务器。</p><h2>文件与密码</h2><p>你通过 Files、打开方式或系统选择器提供的文件，仅用于查看、创建、解压、预览和分享。文件内容、文件名、路径、密码和解压结果不会由 ZipHarbor 上传给开发者。归档密码不持久化，任务被系统终止后需要重新输入。</p><h2>本地存储与删除</h2><p>设置、任务记录、最近文件引用和收藏保存在设备上。清理记录不会删除原文件。卸载 App 会移除其应用容器内的数据；保存到 Files、iCloud Drive 或其他提供者的文件不因此删除，备份、同步和保留受对应系统或服务设置控制。</p><h2>系统能力与第三方服务</h2><p>核心归档处理不依赖网络。系统 Files 可按你的选择下载或上传云盘文件；系统分享会将你选中的内容交给接收 App 或服务。其数据处理适用对应服务的隐私政策。</p><p>照片和视频通过 Apple 系统照片选择器导入，只接收你选择的媒体。启用 App 锁时，身份认证由 iOS 处理；ZipHarbor 无法取得 Face ID 生物识别数据。</p><h2>账号、广告与分析</h2><p>应用无需注册账号，不包含广告 SDK，不使用跨 App 跟踪，也不采集后台遥测。</p><h2>支持联系</h2><p>如果主动发送支持邮件，开发者会收到你提供的邮箱、问题描述及附件，并将其用于处理该请求。请避免提供敏感文件或归档密码。</p><h2>儿童隐私</h2><p>ZipHarbor 不专门面向 13 岁以下儿童，也不会有意收集儿童个人信息。</p><h2>政策更新与联系</h2><p>数据处理方式变化时会更新本页面和生效日期。如有问题，请通过 <a href="support.html">技术支持页面</a> 联系开发者。</p>'''
privacy_en = '''<p class="language-switch"><a href="../privacy.html" lang="zh-CN">简体中文</a></p><h1>Privacy Policy</h1><p class="muted">Effective October 4, 2026</p><p>ZipHarbor is provided by Xiaolong Xu. Archive processing takes place on your device. We do not operate a server that receives your archive contents.</p><h2>Files and passwords</h2><p>Files you provide through Files, Open In, or system pickers are used to inspect, create, extract, preview, and share archives. ZipHarbor does not upload file contents, names, paths, passwords, or extracted results to the developer. Archive passwords are not persisted. If iOS terminates a task, you must enter its password again.</p><h2>Local storage and deletion</h2><p>Settings, task records, recent file references, and favorites are stored on your device. Clearing history does not delete source files. Uninstalling the app removes its app-container data. Files saved to Files, iCloud Drive, or other providers remain under those services; backups, synchronization, and retention follow their settings.</p><h2>System features and third-party services</h2><p>Core archive processing does not require a network connection. Files may download or upload cloud files when you choose a provider. System sharing passes selected content to the receiving app or service. Those services apply their own privacy policies.</p><p>Photos and videos are imported through Apple's system photo picker; the app receives only your selected media. When app lock is enabled, iOS handles authentication. ZipHarbor cannot access Face ID biometric data.</p><h2>Accounts, ads, and analytics</h2><p>No account registration is required. The app includes no advertising SDK, uses no cross-app tracking, and collects no background telemetry.</p><h2>Support requests</h2><p>If you email support, the developer receives the address, description, and attachments you provide and uses them to address your request. Avoid sending sensitive files or archive passwords.</p><h2>Children's privacy</h2><p>ZipHarbor is not specifically directed to children under 13 and does not knowingly collect children's personal information.</p><h2>Updates and contact</h2><p>This page and its effective date will be updated if data handling changes. Contact the developer through the <a href="support.html">support page</a> with questions.</p>'''
support_zh = '''<p class="language-switch"><a href="en/support.html" lang="en">English</a></p><h1>技术支持</h1><p>ZipHarbor 支持 iPhone、iPad，以及简体中文和英文界面。切换语言可使用 iOS 的 App 语言设置；向法国提供下载不代表已有法语界面。</p><h2>打开与解压</h2><ol><li>在首页选择“打开压缩包”，通过系统 Files 选择文件；也可从其他 App 的打开方式导入。</li><li>查看目录后选择解压全部或指定文件，确认保存位置和重名策略。</li><li>遇到加密归档时输入密码，任务会自动继续；无需再次点击解压。</li><li>完成后打开目标目录或分享结果；“完成”可关闭结果弹窗。</li></ol><h2>创建归档</h2><p>选择文件、目录或照片视频，再设置名称、目标位置与格式。普通 ZIP 和 7z 可创建；密码保护使用 ZIP AES，暂不支持创建加密 7z。</p><h2>找不到输出文件</h2><p>查看任务结果中的保存位置，或点击“打开文件夹”。默认位置为 App 的 Downloads 目录，也可以在任务开始前选择其他位置。清理最近记录不会删除文件。</p><h2>密码、格式与分卷错误</h2><p>错误密码可以在原任务内重试。加密 RAR 不受支持；7z 和其他格式的密码算法兼容性取决于底层解码能力。分卷文件需要完整选择同一卷组，并保持文件名与编号连续。空间不足、文件损坏或云盘下载失败时，先解决提示的问题再重试。</p><h2>联系开发者</h2><p>邮箱：<a href="mailto:ailehuoquan@163.com?subject=ZipHarbor%20Support">ailehuoquan@163.com</a>。请提供设备型号、iOS 版本、文件格式、错误信息和复现步骤；无需发送敏感文件或密码。</p><p><a href="privacy.html">隐私政策</a> · <a href="docs.html">产品与验收文档</a></p>'''
support_en = '''<p class="language-switch"><a href="../support.html" lang="zh-CN">简体中文</a></p><h1>Support</h1><p>ZipHarbor supports iPhone and iPad, with English and Simplified Chinese interfaces. Use the app's language setting in iOS to change language. Availability in France does not imply a French interface.</p><h2>Open and extract</h2><ol><li>Choose Open archive on the home screen and select a file through Files, or use Open In from another app.</li><li>Browse the archive, choose all or selected entries, and confirm the destination and conflict policy.</li><li>Enter a password if prompted. The task continues automatically without a second extraction action.</li><li>Open the output folder or share the result. Done closes the result sheet.</li></ol><h2>Create an archive</h2><p>Select files, folders, or photos and videos, then choose a name, destination, and format. You can create standard ZIP and 7z archives. Use ZIP AES for password protection; creating encrypted 7z archives is currently unavailable.</p><h2>Find output files</h2><p>Check the destination on the result sheet or choose Open folder. The default location is the app's Downloads folder; you can select another destination before starting. Clearing recent history does not delete files.</p><h2>Password, format, and volume errors</h2><p>Retry an incorrect password within the original task. Encrypted RAR is unsupported. Password algorithm compatibility for 7z and other formats depends on the underlying decoder. Select every file in a split archive and keep the original consecutive names. Resolve low-storage, damaged-file, or cloud-download errors before retrying.</p><h2>Contact the developer</h2><p>Email <a href="mailto:ailehuoquan@163.com?subject=ZipHarbor%20Support">ailehuoquan@163.com</a> with your device model, iOS version, archive format, error message, and reproduction steps. Do not include sensitive files or archive passwords.</p><p><a href="privacy.html">Privacy Policy</a> · <a href="../docs.html">Product and acceptance documents (中文)</a></p>'''
for rel, title, body, en in [('privacy.html', '隐私政策', privacy_zh, False), ('support.html', '技术支持', support_zh, False), ('en/privacy.html', 'Privacy Policy', privacy_en, True), ('en/support.html', 'Support', support_en, True)]:
    page = output / rel
    write(page, shell(page, title, body, en=en))

readme = '''# ZipHarbor GitHub Pages 展示站

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
'''
write(output / 'README.md', readme)
manifest = {'source': 'zip-app/docs', 'updated': '2026-10-04', 'markdown_pages': rendered, 'copied_files': copied, 'excluded': ['*.xcresult/**', 'debug.png', 'debug2.png', 'duplicate UUID screenshots'], 'published': False}
write(output / 'site-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'html_documents': len(rendered), 'copied_files': len(copied), 'output': str(output)}, ensure_ascii=False))
