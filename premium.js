// premium.js — Free/Premium + Lock + Drag-to-swap

// ── COMPRAS ───────────────────────────────────────────────────────────
const PURCHASES_KEY = 'sorteia-purchases-v1';

function isPremium(sport) {
    try { return (JSON.parse(localStorage.getItem(PURCHASES_KEY)) || []).includes(sport); }
    catch { return false; }
}
function unlockPremium(sport) {
    try {
        const p = JSON.parse(localStorage.getItem(PURCHASES_KEY)) || [];
        if (!p.includes(sport)) { p.push(sport); localStorage.setItem(PURCHASES_KEY, JSON.stringify(p)); }
    } catch {}
}
function revokePremium(sport) {
    try {
        const p = (JSON.parse(localStorage.getItem(PURCHASES_KEY)) || []).filter(s => s !== sport);
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(p));
    } catch {}
}

// ── UI FREE/PREMIUM ───────────────────────────────────────────────────
function initPremiumUI(sport, sportName) {
    const premium = isPremium(sport);
    const configBtn  = document.getElementById('configBtn');
    const redrawBtn  = document.getElementById('redrawBtn');
    const paywallBtn = document.getElementById('paywallBtn');

    if (!premium) {
        configBtn.innerHTML = 'Sortear';
        if (redrawBtn)  redrawBtn.style.display  = 'none';
        if (paywallBtn) paywallBtn.style.display = '';
    } else {
        configBtn.innerHTML = '⚙ Sortear';
        if (paywallBtn) paywallBtn.style.display = 'none';
    }

    const banner = document.getElementById('adBanner');
    if (banner) {
        banner.style.display = premium ? 'none' : 'flex';
        document.querySelector('.app').style.paddingBottom = premium ? '24px' : '74px';
    }

    // Campos extras do formulário só aparecem no premium
    document.querySelectorAll('.premium-only').forEach(el => {
        el.style.display = premium
            ? (el.classList.contains('form-row') ? 'grid' : 'block')
            : 'none';
    });

    const modal           = document.getElementById('paywallModal');
    const closeBtn        = document.getElementById('closePaywallBtn');
    const buyBtn          = document.getElementById('unlockBtn');
    const buySingleBtn    = document.getElementById('unlockSingleBtn');
    const singleLabel     = document.getElementById('singleSportLabel');
    const paywallTitle    = document.getElementById('paywallTitle');

    if (!modal) return;
    if (paywallTitle) paywallTitle.textContent = 'Premium';
    if (singleLabel)  singleLabel.textContent  = `Só o ${sportName}`;
    if (paywallBtn) paywallBtn.addEventListener('click', () => modal.classList.add('show'));
    if (closeBtn)   closeBtn.addEventListener('click',   () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    if (buyBtn) buyBtn.addEventListener('click', () => {
        // TODO: integrar Google Play Billing (produto: com.cpz.sorteiaai.pacote_completo)
        // Ao confirmar: unlockPremium('volei'); unlockPremium('futebol'); unlockPremium('basquete'); unlockPremium('handebol');
        _showToast('Em breve! Disponível quando o app for lançado na Play Store 🚀', 4000);
    });
    if (buySingleBtn) buySingleBtn.addEventListener('click', () => {
        // TODO: integrar Google Play Billing (produto: com.cpz.sorteiaai.[sport])
        // Ao confirmar: unlockPremium(sport);
        _showToast('Em breve! Disponível quando o app for lançado na Play Store 🚀', 4000);
    });

    _initDevTrigger(sport, sportName);
}

function _initDevTrigger(sport, sportName) {
    const title = document.querySelector('.brand h1');
    if (!title) return;
    let taps = 0, timer = null;
    title.addEventListener('click', () => {
        taps++;
        clearTimeout(timer);
        timer = setTimeout(() => { taps = 0; }, 1500);
        if (taps >= 7) {
            taps = 0;
            clearTimeout(timer);
            if (isPremium(sport)) {
                revokePremium(sport);
                clearTeamLocks(sport);
                _showToast(`🔓 ${sportName} voltou para Free`, 2500);
            } else {
                unlockPremium(sport);
                _showToast(`⭐ ${sportName} Premium ativado`, 2500);
            }
            setTimeout(() => location.reload(), 800);
        }
    });
}

// ── CADEADO + DRAG-TO-SWAP ────────────────────────────────────────────
const LOCKS_PREFIX = 'sorteia-locks-';
const MAX_LOCKS = 2;

let _ti = { teams: [], sport: '', formation: '', mode: '', locks: {} };

function _locksKey(s) { return LOCKS_PREFIX + s; }

function _loadLocks(sport) {
    try {
        const raw = JSON.parse(localStorage.getItem(_locksKey(sport))) || {};
        return Object.fromEntries(Object.entries(raw).map(([k, v]) => [Number(k), new Set(v)]));
    } catch { return {}; }
}
function _saveLocks() {
    const raw = Object.fromEntries(Object.entries(_ti.locks).map(([k, v]) => [k, [...v]]));
    localStorage.setItem(_locksKey(_ti.sport), JSON.stringify(raw));
}
function clearTeamLocks(sport) { localStorage.removeItem(_locksKey(sport)); }

// Chamado ANTES de renderTeams() — força jogadores travados nos times corretos
function applyLockedPlayers(teams, pool, sport) {
    if (!isPremium(sport)) return;
    const locks = _loadLocks(sport);
    const allIds = new Set(teams.flatMap(t => t.players.map(p => p.id)));
    const lockedIds = new Set(Object.values(locks).flatMap(s => [...s]));

    for (const [rawIdx, ids] of Object.entries(locks)) {
        const teamIdx = Number(rawIdx);
        const targetTeam = teams[teamIdx];
        if (!targetTeam) continue;
        for (const id of ids) {
            if (!allIds.has(id)) continue;
            const currentIdx = teams.findIndex(t => t.players.some(p => p.id === id));
            if (currentIdx === teamIdx || currentIdx === -1) continue;
            const player = teams[currentIdx].players.find(p => p.id === id);
            const swap   = targetTeam.players.find(p => !lockedIds.has(p.id));
            if (!swap) continue;
            teams[currentIdx].players = teams[currentIdx].players.filter(p => p.id !== id);
            targetTeam.players        = targetTeam.players.filter(p => p.id !== swap.id);
            teams[currentIdx].players.push(swap);
            targetTeam.players.push(player);
        }
    }
}

// Chamado DEPOIS de renderTeams()
function setupTeamInteractivity(teams, sport, formation, mode) {
    if (!isPremium(sport)) return;
    _ti = { teams: JSON.parse(JSON.stringify(teams)), sport, formation, mode };
    _ti.locks = _loadLocks(sport);

    const allIds = new Set(teams.flatMap(t => t.players.map(p => p.id)));
    for (const [idx, ids] of Object.entries(_ti.locks)) {
        _ti.locks[idx] = new Set([...ids].filter(id => allIds.has(id)));
    }
    _saveLocks();
    _attachPlayerUI();
    _ensureToastEl();
}

function _attachPlayerUI() {
    document.querySelectorAll('.teams-grid .team').forEach((teamEl, tIdx) => {
        teamEl.dataset.teamIdx = tIdx;
        const team = _ti.teams[tIdx];
        if (!team) return;
        teamEl.querySelectorAll('.team-player').forEach((el, pIdx) => {
            const player = team.players[pIdx];
            if (!player) return;
            el.dataset.teamIdx   = tIdx;
            el.dataset.playerIdx = pIdx;
            _decorateRow(el, player, tIdx);
        });
    });
}

function _decorateRow(el, player, tIdx) {
    // Grid: order | name | role-badge | lock
    el.style.gridTemplateColumns = '28px 1fr auto auto';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';

    const isLocked = (_ti.locks[tIdx] || new Set()).has(player.id);
    if (isLocked) { el.style.borderColor = '#f59e0b'; el.style.background = 'var(--warning-soft)'; }

    // Cadeado
    const lockBtn = document.createElement('button');
    lockBtn.style.cssText = `all:unset;cursor:pointer;font-size:14px;padding:3px 6px;border-radius:6px;opacity:${isLocked ? 1 : 0.3};transition:opacity 100ms;`;
    lockBtn.innerHTML = isLocked ? '🔒' : '🔓';
    lockBtn.title = isLocked ? 'Destravar' : 'Travar neste time';
    lockBtn.addEventListener('click', e => { e.stopPropagation(); _toggleLock(player, tIdx, el, lockBtn); });
    el.appendChild(lockBtn);

    // Drag (segurar e arrastar)
    _makeDraggable(el, player, tIdx);
}

function _toggleLock(player, tIdx, rowEl, btn) {
    if (!_ti.locks[tIdx]) _ti.locks[tIdx] = new Set();
    const set = _ti.locks[tIdx];
    if (set.has(player.id)) {
        set.delete(player.id);
        rowEl.style.borderColor = ''; rowEl.style.background = '';
        btn.innerHTML = '🔓'; btn.style.opacity = '0.3'; btn.title = 'Travar neste time';
    } else {
        if (set.size >= MAX_LOCKS) { _showToast(`Máx. ${MAX_LOCKS} travados por time`); return; }
        set.add(player.id);
        rowEl.style.borderColor = '#f59e0b'; rowEl.style.background = 'var(--warning-soft)';
        btn.innerHTML = '🔒'; btn.style.opacity = '1'; btn.title = 'Destravar';
    }
    _saveLocks();
}

// ── DRAG ─────────────────────────────────────────────────────────────

let _drag = null; // { player, tIdx, ghost, originEl, holdTimer }

function _makeDraggable(el, player, tIdx) {
    // Touch
    el.addEventListener('touchstart', e => {
        const t = e.touches[0];
        const timer = setTimeout(() => {
            navigator.vibrate?.(40);
            _beginDrag(el, player, tIdx, t.clientX, t.clientY);
        }, 280);
        el._dragTimer = timer;
    }, { passive: true });

    el.addEventListener('touchmove', e => {
        if (!_drag) { clearTimeout(el._dragTimer); return; }
        e.preventDefault();
        const t = e.touches[0];
        _moveDrag(t.clientX, t.clientY);
    }, { passive: false });

    el.addEventListener('touchend', e => {
        clearTimeout(el._dragTimer);
        if (!_drag) return;
        const t = e.changedTouches[0];
        _dropDrag(t.clientX, t.clientY);
    });

    el.addEventListener('touchcancel', () => {
        clearTimeout(el._dragTimer);
        _cancelDrag();
    });

    // Mouse (desktop)
    el.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        const timer = setTimeout(() => _beginDrag(el, player, tIdx, e.clientX, e.clientY), 280);
        el._dragTimer = timer;
        const onMove = ev => { if (_drag) _moveDrag(ev.clientX, ev.clientY); };
        const onUp   = ev => {
            clearTimeout(timer);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (_drag) _dropDrag(ev.clientX, ev.clientY);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

function _beginDrag(originEl, player, tIdx, cx, cy) {
    originEl.style.opacity = '0.35';

    const ghost = originEl.cloneNode(true);
    const rect  = originEl.getBoundingClientRect();
    ghost.style.cssText += `;position:fixed;width:${rect.width}px;left:${cx - rect.width/2}px;top:${cy - rect.height/2}px;z-index:500;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,0.28);border-radius:10px;background:var(--surface);opacity:0.95;transform:scale(1.03);transition:none;`;
    document.body.appendChild(ghost);

    _drag = { player, tIdx, ghost, originEl };
    _highlightTeams(tIdx);
}

function _moveDrag(cx, cy) {
    if (!_drag) return;
    const { ghost } = _drag;
    ghost.style.left = cx - ghost.offsetWidth  / 2 + 'px';
    ghost.style.top  = cy - ghost.offsetHeight / 2 + 'px';
    _updateDropTarget(cx, cy);
}

function _dropDrag(cx, cy) {
    if (!_drag) return;
    const { player, tIdx, ghost, originEl } = _drag;
    ghost.remove();
    originEl.style.opacity = '';
    _clearTeamHighlights();

    // Encontra alvo sob o dedo (ghost tem pointer-events:none, então funciona)
    const under    = document.elementFromPoint(cx, cy);
    const targetRow  = under?.closest('.team-player[data-team-idx]');
    const targetTeamEl = under?.closest('.team[data-team-idx]');

    _drag = null;

    if (targetRow) {
        const toTIdx  = Number(targetRow.dataset.teamIdx);
        const toPIdx  = Number(targetRow.dataset.playerIdx);
        if (toTIdx === tIdx) return;
        const targetPlayer = _ti.teams[toTIdx]?.players[toPIdx];
        if (targetPlayer) _doSwap(player, tIdx, targetPlayer, toTIdx);
    } else if (targetTeamEl) {
        const toTIdx = Number(targetTeamEl.dataset.teamIdx);
        if (toTIdx !== tIdx) _doMove(player, tIdx, toTIdx);
    }
}

function _cancelDrag() {
    if (!_drag) return;
    _drag.ghost.remove();
    _drag.originEl.style.opacity = '';
    _clearTeamHighlights();
    _drag = null;
}

function _doSwap(p1, t1, p2, t2) {
    const from = _ti.teams[t1];
    const to   = _ti.teams[t2];
    from.players = from.players.filter(p => p.id !== p1.id);
    to.players   = to.players.filter(p => p.id !== p2.id);
    from.players.push(p2);
    to.players.push(p1);
    _rerender();
}

function _doMove(player, fromTIdx, toTIdx) {
    _ti.teams[fromTIdx].players = _ti.teams[fromTIdx].players.filter(p => p.id !== player.id);
    _ti.teams[toTIdx].players.push(player);
    const suggestion = _findBestSwap(_ti.teams);
    _rerender();
    if (suggestion) _showToast(`💡 Sugestão: trocar ${suggestion.from.name} por ${suggestion.to.name}`, 6000);
}

function _rerender() {
    if (typeof renderTeams === 'function') {
        renderTeams(_ti.teams, 100, _ti.formation, _ti.mode);
        setupTeamInteractivity(_ti.teams, _ti.sport, _ti.formation, _ti.mode);
    }
}

function _highlightTeams(exceptTIdx) {
    document.querySelectorAll('.teams-grid .team').forEach((el, i) => {
        if (i !== exceptTIdx) el.style.outline = '2px dashed var(--accent)';
    });
}
function _updateDropTarget(cx, cy) {
    document.querySelectorAll('.teams-grid .team-player').forEach(el => el.style.outline = '');
    const under = document.elementFromPoint(cx, cy);
    const row   = under?.closest('.team-player[data-team-idx]');
    if (row && Number(row.dataset.teamIdx) !== _drag?.tIdx) {
        row.style.outline = '2px solid var(--accent)';
        row.style.outlineOffset = '1px';
    }
}
function _clearTeamHighlights() {
    document.querySelectorAll('.teams-grid .team').forEach(el => el.style.outline = '');
    document.querySelectorAll('.teams-grid .team-player').forEach(el => el.style.outline = '');
}

function _findBestSwap(teams) {
    if (teams.length !== 2) return null;
    const skills = teams.map(t => t.players.reduce((s, p) => s + p.skill, 0));
    const diff   = Math.abs(skills[0] - skills[1]);
    if (diff <= 1) return null;
    const si = skills[0] > skills[1] ? 0 : 1, wi = 1 - si;
    let best = null, bestImprove = 0;
    for (const p1 of teams[si].players)
        for (const p2 of teams[wi].players) {
            const newDiff = Math.abs((skills[si] - p1.skill + p2.skill) - (skills[wi] + p1.skill - p2.skill));
            if (diff - newDiff > bestImprove) { bestImprove = diff - newDiff; best = { from: p1, to: p2 }; }
        }
    return best;
}

// ── TOAST ─────────────────────────────────────────────────────────────
function _ensureToastEl() {
    if (document.getElementById('_premiumToast')) return;
    const d = document.createElement('div');
    d.id = '_premiumToast';
    d.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) scale(0.9);background:#0f172a;color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;z-index:400;max-width:88vw;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.35);opacity:0;transition:opacity 200ms,transform 200ms;pointer-events:none;';
    document.body.appendChild(d);
}
function _showToast(msg, duration = 3000) {
    _ensureToastEl();
    const el = document.getElementById('_premiumToast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) scale(0.9)'; }, duration);
}
