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
        if (!state || !state.participantes) return;

        const formatBRL = (val) => (val || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const participantes = state.participantes;
        const despesas = state.despesas || [];

        // 1. Financeiro do Churrasco (Aba Financeiro)
        let churrascoArrecadado = 0;
        let churrascoPendente = 0;
        let camisasArrecadado = 0;
        let camisasPendente = 0;

        participantes.forEach(p => {
            const pagoChurrasco = parseFloat(p.valor_pago || 0);
            const totalChurrasco = parseFloat(p.valor_total || 0);
            churrascoArrecadado += pagoChurrasco;
            churrascoPendente += Math.max(0, totalChurrasco - pagoChurrasco);

            const valorCamisa = parseFloat(p.valor_camisa || 0) || (window.Camisas ? Camisas.calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa) : 0);
            const pagoCamisa = parseFloat(p.camisa_pago || 0);
            camisasArrecadado += pagoCamisa;
            camisasPendente += Math.max(0, valorCamisa - pagoCamisa);
        });

        let despesasPagas = 0;
        let despesasTotal = 0;
        despesas.forEach(d => {
            const val = parseFloat(d.valor || 0);
            despesasTotal += val;
            if (d.pago) despesasPagas += val;
        });

        const saldoCaixa = churrascoArrecadado - despesasPagas;

        setVal('metric-inscritos', participantes.length);
        setVal('metric-arrecadado', formatBRL(churrascoArrecadado));
        setVal('metric-pendente', formatBRL(churrascoPendente));
        setVal('metric-saldo', formatBRL(saldoCaixa));

        let percent = despesasTotal > 0 ? Math.min(100, (churrascoArrecadado / despesasTotal) * 100) : 0;
        const bar = document.getElementById('thermometer-bar');
        if (bar) bar.style.width = `${percent}%`;

        setVal('thermometer-percent', `${percent.toFixed(1)}%`);
        setVal('thermometer-values', `${formatBRL(churrascoArrecadado)} de ${formatBRL(despesasTotal)}`);

        // 2. Dashboard Operacional (Aba Dashboard)
        let choppBebedores = 0;
        let semChoppPessoas = 0;
        let adultosChurrasco = 0;
        let criancasChurrasco = 0;

        let solteirosLinha = 0;
        let solteirosGol = 0;
        let casadosLinha = 0;
        let casadosGol = 0;
        let resenhaTotal = 0;
        let criancasTotal = 0;
        let somenteCamisaTotal = 0;

        participantes.forEach(p => {
            const isSomenteCamisa = p.categoria === 'Somente Camisa' || p.tipo_consumo === 'Somente Camisa';
            const isCrianca = p.categoria === 'Criança' || p.tipo_consumo === 'Crianca Meia' || p.tipo_consumo === 'Criança';
            const isSemChopp = p.tipo_consumo === 'Sem Chopp';
            const isCompleto = p.tipo_consumo === 'Completo';

            if (isSomenteCamisa) {
                somenteCamisaTotal++;
            } else {
                // Vai ao churrasco
                if (isCompleto) choppBebedores++;
                if (isSemChopp || isCrianca) semChoppPessoas++;

                if (isCrianca) {
                    criancasChurrasco++;
                } else {
                    adultosChurrasco++;
                }
            }

            if (isCrianca) criancasTotal++;

            // Elencos
            if (p.categoria === 'Jogador Solteiro') {
                if (p.posicao_campo === 'Goleiro') solteirosGol++;
                else solteirosLinha++;
            } else if (p.categoria === 'Jogador Casado') {
                if (p.posicao_campo === 'Goleiro') casadosGol++;
                else casadosLinha++;
            } else if (p.categoria === 'Resenha') {
                resenhaTotal++;
            }
        });

        // Cálculos Chopp
        const choppLitrosMin = choppBebedores * 2.5;
        const choppLitrosMax = choppBebedores * 3.0;
        const choppLitrosMedia = Math.round((choppLitrosMin + choppLitrosMax) / 2);
        const barrisSugestao = choppLitrosMedia > 0 
            ? `${Math.ceil(choppLitrosMedia / 50)} barris (${Math.ceil(choppLitrosMedia / 50) * 50}L)` 
            : '0 barris';

        setVal('dash-chopp-bebedores-badge', `${choppBebedores} bebedores`);
        setVal('dash-chopp-litros', `${choppLitrosMedia} L`);
        setVal('dash-chopp-faixa', `${choppLitrosMin.toFixed(0)}L a ${choppLitrosMax.toFixed(0)}L recomendados`);
        setVal('dash-chopp-barris', barrisSugestao);

        // Cálculos Bebidas Não-Alcoólicas
        const refriLitros = semChoppPessoas * 1.5;
        const refriPets = Math.ceil(refriLitros / 2);
        const aguaLitros = semChoppPessoas * 1.0;
        const aguaGarrafas = Math.ceil(aguaLitros / 0.5);

        setVal('dash-semchopp-badge', `${semChoppPessoas} pessoas`);
        setVal('dash-refri-litros', `${refriLitros.toFixed(1)} L`);
        setVal('dash-refri-pets', `${refriPets} garrafas PET (2L)`);
        setVal('dash-agua-litros', `${aguaLitros.toFixed(1)} L`);
        setVal('dash-agua-garrafas', `${aguaGarrafas} garrafas (500ml)`);

        // Cálculos Carnes & Alimentação
        const totalPresentesChurrasco = adultosChurrasco + criancasChurrasco;
        const carnesKg = (adultosChurrasco * 0.4) + (criancasChurrasco * 0.2);

        setVal('dash-comensais-badge', `${totalPresentesChurrasco} no churrasco`);
        setVal('dash-carnes-kg', `${carnesKg.toFixed(1)} Kg`);
        setVal('dash-carnes-detalhe', `${adultosChurrasco} adultos (${(adultosChurrasco * 0.4).toFixed(1)}kg) • ${criancasChurrasco} crianças (${(criancasChurrasco * 0.2).toFixed(1)}kg)`);

        // Cálculos Mesas e Cadeiras
        const mesasNecessarias = Math.ceil(totalPresentesChurrasco / 8);
        const cadeirasNecessarias = totalPresentesChurrasco;

        setVal('dash-presenca-churrasco', `${totalPresentesChurrasco} presentes`);
        setVal('dash-mesas-qtd', mesasNecessarias);
        setVal('dash-cadeiras-qtd', cadeirasNecessarias);

        // Raio-X dos Elencos
        setVal('dash-solteiros-total', solteirosLinha + solteirosGol);
        setVal('dash-solteiros-detalhe', `${solteirosLinha} linha • ${solteirosGol} gol`);
        setVal('dash-casados-total', casadosLinha + casadosGol);
        setVal('dash-casados-detalhe', `${casadosLinha} linha • ${casadosGol} gol`);
        setVal('dash-resenha-total', resenhaTotal);
        setVal('dash-criancas-total', criancasTotal);
        setVal('dash-somente-camisa-total', somenteCamisaTotal);

        // Consolidado Financeiro Geral
        setVal('dash-fin-churrasco', formatBRL(churrascoArrecadado));
        setVal('dash-fin-churrasco-pend', `Pendente: ${formatBRL(churrascoPendente)}`);
        setVal('dash-fin-camisas', formatBRL(camisasArrecadado));
        setVal('dash-fin-camisas-pend', `Pendente: ${formatBRL(camisasPendente)}`);
        setVal('dash-fin-despesas', formatBRL(despesasPagas));
        setVal('dash-fin-despesas-total', `Total orçado: ${formatBRL(despesasTotal)}`);

        const saldoGeral = (churrascoArrecadado + camisasArrecadado) - despesasPagas;
        const saldoGeralEl = document.getElementById('dash-fin-saldo');
        if (saldoGeralEl) {
            saldoGeralEl.textContent = formatBRL(saldoGeral);
            if (saldoGeral >= 0) {
                saldoGeralEl.className = 'text-lg font-bold text-emerald-400';
            } else {
                saldoGeralEl.className = 'text-lg font-bold text-rose-400';
            }
        }
    }

    return { init, render, updateCountdown };
})();
