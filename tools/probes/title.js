(() => Array.from(document.querySelectorAll('[data-window-top] > [data-panel-header]')).map(el => {
  const cs = getComputedStyle(el)
  return { top: el.parentElement.dataset.windowTop, bgImage: cs.backgroundImage, bg: cs.backgroundColor, tbh: cs.getPropertyValue('--titlebar-height'), r: el.getBoundingClientRect().toJSON() }
}).concat([{ css: (document.getElementById('hermes-desktop-custom-css')?.textContent || '').match(/data-panel-header\][^}]*}/)?.[0] }]))()
