window.Dashboard = (function() {
    function updateCountdown() {
        const target = new Date('2026-12-20T09:00:00-03:00');
        const now = new Date();
        const diff = target - now;

        const countdownEl = document.getElementById('countdown');
        if (diff <= 0) {
            if (countdownEl) countdownEl.innerHTML = '<span class="text-xl font-bold text-emerald-400">Evento realizado! 🎉</span>';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        if (countdownEl) {
            countdownEl.innerHTML = `
                <div class="flex justify-center items-center gap-4">
                    <div class="text-center">
                        <span class="text-xl font-bold text-emerald-400">${days}</span>
                        <span class="text-xs text-slate-500 block">dias</span>
                    </div>
                    <div class="w-px h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-xl font-bold text-emerald-400">${hours.toString().padStart(2, '0')}</span>
                        <span class="text-xs text-slate-500 block">horas</span>
                    </div>
                    <div class="w-px h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-xl font-bold text-emerald-400">${mins.toString().padStart(2, '0')}</span>
                        <span class="text-xs text-slate-500 block">min</span>
                    </div>
                    <div class="w-px h-8 bg-slate-700"></div>
                    <div class="text-center">
                        <span class="text-xl font-bold text-emerald-400">${secs.toString().padStart(2, '0')}</span>
                        <span class="text-xs text-slate-500 block">seg</span>
                    </div>
                </div>
            `;
        }
    }

    function init() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    function render(state) {
        const inscritos = state.participantes.length;
        
        let arrecadado = 0;
        let pendente = 0;
        state.parcelas.forEach(p => {
            const val = parseFloat(p.valor || 0) - parseFloat(p.valor_desconto || 0);
            if (p.pago) arrecadado += val;
            else pendente += val;
        });

        let despesasPagas = 0;
        let meta = 0;
        state.despesas.forEach(d => {
            const val = parseFloat(d.valor || 0);
            meta += val;
            if (d.pago) despesasPagas += val;
        });

        const saldoCaixa = arrecadado - despesasPagas;
        const camisas = state.participantes.length; 

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('metric-inscritos', inscritos);
        setVal('metric-arrecadado', formatBRL(arrecadado));
        setVal('metric-pendente', formatBRL(pendente));
        setVal('metric-saldo', formatBRL(saldoCaixa));
        setVal('metric-camisas', camisas);

        let totalEsperado = 0;
        state.participantes.forEach(p => totalEsperado += parseFloat(p.valor_total || 0));

        let percent = meta > 0 ? Math.min(100, (arrecadado / meta) * 100) : 0;
        
        const bar = document.getElementById('thermometer-bar');
        if (bar) bar.style.width = `${percent}%`;

        setVal('thermometer-percent', `${percent.toFixed(1)}%`);
        setVal('thermometer-values', `${formatBRL(arrecadado)} de ${formatBRL(meta)}`);

        const discountEl = document.getElementById('thermometer-discount');
        if (totalEsperado > meta && meta > 0) {
            const numberOfPayers = state.participantes.filter(p => p.categoria !== 'Acompanhante').length;
            const discount = numberOfPayers > 0 ? (totalEsperado - meta) / numberOfPayers : 0;
            if (discountEl) {
                discountEl.textContent = `Desconto estimado: ${formatBRL(discount)} por pessoa na 4ª parcela`;
                discountEl.classList.remove('hidden');
            }
            if (bar) bar.classList.add('shadow-[0_0_10px_rgba(52,211,153,0.8)]');
        } else {
            if (discountEl) discountEl.classList.add('hidden');
            if (bar) bar.classList.remove('shadow-[0_0_10px_rgba(52,211,153,0.8)]');
        }
    }

    return { init, render };
})();
