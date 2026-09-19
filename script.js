const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".nav");

/* Supabase 配置：当前为纯本地模式，留空即关闭数据库（无需保活、不会休眠）。
   想重新启用：把下面两行填上即可（只能填 anon/public key，绝不能填 service_role） */
const SUPABASE_URL = "";
const SUPABASE_KEY = "";

/* ===== 文章数据：改文章就改这里 =====
   title 标题 / url 公众号链接（留空=不可点击）/ cover 封面图（assets/covers/xxx.jpg，留空=彩色编号卡）
   date 日期 / read 阅读时长（都留空就不显示那一行） */
const LOCAL_ARTICLES = [
  {
    title: "无论是否上班，你都可以去做一个赚钱的公众号（喂饭级教程，附图）",
    url: "https://mp.weixin.qq.com/s/rOEAihCQ1K9t8MXmmcS0pA",
    cover: "assets/covers/gz-logo.jpg",
    date: "",
    read: ""
  },
  {
    title: "人一旦开窍，做自媒体就很容易成功",
    url: "https://mp.weixin.qq.com/s/u5w5lFp-jtvDeODgFSB4_g",
    cover: "assets/covers/kaiqiao.jpg",
    date: "",
    read: ""
  },
  {
    title: "2026年，一定要做个人IP",
    url: "https://mp.weixin.qq.com/s/iXVNXRUlqBEiyFjGmsSI9Q",
    cover: "assets/covers/geren-ip.jpg",
    date: "",
    read: ""
  },
  {
    title: "写作两年，我发现很多人都搞错了日更的意义",
    url: "https://mp.weixin.qq.com/s/hh9Q-kpMPgeZ3b27cLTpkw",
    cover: "assets/covers/rigeng.jpg",
    date: "",
    read: ""
  },
  {
    title: "写公众号两个月，月入过万后，我发现：这四类文章很容易爆",
    url: "",
    cover: "",
    date: "",
    read: ""
  },
  {
    title: "在公众号写作，这才是最赚钱的赛道",
    url: "",
    cover: "",
    date: "",
    read: ""
  },
  {
    title: "公众号这4类内容不要标“原创”，不仅限流，还影响账号",
    url: "",
    cover: "",
    date: "",
    read: ""
  }
];

/* 通用：HTML 转义，防止数据里的特殊字符破坏页面 */
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* 文章卡片：渲染 + 数据加载 */
const articleGrid = document.getElementById("article-grid");
if (articleGrid) {
  const renderArticle = (item, i) => {
    const title = escapeHtml(item.title || "未命名文章");
    const cover = item.cover
      ? `<img src="${escapeHtml(item.cover)}" alt="${title}">`
      : `<figure class="cover-fallback c${i % 4}"><span>${String(i + 1).padStart(2, "0")}</span></figure>`;
    const meta = item.date || item.read
      ? `<div><time>${escapeHtml(item.date || "")}</time><span>${escapeHtml(item.read || "")}</span></div>`
      : "";
    const inner = `${cover}${meta}<h3>${title}</h3>`;
    return item.url
      ? `<a class="article-card neo-shadow-small" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="article-card neo-shadow-small">${inner}</article>`;
  };

  // 配了 Supabase 就读数据库；读不到就自动退回本地 articles.json，页面不会开天窗
  const loadArticles = async () => {
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=*`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) throw new Error("Supabase 读取失败");
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) return rows;
        throw new Error("Supabase 表暂无数据");
      } catch (err) {
        console.warn("Supabase 读取失败，退回本地 articles.json", err);
      }
    }
    // 纯本地模式：直接用上面写好的数据，不发任何网络请求（双击打开也能显示）
    return LOCAL_ARTICLES;
  };

  // 分页展示：默认只显示前几篇，点"加载更多"再往后加
  const PAGE_SIZE = 3;
  const loadMoreBtn = document.getElementById("load-more");
  let shown = 0;
  let articles = [];

  const attachCoverFallback = () => {
    articleGrid.querySelectorAll(".article-card img").forEach((img, idx) => {
      if (img.dataset.guarded) return;
      img.dataset.guarded = "1";
      img.addEventListener("error", () => {
        const fb = document.createElement("figure");
        fb.className = "cover-fallback c" + (idx % 4);
        fb.innerHTML = `<span>${String(idx + 1).padStart(2, "0")}</span>`;
        img.replaceWith(fb);
      });
    });
  };

  const showNext = () => {
    const start = shown;
    const next = articles.slice(start, start + PAGE_SIZE);
    if (next.length === 0) {
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }
    articleGrid.insertAdjacentHTML("beforeend", next.map((item, j) => renderArticle(item, start + j)).join(""));
    shown = start + next.length;
    attachCoverFallback();
    if (loadMoreBtn) loadMoreBtn.hidden = shown >= articles.length;
  };

  loadArticles()
    .then((list) => {
      if (!Array.isArray(list) || list.length === 0) throw new Error("没有文章数据");
      articles = list;
      const loading = articleGrid.querySelector(".article-loading");
      if (loading) loading.remove();
      showNext();
      if (loadMoreBtn && shown < articles.length) loadMoreBtn.hidden = false;
      if (loadMoreBtn) loadMoreBtn.addEventListener("click", showNext);
    })
    .catch(() => {
      articleGrid.innerHTML = `<p class="article-loading">文章暂时加载不出来，稍后再来看看。</p>`;
    });
}

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "×" : "☰";
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
  });
});

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = contactForm.elements.name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const message = contactForm.elements.message.value.trim();
    if (!name || !email || !message) {
      formStatus.textContent = "请把称呼、邮箱和留言都填一下 ✦";
      formStatus.classList.add("error");
      return;
    }
    formStatus.classList.remove("error");
    formStatus.textContent = "已收到，我会尽快联系你 ✦";
    contactForm.reset();
  });
}

/* ===== 联系区：微信/视频号二维码弹窗 ===== */
const qrModal = document.getElementById("qr-modal");
if (qrModal) {
  const qrImg = document.getElementById("qr-img");
  const qrTip = document.getElementById("qr-tip");

  const openQr = (src, tip) => {
    qrImg.src = src;
    qrTip.textContent = tip;
    qrModal.hidden = false;
  };
  const closeQr = () => { qrModal.hidden = true; };

  document.getElementById("icon-wechat")?.addEventListener("click", () => openQr("assets/wechat-qr.jpg", "微信扫一扫，加我好友"));
  document.getElementById("icon-sph")?.addEventListener("click", () => openQr("assets/sph-qr.png", "微信扫一扫，观看我的视频号"));
  document.getElementById("qr-close")?.addEventListener("click", closeQr);
  qrModal.addEventListener("click", (e) => { if (e.target === qrModal) closeQr(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeQr(); });
}

/* ===== 视频列表：加视频就改这里 =====
   title 标题 / url 视频链接（留空=不可点击）/ cover 封面图（留空=播放键占位卡）
   注意：这段代码必须放在文件末尾，它依赖上面定义的 escapeHtml */
const VIDEOS = [
  {
    title: "workbuddy真的要代替设计师了",
    desc: "小红书视频，点开就能看。",
    url: "https://www.xiaohongshu.com/discovery/item/6a7df0d30000000028032952?source=webshare&xhsshare=pc_web&xsec_token=AB3_4tlVxDLuqRMESAdCGvI_ubSgQMWflfQQxZgax9T6U=&xsec_source=pc_share",
    cover: "assets/covers/workbuddy-xhs.jpg"
  },
  {
    title: "我用workbuddy做了个自动拆解爆款文案skill",
    desc: "小红书视频，点开就能看。",
    url: "https://www.xiaohongshu.com/discovery/item/6a677880000000000f01337a?source=webshare&xhsshare=pc_web&xsec_token=ABN7ViEAat93WJBLEnKb7VnyP6RFHNPB-Zbrd-hvdCbp8=&xsec_source=pc_share",
    cover: "assets/covers/skill-xhs.jpg"
  },
  {
    title: "如何拆解文并提升文笔！",
    desc: "小红书视频，点开就能看。",
    url: "https://www.xiaohongshu.com/discovery/item/6a5e580b000000001303c96f?source=webshare&xhsshare=pc_web&xsec_token=ABdyVgHnhQyvRwm_BmBpWfIpKid1O40fX70Xg0jcdt-go=&xsec_source=pc_share",
    cover: "assets/covers/chaiwen-xhs.jpg"
  }
];

/* 视频卡片渲染：沿用原本的长条卡片排版（左侧封面 + 右侧标题描述 + 右侧箭头）
   有 url 的整条可点击跳转，右侧显示 ↗ */
const videoGrid = document.getElementById("video-grid");
const videoMoreBtn = document.getElementById("video-more");
if (videoGrid && Array.isArray(VIDEOS)) {
  const VIDEO_PAGE = 3;
  let vShown = 0;

  const renderVideo = (item, i) => {
    const title = escapeHtml(item.title || "未命名视频");
    const desc = item.desc ? `<p>${escapeHtml(item.desc)}</p>` : "";
    const thumb = item.cover
      ? `<img src="${escapeHtml(item.cover)}" alt="${title}">`
      : `<figure class="video-thumb c${i % 4}"><span>&#9654;</span></figure>`;
    const arrow = `<span class="go">${item.url ? "↗" : "·"}</span>`;
    const inner = `${thumb}<div><h3>${title}</h3>${desc}</div>${arrow}`;
    return item.url
      ? `<a class="service-card neo-shadow-small" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="service-card neo-shadow-small">${inner}</article>`;
  };

  const showMoreVideos = () => {
    const start = vShown;
    const next = VIDEOS.slice(start, start + VIDEO_PAGE);
    if (next.length === 0) {
      if (videoMoreBtn) videoMoreBtn.hidden = true;
      return;
    }
    videoGrid.insertAdjacentHTML("beforeend", next.map((item, j) => renderVideo(item, start + j)).join(""));
    vShown = start + next.length;
    if (videoMoreBtn) videoMoreBtn.hidden = vShown >= VIDEOS.length;
  };

  showMoreVideos();
  if (videoMoreBtn && vShown < VIDEOS.length) videoMoreBtn.hidden = false;
  if (videoMoreBtn) videoMoreBtn.addEventListener("click", showMoreVideos);
}

/* ===== 自定义鼠标特效：纯黑小方块光标 ===== */
(function initCustomCursor() {
  // 仅在精确指针（桌面鼠标）且用户未要求减少动效时启用，触屏保持原生光标
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.append(dot);
  document.body.classList.add("cursor-on");

  // 初始放到屏幕中央，避免未移动鼠标时停在左上角
  dot.style.left = window.innerWidth / 2 + "px";
  dot.style.top = window.innerHeight / 2 + "px";

  window.addEventListener("mousemove", (e) => {
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
  }, { passive: true });
})();
