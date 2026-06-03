// premium.js — Free/Premium + Lock + Move

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

    const modal       = document.getElementById('paywallModal');
    const closeBtn    = document.getElementById('closePaywallBtn');
    const unlockBtn   = document.getElementById('unlockBtn');
    const revokeBtn   = document.getElementById('revokePremiumBtn');
    const paywallTitle = document.getElementById('paywallTitle');

    if (!modal) return;
    if (paywallTitle) paywallTitle.textContent = `${sportName} Premium`;
    if (paywallBtn) paywallBtn.addEventListener('click', () => modal.classList.add('show'));
    if (closeBtn)   closeBtn.addEventListener('click',   () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    if (unlockBtn)  unlockBtn.addEventListener('click', () => { unlockPremium(sport); location.reload(); });
    if (revokeBtn) {
        revokeBtn.style.display = premium ? '' : 'none';
        revokeBtn.addEventListener('click', () => { revokePremium(sport); clearTeamLocks(sport); location.reload(); });
    }
}

// ── CADEADO + MOVER ───────────────────────────────────────────────────
const LOCKS_PREFIX = 'sorteia-locks-';
const MAX_LOCKS = 2;

let _ti = { teams: [], sport: '', formation: '', mode: '', locks: {} };
let _moving = null; // { player, teamIdx }

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
function clearTeamLocks(sport) {
    localStorage.removeItem(_locksKey(sport));
}

// Chamado de drawTeams() ANTES de renderTeams() — força jogadores travados nos times certos
function applyLockedPlayers(teams, pool, sport) {
    if (!isPremium(sport)) return;
    const locks = _loadLocks(sport);
    const allIds = new Set(teams.flatMap(t => t.players.map(p => p.id)));
    const lockedIds = new Set();
    Object.values(locks).forEach(s => s.forEach(id => lockedIds.add(id)));

    for (const [rawIdx, ids] of Object.entries(locks)) {
        const teamIdx = Number(rawIdx);
        const targetTeam = teams[teamIdx];
        if (!targetTeam) continue;

        for (const id of ids) {
            if (!allIds.has(id)) continue; // jogador não está no sorteio atual
            const currentIdx = teams.findIndex(t => t.players.some(p => p.id === id));
            if (currentIdx === teamIdx || currentIdx === -1) continue;

            // Precisa mover de currentIdx → teamIdx
            const player = teams[currentIdx].players.find(p => p.id === id);
            // Acha um não-travado no time destino para trocar
            const swap = targetTeam.players.find(p => !lockedIds.has(p.id));
            if (!swap) continue;

            teams[currentIdx].players = teams[currentIdx].players.filter(p => p.id !== id);
            targetTeam.players        = targetTeam.players.filter(p => p.id !== swap.id);
            teams[currentIdx].players.push(swap);
            targetTeam.players.push(player);
        }
    }
}

// Chamado de drawTeams() DEPOIS de renderTeams()
function setupTeamInteractivity(teams, sport, formation, mode) {
    if (!isPremium(sport)) return;
    _ti = { teams: JSON.parse(JSON.stringify(teams)), sport, formation, mode };
    _ti.locks = _loadLocks(sport);
    _moving = null;

    // Limpa locks de jogadores fora do sorteio atual
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
        const team = _ti.teams[tIdx];
        if (!team) return;
        teamEl.querySelectorAll('.team-player').forEach((el, pIdx) => {
            const player = team.players[pIdx];
            if (!player) return;
            _decorateRow(el, player, tIdx);
        });
    });
}

function _decorateRow(el, player, tIdx) {
    el.style.gridTemplateColumns = '28px 1fr auto auto';
    const isLocked = (_ti.locks[tIdx] || new Set()).has(player.id);

    if (isLocked) {
        el.style.borderColor = '#f59e0b';
        el.style.background  = 'var(--warning-soft)';
    }

    // Botão mover ⇄
    const moveBtn = _btn('⇄', 'Mover para outro time', '15px');
    moveBtn.addEventListener('click', e => { e.stopPropagation(); _startMove(player, tIdx, el); });

    // Botão cadeado
    const lockBtn = _btn(isLocked ? '🔒' : '🔓', isLocked ? 'Destravar' : 'Travar neste time', '14px');
    lockBtn.style.opacity = isLocked ? '1' : '0.35';
    lockBtn.addEventListener('click', e => { e.stopPropagation(); _toggleLock(player, tIdx, el, lockBtn); });

    el.appendChild(moveBtn);
    el.appendChild(lockBtn);

    // Toque no row enquanto está movendo → completa a troca
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { if (_moving && _moving.player.id !== player.id) _completeMoveOrSwap(player, tIdx); });
}

function _btn(icon, title, size) {
    const b = document.createElement('button');
    b.style.cssText = `all:unset;cursor:pointer;font-size:${size};padding:3px 5px;border-radius:6px;color:var(--muted);transition:opacity 100ms;`;
    b.innerHTML = icon;
    b.title = title;
    return b;
}

function _toggleLock(player, tIdx, rowEl, btn) {
    if (!_ti.locks[tIdx]) _ti.locks[tIdx] = new Set();
    const set = _ti.locks[tIdx];

    if (set.has(player.id)) {
        set.delete(player.id);
        rowEl.style.borderColor = '';
        rowEl.style.background  = '';
        btn.innerHTML    = '🔓';
        btn.style.opacity = '0.35';
        btn.title        = 'Travar neste time';
    } else {
        if (set.size >= MAX_LOCKS) { _showToast(`Máx. ${MAX_LOCKS} travados por time`); return; }
        set.add(player.id);
        rowEl.style.borderColor = '#f59e0b';
        rowEl.style.background  = 'var(--warning-soft)';
        btn.innerHTML    = '🔒';
        btn.style.opacity = '1';
        btn.title        = 'Destravar';
    }
    _saveLocks();
}

function _startMove(player, tIdx, rowEl) {
    if (_moving && _moving.player.id === player.id) {
        _moving = null;
        _clearMoveHighlights();
        return;
    }
    _moving = { player, tIdx };
    _applyMoveHighlights();
    _showToast(`Movendo ${player.name} → toque em outro jogador para trocar`);
}

function _completeMoveOrSwap(targetPlayer, targetTeamIdx) {
    if (!_moving || _moving.tIdx === targetTeamIdx) return;

    const fromTeam = _ti.teams[_moving.tIdx];
    const toTeam   = _ti.teams[targetTeamIdx];
    const mover    = _moving.player;

    // Troca os dois
    fromTeam.players = fromTeam.players.filter(p => p.id !== mover.id);
    toTeam.players   = toTeam.players.filter(p => p.id !== targetPlayer.id);
    fromTeam.players.push(targetPlayer);
    toTeam.players.push(mover);

    const suggestion = _findBestSwap(_ti.teams);
    _moving = null;

    // Re-renderiza (renderTeams é global no arquivo do esporte)
    if (typeof renderTeams === 'function') {
        renderTeams(_ti.teams, 100, _ti.formation, _ti.mode);
        setupTeamInteractivity(_ti.teams, _ti.sport, _ti.formation, _ti.mode);
    }

    if (suggestion) {
        _showSuggestion(suggestion);
    }
}

function _findBestSwap(teams) {
    if (teams.length !== 2) return null;
    const skills = teams.map(t => t.players.reduce((s, p) => s + p.skill, 0));
    const diff   = Math.abs(skills[0] - skills[1]);
    if (diff <= 1) return null;

    const strongIdx = skills[0] > skills[1] ? 0 : 1;
    const weakIdx   = 1 - strongIdx;
    let best = null, bestImprove = 0;

    for (const p1 of teams[strongIdx].players) {
        for (const p2 of teams[weakIdx].players) {
            const newDiff = Math.abs((skills[strongIdx] - p1.skill + p2.skill) - (skills[weakIdx] + p1.skill - p2.skill));
            const improve = diff - newDiff;
            if (improve > bestImprove) { bestImprove = improve; best = { from: p1, fromTeam: teams[strongIdx].name, to: p2, toTeam: teams[weakIdx].name }; }
        }
    }
    return best;
}

function _applyMoveHighlights() {
    if (!_moving) return;
    document.querySelectorAll('.teams-grid .team').forEach((teamEl, tIdx) => {
        const team = _ti.teams[tIdx];
        if (!team) return;
        teamEl.querySelectorAll('.team-player').forEach((el, pIdx) => {
            const p = team.players[pIdx];
            if (!p) return;
            if (p.id === _moving.player.id) {
                el.style.outline = '2px solid var(--accent)';
                el.style.outlineOffset = '1px';
            } else if (tIdx !== _moving.tIdx) {
                el.style.background = 'var(--accent-soft)';
            }
        });
    });
}

function _clearMoveHighlights() {
    document.querySelectorAll('.team-player').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        // Restaura background apenas nos não-travados
        const tIdx = [...document.querySelectorAll('.teams-grid .team')].findIndex(t => t.contains(el));
        const pIdx = [...el.parentElement.querySelectorAll('.team-player')].indexOf(el);
        const player = _ti.teams[tIdx]?.players[pIdx];
        const locked = player && (_ti.locks[tIdx] || new Set()).has(player.id);
        el.style.background = locked ? 'var(--warning-soft)' : '';
    });
}

function _ensureToastEl() {
    if (!document.getElementById('_premiumToast')) {
        const d = document.createElement('div');
        d.id = '_premiumToast';
        d.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) scale(0.9);background:#0f172a;color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;z-index:300;max-width:88vw;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.35);opacity:0;transition:opacity 200ms,transform 200ms;pointer-events:none;';
        document.body.appendChild(d);
    }
}

function _showToast(msg, duration = 3000) {
    const el = document.getElementById('_premiumToast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1)';
    clearTimeout(el._t);
    el._t = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) scale(0.9)';
    }, duration);
}

function _showSuggestion(s) {
    _showToast(`💡 Sugestão: trocar ${s.from.name} por ${s.to.name}`, 6000);
}
