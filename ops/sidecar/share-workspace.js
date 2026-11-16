/* Presentation and keyboard enhancement only. Existing Share APIs and handlers own all data. */
;(function () {
  "use strict"
  const assetVersion = "20261116-exterior2"
  if (!document.querySelector("link[data-atp-share-workspace]")) {
    const css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = "/share-app/share-workspace.css?v=" + assetVersion
    css.dataset.atpShareWorkspace = ""
    document.head.appendChild(css)
  }
  const publicPage = document.body.classList.contains("atp-share-public")
  if (publicPage) {
    try {
      const saved =
        localStorage.getItem("atpweb-theme") ||
        localStorage.getItem("hope-ui-color-mode")
      const light = saved
        ? saved === "light"
        : !matchMedia("(prefers-color-scheme: dark)").matches
      if (light) document.body.setAttribute("data-theme", "light")
      else document.body.removeAttribute("data-theme")
    } catch (_) {}
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.type = "button"
      button.setAttribute("aria-label", "Đổi giao diện sáng hoặc tối")
    })
  }
  const eye =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
  let previousFocus = null,
    wasOpen = false
  function decorate(overlay) {
    if (!overlay.dataset.atpWorkspaceReady) {
      overlay.dataset.atpWorkspaceReady = "true"
      overlay.setAttribute("role", "dialog")
      overlay.setAttribute("aria-modal", "true")
      overlay.setAttribute("aria-labelledby", "atpsModalTitle")
      const text = (selector, label) => {
        const node = overlay.querySelector(selector)
        if (node) node.textContent = label
      }
      text("#atpsModalTitle", "Chia sẻ liên kết")
      text('[data-tab="create"]', "Tạo liên kết")
      text('[data-tab="manage"]', "Quản lý link")
      text("#atpsBtnCreate", "Tạo liên kết")
      text(".atps-result-label", "Liên kết đã tạo")
      text("#atpsBtnCopyResult", "Sao chép liên kết")
      const fields = overlay.querySelectorAll("#atpsTabCreate > .atps-field")
      const labels = [
        "Tệp được chia sẻ",
        "Thời hạn truy cập",
        "Mật khẩu (tùy chọn)",
        "Giới hạn lượt tải",
      ]
      fields.forEach((field, i) => {
        const label = field.querySelector("label")
        if (!label) return
        label.textContent = labels[i] || label.textContent
        const input = field.querySelector(".atps-input")
        if (input) label.htmlFor = input.id
        if (i === 0) label.id = "atpsFileLabel"
        if (i === 3) {
          const hint = document.createElement("small")
          hint.className = "atps-field-hint"
          hint.id = "atpsMaxDlHint"
          hint.textContent = "Nhập 0 để không giới hạn."
          field.appendChild(hint)
          if (input) input.setAttribute("aria-describedby", hint.id)
        }
      })
      const radio = overlay.querySelector(".atps-radio-group")
      if (radio) {
        radio.setAttribute("role", "group")
        radio.setAttribute("aria-label", "Thời hạn truy cập")
      }
      const file = overlay.querySelector("#atpsFileName")
      if (file) file.setAttribute("aria-labelledby", "atpsFileLabel")
      const custom = overlay.querySelector("#atpsCustomDays")
      if (custom) custom.setAttribute("aria-label", "Số ngày truy cập")
      const password = overlay.querySelector("#atpsPassword")
      if (password) {
        password.type = "password"
        password.autocomplete = "new-password"
        const wrap = document.createElement("div")
        wrap.className = "atps-secret-row"
        password.before(wrap)
        wrap.appendChild(password)
        const toggle = document.createElement("button")
        toggle.type = "button"
        toggle.className = "atps-secret-toggle"
        toggle.innerHTML = eye
        toggle.setAttribute("aria-label", "Hiện mật khẩu")
        toggle.setAttribute("aria-pressed", "false")
        toggle.addEventListener("click", () => {
          const show = password.type === "password"
          password.type = show ? "text" : "password"
          toggle.setAttribute("aria-pressed", String(show))
          toggle.setAttribute(
            "aria-label",
            show ? "Ẩn mật khẩu" : "Hiện mật khẩu",
          )
        })
        wrap.appendChild(toggle)
      }
      overlay
        .querySelectorAll("button")
        .forEach((button) => (button.type = "button"))
      const close = overlay.querySelector("#atpsCloseBtn")
      if (close) close.setAttribute("aria-label", "Đóng chia sẻ")
      overlay.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return
        const items = Array.from(
          overlay.querySelectorAll("button,input,a[href],[tabindex]"),
        ).filter(
          (node) =>
            !node.disabled &&
            node.tabIndex >= 0 &&
            node.getClientRects().length > 0,
        )
        if (!items.length) return
        const first = items[0],
          last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      })
    }
    overlay
      .querySelectorAll("[data-copy-url],[data-delete-id]")
      .forEach((button) => {
        if (button.dataset.atpLabelled) return
        button.dataset.atpLabelled = "true"
        const label = button.hasAttribute("data-copy-url")
          ? "Sao chép"
          : "Thu hồi"
        button.textContent = label
        button.setAttribute("aria-label", label + " liên kết")
      })
    const tabs = Array.from(overlay.querySelectorAll(".atps-tab"))
    const tablist = overlay.querySelector(".atps-tabs")
    if (tablist) tablist.setAttribute("role", "tablist")
    tabs.forEach((tab, i) => {
      tab.id = "atpsTabButton" + i
      tab.setAttribute("role", "tab")
      tab.setAttribute(
        "aria-selected",
        String(tab.classList.contains("active")),
      )
      tab.tabIndex = tab.classList.contains("active") ? 0 : -1
      const id =
        tab.dataset.tab === "create" ? "atpsTabCreate" : "atpsTabManage"
      tab.setAttribute("aria-controls", id)
      const panel = overlay.querySelector("#" + id)
      if (panel) {
        panel.setAttribute("role", "tabpanel")
        panel.setAttribute("aria-labelledby", tab.id)
      }
      if (!tab.dataset.atpKeys) {
        tab.dataset.atpKeys = "true"
        tab.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return
          event.preventDefault()
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                  tabs.length
          tabs[next].click()
          tabs[next].focus()
        })
      }
    })
    const create = overlay.querySelector("#atpsBtnCreate")
    if (create && create.textContent.includes("Tạo Share Link"))
      create.textContent = "Tạo liên kết"
    if (create && create.textContent.includes("✅ Đã tạo"))
      create.textContent = "Đã tạo liên kết"
    overlay.querySelectorAll(".atps-badge-pw").forEach((badge) => {
      if (badge.textContent !== "Mật khẩu") badge.textContent = "Mật khẩu"
    })
    const open = getComputedStyle(overlay).display !== "none"
    if (open && !wasOpen) {
      previousFocus = document.activeElement
      requestAnimationFrame(() =>
        overlay.querySelector("#atpsCloseBtn")?.focus({ preventScroll: true }),
      )
    }
    if (!open && wasOpen && previousFocus?.isConnected)
      previousFocus.focus({ preventScroll: true })
    wasOpen = open
  }
  function attach() {
    const overlay = document.getElementById("atpShareOverlay")
    if (!overlay) return false
    decorate(overlay)
    new MutationObserver(() => decorate(overlay)).observe(overlay, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })
    return true
  }
  if (!attach()) {
    const watcher = new MutationObserver(() => {
      if (attach()) watcher.disconnect()
    })
    watcher.observe(document.body, { childList: true })
  }
})()
