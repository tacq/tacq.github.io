(function () {
  "use strict";

  const GITHUB_NEW_ISSUE_BASE = "https://github.com/tAcQ/money/issues/new";
  const SUPPORT_EMAIL = "zrl0420@gmail.com";

  const playerIdInput = document.getElementById("bug-player-id");
  const deviceInput = document.getElementById("bug-device");
  const gameSelect = document.getElementById("bug-game");
  const descInput = document.getElementById("bug-description");
  const githubLink = document.getElementById("btn-github-issue");
  const emailLink = document.getElementById("btn-email-report");
  const statusEl = document.getElementById("form-status");

  if (!playerIdInput || !deviceInput || !descInput || !githubLink || !emailLink) {
    return;
  }

  function sanitizeText(value, maxLen) {
    if (typeof value !== "string") {
      return "";
    }
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLen);
  }

  function normalizePlayerId(raw) {
    const cleaned = sanitizeText(raw, 24).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!cleaned) {
      return "PA-XXXXXX (please fill in from Settings -> Report a Bug)";
    }
    if (cleaned.startsWith("PA-")) {
      return cleaned;
    }
    if (/^[A-Z0-9]{6}$/.test(cleaned)) {
      return "PA-" + cleaned;
    }
    return cleaned;
  }

  function buildReportPayload() {
    const rawPlayerId = sanitizeText(playerIdInput.value, 24);
    const playerId = normalizePlayerId(rawPlayerId);
    const deviceModel = sanitizeText(deviceInput.value, 120) || "Not specified";
    const miniGame = gameSelect ? sanitizeText(gameSelect.value, 60) : "General / All Mini-Games";
    const description = sanitizeText(descInput.value, 3000);

    const shortSummary = description
      ? description.split(/\r?\n/)[0].slice(0, 72)
      : "Bug Report";

    const issueTitle = "[Bug Report] [" + miniGame + "] " + shortSummary + " (" + (rawPlayerId ? playerId : "PA-XXXXXX") + ")";
    const bodyLines = [
      "### Pocket Arcade — Bug Bounty Report",
      "- **App**: Pocket Arcade (`com.tacq.pocketarcade`)",
      "- **Player ID**: `" + playerId + "`",
      "- **Mini-Game / Area**: " + miniGame,
      "- **Device & OS**: " + deviceModel,
      "- **Submitted From**: Web Bug Report Helper (`tacq.github.io/pocket-arcade/`)",
      "",
      "### Bug Description & Steps to Reproduce",
      description || "(Please describe what happened, what you expected, and how to reproduce the bug.)",
      "",
      "---",
      "*Once accepted, please reply with my 3-Day Ad-Free VIP Reward Code (`PA3-XXXX-YYYYYY`) bound to Player ID `" + playerId + "`.*"
    ];
    const bodyText = bodyLines.join("\n");

    const githubUrl =
      GITHUB_NEW_ISSUE_BASE +
      "?title=" +
      encodeURIComponent(issueTitle) +
      "&body=" +
      encodeURIComponent(bodyText);

    const mailtoUrl =
      "mailto:" +
      SUPPORT_EMAIL +
      "?subject=" +
      encodeURIComponent(issueTitle) +
      "&body=" +
      encodeURIComponent(bodyText);

    return {
      rawPlayerId: rawPlayerId,
      playerId: playerId,
      description: description,
      githubUrl: githubUrl,
      mailtoUrl: mailtoUrl
    };
  }

  function updateLinks() {
    const payload = buildReportPayload();
    githubLink.setAttribute("href", payload.githubUrl);
    emailLink.setAttribute("href", payload.mailtoUrl);

    if (statusEl) {
      if (payload.rawPlayerId && !/^PA-[A-Z0-9]{4,10}$/i.test(payload.playerId)) {
        statusEl.textContent = "Tip: Player IDs usually look like PA-7K4M9X (check Settings -> Report a Bug in Pocket Arcade).";
      } else {
        statusEl.textContent = "Links updated automatically with your Player ID and report details.";
      }
    }
  }

  playerIdInput.addEventListener("input", updateLinks);
  deviceInput.addEventListener("input", updateLinks);
  if (gameSelect) {
    gameSelect.addEventListener("change", updateLinks);
  }
  descInput.addEventListener("input", updateLinks);

  updateLinks();
})();
