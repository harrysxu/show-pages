let workspaceDB = null;
let workspaceReady = false;
let workspaceTimer = null;
let workspaceWrite = Promise.resolve();
let storageNoticeShown = false;

function rememberBookmark() {
  if (current()) state.bookmarks[current().id] = state.pageIndex;
}

function markDraft() {
  if (!current()) return;
  rememberBookmark();
  state.hasUsed = true;
  state.draft = {
    fileId: current().id,
    route: state.route,
    pageIndex: state.pageIndex,
    updatedAt: Date.now(),
    document: current(),
  };
  persist();
  scheduleWorkspaceSave();
}

function markScanDraft() {
  state.hasUsed = true;
  state.draft = state.scanPages.length
    ? {
        route: "scan",
        pageIndex: 0,
        scanCount: state.scanPages.length,
        updatedAt: Date.now(),
      }
    : null;
  persist();
  scheduleWorkspaceSave();
}

async function openWorkspaceDB() {
  if (workspaceDB) return workspaceDB;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("paperflow-workspace-v2", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspace");
    request.onsuccess = () => {
      workspaceDB = request.result;
      resolve(workspaceDB);
    };
    request.onerror = () => reject(request.error);
  });
}

async function workspaceTransaction(mode, operation) {
  const db = await openWorkspaceDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workspace", mode);
    const request = operation(transaction.objectStore("workspace"));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("本地保存失败"));
  });
}

function workspaceSnapshot() {
  rememberBookmark();
  const ids = new Set(
    [
      ...state.files,
      ...(state.draft?.document ? [state.draft.document] : []),
    ].flatMap((f) => f.pages.map((p) => p.sourceId)),
  );
  return structuredClone({
    version: 2,
    files: state.files,
    sources: [...sources].filter(([id]) => ids.has(id)),
    current: state.current,
    bookmarks: state.bookmarks,
    draft: state.draft,
    activeWorkflow: state.activeWorkflow,
    pendingWorkflow: state.pendingWorkflow,
    scanPages: state.scanPages,
    compress: state.compress,
    numbers: state.numbers,
    watermark: state.watermark,
    redactBoxes: state.redactBoxes,
    redactFileId: state.redactFileId,
    form: state.form,
    savedAt: Date.now(),
  });
}

function scheduleWorkspaceSave() {
  if (!workspaceReady || !state.settings.saveDrafts || state.job) return;
  clearTimeout(workspaceTimer);
  workspaceTimer = setTimeout(() => saveWorkspace(), 280);
}

function saveWorkspace() {
  clearTimeout(workspaceTimer);
  if (!workspaceReady || !state.settings.saveDrafts || state.job)
    return workspaceWrite;
  const snapshot = workspaceSnapshot();
  workspaceWrite = workspaceWrite.then(async () => {
    try {
      await workspaceTransaction("readwrite", (store) =>
        store.put(snapshot, "current"),
      );
      state.workspaceSavedAt = snapshot.savedAt;
      state.storageAvailable = true;
      const status = $("#draft-save-status");
      if (status) status.textContent = "草稿已保存到本机";
    } catch {
      state.storageAvailable = false;
      if (!storageNoticeShown) {
        storageNoticeShown = true;
        toast("浏览器无法保存草稿，当前会话仍可继续", true);
      }
    }
  });
  return workspaceWrite;
}

async function restoreWorkspace() {
  try {
    const saved = state.settings.saveDrafts
      ? await workspaceTransaction("readonly", (store) => store.get("current"))
      : null;
    if (saved?.version === 2 && Array.isArray(saved.files)) {
      state.files = saved.files;
      sources.clear();
      sourceDocuments.clear();
      for (const [id, bytes] of saved.sources) sources.set(id, bytes);
      state.current = saved.current;
      state.bookmarks = saved.bookmarks || {};
      state.draft = saved.draft || null;
      state.activeWorkflow = saved.activeWorkflow || null;
      state.pendingWorkflow = saved.pendingWorkflow || null;
      state.scanPages = saved.scanPages || [];
      for (const key of ["compress", "numbers", "watermark", "form"])
        if (saved[key]) state[key] = saved[key];
      state.redactBoxes = saved.redactBoxes || [];
      state.redactFileId = saved.redactFileId || null;
      state.workspaceSavedAt = saved.savedAt;
      state.pageIndex = state.bookmarks[state.current] || 0;
    }
  } catch {
    state.storageAvailable = false;
  }
  workspaceReady = true;
}

async function clearWorkspace() {
  clearTimeout(workspaceTimer);
  await workspaceWrite;
  await workspaceTransaction("readwrite", (store) => store.clear());
  state.workspaceSavedAt = null;
}

function normalizeTemplates() {
  const builtins = {
    contract: {
      name: "合同签署",
      manual: ["sign"],
      compress: "balanced",
      numbers: false,
      watermark: "",
      metadata: true,
      naming: "{原名}_已签署_{日期}",
    },
    receipt: {
      name: "每月报销",
      manual: ["organize", "ocr"],
      compress: "balanced",
      gray: true,
      numbers: true,
      watermark: "",
      metadata: true,
      naming: "报销_{日期}_{原名}",
    },
    project: {
      name: "项目交付",
      manual: ["organize"],
      compress: "light",
      numbers: true,
      skip: true,
      watermark: "项目交付",
      metadata: true,
      naming: "{原名}_交付_{日期}",
    },
    submission: {
      name: "材料提交",
      manual: ["organize"],
      compress: "strong",
      target: 2,
      numbers: false,
      watermark: "",
      metadata: true,
      naming: "{原名}_提交",
    },
  };
  if (
    state.templates.some((t) => !t.params) &&
    !state.templates.some((t) => t.id === "submission")
  )
    state.templates.push({
      id: "submission",
      name: "材料提交",
      type: "report",
    });
  state.templates = state.templates.map((t, index) => {
    if (t.params) return t;
    const b = builtins[t.id];
    const preset = b?.compress || t.compress || "balanced";
    return {
      ...t,
      name: b?.name || t.name,
      pinned: index < 2,
      params: {
        manual: b?.manual || [],
        compress: {
          ...state.compress,
          enabled: true,
          preset,
          quality: preset === "light" ? 85 : preset === "strong" ? 35 : 65,
          dpi: preset === "light" ? 200 : preset === "strong" ? 96 : 144,
          gray: !!b?.gray,
          target: b?.target || 1.5,
        },
        numbers: {
          ...state.numbers,
          enabled: b?.numbers ?? true,
          position: t.position || "bottom-center",
          skip: !!b?.skip,
          to: 100,
        },
        watermark: {
          ...state.watermark,
          enabled: !!(b ? b.watermark : t.watermark),
          text: b ? b.watermark : t.watermark || "",
          range: "all",
        },
        metadata: b?.metadata ?? true,
        naming: b?.naming || "{原名}_处理_{日期}",
      },
    };
  });
}

function workflowLabels(t) {
  const p = t.params;
  const labels = (p.manual || []).map(
    (r) =>
      ({ sign: "填写与签名", organize: "整理页面", ocr: "识别与复核文字" })[r],
  );
  if (p.numbers.enabled) labels.push("添加页码");
  if (p.watermark.enabled)
    labels.push(p.watermark.type === "image" ? "图片水印" : "文字水印");
  if (p.compress.enabled)
    labels.push(p.compress.gray ? "灰度压缩" : "压缩 PDF");
  if (p.metadata) labels.push("清理元数据");
  labels.push("命名与导出");
  return labels;
}

function workflowRow(t, controls = false) {
  const symbol = t.params.manual.includes("sign")
    ? "signature"
    : t.id === "receipt"
      ? "receipt-text"
      : "workflow";
  return `<div class="workflow-row"><button class="workflow-launch row grow" data-action="launch-workflow" data-id="${t.id}"><span class="workflow-symbol">${icon(symbol)}</span><span class="grow"><strong>${esc(t.name)}</strong><small>${esc(workflowLabels(t).join(" → "))}</small></span>${icon("chevron-right")}</button>${controls ? `<button class="icon-btn" data-action="pin-workflow" data-id="${t.id}" title="${t.pinned ? "取消置顶" : "置顶到首页"}" aria-label="${t.pinned ? "取消置顶" : "置顶到首页"}">${icon(t.pinned ? "pin-off" : "pin")}</button><button class="icon-btn" data-action="edit-template" data-id="${t.id}" title="编辑流程" aria-label="编辑流程">${icon("sliders-horizontal")}</button><button class="icon-btn" data-action="delete-template" data-id="${t.id}" title="删除流程" aria-label="删除流程">${icon("trash-2")}</button>` : ""}</div>`;
}

function workspaceHomeView() {
  const d = state.draft,
    file = state.files.find((f) => f.id === d?.fileId);
  const recent = state.files.filter((f) => !f.isSample || f.lastOpenedAt);
  const tasks = [
    ["scan", "扫描", "scan-line"],
    ["sign", "签名", "signature"],
    ["compress", "压缩", "minimize-2"],
    ["organize", "合并 / 拆分", "layers-2"],
  ];
  const quick = `<div class="task-grid">${tasks.map(([r, name, symbol]) => `<button class="task-card" data-route="${r}"><span class="tool-icon">${icon(symbol)}</span><strong>${name}</strong></button>`).join("")}</div>`;
  const draft = d
    ? `<div class="draft-band row"><span class="grow"><strong>${d.route === "scan" ? "继续未完成的扫描" : file ? `继续未完成的${state.activeWorkflow ? "流程" : "任务"}` : "草稿文件暂时不可用"}</strong><small class="truncate">${d.route === "scan" ? `已扫描 ${state.scanPages.length} 页` : `${esc(file?.name || d.document?.name || "未命名文件")} · 第 ${d.pageIndex + 1} 页`}</small><small id="draft-save-status">${state.storageAvailable && state.workspaceSavedAt ? "草稿已保存到本机" : "草稿待保存"}</small></span><button class="icon-btn" data-action="resume-draft" title="继续草稿" aria-label="继续草稿">${icon("arrow-right")}</button><button class="icon-btn" data-action="discard-draft" title="放弃草稿" aria-label="放弃草稿">${icon("x")}</button></div>`
    : "";
  const files = recent.length
    ? recent
        .slice(0, 3)
        .map((f) => fileRow(f))
        .join("")
    : `<p class="note">还没有处理记录</p>`;
  const pinned = state.templates.filter((t) => t.pinned);
  return `<div class="page compact-home"><div class="workspace-welcome"><div><div class="date">${state.hasUsed ? fmtDate() : "本地文件工作台"}</div><h1>${state.hasUsed ? "工作台" : "纸间"}</h1></div><button class="icon-btn" data-route="personal" title="常用资料" aria-label="常用资料">${icon("contact-round")}</button></div><div class="home-grid"><div><div class="home-actions">${button("导入文件", "import", "folder-open")}${button("扫描文档", "home-scan", "scan-line", "outline")}</div>${draft}${state.hasUsed ? `${section("最近文件", `<button class="text-btn" data-route="files">查看全部 ${icon("chevron-right")}</button>`)}${files}` : `${section("快速处理", `<button class="text-btn" data-route="tools">全部工具 ${icon("chevron-right")}</button>`)}${quick}${section("示例文件")}<button class="file-item row full" data-action="sample-demo" style="text-align:left"><img class="file-cover" src="${samplePages.contract[0].image}" alt="示例合同封面"><span class="grow"><strong style="font-size:13px">合作服务协议</strong><small style="display:block;margin-top:5px">示例 · 8 页</small></span>${icon("arrow-right")}</button>`}</div><div>${section("常用流程", `<button class="text-btn" data-route="templates">管理 ${icon("chevron-right")}</button>`)}${pinned.length ? pinned.map((t) => workflowRow(t)).join("") : `<button class="text-btn" data-route="templates">${icon("pin")}选择要置顶的流程</button>`}${state.hasUsed ? `${section("快速处理", `<button class="text-btn" data-route="tools">全部工具 ${icon("chevron-right")}</button>`)}${quick}` : ""}<div class="note" style="margin-top:18px">${icon("shield-check")}文件不上传，原件不覆盖</div></div></div></div>`;
}

function workflowTemplatesView() {
  return `<div class="page">${intro("常用流程", `${state.templates.length} 个流程`)}${state.templates.map((t) => workflowRow(t, true)).join("")}<div class="footer-actions">${button("保存当前参数为流程", "save-template", "plus", "outline")}${button("应用所选流程", "apply-template", "play", "secondary")}<div class="note">${icon("shield-check")}流程保存处理设置，文件与签名单独管理</div></div></div>`;
}

function reviewWorkflow(id) {
  const t = state.templates.find((t) => t.id === id);
  if (!t) return toast("流程已移除，请重新选择", true);
  state.chosenTemplate = id;
  if (!current()) {
    state.pendingWorkflow = id;
    importSheet();
    return;
  }
  openModal(
    t.name,
    `${fileBanner()}<ol class="workflow-steps">${workflowLabels(t)
      .map(
        (label, i) =>
          `<li><span class="step-index">${i + 1}</span>${esc(label)}</li>`,
      )
      .join(
        "",
      )}</ol>${field("输出命名", `<input id="workflow-naming" type="text" value="${esc(t.params.naming)}">`)}<small>可用变量：{原名}、{日期}、{序号}</small><div class="footer-actions">${button("开始流程", "workflow-start", "play", "primary", `data-id="${id}"`)}<div class="row">${button("更换输入文件", "workflow-input", "folder-open", "outline", `data-id="${id}"`)}${button("从扫描开始", "workflow-scan", "scan-line", "outline", `data-id="${id}"`)}</div></div>`,
  );
}

function beginWorkflow(id) {
  const t = state.templates.find((t) => t.id === id);
  if (!t || !current()) return;
  const params = structuredClone(t.params);
  params.naming = $("#workflow-naming")?.value.trim() || params.naming;
  state.activeWorkflow = {
    templateId: id,
    name: t.name,
    fileId: current().id,
    index: 0,
    params,
  };
  state.pendingWorkflow = null;
  state.hasUsed = true;
  closeModal();
  markDraft();
  return showWorkflowStep();
}

function showWorkflowStep() {
  const w = state.activeWorkflow;
  if (!w) return;
  const file = state.files.find((f) => f.id === w.fileId);
  if (!file) return showMissingDraft();
  state.current = file.id;
  const route = w.params.manual[w.index];
  if (!route) return executeWorkflow();
  navigate(route);
  markDraft();
}

function advanceWorkflow() {
  const w = state.activeWorkflow;
  if (!w) return;
  const route = w.params.manual[w.index];
  if (
    route === "sign" &&
    !(current().annotations || []).some((a) => a.type === "signature")
  )
    return toast("请先放置签名", true);
  if (route === "ocr" && !state.ocrReady)
    return toast("请先识别并复核文字", true);
  if (route === "ocr") current().ocrText = state.ocrText;
  w.index++;
  return showWorkflowStep();
}

async function executeWorkflow() {
  const w = state.activeWorkflow;
  if (!w || !current()) return;
  const p = w.params;
  if (p.compress.enabled && !allowTask("compress", "workflow-finish")) return;
  const previous = {
    compress: state.compress,
    numbers: state.numbers,
    watermark: state.watermark,
  };
  state.compress = structuredClone(p.compress);
  state.numbers = structuredClone(p.numbers);
  state.watermark = structuredClone(p.watermark);
  const naming = p.naming
    .replaceAll("{原名}", basename(current().name))
    .replaceAll("{日期}", new Date().toISOString().slice(0, 10))
    .replaceAll("{序号}", "001");
  const options = {
    annotations: true,
    raster:
      p.compress.enabled &&
      (current().isRaster || !p.compress.preserve || p.compress.gray),
    quality: p.compress.quality,
    dpi: p.compress.dpi,
    gray: p.compress.enabled && p.compress.gray,
    metadata: p.metadata,
    numbers: p.numbers.enabled,
    watermark: p.watermark.enabled,
  };
  const done = await withJob(`正在完成${w.name}`, async () => {
    await finishPDF(current(), options, "流程", {
      filename: naming.endsWith(".pdf") ? naming : naming + ".pdf",
      title: `${w.name}已完成`,
      workflow: structuredClone(w),
      summary: workflowLabels({ params: p }).join(" · "),
    });
    if (
      p.manual.includes("ocr") &&
      current().pages.some(
        (page) =>
          page.textSource === "sample" ||
          (!page.textSource && current().isSample) ||
          !page.text.trim(),
      )
    )
      state.result.warning =
        "扫描 OCR 使用示例文字，当前 PDF 不包含真实 OCR 文字层。可在文字识别页单独导出文字。";
    state.activeWorkflow = null;
    state.draft = null;
  });
  state.compress = previous.compress;
  state.numbers = previous.numbers;
  state.watermark = previous.watermark;
  if (done && p.compress.enabled) countTask("compress");
  if (!done && state.activeWorkflow) {
    state.activeWorkflow.index = Math.max(0, p.manual.length - 1);
    render();
  }
  await saveWorkspace();
}

function renderWorkflowProgress() {
  $("#workflow-progress")?.remove();
  const w = state.activeWorkflow;
  if (
    w &&
    w.fileId === current()?.id &&
    w.params.manual[w.index] === state.route
  ) {
    const next = w.params.manual[w.index + 1];
    $("#app-header").insertAdjacentHTML(
      "afterend",
      `<div class="workflow-progress" id="workflow-progress"><span class="grow"><strong>${esc(w.name)}</strong><small>第 ${w.index + 1} 步 / ${w.params.manual.length + 1} 步 · ${esc(routes[state.route][0])}</small></span><button class="btn secondary" data-action="workflow-next">${icon("arrow-right")}${next ? "继续" : "生成结果"}</button><button class="icon-btn" data-action="pause-workflow" title="暂停并保存流程" aria-label="暂停并保存流程">${icon("pause")}</button></div>`,
    );
  }
  if (state.route === "settings")
    $("#content .page").insertAdjacentHTML(
      "beforeend",
      experienceSettingsHTML(),
    );
  if (
    ["reader", "sign", "redact", "numbers", "watermark", "compress"].includes(
      state.route,
    )
  )
    $("#app-header .row").insertAdjacentHTML(
      "afterbegin",
      `<button class="icon-btn tablet-only" data-action="toggle-sidebar" title="${state.sidebarCollapsed ? "展开导航" : "收起导航"}" aria-label="${state.sidebarCollapsed ? "展开导航" : "收起导航"}">${icon("panel-left")}</button>`,
    );
  if (state.route === "sign")
    $("#content .inspector").insertAdjacentHTML(
      "afterbegin",
      `<button class="text-btn" data-action="signature-library" style="margin-bottom:14px">${icon("contact-round")}常用签名与资料</button>`,
    );
}

function renderTaskContext() {
  if (state.route === "compress") {
    const quota = state.pro
      ? "Pro · 不限次数"
      : `本月剩余 ${Math.max(0, 3 - state.usage.compress)} 次免费压缩`;
    $("#context-tools").innerHTML =
      `<div class="task-footer"><span class="grow"><strong>生成新的 PDF</strong><small>${quota}</small></span>${button("压缩并预览", "compress-run", "minimize-2")}</div>`;
    return;
  }
  renderPageControls();
}

function personalView() {
  return `<div class="page">${intro("常用资料", "仅保存在此设备")}<div class="row between"><h2>签名</h2><button class="text-btn" data-action="signature-pad">${icon("plus")}新建</button></div><div class="signature-library" style="margin-top:14px">${state.signatures.length ? state.signatures.map((s) => `<div class="signature-item"><button data-action="choose-signature" data-id="${s.id}" style="width:100%;padding:0"><img src="${s.image}" alt="${esc(s.name)}"><div class="row"><strong class="grow">${esc(s.name)}</strong>${icon(s.image === state.signature ? "circle-check" : "circle")}</div></button><div class="row"><button class="icon-btn" data-action="rename-signature" data-id="${s.id}" title="重命名签名" aria-label="重命名签名">${icon("pencil")}</button><button class="icon-btn" data-action="remove-signature" data-id="${s.id}" title="删除签名" aria-label="删除签名">${icon("trash-2")}</button></div></div>`).join("") : `<p class="note">还没有保存的签名</p>`}</div>${section("常用填写资料")}${[
    ["name", "姓名"],
    ["phone", "联系电话"],
    ["company", "公司 / 单位"],
  ]
    .map(([key, label]) =>
      field(
        label,
        `<input type="text" data-bind="profile.${key}" value="${esc(state.profile[key])}">`,
      ),
    )
    .join(
      "",
    )}${button("保存资料", "save-profile", "check")}${section("流程与本地数据")}${button("管理常用流程", "manage-workflows", "workflow", "outline")}<button class="settings-row" data-action="clear-personal"><span class="grow">清除常用资料</span>${icon("trash-2")}</button></div>`;
}

function rememberSignature(image, name = "常用签名") {
  state.signature = image;
  if (!state.signatures.some((s) => s.image === image))
    state.signatures.push({ id: uid(), name, image });
  persist();
}

function experienceSettingsHTML() {
  return `${section("草稿与工作空间")}${switchRow("在此浏览器保存文件与草稿", "settings.saveDrafts", state.settings.saveDrafts, state.storageAvailable ? "刷新后可继续，本机存储" : "当前浏览器无法保存")}${button("清除已保存的文件与草稿", "clear-workspace", "trash-2", "outline")}<button class="settings-row" data-route="personal">${icon("contact-round")}<span class="grow">常用签名与填写资料</span>${icon("chevron-right")}</button>${section("免费使用额度")}${[
    ["scan", "扫描"],
    ["ocr", "文字识别"],
    ["compress", "压缩"],
  ]
    .map(
      ([key, title]) =>
        `<div class="quota-row row between"><span>${title}</span><span>${state.pro ? "Pro · 不限次数" : `本月剩余 ${Math.max(0, 3 - state.usage[key])} / 3 次`}</span></div>`,
    )
    .join(
      "",
    )}<div class="note" style="margin-top:12px">${icon("info")}额度与购买为原型演示</div>`;
}

function allowTask(kind, resumeAction) {
  if (state.pro || state.usage[kind] < 3) return true;
  state.resumeAction = {
    action: resumeAction,
    fileId: current()?.id,
    route: state.route,
  };
  const title = { scan: "扫描", ocr: "文字识别", compress: "压缩" }[kind];
  openModal(
    "本月免费次数已用完",
    `<div class="warning">${icon("info")}本月 3 次免费${title}已用完。当前文件和编辑内容已保留。</div><div class="plan active"><span class="grow"><strong>纸间 Pro · 永久买断</strong><small style="display:block;margin-top:5px">无限扫描、OCR、压缩与完整流程</small></span><strong>¥68</strong></div>${button("查看 Pro", "quota-pro", "crown")}${button("返回文件", "close-modal", "arrow-left", "outline")}<small style="display:block;margin-top:12px">原型演示，不会发起真实支付</small>`,
  );
  return false;
}

function countTask(kind) {
  state.usage[kind]++;
  persist();
  if (state.route === "compress") renderTaskContext();
}

function enhancedProView() {
  return `<div class="page">${intro("纸间 Pro", state.pro ? "已解锁 · 永久买断" : "¥68 · 一次付款，无自动续订")}<h2>免费可完成</h2><p style="margin:10px 0 20px">阅读、搜索、基础签名与标注、页面整理和文件导出。扫描、OCR、压缩每月各 3 次。</p>${section("Pro 权益")}${[
    ["scan-text", "无限扫描、OCR 与压缩"],
    ["list-checks", "批量任务与原生快捷指令"],
    ["workflow", "保存和复用完整处理流程"],
    ["shield-check", "高级打码与密码保护"],
    ["stamp", "页码、水印与家庭共享"],
  ]
    .map(
      ([symbol, title]) =>
        `<div class="benefit">${icon(symbol)}<span class="grow"><strong>${title}</strong></span>${icon("check")}</div>`,
    )
    .join(
      "",
    )}<div class="plan active"><span class="grow"><h3>永久买断</h3><small>一次购买，无自动续订</small></span><strong>¥68</strong></div>${button(state.pro ? "已解锁 Pro" : "解锁纸间 Pro", "buy-pro", "crown", "primary", state.pro ? "disabled" : "")}${button("恢复购买", "restore-pro", "rotate-cw", "outline")}<div class="note" style="margin-top:14px">${icon("info")}购买与高级功能在原型中可体验，不产生费用</div></div>`;
}

function showMissingDraft() {
  openModal(
    "需要重新选择文件",
    `<div class="warning">${icon("file-warning")}这份草稿的文件暂时不可用。重新选择同一份源文件后可继续。</div>${button("重新选择文件", "relink-draft", "folder-open")}${button("返回工作台", "missing-draft-home", "arrow-left", "outline")}`,
  );
}

function editWorkflowSheet(id) {
  const t = state.templates.find((t) => t.id === id);
  if (!t) return;
  const p = t.params;
  openModal(
    "编辑流程",
    `${field("流程名称", `<input id="template-name" type="text" value="${esc(t.name)}">`)}${field("输出命名", `<input id="template-naming" type="text" value="${esc(p.naming)}">`)}<small>{原名}、{日期}、{序号}</small>${section("处理步骤")}${[
      ["sign", "填写与签名"],
      ["organize", "整理页面"],
      ["ocr", "识别并复核文字"],
    ]
      .map(
        ([id, label]) =>
          `<label class="check-row"><span>${label}</span><input type="checkbox" data-workflow-step="${id}" ${p.manual.includes(id) ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<label class="check-row"><span>添加页码</span><input id="template-numbers" type="checkbox" ${p.numbers.enabled ? "checked" : ""}></label><label class="check-row"><span>跳过封面编号</span><input id="template-skip" type="checkbox" ${p.numbers.skip ? "checked" : ""}></label><label class="check-row"><span>添加水印</span><input id="template-watermark-enabled" type="checkbox" ${p.watermark.enabled ? "checked" : ""}></label>${field("水印文字", `<input id="template-watermark" type="text" value="${esc(p.watermark.text)}">`)}<label class="check-row"><span>压缩 PDF</span><input id="template-compress-enabled" type="checkbox" ${p.compress.enabled ? "checked" : ""}></label>${field(
      "压缩档位",
      `<select id="template-compress">${[
        ["light", "轻度"],
        ["balanced", "平衡"],
        ["strong", "强力"],
      ]
        .map(
          ([id, label]) =>
            `<option value="${id}" ${p.compress.preset === id ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select>`,
    )}${field("文件大小限制（MB）", `<input id="template-target" type="number" min="0.1" step="0.1" value="${p.compress.target}">`)}<label class="check-row"><span>灰度输出</span><input id="template-gray" type="checkbox" ${p.compress.gray ? "checked" : ""}></label><label class="check-row"><span>清理元数据</span><input id="template-metadata" type="checkbox" ${p.metadata ? "checked" : ""}></label>${button("保存流程", "template-save-edit", "check", "primary", `data-id="${id}"`)}`,
  );
}

function resultExperienceHTML(r) {
  const operation = r.operation;
  let metrics = "",
    summary = r.summary || "";
  if (operation === "压缩" || r.workflow?.params.compress.enabled) {
    const saving = Math.round((1 - r.size / r.sourceSize) * 100);
    metrics = `<div class="result-metrics"><div><small>处理前</small><strong>${sizeString(r.sourceSize)}</strong></div><div><small>处理后${saving > 0 ? ` · 减少 ${saving}%` : ""}</small><strong class="accent">${sizeString(r.size)}</strong></div></div>`;
    summary =
      r.size <= r.target * 1048576
        ? `符合 ${r.target} MB 文件大小限制`
        : `超过 ${r.target} MB 限制，可调整参数后重试`;
  } else if (operation === "已签署") {
    summary = `${r.signatureCount} 个签名 · ${r.annotationCount} 项签名与填写内容`;
  } else if (operation === "整理")
    summary = `${r.sourcePageCount} 页 → ${r.pageCount} 页 · 已保存页面顺序与方向`;
  else if (operation === "扫描") summary = `已生成 ${r.pageCount} 页扫描 PDF`;
  else if (operation === "已打码")
    summary = `已重建 ${r.redactionPages} 页 · ${r.redactionCount} 处遮挡区域`;
  else if (operation === "页码") summary = `已为 ${r.numberedPages} 页添加页码`;
  else if (operation === "水印")
    summary = `已为 ${r.watermarkedPages} 页添加水印`;
  const next =
    operation === "已签署"
      ? ["compress", "签署后压缩", "minimize-2"]
      : operation === "扫描"
        ? ["ocr", "提取文字", "scan-text"]
        : operation === "压缩"
          ? ["sign", "继续签名", "signature"]
          : ["numbers", "添加页码", "list-ordered"];
  return `${metrics}${summary ? `<div class="result-summary">${icon("circle-check")}<span>${esc(summary)}</span></div>` : ""}${r.kind === "pdf" ? `<button class="text-btn" data-action="compare-result">${icon("columns-2")}查看处理前后</button>` : ""}<div class="result-next">${r.pendingWorkflow ? button("继续常用流程", "result-workflow", "workflow", "outline") : button(next[1], "result-next", next[2], "outline", `data-next-route="${next[0]}"`)}${button("保存此流程", "save-result-workflow", "pin", "outline")}</div>`;
}

Object.assign(renderers, {
  templates: workflowTemplatesView,
  personal: personalView,
  pro: enhancedProView,
});

Object.assign(actions, {
  "choose-current": (el) => {
    closeModal();
    selectFile(el.dataset.id, state.route);
  },
  "home-scan": () => navigate("scan"),
  "sample-demo": () => {
    const f = state.files.find((f) => f.isSample && f.type === "contract");
    if (f) selectFile(f.id);
    else importSheet();
  },
  "toggle-sidebar": () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    render();
  },
  "launch-workflow": (el) => reviewWorkflow(el.dataset.id),
  "pin-workflow": (el) => {
    const t = state.templates.find((t) => t.id === el.dataset.id);
    t.pinned = !t.pinned;
    persist();
    render();
  },
  "apply-template": () => reviewWorkflow(state.chosenTemplate),
  "workflow-start": (el) => beginWorkflow(el.dataset.id),
  "workflow-input": (el) => {
    state.pendingWorkflow = el.dataset.id;
    importSheet();
  },
  "workflow-scan": (el) => {
    state.pendingWorkflow = el.dataset.id;
    state.pendingRoute = null;
    navigate("scan");
  },
  "workflow-next": advanceWorkflow,
  "workflow-finish": executeWorkflow,
  "pause-workflow": () => {
    markDraft();
    navigate("home");
    toast("流程已暂停，草稿保留");
  },
  "resume-draft": () => {
    if (state.draft?.route === "scan") return navigate("scan");
    const d = state.draft,
      file = state.files.find((f) => f.id === d?.fileId);
    if (!file) return showMissingDraft();
    if (state.activeWorkflow?.fileId === file.id) return showWorkflowStep();
    selectFile(file.id, d.route);
    state.pageIndex = Math.min(d.pageIndex, file.pages.length - 1);
    render();
  },
  "discard-draft": () =>
    openModal(
      "放弃当前草稿？",
      `<p>将撤回未导出的编辑，已生成的结果与源文件保留。</p>${button("放弃草稿", "confirm-discard-draft", "trash-2", "destructive")}${button("保留草稿", "close-modal", "arrow-left", "outline")}`,
    ),
  "confirm-discard-draft": async () => {
    const d = state.draft,
      f = state.files.find((f) => f.id === d?.fileId);
    if (f?.sourceBytes) {
      const restored = await parsePDF(f.sourceBytes, f.name);
      Object.assign(f, {
        pages: restored.pages,
        annotations: [],
        ocrText: null,
      });
    }
    state.draft = null;
    state.activeWorkflow = null;
    state.scanPages = [];
    state.redactBoxes = [];
    closeModal();
    render();
    await saveWorkspace();
  },
  "relink-draft": () => {
    state.relinkDraft = state.draft;
    state.pendingRoute = state.draft?.route || "reader";
    state.pendingWorkflow = state.activeWorkflow?.templateId || null;
    importSheet();
  },
  "missing-draft-home": () => navigate("home"),
  "edit-template": (el) => editWorkflowSheet(el.dataset.id),
  "template-save-edit": (el) => {
    const t = state.templates.find((t) => t.id === el.dataset.id),
      name = $("#template-name").value.trim();
    const target = +$("#template-target").value;
    if (!name || !Number.isFinite(target) || target <= 0)
      return toast("请填写流程名称和有效的大小限制", true);
    const p = structuredClone(t.params),
      preset = $("#template-compress").value;
    p.manual = $$("[data-workflow-step]")
      .filter((el) => el.checked)
      .map((el) => el.dataset.workflowStep);
    p.naming = $("#template-naming").value.trim() || "{原名}_处理";
    p.numbers.enabled = $("#template-numbers").checked;
    p.numbers.skip = $("#template-skip").checked;
    p.watermark.enabled = $("#template-watermark-enabled").checked;
    p.watermark.type = "text";
    p.watermark.text = $("#template-watermark").value;
    if (p.watermark.enabled && !p.watermark.text.trim())
      return toast("请输入水印文字", true);
    Object.assign(p.compress, {
      enabled: $("#template-compress-enabled").checked,
      preset,
      quality: preset === "light" ? 85 : preset === "strong" ? 35 : 65,
      dpi: preset === "light" ? 200 : preset === "strong" ? 96 : 144,
      target,
      gray: $("#template-gray").checked,
    });
    p.metadata = $("#template-metadata").checked;
    t.name = name;
    t.params = p;
    persist();
    closeModal();
    render();
    toast("流程已保存");
  },
  "save-template": (result = null) => {
    state.workflowToSave = result?.kind === "pdf" ? result : null;
    openModal(
      "保存为常用流程",
      `${field("流程名称", `<input id="new-template-name" type="text" placeholder="如：每月客户合同">`)}${field("输出命名", `<input id="new-template-naming" type="text" value="{原名}_处理_{日期}">`)}<small>{原名}、{日期}、{序号}</small><label class="check-row"><span>置顶到首页</span><input id="new-template-pin" type="checkbox" checked></label>${button("保存流程", "confirm-save-template", "check")}`,
    );
  },
  "confirm-save-template": () => {
    const name = $("#new-template-name").value.trim();
    if (!name) return toast("请输入流程名称", true);
    const result = state.workflowToSave;
    const params = result?.workflow?.params
      ? structuredClone(result.workflow.params)
      : {
          manual: result?.operation === "已签署" ? ["sign"] : [],
          compress: {
            ...state.compress,
            enabled: result ? result.operation === "压缩" : true,
          },
          numbers: {
            ...state.numbers,
            enabled: result ? !!result.options?.numbers : true,
          },
          watermark: {
            ...state.watermark,
            enabled: result
              ? !!result.options?.watermark
              : !!state.watermark.text,
          },
          metadata: result
            ? !!result.options?.metadata
            : state.compress.metadata,
          naming: "{原名}_处理_{日期}",
        };
    params.naming = $("#new-template-naming").value.trim() || params.naming;
    const t = {
      id: uid(),
      name,
      type: "custom",
      pinned: $("#new-template-pin").checked,
      params,
    };
    state.templates.push(t);
    state.chosenTemplate = t.id;
    state.workflowToSave = null;
    persist();
    closeModal();
    render();
    toast("流程已保存，可从首页再次使用");
  },
  "continue-result": () => {
    const id = state.result?.fileId;
    closeModal();
    if (id) selectFile(id);
  },
  "result-next": (el) => {
    const id = state.result?.fileId;
    closeModal();
    if (id) selectFile(id, el.dataset.nextRoute);
  },
  "result-workflow": () => {
    const r = state.result;
    closeModal();
    selectFile(r.fileId);
    reviewWorkflow(r.pendingWorkflow);
  },
  "save-result-workflow": () => {
    actions["save-template"](state.result);
  },
  "compare-result": () => {
    const r = state.result;
    openModal(
      "处理前后",
      `<div class="compare-pages"><div><small>处理前 · ${sizeString(r.sourceSize)}</small><img src="${r.sourceImage}" alt="处理前页面"></div><div><small>处理后 · ${sizeString(r.size)}</small><img src="${r.image}" alt="处理后页面"></div></div>${button("返回处理结果", "return-result", "arrow-left", "outline")}`,
    );
  },
  "return-result": showResult,
  "save-profile": () => {
    Object.assign(state.form, state.profile);
    persist();
    toast("常用资料已保存");
  },
  "manage-workflows": () => navigate("templates"),
  "signature-library": () =>
    openModal(
      "常用签名与资料",
      `${state.signatures.map((s) => `<button class="settings-row" data-action="choose-signature" data-id="${s.id}">${icon(s.image === state.signature ? "circle-check" : "circle")}<span class="grow">${esc(s.name)}</span></button>`).join("")}${button("管理常用资料", "open-personal", "contact-round", "outline")}${button("使用常用填写资料", "use-profile", "text-cursor-input", "secondary")}`,
    ),
  "open-personal": () => navigate("personal"),
  "use-profile": () => {
    Object.assign(state.form, state.profile);
    state.signMode = "form";
    closeModal();
    render();
  },
  "choose-signature": (el) => {
    const s = state.signatures.find((s) => s.id === el.dataset.id);
    state.signature = s.image;
    persist();
    closeModal();
    render();
  },
  "rename-signature": (el) => {
    const s = state.signatures.find((s) => s.id === el.dataset.id);
    openModal(
      "签名名称",
      `${field("名称", `<input id="signature-rename" type="text" value="${esc(s.name)}">`)}${button("保存名称", "confirm-rename-signature", "check", "primary", `data-id="${s.id}"`)}`,
    );
  },
  "confirm-rename-signature": (el) => {
    const name = $("#signature-rename").value.trim();
    if (!name) return toast("请输入名称", true);
    state.signatures.find((s) => s.id === el.dataset.id).name = name;
    persist();
    closeModal();
    render();
  },
  "remove-signature": (el) =>
    openModal(
      "删除此签名？",
      `<p>已导出文件中的签名不会受影响。</p>${button("删除签名", "confirm-remove-signature", "trash-2", "destructive", `data-id="${el.dataset.id}"`)}`,
    ),
  "confirm-remove-signature": (el) => {
    const s = state.signatures.find((s) => s.id === el.dataset.id);
    state.signatures = state.signatures.filter((s) => s.id !== el.dataset.id);
    if (state.signature === s.image)
      state.signature = state.signatures[0]?.image || null;
    persist();
    closeModal();
    render();
  },
  "clear-personal": () =>
    openModal(
      "清除常用资料？",
      `<p>移除已保存的签名与填写资料，文件和流程保留。</p>${button("清除资料", "confirm-clear-personal", "trash-2", "destructive")}${button("取消", "close-modal", "x", "outline")}`,
    ),
  "confirm-clear-personal": () => {
    state.signatures = [];
    state.signature = null;
    state.profile = { name: "", phone: "", company: "" };
    state.form = { ...state.profile, agree: false };
    persist();
    closeModal();
    render();
  },
  "clear-workspace": () =>
    openModal(
      "清除本地工作空间？",
      `<p>移除此浏览器保存的文件、草稿和最近记录。系统中的源文件、常用资料和流程保留。</p>${button("清除文件与草稿", "confirm-clear-workspace", "trash-2", "destructive")}${button("取消", "close-modal", "x", "outline")}`,
    ),
  "confirm-clear-workspace": async () => {
    state.files = [];
    state.current = null;
    state.draft = null;
    state.activeWorkflow = null;
    state.scanPages = [];
    state.bookmarks = {};
    state.batch.ids.clear();
    sources.clear();
    sourceDocuments.clear();
    await clearWorkspace();
    closeModal();
    render();
  },
  "quota-pro": () => navigate("pro"),
  "more-annotation-tools": () =>
    openModal(
      "标注工具",
      `<div class="tool-grid">${[
        ["check", "check", "勾选"],
        ["rectangle", "square", "矩形"],
        ["underline", "underline", "下划线"],
        ["note", "sticky-note", "便签"],
      ]
        .map(
          ([id, symbol, label]) =>
            `<button class="tool-item" data-tool="${id}">${icon(symbol)}${label}</button>`,
        )
        .join("")}</div>`,
    ),
  "reader-options": () =>
    openModal(
      "阅读选项",
      `${button(state.readerMode === "single" ? "连续阅读" : "单页阅读", "reader-mode", "rows-2", "outline")}<div class="row" style="margin-top:12px">${button("缩小", "zoom-out", "minus", "outline")}<span class="nowrap">${state.zoom}%</span>${button("放大", "zoom-in", "plus", "outline")}</div>`,
    ),
});

for (const [kind, action] of [
  ["scan", "scan-finish"],
  ["ocr", "ocr-run"],
  ["compress", "compress-run"],
]) {
  const run = actions[action];
  actions[action] = async () => {
    if (!allowTask(kind, action)) return;
    const completed = await run();
    if (completed) countTask(kind);
  };
}

for (const [action, route] of [
  ["sign-export", "sign"],
  ["organize-export", "organize"],
  ["ocr-save", "ocr"],
]) {
  const run = actions[action];
  actions[action] = () =>
    state.activeWorkflow?.params.manual[state.activeWorkflow.index] === route
      ? advanceWorkflow()
      : run();
}

document.addEventListener("input", (e) => {
  const key = e.target.dataset.bind || "";
  if (
    ["form.", "compress.", "numbers.", "watermark."].some((prefix) =>
      key.startsWith(prefix),
    ) ||
    e.target.id === "ocr-text"
  )
    markDraft();
  if (key.startsWith("profile.")) persist();
  if (e.target.id === "ocr-text" && current())
    current().ocrText = state.ocrText;
  scheduleWorkspaceSave();
});
document.addEventListener("change", async (e) => {
  if (e.target.dataset.bind === "settings.saveDrafts") {
    if (!state.settings.saveDrafts) await clearWorkspace();
    else await saveWorkspace();
  }
});
window.addEventListener("pagehide", () => saveWorkspace());
