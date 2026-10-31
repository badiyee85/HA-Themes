(() => {
  const desc = el => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return `${el.tagName.toLowerCase()}${el.dataset.slot ? '[slot=' + el.dataset.slot + ']' : ''}${el.getAttribute('aria-label') ? '[aria=' + el.getAttribute('aria-label') + ']' : ''} r=${[r.x, r.y, r.width, r.height].map(Math.round)} pos=${cs.position} bg=${cs.backgroundColor} z=${cs.zIndex} cls=${(el.getAttribute('class') || '').slice(0, 160)}`
  }
  const chain = el => {
    const out = []
    while (el && out.length < 9) { out.push(desc(el)); el = el.parentElement }
    return out
  }
  const pick = label => document.querySelector(`[aria-label="${label}"]`)
  const at = (x, y) => document.elementFromPoint(x, y)
  return {
    hideSidebar: chain(pick('Hide sidebar')),
    openSettings: chain(pick('Open settings')),
    topLeft: chain(at(120, 15)),
    topMid: chain(at(600, 15)),
    sendArea: chain(at(1020, 660)),
    composerSurface: desc(document.querySelector('[data-slot=composer-surface]')),
    userBubble: chain(document.querySelector('[data-slot=aui_user-message-text]')).slice(0, 5),
    rootAttrs: Array.from(document.documentElement.attributes).map(a => a.name + '=' + a.value.slice(0, 60)),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    titlebarHeight: getComputedStyle(document.documentElement).getPropertyValue('--titlebar-height')
  }
})()
