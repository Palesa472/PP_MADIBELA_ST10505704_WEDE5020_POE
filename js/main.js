/* Furnished By Persi - Part 3 JavaScript (vanilla JS, no dependencies except Leaflet on contact.html) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = n => 'R' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Scroll-reveal animation (CSS transition + IntersectionObserver) ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, o) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
      }), { threshold: 0.1 })
    : null;
  const reveal = el => (io ? io.observe(el) : el.classList.add('visible'));
  $$('.reveal').forEach(reveal);

  /* ---------- Overlay helper (modal + lightbox): focus handling, Esc to close, scroll lock ---------- */
  let openOverlay = null;
  function showOverlay(el, onKey) {
    if (openOverlay) openOverlay.close();
    const previous = document.activeElement;
    document.body.classList.add('no-scroll');
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    const handler = e => { if (e.key === 'Escape') close(); else if (onKey) onKey(e); };
    function close() {
      document.removeEventListener('keydown', handler);
      el.remove(); document.body.classList.remove('no-scroll'); openOverlay = null;
      if (previous && previous.focus) previous.focus();
    }
    document.addEventListener('keydown', handler);
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('.modal-close')) close(); });
    openOverlay = { close };
    const first = $('.modal-close', el); if (first) first.focus();
    return close;
  }

  function openModal(title, bodyHtml) {
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<button class="modal-close" type="button" aria-label="Close">&times;</button>' +
      '<h2 id="modal-title"></h2><div class="modal-body"></div></div>';
    $('#modal-title', el).textContent = title;
    $('.modal-body', el).innerHTML = bodyHtml;
    showOverlay(el);
  }

  /* ---------- Lightbox gallery ---------- */
  function openLightbox(items, start) {
    let i = start;
    const el = document.createElement('div');
    el.className = 'modal-overlay lightbox';
    el.innerHTML = '<div class="lb" role="dialog" aria-modal="true" aria-label="Image gallery">' +
      '<button class="modal-close" type="button" aria-label="Close gallery">&times;</button>' +
      '<button class="lb-nav prev" type="button" aria-label="Previous image">&#8249;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-nav next" type="button" aria-label="Next image">&#8250;</button></div>';
    const img = $('img', el), cap = $('figcaption', el);
    const show = n => {
      i = (n + items.length) % items.length;
      img.src = items[i].src; img.alt = items[i].alt;
      cap.textContent = items[i].alt + ' (' + (i + 1) + ' of ' + items.length + ')';
    };
    $('.prev', el).addEventListener('click', () => show(i - 1));
    $('.next', el).addEventListener('click', () => show(i + 1));
    if (items.length < 2) $$('.lb-nav', el).forEach(b => (b.hidden = true));
    show(i);
    showOverlay(el, e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  }
  // Static galleries (home + contact pages): buttons with data-lightbox="groupName"
  $$('[data-lightbox]').forEach(btn => btn.addEventListener('click', () => {
    const group = $$('[data-lightbox="' + btn.dataset.lightbox + '"]');
    openLightbox(group.map(b => ({ src: $('img', b).currentSrc || $('img', b).src, alt: $('img', b).alt })), group.indexOf(btn));
  }));

  /* ---------- Accordion (about_us.html) ---------- */
  $$('.accordion').forEach(acc => {
    const triggers = $$('.accordion-trigger', acc);
    triggers.forEach(btn => btn.addEventListener('click', () => {
      const wasOpen = btn.getAttribute('aria-expanded') === 'true';
      triggers.forEach(b => { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).hidden = true; });
      if (!wasOpen) { btn.setAttribute('aria-expanded', 'true'); document.getElementById(btn.getAttribute('aria-controls')).hidden = false; }
    }));
  });

  /* ---------- Tabs (contact.html branches) ---------- */
  $$('.tabs').forEach(wrap => {
    const tabs = $$('[role="tab"]', wrap);
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      wrap.dispatchEvent(new CustomEvent('tabchange', { detail: tab.dataset.branch }));
    };
    tabs.forEach((t, n) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        const next = tabs[(n + k + tabs.length) % tabs.length]; next.focus(); select(next);
      });
    });
    select(tabs[0]);
  });

  /* ---------- Interactive branch map (Leaflet + OpenStreetMap) ---------- */
  const mapEl = $('#map');
  if (mapEl) {
    if (!window.L) { mapEl.textContent = 'The map could not be loaded. Please use the branch phone numbers above.'; }
    else {
      const branches = {
        johannesburg: { name: 'Johannesburg Branch', ll: [-26.2041, 28.0473] },
        capetown: { name: 'Cape Town Branch', ll: [-33.9249, 18.4241] },
        kzn: { name: 'KwaZulu-Natal Branch (Durban)', ll: [-29.8587, 31.0218] }
      };
      const map = L.map(mapEl, { scrollWheelZoom: false }).setView([-29.5, 25], 5);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      Object.keys(branches).forEach(k => { branches[k].marker = L.marker(branches[k].ll).addTo(map).bindPopup('<strong>Furnished By Persi</strong><br>' + branches[k].name); });
      const tabs = $('.tabs');
      if (tabs) tabs.addEventListener('tabchange', e => {
        const b = branches[e.detail]; if (!b) return;
        map.flyTo(b.ll, 10, { duration: 1.2 }); b.marker.openPopup();
      });
    }
  }

  /* ---------- Dynamic products: render, search, filter, sort (services.html) ---------- */
  const grid = $('#product-grid');
  if (grid && window.PRODUCTS) {
    const q = $('#product-search'), cat = $('#product-category'), sort = $('#product-sort'), count = $('#product-count');
    const cats = Array.from(new Set(PRODUCTS.map(p => p.category)));
    cats.forEach(c => cat.add(new Option(c, c)));
    function render() {
      const term = q.value.trim().toLowerCase();
      let list = PRODUCTS.filter(p => (!cat.value || p.category === cat.value) && (!term || (p.name + ' ' + p.desc + ' ' + p.category).toLowerCase().includes(term)));
      const s = sort.value;
      if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
      if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
      if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
      grid.innerHTML = '';
      list.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card reveal';
        const first = p.images[0];
        card.innerHTML =
          '<button class="card-img" type="button" aria-label="View ' + esc(p.name) + ' photos">' +
          '<img src="' + first.src + '" alt="' + esc(first.alt) + '" width="' + first.w + '" height="' + first.h + '" loading="lazy">' +
          '<span class="badge">' + p.images.length + (p.images.length > 1 ? ' photos' : ' photo') + '</span></button>' +
          '<h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
          '<p class="price">From ' + money(p.price) + '</p>' +
          '<a class="btn-link" href="enquiry.html?item=' + p.id + '">Enquire about this</a>';
        $('.card-img', card).addEventListener('click', () => openLightbox(p.images, 0));
        grid.appendChild(card); reveal(card);
      });
      count.textContent = list.length ? 'Showing ' + list.length + ' of ' + PRODUCTS.length + ' collections' : '';
      if (!list.length) {
        grid.innerHTML = '<p class="empty">No furniture matches your search. <button type="button" id="reset-filters" class="btn-link">Clear filters</button></p>';
        $('#reset-filters').addEventListener('click', () => { q.value = ''; cat.value = ''; sort.value = 'featured'; render(); });
        count.textContent = 'No results found';
      }
    }
    [q, cat, sort].forEach(c => c.addEventListener('input', render));
    render();
  }

  /* ---------- Form validation (client-side) ---------- */
  const RULES = {
    name: v => /^[A-Za-z\u00C0-\u024F' -]{2,60}$/.test(v) || 'Enter your full name (2-60 letters; spaces, hyphens and apostrophes are allowed).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address, e.g. name@example.com.',
    phone: v => /^(\+27|0)[1-9]\d{8}$/.test(v.replace(/[\s-]/g, '')) || 'Enter a valid South African number, e.g. 082 123 4567 or +27 82 123 4567.',
    date: v => { const d = new Date(v + 'T00:00:00'), t = new Date(); t.setHours(0, 0, 0, 0); return (!isNaN(d) && d >= t) || 'Choose today or a future date.'; },
    quantity: v => (/^\d+$/.test(v) && +v >= 1 && +v <= 10) || 'Enter a quantity between 1 and 10.'
  };
  function check(f) {
    const v = f.value.trim();
    if (f.required && !v) return f.tagName === 'SELECT' ? 'Please choose an option.' : 'This field is required.';
    if (!v) return '';
    if (RULES[f.name]) { const r = RULES[f.name](v); if (r !== true) return r; }
    if (f.minLength > 0 && v.length < f.minLength) return 'Please enter at least ' + f.minLength + ' characters (currently ' + v.length + ').';
    if (f.maxLength > 0 && v.length > f.maxLength) return 'Please keep this under ' + f.maxLength + ' characters.';
    return '';
  }
  function setError(f, msg) {
    const out = document.getElementById(f.id + '-error');
    f.classList.toggle('invalid', !!msg); f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg;
  }
  function wireForm(form, onValid) {
    const fields = $$('input:not([type=submit]):not([type=checkbox]), select, textarea', form);
    fields.forEach(f => {
      f.addEventListener('blur', () => setError(f, check(f)));
      f.addEventListener('input', () => { if (f.classList.contains('invalid')) setError(f, check(f)); });
    });
    $$('textarea[data-counter]', form).forEach(t => {
      const out = document.getElementById(t.dataset.counter);
      const upd = () => (out.textContent = t.value.length + ' / ' + t.maxLength);
      t.addEventListener('input', upd); upd();
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      fields.forEach(f => { const m = check(f); setError(f, m); if (m && !first) first = f; });
      if (first) { first.focus(); return; }
      onValid(form);
    });
  }

  /* ---------- Enquiry form: validate, AJAX submit, show cost/availability response ---------- */
  // Optional: paste a free Formspree endpoint (https://formspree.io/f/xxxxxxx) to receive enquiries by email.
  const ENQUIRY_ENDPOINT = '';
  const enquiry = $('#enquiry-form');
  if (enquiry && window.PRODUCTS) {
    const item = new URLSearchParams(location.search).get('item');
    if (item && PRODUCTS.some(p => p.id === item)) $('#furniture').value = item;
    const dateInput = $('#date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
    wireForm(enquiry, async form => {
      const data = Object.fromEntries(new FormData(form));
      const status = $('#form-status'), btn = $('input[type=submit]', form);
      const p = PRODUCTS.find(x => x.id === data.furniture);
      const branch = $('#branch').selectedOptions[0].textContent;
      btn.disabled = true; btn.value = 'Sending...'; status.textContent = '';
      try {
        if (ENQUIRY_ENDPOINT) {
          const res = await fetch(ENQUIRY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error('Server responded ' + res.status);
        } else {
          await new Promise(r => setTimeout(r, 700)); // demo mode: simulates the network request
        }
        const qty = +data.quantity, total = p.price * qty;
        let html = '<p>Thank you, <strong>' + esc(data.name.split(' ')[0]) + '</strong>. Here is a summary of your enquiry:</p><ul class="summary">' +
          '<li><strong>Item:</strong> ' + esc(p.name) + ' x ' + qty + '</li>' +
          '<li><strong>Branch:</strong> ' + esc(branch) + '</li>' +
          '<li><strong>Estimated starting price:</strong> ' + money(total) + (qty > 1 ? ' (' + money(p.price) + ' each)' : '') + '</li>' +
          (data.delivery ? '<li><strong>Delivery:</strong> Requested. Fees depend on location and order size (from R2,999).</li>' : '') +
          (data.date ? '<li><strong>Preferred viewing date:</strong> ' + esc(new Date(data.date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })) + '</li>' : '') + '</ul>' +
          '<p>' + (p.id === 'custom'
            ? 'Custom pieces are made to order, so our team will arrange a design consultation and send you a final quote.'
            : 'Our ' + esc(branch) + ' team will confirm availability and final pricing and contact you at ' + esc(data.email) + '.') + '</p>';
        openModal('Enquiry received', html);
        form.reset(); $$('.invalid', form).forEach(f => setError(f, ''));
      } catch (err) {
        status.textContent = 'Sorry, we could not send your enquiry. Please try again or email info@furnishedbypersi.co.za.';
      } finally { btn.disabled = false; btn.value = 'Submit Enquiry'; }
    });
  }

  /* ---------- Contact form: validate, then compile an email (mailto) ---------- */
  const contact = $('#contact-form');
  if (contact) {
    const RECIPIENT = 'info@furnishedbypersi.co.za';
    wireForm(contact, form => {
      const d = Object.fromEntries(new FormData(form));
      const subject = '[' + d.type + '] Website message from ' + d.name;
      const body = 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + (d.phone || 'Not provided') + '\nMessage type: ' + d.type + '\n\nMessage:\n' + d.message;
      const href = 'mailto:' + RECIPIENT + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      openModal('Your email is ready', '<p>Your email app should open with your message addressed to <strong>' + RECIPIENT + '</strong>. Press send there to finish.</p>' +
        '<p>Nothing happened? <a class="btn-link" href="' + href + '">Open the email again</a></p>');
      window.location.href = href;
    });
  }
})();
