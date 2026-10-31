// Audit: visible elements that still carry "modern" styling the WinForms look
// forbids — rounded corners, drop shadows, backdrop blur, translucent fills.
// Result -> probe.json (via PROBE=tools/probes/leftovers.js tools/shoot.sh <label> <skin>).
(() => {
  const out = { radius: [], shadow: [], blur: [], translucent: [], fonts: {} }
  const label = el => {
    const r = el.getBoundingClientRect()
    return {
      tag: el.tagName.toLowerCase(),
      slot: el.dataset.slot || undefined,
      aria: el.getAttribute('aria-label') || undefined,
      r: [r.x, r.y, r.width, r.height].map(Math.round),
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 40),
      cls: (el.getAttribute('class') || '').slice(0, 120)
    }
  }
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width < 6 || r.height < 6 || r.bottom < 0 || r.top > innerHeight) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue
    const rad = parseFloat(cs.borderTopLeftRadius) || 0
    // Circles (avatars, radio dots, status dots) are allowed to stay round.
    const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.backgroundImage !== 'none'
    if (rad > 0.5 && painted && !(rad >= Math.min(r.width, r.height) / 2 - 1 && Math.abs(r.width - r.height) < 3)) out.radius.push({ ...label(el), rad })
    if (cs.boxShadow !== 'none' && !/^(rgba\([^)]*,\s*0\)\s*0px\s*0px\s*0px\s*0px\s*,?\s*)+$/.test(cs.boxShadow)) out.shadow.push({ ...label(el), shadow: cs.boxShadow.slice(0, 80) })
    if (cs.backdropFilter && cs.backdropFilter !== 'none') out.blur.push({ ...label(el), f: cs.backdropFilter })
    const m = /rgba\(\d+, \d+, \d+, (0\.\d+)\)/.exec(cs.backgroundColor)
    if (m && parseFloat(m[1]) > 0.02 && r.width * r.height > 2000) out.translucent.push({ ...label(el), bg: cs.backgroundColor })
    if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
      const k = `${cs.fontFamily.split(',')[0]} ${cs.fontSize}`
      out.fonts[k] = (out.fonts[k] || 0) + 1
    }
  }
  for (const k of ['radius', 'shadow', 'blur', 'translucent']) out[k] = out[k].slice(0, 40)
  return out
})()
