const sources = new Map(),
  sourceDocuments = new Map();
let samplePages = {},
  draggedPageId = null,
  annotationDrag = null,
  rectDrag = null,
  signatureDrawing = false,
  signatureCurrent = null;
const sampleText = {
  contract: [
    "合作服务协议",
    "甲方：上海启明科技有限公司",
    "乙方：林晓",
    "第一条  合作范围",
    "双方确认本项目的服务范围、交付标准及实施计划。",
    "乙方应按照双方约定的时间完成交付，并保证成果完整。",
    "第二条  交付与验收",
    "项目方案确认：2026 年 10 月 15 日",
    "最终成果交付：2026 年 11 月 30 日",
    "第三条  费用与支付",
    "项目服务费用为人民币 28,000 元。",
    "甲方在确认交付成果后 15 个工作日内完成支付。",
    "联系人：林晓   电话：138 0013 8000",
    "第四条  保密义务",
    "双方对合作过程中获得的资料及商业信息承担保密义务。",
    "甲方签署：____________",
    "乙方签署：____________",
  ],
  receipt: [
    "差旅费用报销单",
    "报销人：林晓      部门：产品设计部",
    "出差日期：2026.09.24 — 2026.09.27",
    "出差事由：供应商现场沟通与验收",
    "费用明细",
    "交通费用                    ¥ 1,280.00",
    "住宿费用                    ¥ 1,560.00",
    "餐饮补助                    ¥   240.00",
    "其他费用                    ¥   120.00",
    "合计金额                    ¥ 3,200.00",
    "附件：车票、酒店发票及付款凭证",
    "申请人：____________",
    "部门负责人：____________",
    "财务复核：____________",
  ],
  invoice: [
    "电子发票（普通发票）",
    "发票号码：2026092800031286",
    "开票日期：2026 年 09 月 28 日",
    "购买方：上海启明科技有限公司",
    "销售方：上海云杉设计服务中心",
    "项目名称：设计服务费",
    "数量：1 项      单价：26,415.09",
    "税率：6%       税额：1,584.91",
    "价税合计（小写）：¥ 28,000.00",
    "价税合计（大写）：贰万捌仟元整",
    "备注：2026 年第三季度项目设计服务",
    "收款人：李明     复核：张悦     开票：王宁",
  ],
  report: [
    "项目申请与执行计划",
    "项目名称：年度产品体验升级",
    "申请部门：产品设计部",
    "负责人：林晓",
    "项目目标",
    "完善核心任务体验，优化文件交付与本地隐私流程。",
    "实施范围",
    "需求研究、界面设计、交互验证与实施验收。",
    "阶段安排",
    "01 需求与现状研究     2026.10.01 — 10.15",
    "02 原型与设计评审     2026.10.16 — 10.31",
    "03 开发与交付验证     2026.11.01 — 11.30",
    "申请预算：人民币 68,000 元",
    "申请人：____________",
    "审核意见：____________",
  ],
};
function makeDocumentAsset(type, index = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 1190;
  canvas.height = 1684;
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  c.fillStyle = "#fff";
  c.fillRect(0, 0, 595, 842);
  c.fillStyle = "#859589";
  c.font = '9px -apple-system,"PingFang SC",sans-serif';
  c.fillText(
    "PAPERFLOW  /  " +
      (type === "contract"
        ? "AGREEMENT"
        : type === "receipt"
          ? "EXPENSE REPORT"
          : type === "invoice"
            ? "INVOICE"
            : "PROJECT PLAN"),
    49,
    45,
  );
  c.fillText("2026.09", 495, 45);
  c.strokeStyle = "#d6ded6";
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(49, 58);
  c.lineTo(546, 58);
  c.stroke();
  const lines = [...sampleText[type]];
  if (index > 0) {
    lines[0] =
      type === "contract"
        ? [
            "合作条款与实施安排",
            "交付清单与验收标准",
            "保密与数据安全约定",
            "项目计划附件",
          ][index % 4]
        : type === "receipt"
          ? "费用凭证 · 附件 " + index
          : lines[0] + " · 附页 " + index;
  }
  c.fillStyle = type === "invoice" ? "#b45e59" : "#243a2c";
  c.font = 'bold 25px "PingFang SC",sans-serif';
  c.textAlign = "center";
  c.fillText(lines[0], 297.5, 112);
  c.fillStyle = "#7d8d81";
  c.font = '10px "PingFang SC",sans-serif';
  c.fillText(
    type === "contract"
      ? "双方共同确认下列服务内容与执行安排"
      : "请核对下列信息并保留相关凭证",
    297.5,
    138,
  );
  c.textAlign = "left";
  let y = 185;
  for (let i = 1; i < lines.length; i++) {
    const heading =
      /^第[一二三四]|^费用明细|^合计金额|^项目目标|^实施范围|^阶段安排/.test(
        lines[i],
      );
    if (heading) {
      y += 12;
      c.fillStyle = "#edf3ee";
      c.fillRect(49, y - 17, 497, 28);
      c.fillStyle = "#34523c";
      c.font = 'bold 13px "PingFang SC",sans-serif';
    } else {
      c.fillStyle = "#435349";
      c.font = '12px "PingFang SC",sans-serif';
    }
    c.fillText(lines[i], heading ? 58 : 54, y);
    y += heading ? 36 : 32;
    if (y > 753) break;
  }
  c.strokeStyle = "#e2e8e2";
  c.beginPath();
  c.moveTo(49, 790);
  c.lineTo(546, 790);
  c.stroke();
  c.fillStyle = "#95a399";
  c.font = '9px "PingFang SC",sans-serif';
  c.fillText("纸间 · 示例文档", 49, 809);
  c.textAlign = "right";
  c.fillText(String(index + 1).padStart(2, "0"), 546, 809);
  return {
    id: uid(),
    image: canvas.toDataURL("image/jpeg", 0.84),
    rotation: 0,
    text: lines.join("\n"),
    textSource: "sample",
    originalIndex: index,
    width: 595,
    height: 842,
  };
}
function clonePage(p) {
  return { ...p, id: uid() };
}
async function initSamples() {
  samplePages = {
    contract: Array.from({ length: 8 }, (_, i) =>
      makeDocumentAsset("contract", i),
    ),
    receipt: Array.from({ length: 5 }, (_, i) =>
      makeDocumentAsset("receipt", i),
    ),
    invoice: Array.from({ length: 2 }, (_, i) =>
      makeDocumentAsset("invoice", i),
    ),
    report: Array.from({ length: 4 }, (_, i) => makeDocumentAsset("report", i)),
  };
  const definitions = [
    ["合作协议_最终版.pdf", "contract", "示例", "示例文档"],
    ["差旅报销单_9月.pdf", "receipt", "示例", "示例文档"],
    ["供应商发票_0928.pdf", "invoice", "示例", "示例文档"],
    ["项目申请表.pdf", "report", "示例", "示例文档"],
  ];
  state.files = definitions.map(([name, type, status, date]) => ({
    id: uid(),
    name,
    type,
    status,
    date,
    pages: samplePages[type].map((p) => ({ ...p, id: uid() })),
    annotations: [],
    isRaster: true,
    isSample: true,
    size: 0,
  }));
  for (const f of state.files) {
    f.originalPageCount = f.pages.length;
    const bytes = await buildPDF(f, { raster: true, quality: 84, dpi: 144 });
    f.size = bytes.byteLength;
    f.sourceBytes = bytes;
    sources.set(f.id, bytes);
    f.pages.forEach((p, i) => {
      p.sourceId = f.id;
      p.originalIndex = i;
    });
  }
  state.current = state.files[0].id;
}
async function imageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取页面图片"));
    image.src = src;
  });
}
function rgbColor(hex) {
  const h = hex.replace("#", "");
  return PDFLib.rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}
async function canvasPage(
  p,
  {
    quality = 85,
    dpi = 144,
    gray = false,
    redactions = [],
    redactColor = "#161c18",
  } = {},
) {
  const im = await imageElement(p.image),
    ratio = dpi / 72,
    { width, height } = pageDimensions(p),
    canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  c.fillStyle = "#fff";
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (gray) c.filter = "grayscale(1)";
  c.save();
  c.translate(canvas.width / 2, canvas.height / 2);
  c.rotate(((p.rotation || 0) * Math.PI) / 180);
  c.drawImage(
    im,
    (-(p.width || 595) * ratio) / 2,
    (-(p.height || 842) * ratio) / 2,
    (p.width || 595) * ratio,
    (p.height || 842) * ratio,
  );
  c.restore();
  c.filter = "none";
  if (redactions.length) {
    c.fillStyle = redactColor;
    for (const b of redactions)
      c.fillRect(
        Math.floor(b.x * canvas.width) - 2,
        Math.floor(b.y * canvas.height) - 2,
        Math.ceil(b.w * canvas.width) + 4,
        Math.ceil(b.h * canvas.height) + 4,
      );
  }
  return canvas.toDataURL("image/jpeg", quality / 100);
}
async function createOverlay(file, p, index, options, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * 2);
  canvas.height = Math.round(height * 2);
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  let hasContent = false;
  if (options.watermark) {
    const w = state.watermark;
    if (w.type === "image" && w.image) {
      const im = await imageElement(w.image);
      c.save();
      c.globalAlpha = w.opacity / 100;
      c.translate(width / 2, height / 2);
      c.rotate((w.angle * Math.PI) / 180);
      const ww = width * (w.size / 100),
        hh = (ww * im.height) / im.width;
      c.drawImage(im, -ww / 2, -hh / 2, ww, hh);
      c.restore();
      hasContent = true;
    } else if (w.text) {
      const yy = w.tile ? [-height * 0.27, 0, height * 0.27] : [0];
      for (const offset of yy) {
        c.save();
        c.globalAlpha = (w.opacity / 100) * (w.foreground ? 1 : 0.66);
        c.fillStyle = w.color;
        c.translate(width / 2, height / 2 + offset);
        c.rotate((w.angle * Math.PI) / 180);
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = `bold ${(w.size * width) / 310}px "PingFang SC",sans-serif`;
        c.fillText(w.text, 0, 0);
        c.restore();
      }
      hasContent = true;
    }
  }
  if (options.numbers) {
    const n = state.numbers;
    if (
      !(n.skip && index === 0) &&
      index + 1 >= +n.from &&
      index + 1 <= Math.min(+n.to, file.pages.length)
    ) {
      let pos = n.position;
      if (n.oddEven && (index + 1) % 2 === 0)
        pos = pos.endsWith("left")
          ? pos.replace("left", "right")
          : pos.endsWith("right")
            ? pos.replace("right", "left")
            : pos;
      c.fillStyle = "#33483a";
      c.font = `${(n.size * width) / 310}px "PingFang SC",sans-serif`;
      c.textAlign = pos.endsWith("center")
        ? "center"
        : pos.endsWith("right")
          ? "right"
          : "left";
      c.fillText(
        `${n.prefix}${+n.start + index}${n.suffix}`,
        pos.endsWith("center")
          ? width / 2
          : pos.endsWith("right")
            ? width - 34
            : 34,
        pos.startsWith("top") ? 30 : height - 24,
      );
      hasContent = true;
    }
  }
  if (options.annotations) {
    const aa = (file.annotations || []).filter((a) => a.pageId === p.id);
    for (const a of aa) {
      c.fillStyle = a.color || state.color;
      c.strokeStyle = a.color || state.color;
      c.lineWidth = 2;
      const x = a.x * width,
        y = a.y * height,
        w = a.w * width,
        h = a.h * height;
      if (a.type === "signature") {
        const im = await imageElement(a.image);
        c.drawImage(im, x, y, w, h);
      } else if (a.type === "highlight") {
        c.save();
        c.globalAlpha = 0.36;
        c.fillStyle = "#f3c84c";
        c.fillRect(x, y, w, h);
        c.restore();
      } else if (a.type === "rectangle") {
        c.strokeRect(x, y, w, h);
      } else if (a.type === "underline") {
        c.beginPath();
        c.moveTo(x, y + h);
        c.lineTo(x + w, y + h);
        c.stroke();
      } else {
        if (a.type === "note") {
          c.fillStyle = "#fff3b1";
          c.fillRect(x, y, w, h);
          c.fillStyle = "#716338";
        }
        c.font = `${((a.size || 16) * width) / 310}px "PingFang SC",sans-serif`;
        c.textBaseline = "middle";
        c.fillText(
          a.type === "check" ? "✓" : a.text || "",
          x + 4,
          y + h / 2,
          w - 5,
        );
      }
      hasContent = true;
    }
  }
  return hasContent ? canvas.toDataURL("image/png") : null;
}
async function buildPDF(file, options = {}) {
  const doc = await PDFLib.PDFDocument.create();
  doc.setCreator("Paperflow HTML Prototype");
  if (!options.metadata) doc.setTitle(basename(file.name));
  for (let i = 0; i < file.pages.length; i++) {
    if (state.job?.cancelled) throw cancelledError();
    const p = file.pages[i];
    let page,
      width = p.width || 595,
      height = p.height || 842;
    const boxes = options.redactions
      ? state.redactBoxes.filter((b) => b.pageId === p.id)
      : [];
    const raster =
      options.raster ||
      boxes.length ||
      !p.sourceId ||
      !sources.has(p.sourceId) ||
      ((p.baseRotation || p.rotation) &&
        (options.annotations || options.numbers || options.watermark));
    if (!raster) {
      let source = sourceDocuments.get(p.sourceId);
      if (!source) {
        source = await PDFLib.PDFDocument.load(sources.get(p.sourceId));
        sourceDocuments.set(p.sourceId, source);
      }
      const copied = await doc.copyPages(source, [p.originalIndex]);
      page = doc.addPage(copied[0]);
      ({ width, height } = page.getSize());
    } else {
      ({ width, height } = pageDimensions(p));
      const data = await canvasPage(p, {
        quality: options.quality || 85,
        dpi: options.dpi || 144,
        gray: options.gray,
        redactions: boxes,
        redactColor: state.redactColor,
      });
      const img = await doc.embedJpg(data);
      page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }
    page.setRotation(
      PDFLib.degrees(
        raster ? 0 : ((p.baseRotation || 0) + (p.rotation || 0)) % 360,
      ),
    );
    const applyWatermark =
      options.watermark &&
      (state.watermark.range === "all" || i === state.pageIndex);
    const overlay = await createOverlay(
      file,
      p,
      i,
      { ...options, watermark: applyWatermark },
      width,
      height,
    );
    if (overlay) {
      const embedded = await doc.embedPng(overlay);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
    }
    if (state.job)
      progress(
        Math.round(15 + ((i + 1) / file.pages.length) * 65),
        `第 ${i + 1} / ${file.pages.length} 页`,
      );
  }
  return doc.save();
}
async function parsePDF(bytes, name, { forResult = false } = {}) {
  const pdf = await pdfjsLib.getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
  }).promise;
  if (pdf.numPages > 100)
    throw new Error("原型单次支持 100 页以内的 PDF，请拆分后再导入。");
  const id = uid(),
    pages = [];
  sources.set(id, bytes);
  for (let i = 1; i <= pdf.numPages; i++) {
    if (state.job?.cancelled) throw cancelledError();
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp })
      .promise;
    const text = await page.getTextContent();
    const dims = page.getViewport({ scale: 1 });
    pages.push({
      id: uid(),
      image: canvas.toDataURL("image/jpeg", 0.85),
      rotation: 0,
      baseRotation: page.rotate || 0,
      text: text.items.map((t) => t.str).join(" "),
      textSource: "native",
      sourceId: id,
      originalIndex: i - 1,
      width: dims.width,
      height: dims.height,
    });
    if (state.job)
      progress(
        20 + (i / pdf.numPages) * 65,
        `预览第 ${i} / ${pdf.numPages} 页`,
      );
    page.cleanup();
  }
  await pdf.destroy();
  return {
    id,
    name,
    pages,
    size: bytes.byteLength,
    status: forResult ? "已完成" : "刚导入",
    date: "刚刚",
    sourceBytes: bytes,
    annotations: [],
    isRaster: false,
    originalPageCount: pages.length,
  };
}
async function fileAsPage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await imageElement(url),
      c = document.createElement("canvas");
    const w = 1190,
      h = 1684;
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, h);
    const scale = Math.min((w - 60) / image.width, (h - 60) / image.height),
      ww = image.width * scale,
      hh = image.height * scale;
    g.drawImage(image, (w - ww) / 2, (h - hh) / 2, ww, hh);
    return {
      id: uid(),
      image: c.toDataURL("image/jpeg", 0.88),
      width: 595,
      height: 842,
      text: "",
      rotation: 0,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function progress(value, label = "") {
  if (!state.job) return;
  state.job.progress = Math.max(state.job.progress, Math.round(value));
  const bar = $("#job-progress"),
    pct = $("#job-percent"),
    stage = $("#job-stage");
  if (bar) bar.style.width = state.job.progress + "%";
  if (pct) pct.textContent = state.job.progress + "%";
  if (stage && label) stage.textContent = label;
}
async function withJob(title, work) {
  if (state.job) return;
  closeModal();
  state.result = null;
  const id = uid();
  state.job = { id, title, progress: 0, cancelled: false };
  $("#overlays").innerHTML =
    `<div class="progress-overlay" role="dialog" aria-modal="true" aria-labelledby="job-title"><div class="progress-box"><div class="spinner"></div><h2 id="job-title">${esc(title)}</h2><p>在本地生成工作副本</p><div class="progress-track"><span id="job-progress"></span></div><div class="progress-caption"><span id="job-stage">准备页面</span><span id="job-percent">0%</span></div><button class="text-btn muted" data-action="cancel-job" style="margin-top:20px">取消处理</button></div></div>`;
  refreshIcons();
  try {
    await sleep(120);
    if (state.job?.cancelled) throw cancelledError();
    await work();
    if (state.job?.cancelled) throw cancelledError();
    progress(100, "处理完成");
    state.job = null;
    await saveWorkspace();
    $("#overlays").innerHTML = "";
    render();
    if (state.result) showResult();
    return true;
  } catch (error) {
    state.job = null;
    $("#overlays").innerHTML = "";
    render();
    if (error.message === "TASK_CANCELLED") toast("任务已取消，原件保留");
    else {
      console.error(error);
      openModal(
        "处理未完成",
        `<div class="warning red">${icon("circle-alert")}${esc(error.message || "文件处理失败，请重新尝试。")}</div><p>原始文件没有被修改。</p><div class="footer-actions">${button("返回任务", "close-modal", "arrow-left", "secondary")}</div>`,
      );
    }
    return false;
  }
}
async function finishPDF(file, options, suffix, extra = {}) {
  const bytes = await buildPDF(file, options);
  if (state.job?.cancelled) throw cancelledError();
  progress(85, "生成结果预览");
  const filename =
    extra.filename || basename(file.name) + "_" + suffix + ".pdf";
  const resultFile = await parsePDF(bytes, filename, { forResult: true });
  if (state.job?.cancelled) throw cancelledError();
  state.files.unshift(resultFile);
  state.hasUsed = true;
  state.draft = null;
  resultFile.lastOpenedAt = Date.now();
  const affectedPage =
    (file.annotations || [])[0]?.pageId || state.redactBoxes[0]?.pageId;
  const previewIndex = Math.max(
    0,
    file.pages.findIndex((p) => p.id === affectedPage),
  );
  state.result = {
    bytes,
    filename,
    fileId: resultFile.id,
    kind: "pdf",
    pageCount: resultFile.pages.length,
    size: bytes.byteLength,
    image: resultFile.pages[previewIndex]?.image || resultFile.pages[0].image,
    sourceFileId: file.id,
    sourceSize: file.size || bytes.byteLength,
    sourcePageCount: file.originalPageCount || file.pages.length,
    sourceImage: file.pages[previewIndex]?.image || file.pages[0].image,
    previewPageIndex: previewIndex,
    operation: suffix,
    options: structuredClone(options),
    target: state.compress.target,
    signatureCount: (file.annotations || []).filter(
      (a) => a.type === "signature",
    ).length,
    annotationCount: (file.annotations || []).length,
    redactionCount: state.redactBoxes.length,
    redactionPages: new Set(state.redactBoxes.map((b) => b.pageId)).size,
    numberedPages: file.pages.filter(
      (_, i) =>
        !(state.numbers.skip && i === 0) &&
        i + 1 >= state.numbers.from &&
        i + 1 <= state.numbers.to,
    ).length,
    watermarkedPages: state.watermark.range === "all" ? file.pages.length : 1,
    pendingWorkflow: suffix === "扫描" ? state.pendingWorkflow : null,
    title: {
      压缩: "压缩完成",
      已签署: "签署副本已生成",
      整理: "页面整理完成",
      扫描: "扫描文档已生成",
      页码: "页码已添加",
      水印: "水印已添加",
      已打码: "打码副本已生成",
    }[suffix],
    ...extra,
  };
  persist();
}
function openModal(title, body, { wide = false, after = null } = {}) {
  modalReturnFocus = document.activeElement;
  state.modal = { title };
  $("#overlays").innerHTML =
    `<div class="overlay" data-overlay="true"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="sheet-grabber"></div><div class="sheet-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon-btn" data-action="close-modal" title="关闭" aria-label="关闭">${icon("x")}</button></div>${body}</section></div>`;
  refreshIcons();
  const first = $("input,textarea,select,button", $(".sheet"));
  first?.focus({ preventScroll: true });
  if (after) requestAnimationFrame(after);
}
function closeModal() {
  if (state.job) return;
  state.modal = null;
  $("#overlays").innerHTML = "";
  if (modalReturnFocus?.isConnected)
    modalReturnFocus.focus({ preventScroll: true });
}
function showResult() {
  const r = state.result;
  if (!r) return;
  openModal(
    "处理结果",
    `<h2 class="result-title" style="margin-top:5px">${esc(r.title || "新文件已就绪")}</h2><p class="result-sub">原始文件保持不变</p>${r.kind === "pdf" ? resultExperienceHTML(r) : ""}<div class="result-detail"><img class="file-cover" src="${r.image || current()?.pages[0]?.image || ""}" alt="输出文件封面"><div class="grow"><strong style="word-break:break-all">${esc(r.filename)}</strong><p>${r.pageCount ? r.pageCount + " 页 · " : ""}${sizeString(r.size)}</p></div><span class="tag">已生成</span></div>${r.warning ? `<div class="warning">${icon("info")}${esc(r.warning)}</div>` : ""}${field("输出文件名", `<input type="text" id="result-name" value="${esc(r.filename)}">`)}${button("保存到文件 / 下载", "download-result", "download")}<div class="row" style="margin-top:9px">${button("分享文件", "share-result", "share", "outline")}${button("查看结果", "open-result", "book-open", "outline")}</div>${r.kind === "pdf" ? `<button class="text-btn" data-action="continue-result" style="margin-top:17px;width:100%;justify-content:center">继续处理此结果 ${icon("arrow-right")}</button>` : ""}`,
  );
}
function download(bytes, name, mime = "application/pdf") {
  const blob = new Blob([bytes], { type: mime }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function downloadResult() {
  if (!state.result) return;
  const name = $("#result-name")?.value.trim() || state.result.filename;
  if (!name) {
    toast("请输入文件名", true);
    return;
  }
  state.result.filename = name;
  const file = state.files.find((f) => f.id === state.result.fileId);
  if (file) file.name = name;
  scheduleWorkspaceSave();
  download(
    state.result.bytes,
    name,
    state.result.kind === "text"
      ? "text/plain;charset=utf-8"
      : "application/pdf",
  );
  toast("文件已交给浏览器保存");
}
async function shareResult() {
  const r = state.result;
  if (!r) return;
  const file = new File([r.bytes], $("#result-name")?.value || r.filename, {
    type: "application/pdf",
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: basename(r.filename) });
    } catch (e) {
      if (e.name !== "AbortError") toast("当前浏览器无法分享，请下载文件");
    }
  } else {
    openModal(
      "分享文件",
      `<p>${esc(r.filename)}</p><div class="warning">${icon("info")}当前浏览器不支持系统文件分享，可先下载文件，再使用 AirDrop、邮件或其他 App 发送。</div>${button("下载文件", "download-result", "download")}`,
    );
  }
}
function importSheet() {
  openModal(
    "添加文件",
    `<button class="import-option" data-action="pick-files">${icon("folder-open")}<span class="grow"><strong>从文件导入</strong><small>PDF、JPEG、PNG 与其他系统图片</small></span>${icon("chevron-right")}</button><button class="import-option" data-action="pick-photos">${icon("images")}<span class="grow"><strong>从照片导入</strong><small>可选择多张照片生成文档</small></span>${icon("chevron-right")}</button><button class="import-option" data-route="scan">${icon("scan-line")}<span class="grow"><strong>扫描纸质文档</strong><small>多页扫描与边缘校正</small></span>${icon("chevron-right")}</button><div class="dropzone">${icon("file-input")}<p>将文件拖入此处</p></div><div class="note" style="margin-top:15px">${icon("shield-check")}文件只在当前浏览器处理</div>`,
  );
}
async function importFiles(files, destination = importDestination) {
  if (!files.length) return;
  state.result = null;
  if (["signature", "watermark"].includes(destination)) {
    try {
      const img = files[0];
      if (!img.type.startsWith("image/"))
        throw new Error("请选择 PNG 或 JPEG 图片");
      const reader = new FileReader();
      reader.onload = () => {
        if (destination === "signature") {
          rememberSignature(reader.result, basename(img.name));
        } else {
          state.watermark.image = reader.result;
          state.watermark.type = "image";
        }
        closeModal();
        render();
        toast("图片已添加");
      };
      reader.readAsDataURL(img);
    } catch (e) {
      toast(e.message, true);
    }
    importDestination = "file";
    return;
  }
  const requestedRoute = state.pendingRoute;
  const workflowId = state.pendingWorkflow;
  const relink = state.relinkDraft;
  const completed = await withJob("正在导入文件", async () => {
    const added = [];
    for (const file of files) {
      if (state.job?.cancelled) throw cancelledError();
      const isPDF =
        file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (relink && !isPDF) throw new Error("请重新选择草稿的原始 PDF 文件。");
      if (!isPDF && !file.type.startsWith("image/"))
        throw new Error(`不支持“${file.name}”的格式，请选择 PDF 或图片。`);
      let doc;
      if (isPDF) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (relink?.document?.sourceBytes) {
          const original = relink.document.sourceBytes;
          if (
            files.length !== 1 ||
            bytes.length !== original.length ||
            !bytes.every((b, i) => b === original[i])
          )
            throw new Error(
              "这份 PDF 与草稿源文件不一致，请重新选择原始 PDF。",
            );
        }
        doc = await parsePDF(bytes, file.name);
        if (relink?.document) doc = structuredClone(relink.document);
      } else {
        const p = await fileAsPage(file);
        doc = {
          id: uid(),
          name: basename(file.name) + ".pdf",
          pages: [p],
          size: file.size,
          isImage: true,
          isRaster: true,
          status: "图片导入",
          date: "刚刚",
          annotations: [],
        };
        const b = await buildPDF(doc, { raster: true, quality: 88 });
        doc.sourceBytes = b;
        doc.size = b.byteLength;
        sources.set(doc.id, b);
        p.sourceId = doc.id;
        p.originalIndex = 0;
      }
      if (destination === "scan") {
        state.scanPages.push(...doc.pages.map(clonePage));
      } else if (destination === "insert") {
        rememberPages();
        current().pages.splice(
          state.pageIndex + 1,
          0,
          ...doc.pages.map(clonePage),
        );
      } else {
        state.files.unshift(doc);
        added.push(doc);
      }
    }
    if (destination === "scan") state.route = "scan";
    else if (destination === "insert") state.route = "organize";
    else if (added.length) {
      state.current = added.at(-1).id;
      state.pageIndex = relink?.pageIndex || 0;
      state.route = requestedRoute || "reader";
      state.hasUsed = true;
      state.draft = relink || null;
      if (!relink) state.activeWorkflow = null;
      state.relinkDraft = null;
      state.ocrText =
        state.files.find((f) => f.id === state.current).ocrText || "";
      state.ocrReady = !!state.ocrText;
      state.pendingRoute = null;
      state.files.find((f) => f.id === state.current).lastOpenedAt = Date.now();
      persist();
    }
    state.result = null;
    progress(100);
  });
  importDestination = "file";
  if (!completed) return;
  if (destination === "scan") markScanDraft();
  if (workflowId && destination === "file" && !relink) {
    state.pendingWorkflow = null;
    reviewWorkflow(workflowId);
  }
  if (relink) state.pendingWorkflow = null;
  toast(
    destination === "scan"
      ? "已添加扫描页面"
      : destination === "insert"
        ? "页面已插入"
        : "文件已导入",
  );
}
function rememberPages() {
  markDraft();
  state.undo.push(current().pages.map((p) => ({ ...p })));
  if (state.undo.length > 30) state.undo.shift();
  state.redo = [];
}
function movePage(id, direction) {
  const f = current(),
    index = f.pages.findIndex((p) => p.id === id),
    target = index + Number(direction);
  if (target < 0 || target >= f.pages.length) return;
  rememberPages();
  [f.pages[index], f.pages[target]] = [f.pages[target], f.pages[index]];
  render();
}
function chooseFileSheet() {
  openModal(
    "选择文件",
    `${state.files.map((f) => `<button class="file-item" data-action="choose-current" data-id="${f.id}"><img class="file-cover" src="${f.pages[0].image}" alt="封面"><span class="grow"><strong class="filename">${esc(f.name)}</strong><small style="display:block;margin-top:5px">${f.pages.length} 页 · ${sizeString(f.size)}</small></span>${icon(f.id === state.current ? "circle-check" : "circle")}</button>`).join("")}<div class="footer-actions">${button("从文件导入", "pick-files", "plus", "outline")}</div>`,
  );
}
let mergeIDs = new Set();
function mergeSheet() {
  mergeIDs = new Set();
  openModal(
    "合并文件",
    `<div class="note">${icon("files")}按所选文件顺序追加到当前文档</div>${state.files
      .filter((f) => f.id !== state.current)
      .map(
        (f) =>
          `<label class="file-item"><input type="checkbox" data-merge-id="${f.id}"><img class="file-cover" src="${f.pages[0].image}" alt="封面"><span class="grow"><strong class="filename">${esc(f.name)}</strong><small style="display:block;margin-top:4px">${f.pages.length} 页</small></span></label>`,
      )
      .join(
        "",
      )}<div class="footer-actions">${button("合并所选文件", "merge-apply", "combine")}</div>`,
  );
}
function splitSheet() {
  openModal(
    "拆分 PDF",
    `${field("拆分方式", `<select id="split-mode"><option value="single">每页保存为一个 PDF</option><option value="ranges">按范围拆分</option></select>`)}${field("页面范围（逗号分隔）", `<input type="text" id="split-ranges" value="1-${Math.max(1, Math.floor(current().pages.length / 2))},${Math.floor(current().pages.length / 2) + 1}-${current().pages.length}">`)}<div class="footer-actions">${button("开始拆分", "split-run", "scissors")}</div>`,
  );
}
function parseRanges(text, total) {
  const result = [];
  for (const part of text.split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("请输入正确范围，例如：1-3,4-8");
    const start = +match[1],
      end = +(match[2] || match[1]);
    if (start < 1 || end > total || start > end)
      throw new Error(`范围应在 1 到 ${total} 之间`);
    result.push(
      Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i),
    );
  }
  return result;
}
function editTemplateSheet(id) {
  const t = state.templates.find((t) => t.id === id);
  openModal(
    "编辑模板",
    `${field("模板名称", `<input type="text" id="template-name" value="${esc(t.name)}">`)}${field("水印文字", `<input type="text" id="template-watermark" value="${esc(t.watermark)}">`)}${field("压缩预设", `<select id="template-compress"><option value="light" ${t.compress === "light" ? "selected" : ""}>轻度</option><option value="balanced" ${t.compress === "balanced" ? "selected" : ""}>平衡</option><option value="strong" ${t.compress === "strong" ? "selected" : ""}>强力</option></select>`)}${button("保存模板", "template-save-edit", "check", "primary", `data-id="${id}"`)}`,
  );
}
function signatureSheet() {
  signatureDrawing = false;
  state.signatureStrokes = [];
  signatureCurrent = null;
  openModal(
    "手写签名",
    `<div class="row between" style="margin-bottom:12px"><span class="note">${icon("signature")}签署人</span><div class="row"><button class="icon-btn" data-action="signature-undo" title="撤销笔画">${icon("undo-2")}</button><button class="text-btn" data-action="signature-clear">清空</button></div></div><canvas id="signature-canvas" class="signature-canvas"></canvas><div class="row between" style="margin:15px 0"><span class="note">${icon("lock-keyhole")}只保存在本机</span><span class="tag gray">触控 / 鼠标 / Pencil</span></div>${button("保存签名", "signature-save", "check")}`,
    { after: initSignaturePad },
  );
}
function initSignaturePad() {
  const canvas = $("#signature-canvas"),
    r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * 2);
  canvas.height = 340;
  redrawSignature();
  canvas.onpointerdown = (e) => {
    signatureDrawing = true;
    canvas.setPointerCapture(e.pointerId);
    signatureCurrent = [];
    state.signatureStrokes.push(signatureCurrent);
    addSignaturePoint(e);
  };
  canvas.onpointermove = (e) => {
    if (signatureDrawing) addSignaturePoint(e);
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    signatureDrawing = false;
    signatureCurrent = null;
  };
}
function addSignaturePoint(e) {
  const canvas = $("#signature-canvas"),
    r = canvas.getBoundingClientRect();
  signatureCurrent.push({
    x: (e.clientX - r.left) / r.width,
    y: (e.clientY - r.top) / r.height,
  });
  redrawSignature();
}
function redrawSignature() {
  const canvas = $("#signature-canvas");
  if (!canvas) return;
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = "#20392d";
  c.lineWidth = 5;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const stroke of state.signatureStrokes) {
    if (!stroke.length) continue;
    c.beginPath();
    c.moveTo(stroke[0].x * canvas.width, stroke[0].y * canvas.height);
    if (stroke.length === 1)
      c.lineTo(
        stroke[0].x * canvas.width + 0.2,
        stroke[0].y * canvas.height + 0.2,
      );
    for (const p of stroke.slice(1))
      c.lineTo(p.x * canvas.width, p.y * canvas.height);
    c.stroke();
  }
  if (!state.signatureStrokes.length) {
    c.fillStyle = "#d7e0d9";
    c.font = '32px "PingFang SC",sans-serif';
    c.textAlign = "center";
    c.fillText("在此签名", canvas.width / 2, canvas.height / 2 + 12);
  }
}
function saveSignature() {
  const points = state.signatureStrokes.flat();
  if (points.length < 2) {
    toast("请先绘制签名", true);
    return;
  }
  const canvas = $("#signature-canvas"),
    c = canvas.getContext("2d");
  let minx = 1,
    miny = 1,
    maxx = 0,
    maxy = 0;
  points.forEach((p) => {
    minx = Math.min(minx, p.x);
    maxx = Math.max(maxx, p.x);
    miny = Math.min(miny, p.y);
    maxy = Math.max(maxy, p.y);
  });
  const x = Math.max(0, minx * canvas.width - 12),
    y = Math.max(0, miny * canvas.height - 12),
    w = Math.min(
      canvas.width - x,
      Math.max(24, (maxx - minx) * canvas.width + 24),
    ),
    h = Math.min(
      canvas.height - y,
      Math.max(24, (maxy - miny) * canvas.height + 24),
    ),
    crop = document.createElement("canvas");
  crop.width = w;
  crop.height = h;
  crop.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
  rememberSignature(
    crop.toDataURL("image/png"),
    $("#signature-name")?.value.trim() ||
      "签名 " + (state.signatures.length + 1),
  );
  closeModal();
  render();
  toast("签名已保存");
}
function addAnnotation(
  type,
  { x = 0.31, y = 0.72, text = null, w = null, h = null } = {},
) {
  if (type === "signature" && !state.signature) {
    signatureSheet();
    return;
  }
  const a = {
    id: uid(),
    pageId: currentPage().id,
    type,
    x,
    y,
    w: w || (type === "signature" ? 0.35 : type === "check" ? 0.065 : 0.44),
    h: h || (type === "signature" ? 0.09 : type === "check" ? 0.05 : 0.065),
    color: state.color,
    size: state.annotationSize,
  };
  if (type === "signature") a.image = state.signature;
  if (text) a.text = text;
  current().annotations = current().annotations || [];
  current().annotations.push(a);
  state.annotations = current().annotations;
  state.tool = "select";
  markDraft();
  render();
}
function addTextSheet(x = 0.25, y = 0.45, type = "text") {
  openModal(
    type === "note" ? "添加便签" : "添加文本",
    `${field("内容", `<input type="text" id="annotation-text" placeholder="输入文字" autofocus>`)}${button("添加到当前页面", "add-text-confirm", "check", "primary", `data-x="${x}" data-y="${y}" data-type="${type}"`)}`,
  );
}
function afterRender() {
  const pw = $("#paper-wrap");
  if (pw && ["sign", "redact"].includes(state.route)) {
    pw.onpointerdown = paperPointerDown;
    pw.onpointermove = paperPointerMove;
    pw.onpointerup = paperPointerEnd;
    pw.onpointercancel = paperPointerEnd;
  }
  updateBoundUI();
  if (state.route === "ocr") updateOCRSearch();
}
function paperPointerDown(e) {
  if (e.button !== 0) return;
  const pw = $("#paper-wrap"),
    r = pw.getBoundingClientRect(),
    x = (e.clientX - r.left) / r.width,
    y = (e.clientY - r.top) / r.height;
  const aEl = e.target.closest("[data-annotation-id]");
  if (aEl && state.route === "sign") {
    const a = current().annotations.find(
      (a) => a.id === aEl.dataset.annotationId,
    );
    if (!a) return;
    annotationDrag = {
      id: a.id,
      x,
      y,
      ax: a.x,
      ay: a.y,
      aw: a.w,
      ah: a.h,
      resize: !!e.target.closest("[data-resize-annotation]"),
    };
    pw.setPointerCapture(e.pointerId);
    return;
  }
  if (
    state.route === "redact" ||
    ["highlight", "rectangle", "underline"].includes(state.tool)
  ) {
    rectDrag = {
      x,
      y,
      pageId: currentPage().id,
      type: state.route === "redact" ? "redact" : state.tool,
    };
    pw.setPointerCapture(e.pointerId);
    pw.insertAdjacentHTML(
      "beforeend",
      `<div id="rect-draft" class="rect-draft"></div>`,
    );
  } else if (state.route === "sign" && state.tool !== "select") {
    if (["text", "note"].includes(state.tool)) addTextSheet(x, y, state.tool);
    else if (state.tool === "signature")
      addAnnotation("signature", { x: Math.min(0.6, x), y: Math.min(0.86, y) });
    else if (state.tool === "check") addAnnotation("check", { x, y });
  }
}
function paperPointerMove(e) {
  const pw = $("#paper-wrap");
  if (!pw) return;
  const r = pw.getBoundingClientRect(),
    x = (e.clientX - r.left) / r.width,
    y = (e.clientY - r.top) / r.height;
  if (annotationDrag) {
    const a = current().annotations.find((a) => a.id === annotationDrag.id);
    if (annotationDrag.resize) {
      a.w = Math.max(
        0.04,
        Math.min(1 - a.x, annotationDrag.aw + x - annotationDrag.x),
      );
      a.h = Math.max(
        0.02,
        Math.min(1 - a.y, annotationDrag.ah + y - annotationDrag.y),
      );
    } else {
      a.x = Math.max(
        0,
        Math.min(1 - a.w, annotationDrag.ax + x - annotationDrag.x),
      );
      a.y = Math.max(
        0,
        Math.min(1 - a.h, annotationDrag.ay + y - annotationDrag.y),
      );
    }
    const el = $(`[data-annotation-id="${a.id}"]`);
    if (el) {
      el.style.left = a.x * 100 + "%";
      el.style.top = a.y * 100 + "%";
      el.style.width = a.w * 100 + "%";
      el.style.height = a.h * 100 + "%";
    }
  } else if (rectDrag) {
    rectDrag.ex = Math.max(0, Math.min(1, x));
    rectDrag.ey = Math.max(0, Math.min(1, y));
    const d = $("#rect-draft");
    if (d) {
      d.style.left = Math.min(rectDrag.x, x) * 100 + "%";
      d.style.top = Math.min(rectDrag.y, y) * 100 + "%";
      d.style.width = Math.abs(x - rectDrag.x) * 100 + "%";
      d.style.height = Math.abs(y - rectDrag.y) * 100 + "%";
    }
  }
}
function paperPointerEnd(e) {
  if (annotationDrag || rectDrag) markDraft();
  annotationDrag = null;
  if (rectDrag) {
    const d = rectDrag;
    rectDrag = null;
    $("#rect-draft")?.remove();
    const w = Math.abs((d.ex ?? d.x) - d.x),
      h = Math.abs((d.ey ?? d.y) - d.y);
    if (w > 0.025 && h > 0.008) {
      const rect = {
        id: uid(),
        pageId: d.pageId,
        x: Math.min(d.x, d.ex),
        y: Math.min(d.y, d.ey),
        w,
        h,
      };
      if (d.type === "redact") {
        state.redactBoxes.push(rect);
        render();
      } else addAnnotation(d.type, rect);
    }
  }
}
function updateBoundUI() {
  if (state.route === "compress") {
    const c = state.compress,
      f = current(),
      estimate =
        f.size *
        (c.preserve && !f.isRaster
          ? 0.93
          : Math.min(0.95, 0.12 + c.quality / 140));
    if ($("#quality-value")) $("#quality-value").textContent = c.quality + "%";
    if ($("#compression-estimate"))
      $("#compression-estimate").textContent = sizeString(estimate);
    if ($("#compression-saving"))
      $("#compression-saving").textContent =
        "−" + Math.round((1 - estimate / f.size) * 100) + "%";
  }
  if (["watermark", "numbers"].includes(state.route)) {
    $("#document-overlay").innerHTML = overlayHTML();
    if ($("#watermark-opacity"))
      $("#watermark-opacity").textContent = state.watermark.opacity + "%";
    if ($("#watermark-angle"))
      $("#watermark-angle").textContent = state.watermark.angle + "°";
    if ($("#watermark-size"))
      $("#watermark-size").textContent = state.watermark.size + " pt";
    if ($("#number-size"))
      $("#number-size").textContent = state.numbers.size + " pt";
  }
  if (state.route === "protect" && $("#password-status")) {
    const p = state.protect;
    $("#password-status").textContent = !p.confirm
      ? ""
      : p.password.length < 6
        ? "密码至少需要 6 位"
        : p.password === p.confirm
          ? "两次密码一致"
          : "两次输入不一致";
    $("#password-status").className =
      "note " +
      (p.password === p.confirm && p.password.length >= 6
        ? "accent"
        : "danger");
  }
}
function updateOCRSearch() {
  const box = $("#ocr-search-result");
  if (!box) return;
  const q = state.ocrQuery;
  if (!q) {
    box.textContent = "";
    return;
  }
  const occurrences = state.ocrText.split(q).length - 1;
  box.textContent = occurrences
    ? `找到 ${occurrences} 处“${q}”`
    : "未找到匹配文字";
  const area = $("#ocr-text");
  if (occurrences) {
    const index = state.ocrText.indexOf(q);
    area.setSelectionRange(index, index + q.length);
  }
}
function setByPath(path, value) {
  const parts = path.split(".");
  let obj = state;
  for (const part of parts.slice(0, -1)) obj = obj[part];
  obj[parts.at(-1)] = value;
}
function batchOptions(op, f) {
  if (op === "compress")
    return {
      raster: f.isRaster || !state.compress.preserve,
      quality: state.compress.quality,
      dpi: state.compress.dpi,
      gray: state.compress.gray,
      metadata: state.compress.metadata,
    };
  return {
    annotations: true,
    numbers: op === "numbers",
    watermark: op === "watermark",
  };
}
async function runBatch({ onlyFailed = false, id = null } = {}) {
  const b = state.batch,
    selected = state.files.filter((f) => b.ids.has(f.id));
  if (!selected.length) {
    toast("请选择至少一个文件");
    return;
  }
  state.result = null;
  if (!onlyFailed && !id)
    b.queue = selected.map((f) => ({
      id: f.id,
      name: f.name,
      status: "pending",
      progress: 0,
    }));
  const completed = await withJob("正在批量处理", async () => {
    if (b.op === "merge") {
      const merged = {
        ...selected[0],
        pages: selected.flatMap((f) => f.pages),
        name: "合并文件.pdf",
      };
      await finishPDF(merged, { annotations: true }, "合并");
      b.queue.forEach((q) => {
        q.status = "done";
        q.progress = 100;
        q.bytes = state.result.bytes;
        q.filename = state.result.filename;
      });
      return;
    }
    let count = 0;
    const queue = id
      ? b.queue.filter((q) => q.id === id)
      : onlyFailed
        ? b.queue.filter((q) => q.status === "error")
        : b.queue;
    for (const q of queue) {
      if (state.job?.cancelled) throw cancelledError();
      q.status = "running";
      q.progress = 15;
      renderQueue();
      const f = state.files.find((f) => f.id === q.id);
      try {
        if (!f) throw new Error("文件已移除");
        q.parts = null;
        q.bytes = null;
        const outputName =
          b.op === "rename"
            ? `${b.prefix}_${String(count + 1).padStart(3, "0")}.pdf`
            : `${basename(f.name)}_${{ compress: "压缩", numbers: "页码", watermark: "水印", split: "拆分" }[b.op] || "处理"}.pdf`;
        if (b.op === "split") {
          for (let i = 0; i < f.pages.length; i++) {
            const part = { ...f, pages: [f.pages[i]] };
            const bytes = await buildPDF(part, { annotations: true });
            q.parts = q.parts || [];
            q.parts.push({
              bytes,
              name: `${basename(f.name)}_第${i + 1}页.pdf`,
            });
          }
          q.bytes = q.parts[0].bytes;
          q.filename = q.parts[0].name;
        } else {
          q.bytes = await buildPDF(f, batchOptions(b.op, f));
          q.filename = outputName;
        }
        q.status = "done";
        q.progress = 100;
      } catch (e) {
        if (e.message === "TASK_CANCELLED") {
          q.status = "pending";
          q.progress = 0;
          q.parts = null;
          q.bytes = null;
          throw e;
        }
        q.status = "error";
        q.error = e.message;
        q.progress = 0;
      }
      count++;
      renderQueue();
      await sleep(180);
    }
    state.result = null;
  });
  if (!completed) return;
  toast(
    `已完成 ${b.queue.filter((q) => q.status === "done").length} 个任务${b.queue.some((q) => q.status === "error") ? "，失败项可重试" : ""}`,
  );
}
function renderQueue() {
  const el = $("#batch-queue");
  if (el) {
    el.innerHTML = queueHTML();
    refreshIcons();
  }
}
function resultText(text, name) {
  const bytes = new TextEncoder().encode(text);
  state.result = {
    bytes,
    filename: name,
    kind: "text",
    size: bytes.byteLength,
    image: current().pages[0].image,
    title: "识别文字已就绪",
  };
  showResult();
}
const actions = {
  back: back,
  import: importSheet,
  "close-modal": closeModal,
  "pick-files": () => {
    importDestination = "file";
    $("#file-input").click();
  },
  "pick-photos": () => {
    importDestination = "file";
    $("#image-input").click();
  },
  "scan-import": () => {
    importDestination = "scan";
    $("#image-input").click();
  },
  "insert-picker": () => {
    importDestination = "insert";
    $("#file-input").click();
  },
  "choose-file": chooseFileSheet,
  "choose-current": (el) => {
    state.current = el.dataset.id;
    state.pageIndex = 0;
    state.selected.clear();
    state.redactBoxes = [];
    state.annotations = current().annotations || [];
    closeModal();
    render();
  },
  "clear-query": () => {
    state.query = "";
    render();
    $("#file-search")?.focus();
  },
  "sort-files": () => {
    state.files.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    render();
  },
  capture: () => {
    state.scanPages.push(
      clonePage(
        samplePages.contract[
          state.scanPages.length % samplePages.contract.length
        ],
      ),
    );
    markScanDraft();
    render();
    $("#scan-stage")?.classList.add("scan-flash");
    toast("已拍摄第 " + state.scanPages.length + " 页");
  },
  "scan-remove": (el) => {
    state.scanPages.splice(+el.dataset.index, 1);
    markScanDraft();
    render();
  },
  "scan-review": () => {
    if (!state.scanPages.length) {
      toast("尚未拍摄页面");
      return;
    }
    openModal(
      "扫描页面",
      `<div class="page-grid">${state.scanPages.map((p, i) => `<div class="page-tile"><img src="${p.image}" alt="第 ${i + 1} 页"><span class="page-label">第 ${i + 1} 页</span><div class="page-tools"><button data-action="scan-move" data-index="${i}" data-direction="-1" title="向前移动" ${i === 0 ? "disabled" : ""}>${icon("arrow-left")}</button><button data-action="scan-rotate" data-index="${i}" title="旋转页面">${icon("rotate-cw")}</button><button data-action="scan-move" data-index="${i}" data-direction="1" title="向后移动" ${i === state.scanPages.length - 1 ? "disabled" : ""}>${icon("arrow-right")}</button></div></div>`).join("")}</div><div class="footer-actions">${button("完成整理", "close-modal", "check")}</div>`,
    );
  },
  "scan-move": (el) => {
    const i = +el.dataset.index,
      j = i + +el.dataset.direction;
    [state.scanPages[i], state.scanPages[j]] = [
      state.scanPages[j],
      state.scanPages[i],
    ];
    actions["scan-review"]();
    renderScanBehind();
  },
  "scan-rotate": (el) => {
    const p = state.scanPages[+el.dataset.index];
    p.rotation = ((p.rotation || 0) + 90) % 360;
    actions["scan-review"]();
  },
  "scan-finish": () =>
    withJob("正在生成扫描 PDF", async () => {
      const f = {
        id: uid(),
        name: "扫描文档_" + new Date().toISOString().slice(0, 10) + ".pdf",
        pages: state.scanPages.map(clonePage),
        annotations: [],
        isRaster: true,
      };
      await finishPDF(f, { raster: true, quality: 85, dpi: 144 }, "扫描", {
        warning: state.scanOCR
          ? "OCR 为演示，当前导出为图像 PDF；可进入文字识别页编辑并导出示例文本。"
          : null,
      });
      state.scanPages = [];
    }),
  "select-all": () => {
    state.selected = new Set(current().pages.map((p) => p.id));
    render();
  },
  "invert-pages": () => {
    state.selected = new Set(
      current()
        .pages.filter((p) => !state.selected.has(p.id))
        .map((p) => p.id),
    );
    render();
  },
  "reverse-pages": () => {
    rememberPages();
    current().pages.reverse();
    render();
  },
  "move-page": (el) => movePage(el.dataset.id, el.dataset.direction),
  "rotate-page": (el) => {
    rememberPages();
    const p = current().pages.find((p) => p.id === el.dataset.id);
    p.rotation = (p.rotation + 90) % 360;
    render();
  },
  "rotate-selected": () => {
    rememberPages();
    current()
      .pages.filter((p) => state.selected.has(p.id))
      .forEach((p) => (p.rotation = (p.rotation + 90) % 360));
    render();
  },
  "duplicate-pages": () => {
    rememberPages();
    current().pages = current().pages.flatMap((p) =>
      state.selected.has(p.id) ? [p, clonePage(p)] : [p],
    );
    render();
    toast("已复制所选页面");
  },
  "delete-pages": () => {
    const n = state.selected.size;
    if (n >= current().pages.length) {
      toast("至少需要保留一页", true);
      return;
    }
    openModal(
      "删除所选页面？",
      `<p>将从工作副本中移除 ${n} 页，原件不会被修改。</p><div class="footer-actions">${button("删除 " + n + " 页", "confirm-delete-pages", "trash-2", "destructive")}${button("取消", "close-modal", "x", "outline")}</div>`,
    );
  },
  "confirm-delete-pages": () => {
    rememberPages();
    current().pages = current().pages.filter((p) => !state.selected.has(p.id));
    state.selected.clear();
    closeModal();
    render();
  },
  "undo-pages": () => {
    if (state.undo.length) {
      state.redo.push(current().pages.map((p) => ({ ...p })));
      current().pages = state.undo.pop();
      state.selected.clear();
      render();
    }
  },
  "redo-pages": () => {
    if (state.redo.length) {
      state.undo.push(current().pages.map((p) => ({ ...p })));
      current().pages = state.redo.pop();
      state.selected.clear();
      render();
    }
  },
  "merge-picker": mergeSheet,
  "merge-apply": () => {
    if (!mergeIDs.size) {
      toast("请选择需要合并的文件");
      return;
    }
    rememberPages();
    for (const id of mergeIDs)
      current().pages.push(
        ...state.files.find((f) => f.id === id).pages.map(clonePage),
      );
    closeModal();
    render();
    toast("已合并 " + mergeIDs.size + " 个文件");
  },
  "split-pages": splitSheet,
  "split-run": () => {
    let groups;
    try {
      groups =
        $("#split-mode").value === "single"
          ? current().pages.map((_, i) => [i])
          : parseRanges($("#split-ranges").value, current().pages.length);
    } catch (e) {
      toast(e.message, true);
      return;
    }
    const f = current();
    state.batch.queue = [];
    state.result = null;
    return withJob("正在拆分 PDF", async () => {
      for (let i = 0; i < groups.length; i++) {
        const part = { ...f, pages: groups[i].map((n) => f.pages[n]) };
        const bytes = await buildPDF(part, { annotations: true });
        state.batch.queue.push({
          id: uid(),
          name: basename(f.name) + "_拆分" + (i + 1) + ".pdf",
          filename: basename(f.name) + "_拆分" + (i + 1) + ".pdf",
          bytes,
          status: "done",
          progress: 100,
        });
      }
      state.route = "batch";
      state.result = null;
    });
  },
  "extract-pages": () =>
    withJob("正在提取页面", () =>
      finishPDF(
        {
          ...current(),
          pages: current().pages.filter((p) => state.selected.has(p.id)),
        },
        { annotations: true },
        "提取",
      ),
    ),
  "organize-export": () =>
    withJob("正在生成整理后的 PDF", () =>
      finishPDF(current(), { annotations: true }, "整理"),
    ),
  "prev-page": () => {
    state.pageIndex = Math.max(0, state.pageIndex - 1);
    render();
  },
  "next-page": () => {
    state.pageIndex = Math.min(current().pages.length - 1, state.pageIndex + 1);
    render();
  },
  "zoom-in": () => {
    state.zoom = Math.min(180, state.zoom + 10);
    render();
  },
  "zoom-out": () => {
    state.zoom = Math.max(70, state.zoom - 10);
    render();
  },
  "reader-mode": () => {
    closeModal();
    state.readerMode = state.readerMode === "single" ? "continuous" : "single";
    render();
  },
  "reader-search": () =>
    openModal(
      "搜索文档",
      `<div class="searchbar">${icon("search")}<input id="document-search" type="text" placeholder="输入要查找的文字"></div><div id="document-search-results" class="col"><p class="muted">搜索原生文字和已识别文字</p></div>`,
    ),
  "search-go": (el) => {
    state.pageIndex = +el.dataset.index;
    closeModal();
    render();
  },
  "doc-info": () =>
    openModal(
      "文档信息",
      `<div class="result-detail"><img src="${current().pages[0].image}" class="file-cover" alt="封面"><div class="grow"><strong>${esc(current().name)}</strong><p>${current().pages.length} 页 · ${sizeString(current().size)}</p></div></div><p>页面尺寸：${Math.round(currentPage().width)} × ${Math.round(currentPage().height)} pt</p><p>状态：${esc(current().status)}</p><p>存储位置：当前浏览器本地会话</p><p>加密状态：未加密</p>`,
    ),
  "page-picker": () =>
    openModal(
      "页面缩略图",
      `<div class="page-grid">${current()
        .pages.map(
          (p, i) =>
            `<button class="page-tile ${i === state.pageIndex ? "active" : ""}" data-action="jump-to-page" data-index="${i}"><img src="${p.image}" alt="第 ${i + 1} 页"><span class="page-label">第 ${i + 1} 页</span></button>`,
        )
        .join("")}</div>`,
    ),
  "jump-to-page": (el) => {
    state.pageIndex = +el.dataset.index;
    closeModal();
    render();
  },
  export: () =>
    withJob("正在准备导出文件", () =>
      finishPDF(current(), { annotations: true }, "副本"),
    ),
  "download-result": downloadResult,
  "share-result": shareResult,
  "open-result": () => {
    const r = state.result;
    if (r?.kind === "text") {
      closeModal();
      navigate("ocr");
      return;
    }
    if (r?.fileId) {
      closeModal();
      selectFile(r.fileId);
    }
  },
  "compress-run": () => {
    const c = state.compress,
      f = current();
    return withJob("正在压缩 PDF", async () => {
      await finishPDF(
        f,
        {
          raster: f.isRaster || !c.preserve || c.gray,
          quality: c.quality,
          dpi: c.dpi,
          gray: c.gray,
          metadata: c.metadata,
          annotations: true,
        },
        "压缩",
      );
      const size = state.result.size;
      if (size > c.target * 1048576)
        state.result.warning =
          "当前结果超过目标 " +
          c.target +
          " MB。可降低图像质量或分辨率后重试。";
      else if (size >= f.size)
        state.result.warning =
          "当前设置没有减少文件体积。可选择更强压缩级别，或保留原件。";
    });
  },
  "signature-pad": signatureSheet,
  "signature-save": saveSignature,
  "signature-undo": () => {
    state.signatureStrokes.pop();
    redrawSignature();
  },
  "signature-clear": () => {
    state.signatureStrokes = [];
    redrawSignature();
  },
  "signature-image": () => {
    importDestination = "signature";
    $("#image-input").click();
  },
  "delete-signature": () =>
    openModal(
      "删除保存的签名？",
      `<p>已放置在文档上的签名仍会保留。</p><div class="footer-actions">${button("删除签名", "confirm-delete-signature", "trash-2", "destructive")}</div>`,
    ),
  "confirm-delete-signature": () => {
    state.signatures = state.signatures.filter(
      (s) => s.image !== state.signature,
    );
    state.signature = null;
    persist();
    closeModal();
    render();
  },
  "place-signature": () => addAnnotation("signature"),
  "add-text-confirm": (el) => {
    const t = $("#annotation-text").value.trim();
    if (!t) {
      toast("请输入内容");
      return;
    }
    closeModal();
    addAnnotation(el.dataset.type || "text", {
      x: +el.dataset.x,
      y: +el.dataset.y,
      text: t,
    });
  },
  "delete-annotation": (el) => {
    current().annotations = current().annotations.filter(
      (a) => a.id !== el.dataset.id,
    );
    render();
  },
  "undo-annotation": () => {
    current().annotations?.pop();
    render();
  },
  "place-form": () => {
    const f = state.form;
    for (const [i, text] of [
      f.name,
      f.phone,
      f.company,
      f.agree ? "已同意协议条款" : "",
    ].entries())
      if (text)
        addAnnotation("text", {
          x: 0.25,
          y: 0.7 + i * 0.055,
          text,
          w: 0.59,
          h: 0.048,
        });
  },
  "sign-export": () =>
    withJob("正在生成签署副本", () =>
      finishPDF(current(), { annotations: true }, "已签署"),
    ),
  "ocr-run": () => {
    state.result = null;
    return withJob("正在识别文字", async () => {
      const chunks = [];
      for (let i = 0; i < current().pages.length; i++) {
        if (state.job?.cancelled) throw cancelledError();
        chunks.push(
          `第 ${i + 1} 页\n${current().pages[i].text.trim() || sampleText.contract.join("\n")}`,
        );
        progress(
          ((i + 1) / current().pages.length) * 90,
          `第 ${i + 1} / ${current().pages.length} 页`,
        );
        await sleep(110);
      }
      if (state.job?.cancelled) throw cancelledError();
      state.ocrText = chunks.join("\n\n");
      state.ocrReady = true;
      current().ocrText = state.ocrText;
      markDraft();
      state.result = null;
    });
  },
  "copy-ocr": async () => {
    if (!state.ocrText) {
      toast("请先识别文字");
      return;
    }
    try {
      await navigator.clipboard.writeText(state.ocrText);
      toast("识别文字已复制");
    } catch {
      const area = $("#ocr-text");
      area.select();
      const okay = document.execCommand("copy");
      toast(okay ? "识别文字已复制" : "已选中文字，可使用系统复制");
    }
  },
  "ocr-save": () => {
    current().ocrText = state.ocrText;
    current().status = "已识别";
    toast("文字修正已保存");
  },
  "ocr-txt": () =>
    resultText(state.ocrText, basename(current().name) + "_文字.txt"),
  "ocr-md": () =>
    resultText(
      "# " + basename(current().name) + "\n\n" + state.ocrText,
      basename(current().name) + "_文字.md",
    ),
  "redact-sample": () => {
    state.redactBoxes.push(
      {
        id: uid(),
        pageId: currentPage().id,
        x: 0.08,
        y: 0.22,
        w: 0.6,
        h: 0.04,
      },
      {
        id: uid(),
        pageId: currentPage().id,
        x: 0.08,
        y: 0.64,
        w: 0.68,
        h: 0.04,
      },
    );
    render();
  },
  "redact-match": () => {
    if (!state.redactText.trim()) {
      toast("请输入要查找的文字");
      return;
    }
    let count = 0;
    current().pages.forEach((p) => {
      if (p.text.includes(state.redactText)) {
        state.redactBoxes.push({
          id: uid(),
          pageId: p.id,
          x: 0.08,
          y: 0.64,
          w: 0.7,
          h: 0.05,
        });
        count++;
      }
    });
    render();
    toast(count ? `已添加 ${count} 处演示标记，请核对区域` : "未找到匹配文字");
  },
  "remove-redact": (el) => {
    state.redactBoxes = state.redactBoxes.filter((b) => b.id !== el.dataset.id);
    render();
  },
  "redact-confirm": () =>
    openModal(
      "确认永久打码",
      `<div class="warning red">${icon("shield-alert")}即将处理 ${state.redactBoxes.length} 处标记。应用后不能撤回，源文件不会修改。</div><p>已标记页面会重建为图像，移除底层文字及交互对象。</p><div class="footer-actions">${button("生成打码副本", "redact-run", "shield-check", "destructive")}${button("返回核对", "close-modal", "arrow-left", "outline")}</div>`,
    ),
  "redact-run": () =>
    withJob("正在重建打码页面", () =>
      finishPDF(current(), { redactions: true, metadata: true }, "已打码", {
        warning:
          "这是原型生成的栅格化副本。正式 App 的不可恢复性安全验证尚未实现，请勿用于真实敏感资料。",
      }),
    ),
  "batch-select": (el) => {
    const id = el.dataset.id;
    if (state.batch.ids.has(id)) state.batch.ids.delete(id);
    else state.batch.ids.add(id);
    render();
  },
  "batch-all": () => {
    state.batch.ids =
      state.batch.ids.size === state.files.length
        ? new Set()
        : new Set(state.files.map((f) => f.id));
    render();
  },
  "batch-run": () => runBatch(),
  "batch-retry": () => runBatch({ onlyFailed: true }),
  "retry-item": (el) => runBatch({ id: el.dataset.id }),
  "download-queue": (el) => {
    const q = state.batch.queue.find((q) => q.id === el.dataset.id);
    if (q.parts) {
      q.parts.forEach((p, i) =>
        setTimeout(() => download(p.bytes, p.name), i * 200),
      );
    } else if (q.bytes) download(q.bytes, q.filename);
  },
  "protect-run": () => {
    const p = state.protect;
    if (
      p.mode === "add" &&
      (p.password.length < 6 || p.password !== p.confirm)
    ) {
      toast(p.password.length < 6 ? "密码至少 6 位" : "两次密码不一致", true);
      return;
    }
    if (p.mode === "remove" && !p.password) {
      toast("请输入当前密码", true);
      return;
    }
    openModal(
      p.mode === "add" ? "密码设置预览" : "密码移除预览",
      `<div class="result-check">${icon("shield-check")}</div><h3 class="result-title" style="font-size:17px">${p.mode === "add" ? "保护参数已配置" : "解锁流程已完成"}</h3><div class="settings-group"><div class="row between"><small>打印</small><span>${p.print ? "允许" : "限制"}</span></div><div class="row between" style="margin-top:13px"><small>复制</small><span>${p.copy ? "允许" : "限制"}</span></div><div class="row between" style="margin-top:13px"><small>编辑</small><span>${p.edit ? "允许" : "限制"}</span></div></div><div class="warning">${icon("info")}HTML 原型仅展示密码流程。下方只能导出未加密的清理副本，不能用于密码保护。</div>${button("导出未加密的清理副本", "protect-clean-export", "download")}`,
    );
  },
  "protect-clean-export": () =>
    withJob("正在清理元数据", () =>
      finishPDF(
        current(),
        {
          metadata: state.protect.metadata,
          raster: state.protect.hidden || state.protect.attachments,
        },
        "清理副本",
        { warning: "此副本未加密。密码保护需要后续原生 App 处理引擎实现。" },
      ),
    ),
  "numbers-export": () => {
    const n = state.numbers;
    if (+n.from < 1 || +n.to < +n.from || +n.from > current().pages.length) {
      toast("请检查页码应用范围", true);
      return;
    }
    return withJob("正在写入页码", () =>
      finishPDF(current(), { numbers: true, annotations: true }, "页码"),
    );
  },
  "watermark-image": () => {
    importDestination = "watermark";
    $("#image-input").click();
  },
  "watermark-export": () => {
    if (state.watermark.type === "text" && !state.watermark.text.trim()) {
      toast("请输入水印内容");
      return;
    }
    if (state.watermark.type === "image" && !state.watermark.image) {
      toast("请选择水印图片");
      return;
    }
    return withJob("正在添加水印", () =>
      finishPDF(current(), { watermark: true, annotations: true }, "水印"),
    );
  },
  "save-template": () =>
    openModal(
      "保存为模板",
      `${field("模板名称", `<input type="text" id="new-template-name" placeholder="如：客户合同">`)}<p class="muted">保存页码、水印、压缩及命名参数，不保存文件内容。</p><div class="footer-actions">${button("保存模板", "confirm-save-template", "check")}</div>`,
    ),
  "confirm-save-template": () => {
    const name = $("#new-template-name").value.trim();
    if (!name) {
      toast("请输入模板名称");
      return;
    }
    const t = {
      id: uid(),
      name,
      detail: "自定义页码 · 水印 · 压缩参数",
      type: "contract",
      watermark: state.watermark.text,
      position: state.numbers.position,
      compress: state.compress.preset,
    };
    state.templates.push(t);
    state.chosenTemplate = t.id;
    persist();
    closeModal();
    render();
    toast("模板已保存");
  },
  "edit-template": (el) => editTemplateSheet(el.dataset.id),
  "template-save-edit": (el) => {
    const t = state.templates.find((t) => t.id === el.dataset.id),
      name = $("#template-name").value.trim();
    if (!name) {
      toast("请输入模板名称");
      return;
    }
    t.name = name;
    t.watermark = $("#template-watermark").value;
    t.compress = $("#template-compress").value;
    persist();
    closeModal();
    render();
  },
  "delete-template": (el) =>
    openModal(
      "删除模板？",
      `<p>此操作不影响已处理过的文件。</p><div class="footer-actions">${button("删除模板", "confirm-delete-template", "trash-2", "destructive", `data-id="${el.dataset.id}"`)}</div>`,
    ),
  "confirm-delete-template": (el) => {
    state.templates = state.templates.filter((t) => t.id !== el.dataset.id);
    if (state.chosenTemplate === el.dataset.id)
      state.chosenTemplate = state.templates[0]?.id;
    persist();
    closeModal();
    render();
  },
  "apply-template": () => {
    const t = state.templates.find((t) => t.id === state.chosenTemplate);
    if (!t) {
      toast("先选择一个模板");
      return;
    }
    if (!current()) {
      importSheet();
      return;
    }
    state.watermark.text = t.watermark;
    state.numbers.position = t.position;
    state.compress.preset = t.compress;
    state.compress.quality =
      t.compress === "light" ? 85 : t.compress === "strong" ? 35 : 65;
    openModal(
      "应用“" + t.name + "”",
      `${fileBanner()}<p>将在新副本中添加页码${t.watermark ? "与“" + esc(t.watermark) + "”水印" : ""}。</p><div class="footer-actions">${button("应用并生成预览", "template-run", "check")}</div>`,
    );
  },
  "template-run": () =>
    withJob("正在应用模板", () =>
      finishPDF(
        current(),
        { numbers: true, watermark: !!state.watermark.text, annotations: true },
        "模板",
      ),
    ),
  "shortcut-add": () =>
    openModal(
      "添加到快捷指令",
      `<div class="result-check">${icon("workflow")}</div><h3 class="result-title" style="font-size:17px">${{ compress: "压缩 PDF", merge: "合并文件", ocr: "识别文字", rename: "重命名文件" }[state.shortcut]}</h3><p class="result-sub">App Intents 动作预览</p><div class="warning">${icon("info")}HTML 不能注册原生快捷指令。正式 App 将在系统快捷指令中提供此动作。</div>${button("试运行", "shortcut-run", "play")}`,
    ),
  "shortcut-run": () => {
    closeModal();
    if (!current()) {
      importSheet();
      return;
    }
    if (state.shortcut === "ocr") navigate("ocr");
    else if (state.shortcut === "compress") {
      navigate("compress");
      actions["compress-run"]();
    } else {
      state.batch.op = state.shortcut === "merge" ? "merge" : "rename";
      state.batch.ids = new Set([current().id]);
      navigate("batch");
    }
  },
  "buy-pro": () =>
    openModal(
      "确认购买 · 演示",
      `<div class="row between"><div><h3>纸间 Pro · 永久买断</h3><small>一次付款，不会自动续订</small></div><h2>¥68</h2></div><div class="divider"></div><div class="note">${icon("info")}这次操作不会请求支付或产生费用</div><div class="footer-actions">${button("模拟购买成功", "confirm-buy", "check")}${button("取消", "close-modal", "x", "outline")}</div>`,
    ),
  "confirm-buy": () => {
    state.pro = true;
    persist();
    closeModal();
    render();
    toast("购买演示成功，Pro 已解锁");
    const resume = state.resumeAction;
    state.resumeAction = null;
    if (resume && state.files.some((f) => f.id === resume.fileId)) {
      selectFile(resume.fileId, resume.route);
      return actions[resume.action]();
    }
  },
  "restore-pro": () => {
    if (state.pro) toast("已恢复纸间 Pro 权益（演示）");
    else
      openModal(
        "恢复购买",
        `<div class="empty" style="padding:15px">${icon("receipt")}<h3>未发现可恢复的购买</h3><p>原型只恢复本浏览器中模拟购买的权益。</p></div>${button("返回", "close-modal", "arrow-left", "secondary")}`,
      );
  },
  "clear-cache": () => {
    sourceDocuments.clear();
    toast("处理缓存已清理，文件与签名保留");
  },
  "clear-history": () =>
    openModal(
      "清除最近文件？",
      `<p>将清除当前原型中的 ${state.files.length} 份文件记录。你的系统文件不会被删除。</p><div class="footer-actions">${button("清除记录", "confirm-clear-history", "trash-2", "destructive")}${button("取消", "close-modal", "x", "outline")}</div>`,
    ),
  "confirm-clear-history": () => {
    state.files = [];
    state.current = null;
    state.draft = null;
    state.activeWorkflow = null;
    state.scanPages = [];
    state.batch.ids.clear();
    sourceDocuments.clear();
    sources.clear();
    closeModal();
    render();
    toast("最近文件记录已清除");
  },
  privacy: () =>
    openModal(
      "隐私与权限",
      `<div class="note">${icon("shield-check")}你的文件只在当前设备处理</div><div class="divider"></div><h3>文件权限</h3><p style="margin:8px 0 18px">仅访问你主动选择或拖入的文件。原始文件不会覆盖，结果通过浏览器下载保存。</p><h3>本机存储</h3><p style="margin:8px 0 18px">常用资料、流程、偏好和模拟 Pro 状态保存在本浏览器。启用草稿保存时，文档和编辑副本写入此浏览器的 IndexedDB，可在设置中关闭或清除。</p><h3>网络访问</h3><p style="margin:8px 0">原型内置所有依赖，无需联网，不会发送文档内容。</p>`,
    ),
  terms: () =>
    openModal(
      "原型使用说明",
      `<p>此 HTML 用于确认 iPhone / iPad App 的界面、参数、交互与任务流程，不涉及真实交易。</p><div class="divider"></div><p>扫描、OCR、密码保护、系统分享和快捷指令中的系统能力为演示。请使用示例资料进行评审。</p>`,
    ),
  about: () =>
    openModal(
      "关于纸间",
      `<div class="pro-heading"><div class="pro-logo">${icon("files")}</div><h1>纸间</h1><p>1.0 · iOS / iPadOS App 交互原型</p></div><p>HTML、CSS 和 JavaScript 构建。PDF-lib 负责 PDF 页面与输出，PDF.js 负责读取和预览，Lucide 提供界面图标。</p>`,
    ),
  "cancel-job": () => {
    if (state.job) {
      state.job.cancelled = true;
      const c = $("#job-stage");
      if (c) c.textContent = "正在取消，保留原文件";
    }
  },
  "reset-prototype": () =>
    openModal(
      "重置原型？",
      `<p>清除签名、模板、设置和模拟购买状态，并恢复全部示例文件。</p><div class="footer-actions">${button("重置原型数据", "confirm-reset", "rotate-ccw", "destructive")}${button("取消", "close-modal", "x", "outline")}</div>`,
    ),
  "confirm-reset": async () => {
    try {
      localStorage.removeItem("paperflow-prototype-v1");
    } catch {}
    await clearWorkspace();
    location.reload();
  },
  "file-menu": (el) => {
    const f = state.files.find((f) => f.id === el.dataset.id);
    openModal(
      "文件操作",
      `<div class="result-detail" style="margin-top:0"><img src="${f.pages[0].image}" class="file-cover" alt="封面"><div class="grow"><strong>${esc(f.name)}</strong><p>${f.pages.length} 页 · ${sizeString(f.size)}</p></div></div>${[
        ["file-view", "book-open", "打开文档"],
        ["file-organize", "layers-2", "整理页面"],
        ["file-sign", "signature", "签名与填写"],
        ["file-compress", "minimize-2", "压缩"],
        ["file-rename", "text-cursor-input", "重命名"],
        ["file-download", "download", "下载原文件"],
        ["file-remove", "trash-2", "移除最近记录"],
      ]
        .map(
          ([a, s, t]) =>
            `<button class="import-option" data-action="${a}" data-id="${f.id}">${icon(s)}<span class="grow"><strong>${t}</strong></span>${icon("chevron-right")}</button>`,
        )
        .join("")}`,
    );
  },
  "file-view": (el) => selectFile(el.dataset.id),
  "file-organize": (el) => selectFile(el.dataset.id, "organize"),
  "file-sign": (el) => selectFile(el.dataset.id, "sign"),
  "file-compress": (el) => selectFile(el.dataset.id, "compress"),
  "file-rename": (el) => {
    const f = state.files.find((f) => f.id === el.dataset.id);
    openModal(
      "重命名文件",
      `${field("文件名", `<input type="text" id="rename-input" value="${esc(f.name)}">`)}${button("保存名称", "file-rename-confirm", "check", "primary", `data-id="${f.id}"`)}`,
    );
  },
  "file-rename-confirm": (el) => {
    const name = $("#rename-input").value.trim();
    if (!name) {
      toast("请输入文件名");
      return;
    }
    state.files.find((f) => f.id === el.dataset.id).name = name.endsWith(".pdf")
      ? name
      : name + ".pdf";
    closeModal();
    render();
    toast("名称已更新");
  },
  "file-download": (el) => {
    const f = state.files.find((f) => f.id === el.dataset.id);
    if (f.sourceBytes) download(f.sourceBytes, f.name);
    else withJob("正在生成文件", () => finishPDF(f, {}, "副本"));
  },
  "file-remove": (el) =>
    openModal(
      "移除最近记录？",
      `<p>不会删除 Files 中的原始文件。</p><div class="footer-actions">${button("移除记录", "file-remove-confirm", "trash-2", "destructive", `data-id="${el.dataset.id}"`)}</div>`,
    ),
  "file-remove-confirm": (el) => {
    state.files = state.files.filter((f) => f.id !== el.dataset.id);
    state.batch.ids.delete(el.dataset.id);
    if (state.current === el.dataset.id) state.current = state.files[0]?.id;
    closeModal();
    render();
  },
};
function renderScanBehind() {
  const overlay = $("#overlays").innerHTML;
  $("#content").innerHTML = scanView();
  refreshIcons();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button,[data-page-id]");
  if (!el) return;
  if (el.disabled) return;
  if (state.job && !el.matches('[data-action="cancel-job"]')) return;
  if (el.dataset.device) {
    state.device = el.dataset.device;
    $("#device").classList.toggle("tablet", state.device === "tablet");
    $$("[data-device]").forEach((b) =>
      b.classList.toggle("selected", b.dataset.device === state.device),
    );
    render();
    return;
  }
  if (el.dataset.route) {
    navigate(el.dataset.route);
    return;
  }
  if (el.dataset.openFile) {
    selectFile(el.dataset.openFile);
    return;
  }
  if (el.dataset.action) {
    const action = actions[el.dataset.action];
    if (action) {
      Promise.resolve(action(el)).catch((e) => {
        console.error(e);
        toast(e.message || "操作未完成", true);
      });
    }
    return;
  }
  if (el.dataset.pageId) {
    const id = el.dataset.pageId;
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    render();
    return;
  }
  if (el.dataset.filter) {
    state.filter = el.dataset.filter;
    render();
    return;
  }
  if (el.dataset.scanFilter) {
    state.scanFilter = el.dataset.scanFilter;
    render();
    return;
  }
  if (el.dataset.compressPreset) {
    const p = el.dataset.compressPreset;
    state.compress.preset = p;
    state.compress.quality = p === "light" ? 85 : p === "strong" ? 35 : 65;
    state.compress.dpi = p === "light" ? 200 : p === "strong" ? 96 : 144;
    render();
    return;
  }
  if (el.dataset.signMode) {
    state.signMode = el.dataset.signMode;
    render();
    return;
  }
  if (el.dataset.tool) {
    closeModal();
    const t = el.dataset.tool;
    state.tool = t;
    if (t === "signature" && !state.signature) signatureSheet();
    else {
      renderContext();
      refreshIcons();
      $("#paper-wrap")?.classList.toggle(
        "selection-tool",
        ["rectangle", "highlight", "underline"].includes(t),
      );
    }
    return;
  }
  if (el.dataset.color) {
    state.color = el.dataset.color;
    render();
    return;
  }
  if (el.dataset.redactMode) {
    state.redactMode = el.dataset.redactMode;
    render();
    return;
  }
  if (el.dataset.redactColor) {
    state.redactColor = el.dataset.redactColor;
    render();
    return;
  }
  if (el.dataset.protectMode) {
    state.protect.mode = el.dataset.protectMode;
    state.protect.password = "";
    state.protect.confirm = "";
    render();
    return;
  }
  if (el.dataset.watermarkType) {
    state.watermark.type = el.dataset.watermarkType;
    render();
    return;
  }
  if (el.dataset.watermarkColor) {
    state.watermark.color = el.dataset.watermarkColor;
    render();
    return;
  }
  if (el.dataset.template) {
    state.chosenTemplate = el.dataset.template;
    render();
    return;
  }
  if (el.dataset.shortcut) {
    state.shortcut = el.dataset.shortcut;
    render();
    return;
  }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    const value =
      el.type === "checkbox"
        ? el.checked
        : el.type === "range" || el.type === "number"
          ? Number(el.value)
          : el.value;
    setByPath(el.dataset.bind, value);
    if (el.dataset.bind.startsWith("settings.")) {
      persist();
      if (el.dataset.bind === "settings.dark")
        $("#device").classList.toggle("body-dark", el.checked);
    }
    updateBoundUI();
  }
  if (el.id === "file-search") {
    const focus = el.selectionStart;
    state.query = el.value;
    const files = state.files.filter(
      (f) =>
        (state.filter === "all" ||
          (state.filter === "pdf" ? !f.isImage : f.isImage)) &&
        f.name.toLowerCase().includes(state.query.toLowerCase()),
    );
    $("#file-results").innerHTML = files.length
      ? files.map((f) => fileRow(f)).join("")
      : empty("没有匹配的文件", "尝试其他文件名");
    refreshIcons();
  }
  if (el.id === "ocr-text") {
    state.ocrText = el.value;
  }
  if (el.id === "ocr-search") {
    state.ocrQuery = el.value;
    updateOCRSearch();
  }
  if (el.id === "document-search") {
    const query = el.value.trim(),
      box = $("#document-search-results");
    box.innerHTML = query
      ? current()
          .pages.map((p, i) =>
            p.text.includes(query)
              ? `<button class="settings-row" data-action="search-go" data-index="${i}">${icon("file-text")}<span class="grow"><strong>第 ${i + 1} 页</strong><small>${esc(p.text.slice(Math.max(0, p.text.indexOf(query) - 15), p.text.indexOf(query) + 40))}</small></span>${icon("chevron-right")}</button>`
              : "",
          )
          .join("")
      : '<p class="muted">搜索原生文字和已识别文字</p>';
    if (query && !box.innerHTML)
      box.innerHTML = '<p class="muted">未找到匹配文字</p>';
    refreshIcons();
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.mergeId) {
    if (el.checked) mergeIDs.add(el.dataset.mergeId);
    else mergeIDs.delete(el.dataset.mergeId);
  }
  if (el.id === "jump-page") {
    state.pageIndex = Math.min(
      current().pages.length - 1,
      Math.max(0, Number(el.value) - 1),
    );
    render();
  }
  if (el.dataset.bind === "batch.op" || el.dataset.bind === "compress.preserve")
    render();
  if (el.id === "file-input" || el.id === "image-input") {
    const files = [...el.files];
    el.value = "";
    importFiles(files).catch((err) => toast(err.message, true));
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (state.job) actions["cancel-job"]();
    else if (state.modal) closeModal();
  }
  if (e.key === "Tab" && state.modal) {
    const items = $$(
        "button,input,select,textarea,a[href]",
        $(".sheet"),
      ).filter((el) => !el.disabled && el.offsetParent !== null),
      first = items[0],
      last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  if (["Enter", " "].includes(e.key) && e.target.matches("[data-page-id]")) {
    e.preventDefault();
    e.target.click();
  }
});
document.addEventListener("dragstart", (e) => {
  const p = e.target.closest("[data-page-id]");
  if (p) {
    draggedPageId = p.dataset.pageId;
    e.dataTransfer.setData("text/plain", draggedPageId);
    e.dataTransfer.effectAllowed = "move";
  }
});
document.addEventListener("dragover", (e) => {
  if (e.dataTransfer.types.includes("Files")) {
    e.preventDefault();
    $("#device").classList.add("dragging-files");
  } else if (draggedPageId) {
    const tile = e.target.closest("[data-page-id]");
    if (tile) {
      e.preventDefault();
      tile.classList.add("drag-over");
    }
  }
});
document.addEventListener("dragleave", (e) => {
  e.target.closest?.("[data-page-id]")?.classList.remove("drag-over");
  if (!e.relatedTarget || !$("#device").contains(e.relatedTarget))
    $("#device").classList.remove("dragging-files");
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
  $("#device").classList.remove("dragging-files");
  if (e.dataTransfer.files.length) {
    importFiles([...e.dataTransfer.files], "file");
    return;
  }
  if (draggedPageId) {
    const target = e.target.closest("[data-page-id]");
    if (target && target.dataset.pageId !== draggedPageId) {
      rememberPages();
      const pages = current().pages,
        from = pages.findIndex((p) => p.id === draggedPageId),
        to = pages.findIndex((p) => p.id === target.dataset.pageId),
        [p] = pages.splice(from, 1);
      pages.splice(to, 0, p);
      render();
    }
    draggedPageId = null;
  }
});
document.addEventListener("dragend", () => {
  draggedPageId = null;
  $$(".drag-over").forEach((e) => e.classList.remove("drag-over"));
});
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-overlay]") && !state.job) closeModal();
});
//__EXPERIENCE__
async function boot() {
  refreshIcons();
  loadLocal();
  normalizeTemplates();
  state.compress.preset = state.settings.compression;
  state.ocrLanguage = state.settings.language;
  state.scanOCR = state.settings.autoOCR;
  pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
    new Blob([$("#pdf-worker-code").textContent], {
      type: "application/javascript",
    }),
  );
  $("#content").innerHTML =
    '<div class="empty" style="padding-top:100px"><div class="spinner"></div><h3 style="margin-top:20px">准备文件工作台</h3></div>';
  await initSamples();
  await restoreWorkspace();
  render();
  window.paperflow = { state, navigate, buildPDF, current, importFiles };
}
boot().catch((e) => {
  console.error(e);
  $("#content").innerHTML =
    '<div class="empty"><h3>原型无法加载</h3><p>' +
    esc(e.message) +
    "</p></div>";
});
