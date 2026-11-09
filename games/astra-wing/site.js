// Astra Wing player page: EN / 中文 toggle + screenshot lightbox.
// Progressive enhancement only — the page is fully readable in English without JS.
// All text is swapped with textContent (never innerHTML); translations are static
// strings authored in the page's data-zh attributes.
(function () {
  "use strict";

  var STORAGE_KEY = "aw-lang";
  var TITLES = {
    en: document.title,
    zh: "星翼战姬 Astra Wing — 竖版科幻弹幕射击 | Android"
  };
  var textNodes = Array.prototype.slice.call(document.querySelectorAll("[data-zh]"));
  var zhImages = Array.prototype.slice.call(document.querySelectorAll("img[data-src-zh]"));
  var toggle = document.getElementById("lang-toggle");
  var video = document.getElementById("trailer-video");

  // Remember the English originals once.
  textNodes.forEach(function (el) { el.setAttribute("data-en", el.textContent); });
  zhImages.forEach(function (img) { img.setAttribute("data-src-en", img.getAttribute("src")); });

  function pickInitial() {
    var param = new URLSearchParams(window.location.search).get("lang");
    if (param === "zh" || param === "en") return param;
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* storage blocked: fall through */ }
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  function setVideo(lang) {
    if (!video) return;
    var src = video.getAttribute("data-src-" + lang);
    var poster = video.getAttribute("data-poster-" + lang);
    var source = video.querySelector("source");
    if (!source || source.getAttribute("src") === src) return;
    var wasPlaying = !video.paused;
    source.setAttribute("src", src);
    video.setAttribute("poster", poster);
    video.load();
    if (wasPlaying) { video.play().catch(function () {}); }
  }

  function apply(lang) {
    var zh = lang === "zh";
    document.documentElement.setAttribute("lang", zh ? "zh-CN" : "en");
    document.title = TITLES[lang];
    textNodes.forEach(function (el) {
      el.textContent = el.getAttribute(zh ? "data-zh" : "data-en");
    });
    zhImages.forEach(function (img) {
      img.setAttribute("src", img.getAttribute(zh ? "data-src-zh" : "data-src-en"));
    });
    setVideo(lang);
    if (toggle) {
      toggle.textContent = zh ? "EN" : "中文";
      toggle.setAttribute("aria-label", zh ? "Switch to English" : "切换到中文");
    }
  }

  var current = pickInitial();
  if (current !== "en") apply(current);

  if (toggle) {
    toggle.addEventListener("click", function () {
      current = current === "zh" ? "en" : "zh";
      apply(current);
      try { window.localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* ignore */ }
    });
  }

  // ---------- Screenshot lightbox ----------
  var dialog = document.getElementById("lightbox");
  var dialogImg = document.getElementById("lightbox-img");
  var closeBtn = document.getElementById("lightbox-close");
  if (dialog && dialogImg && typeof dialog.showModal === "function") {
    document.querySelectorAll(".shot").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        if (!img) return;
        dialogImg.setAttribute("src", img.getAttribute("src"));
        dialogImg.setAttribute("alt", img.getAttribute("alt") || "");
        dialog.showModal();
      });
    });
    closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (ev) {
      if (ev.target === dialog) dialog.close();
    });
  }
})();
