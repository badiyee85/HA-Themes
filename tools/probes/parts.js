(() => {
  const info = el => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName.toLowerCase(),
      slot: el.dataset.slot,
      attrs: Array.from(el.attributes).filter(a => a.name !== 'class' && a.name !== 'style').map(a => `${a.name}=${a.value.slice(0, 40)}`).join(' '),
      r: [r.x, r.y, r.width, r.height].map(Math.round),
      bg: cs.backgroundColor,
      color: cs.color,
      font: `${cs.fontSize}/${cs.fontWeight}/${cs.textTransform}`,
      cls: el.getAttribute('class')
    }
  }
  const headers = Array.from(document.querySelectorAll('[class*="group/pane-header"]')).map(h => ({
    self: info(h),
    parent: info(h.parentElement),
    grand: info(h.parentElement?.parentElement),
    tabs: Array.from(h.querySelectorAll('[role=tab]')).map(info)
  }))
  const sidebarRows = Array.from(document.querySelectorAll('[data-slot=sidebar-menu-button], [data-slot=sidebar-menu] > li > *, [data-slot=sidebar-group-label]')).slice(0, 8).map(info)
  const groupHead = Array.from(document.querySelectorAll('[data-slot=sidebar-group] > *:first-child')).map(info)
  const sessionRow = info(document.querySelector('[data-slot=sidebar-group-content] [data-slot=context-menu-trigger]'))
  const sessionList = info(document.querySelector('[data-slot=sidebar-group-content].overflow-y-auto, [data-slot=sidebar-group-content][class*=overflow-y-auto]'))
  const toolBlock = info(document.querySelector('[class*="group/tool-block"]'))
  const codeCard = info(document.querySelector('[data-slot=code-card]'))
  const voice = info(document.querySelector('[aria-label="Start voice conversation"]'))
  const statusBtns = Array.from(document.querySelectorAll('[data-slot=statusbar] button')).map(info)
  const userBtn = info(document.querySelector('[aria-label="Edit message"]'))
  const statusRow = info(document.querySelector('[data-slot=status-row]'))
  return { headers, sidebarRows, groupHead, sessionRow, sessionList, toolBlock, codeCard, voice, statusBtns, userBtn, statusRow }
})()
