// premium.js — Lógica free/premium do Sorteia Aí!
// Em produção, unlockPremium() será substituído pelo fluxo real do Google Play Billing.

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

function initPremiumUI(sport, sportName) {
    const premium = isPremium(sport);

    // Botão da barra de ações
    const configBtn   = document.getElementById('configBtn');
    const redrawBtn   = document.getElementById('redrawBtn');
    const paywallBtn  = document.getElementById('paywallBtn');

    if (!premium) {
        configBtn.innerHTML = 'Sortear';
        if (redrawBtn)  redrawBtn.style.display  = 'none';
        if (paywallBtn) paywallBtn.style.display = '';
    } else {
        configBtn.innerHTML = '⚙ Sortear';
        if (paywallBtn) paywallBtn.style.display = 'none';
    }

    // Banner de anúncio
    const banner = document.getElementById('adBanner');
    if (banner) {
        banner.style.display = premium ? 'none' : 'flex';
        document.querySelector('.app').style.paddingBottom = premium ? '24px' : '74px';
    }

    // Paywall modal
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

    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            unlockPremium(sport);
            modal.classList.remove('show');
            location.reload();
        });
    }

    if (revokeBtn) {
        revokeBtn.style.display = premium ? '' : 'none';
        revokeBtn.addEventListener('click', () => {
            revokePremium(sport);
            modal.classList.remove('show');
            location.reload();
        });
    }
}
