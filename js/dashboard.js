window.Dashboard = (function() {
    function updateCountdown() {
        const target = new Date('2026-12-20T09:00:00-03:00');
        const now = new Date();
        const diff = target - now;

        const countdownEls = [document.getElementById('countdown'), document.getElementById('countdown-desktop')];
        const content = diff <= 0 
            ? '<span class="text-xl font-bold text-emerald-400">Evento realizado! 🎉</span>'
            : (() => {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const mins = Math.floor((diff / 1000 / 60) % 60);
                const secs = Math.floor((diff / 1000) % 60);
                return `
                <div class="flex justify-center items-center gap-2 sm:gap-4">
                    <div class="text-center">
                        <span class="text-base sm:text-xl font-bold text-emerald-400">${days}</span>
                        <span class="text-[9px] sm:text-xs text-slate-500 block">dias</span>
                    </div>
                    <div class="w-px h-6 sm:h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-base sm:text-xl font-bold text-emerald-400">${hours.toString().padStart(2, '0')}</span>
                        <span class="text-[9px] sm:text-xs text-slate-500 block">horas</span>
                    </div>
                    <div class="w-px h-6 sm:h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-base sm:text-xl font-bold text-emerald-400">${mins.toString().padStart(2, '0')}</span>
                        <span class="text-[9px] sm:text-xs text-slate-500 block">min</span>
                    </div>
                    <div class="w-px h-6 sm:h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-base sm:text-xl font-bold text-emerald-400">${secs.toString().padStart(2, '0')}</span>
                        <span class="text-[9px] sm:text-xs text-slate-500 block">seg</span>
                    </div>
                </div>
            `})();

        countdownEls.forEach(el => {
            if (el) el.innerHTML = content;
        });
    }

    function init() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    function render(state) {
        const inscritos = state.participantes.length;
        
        let arrecadado = 0;
        let pendente = 0;
        state.participantes.forEach(p => {
            const pago = parseFloat(p.valor_pago || 0);
            const total = parseFloat(p.valor_total || 0);
            arrecadado += pago;
            pendente += Math.max(0, total - pago);
        });

        let despesasPagas = 0;
        let meta = 0;
        state.despesas.forEach(d => {
            const val = parseFloat(d.valor || 0);
            meta += val;
            if (d.pago) despesasPagas += val;
        });

        const saldoCaixa = arrecadado - despesasPagas;

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('metric-inscritos', inscritos);
        setVal('metric-arrecadado', formatBRL(arrecadado));
        setVal('metric-pendente', formatBRL(pendente));
        setVal('metric-saldo', formatBRL(saldoCaixa));

        let percent = meta > 0 ? Math.min(100, (arrecadado / meta) * 100) : 0;
        
        const bar = document.getElementById('thermometer-bar');
        if (bar) {
            bar.style.width = `${percent}%`;
            bar.classList.remove('shadow-[0_0_10px_rgba(52,211,153,0.8)]');
        }

        setVal('thermometer-percent', `${percent.toFixed(1)}%`);
        setVal('thermometer-values', `${formatBRL(arrecadado)} de ${formatBRL(meta)}`);

        const discountEl = document.getElementById('thermometer-discount');
        if (discountEl) discountEl.classList.add('hidden');
    }

    return { init, render };
})();
