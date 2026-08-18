window.Dashboard = (function() {
    const DEFAULT_PARAMS = {
        chopp: 2.8,
        barril: 50,
        refri: 1.5,
        agua: 1.0,
        carneAdulto: 0.40,
        carneCrianca: 0.20,
        mesa: 8
    };

    let currentParams = { ...DEFAULT_PARAMS };
    let lastState = null;

    function loadParams() {
        try {
            const saved = localStorage.getItem('sc2026_dash_params');
            if (saved) {
                currentParams = { ...DEFAULT_PARAMS, ...JSON.parse(saved) };
            }
        } catch (e) {
            currentParams = { ...DEFAULT_PARAMS };
        }
        syncParamInputs();
    }

    function saveParams() {
        try {
            localStorage.setItem('sc2026_dash_params', JSON.stringify(currentParams));
        } catch (e) {}
    }

    function syncParamInputs() {
        const elChopp = document.getElementById('param-chopp');
        if (elChopp) elChopp.value = currentParams.chopp;
        const elBarril = document.getElementById('param-barril');
        if (elBarril) elBarril.value = currentParams.barril;
        const elRefri = document.getElementById('param-refri');
        if (elRefri) elRefri.value = currentParams.refri;
        const elCarneAd = document.getElementById('param-carne-adulto');
        if (elCarneAd) elCarneAd.value = currentParams.carneAdulto;
        const elCarneCr = document.getElementById('param-carne-crianca');
        if (elCarneCr) elCarneCr.value = currentParams.carneCrianca;
        const elMesa = document.getElementById('param-mesa');
        if (elMesa) elMesa.value = currentParams.mesa;
    }

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

    // Gerador de PIX e Cobrança para WhatsApp
    function setupPixGenerator() {
        const selectFinalidade = document.getElementById('pix-gen-finalidade');
        const inputValor = document.getElementById('pix-gen-valor');
        const inputDesc = document.getElementById('pix-gen-descricao');
        const inputCopiaCola = document.getElementById('pix-gen-copiacola');
        const btnCopiarPix = document.getElementById('btn-pix-gen-copiar');
        const btnZapCopiar = document.getElementById('btn-pix-gen-zap-copiar');
        const btnZapAbrir = document.getElementById('btn-pix-gen-zap-abrir');
        const previewValor = document.getElementById('pix-gen-preview-valor');
        const previewMotivo = document.getElementById('pix-gen-preview-motivo');

        const presets = {
            'churrasco-completo': { motivo: 'Churrasco Completo (Com Chopp)', valor: 110 },
            'churrasco-semchopp': { motivo: 'Churrasco Sem Chopp', valor: 80 },
            'camisa-tradicional': { motivo: 'Camisa Tradicional / Baby Look', valor: 50 },
            'camisa-extra':       { motivo: 'Camisa XGG / G1 / G2 / G3', valor: 60 },
            'camisa-infantil':    { motivo: 'Camisa Infantil', valor: 40 },
            'patrocinio':         { motivo: 'Patrocínio / Apoio ao Evento', valor: 100 },
            'personalizado':      { motivo: 'Pagamento Solteiros & Casados 2026', valor: 50 }
        };

        function getMotivoTexto() {
            const opt = selectFinalidade ? selectFinalidade.value : 'churrasco-completo';
            return presets[opt]?.motivo || (selectFinalidade ? selectFinalidade.options[selectFinalidade.selectedIndex].text : 'Pagamento');
        }

        function updatePix() {
            if (!window.PIX) return;
            const valor = parseFloat(inputValor ? inputValor.value : 0) || 0;
            const config = (window.App && window.App.state && window.App.state.config) || {};
            const chave = config.pix_chave || '46413688807';
            const nome = config.pix_nome || 'LUAN AUGUSTO BARBOZA SIMAO';
            const cidade = config.pix_cidade || 'GUARARAPES';

            const payload = PIX.gerarPayload(valor, chave, nome, cidade);
            if (inputCopiaCola) inputCopiaCola.value = payload;

            PIX.gerarQRCode('pix-gen-qrcode', payload);

            const formatBRL = (v) => v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            if (previewValor) previewValor.textContent = formatBRL(valor);
            if (previewMotivo) previewMotivo.textContent = getMotivoTexto();
        }

        function getMensagemFormatada() {
            const valor = parseFloat(inputValor ? inputValor.value : 0) || 0;
            const formatBRL = (v) => v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            const motivo = getMotivoTexto();
            const desc = (inputDesc && inputDesc.value.trim()) ? `\n📝 *Obs:* ${inputDesc.value.trim()}` : '';
            const config = (window.App && window.App.state && window.App.state.config) || {};
            const chave = config.pix_chave || '46413688807';
            const nome = config.pix_nome || 'LUAN AUGUSTO BARBOZA SIMAO';
            const payload = inputCopiaCola ? inputCopiaCola.value : '';

            return `⚽ *SOLTEIROS & CASADOS 2026* ⚽\n` +
                   `📢 *COBRANÇA:* ${motivo}\n` +
                   `💰 *Valor:* ${formatBRL(valor)}${desc}\n\n` +
                   `💳 *Chave PIX (CPF):* ${chave}\n` +
                   `👤 *Nome:* ${nome}\n` +
                   `🏛️ *Banco:* Banco do Brasil\n\n` +
                   `📲 *Código PIX Copia e Cola:*\n\`\`\`${payload}\`\`\`\n\n` +
                   `⚠️ _Após efetuar o pagamento, envie o comprovante no grupo ou para a organização!_`;
        }

        if (selectFinalidade) {
            selectFinalidade.addEventListener('change', () => {
                const val = selectFinalidade.value;
                if (presets[val] && inputValor && val !== 'personalizado') {
                    inputValor.value = presets[val].valor.toFixed(2);
                }
                updatePix();
            });
        }

        if (inputValor) {
            inputValor.addEventListener('input', updatePix);
        }

        if (btnCopiarPix) {
            btnCopiarPix.addEventListener('click', async () => {
                const payload = inputCopiaCola ? inputCopiaCola.value : '';
                if (payload && window.PIX) {
                    await PIX.copiar(payload);
                    if (window.App) App.showToast('Código PIX copiado com sucesso!');
                }
            });
        }

        if (btnZapCopiar) {
            btnZapCopiar.addEventListener('click', async () => {
                const msg = getMensagemFormatada();
                if (window.PIX) {
                    await PIX.copiar(msg);
                    if (window.App) App.showToast('Mensagem para o grupo copiada!');
                }
            });
        }

        if (btnZapAbrir) {
            btnZapAbrir.addEventListener('click', () => {
                const msg = getMensagemFormatada();
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
            });
        }

        // Initialize first render
        updatePix();
    }

    function init() {
        loadParams();
        updateCountdown();
        setInterval(updateCountdown, 1000);

        // Parameters inputs listeners
        const bindParam = (id, key, parser = parseFloat) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    const val = parser(el.value);
                    if (!isNaN(val) && val > 0) {
                        currentParams[key] = val;
                        saveParams();
                        if (lastState) render(lastState);
                    }
                });
            }
        };

        bindParam('param-chopp', 'chopp');
        bindParam('param-barril', 'barril', parseInt);
        bindParam('param-refri', 'refri');
        bindParam('param-carne-adulto', 'carneAdulto');
        bindParam('param-carne-crianca', 'carneCrianca');
        bindParam('param-mesa', 'mesa', parseInt);

        const btnReset = document.getElementById('btn-reset-params');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                currentParams = { ...DEFAULT_PARAMS };
                saveParams();
                syncParamInputs();
                if (lastState) render(lastState);
                if (window.App) App.showToast('Parâmetros restaurados para o padrão!');
            });
        }

        setupPixGenerator();
    }

    function render(state) {
        if (!state || !state.participantes) return;
        lastState = state;

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

        // 2. Dashboard Operacional (Aba Dashboard com Parâmetros Customizáveis)
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

        // Cálculos Chopp com base no parâmetro
        const choppLitros = Math.round(choppBebedores * (currentParams.chopp || 2.8));
        const choppLitrosMin = choppBebedores * Math.max(1.0, (currentParams.chopp || 2.8) - 0.3);
        const choppLitrosMax = choppBebedores * ((currentParams.chopp || 2.8) + 0.3);
        const barrilTam = currentParams.barril || 50;
        const barrisQtd = choppLitros > 0 ? Math.ceil(choppLitros / barrilTam) : 0;
        const barrisSugestao = choppLitros > 0 
            ? `${barrisQtd} barris (${barrisQtd * barrilTam}L)` 
            : '0 barris';

        setVal('dash-chopp-bebedores-badge', `${choppBebedores} bebedores`);
        setVal('dash-chopp-litros', `${choppLitros} L`);
        setVal('dash-chopp-faixa', `${choppLitrosMin.toFixed(0)}L a ${choppLitrosMax.toFixed(0)}L (Média: ${currentParams.chopp}L/pessoa)`);
        setVal('dash-chopp-barris', barrisSugestao);

        // Cálculos Bebidas Não-Alcoólicas
        const refriLitros = semChoppPessoas * (currentParams.refri || 1.5);
        const refriPets = Math.ceil(refriLitros / 2);
        const aguaLitros = semChoppPessoas * (currentParams.agua || 1.0);
        const aguaGarrafas = Math.ceil(aguaLitros / 0.5);

        setVal('dash-semchopp-badge', `${semChoppPessoas} pessoas`);
        setVal('dash-refri-litros', `${refriLitros.toFixed(1)} L`);
        setVal('dash-refri-pets', `${refriPets} garrafas PET (2L)`);
        setVal('dash-agua-litros', `${aguaLitros.toFixed(1)} L`);
        setVal('dash-agua-garrafas', `${aguaGarrafas} garrafas (500ml)`);

        // Cálculos Carnes & Alimentação
        const totalPresentesChurrasco = adultosChurrasco + criancasChurrasco;
        const carnesAdultoKg = adultosChurrasco * (currentParams.carneAdulto || 0.40);
        const carnesCriancaKg = criancasChurrasco * (currentParams.carneCrianca || 0.20);
        const carnesKg = carnesAdultoKg + carnesCriancaKg;

        setVal('dash-comensais-badge', `${totalPresentesChurrasco} no churrasco`);
        setVal('dash-carnes-kg', `${carnesKg.toFixed(1)} Kg`);
        setVal('dash-carnes-detalhe', `${adultosChurrasco} adultos (${carnesAdultoKg.toFixed(1)}kg) • ${criancasChurrasco} crianças (${carnesCriancaKg.toFixed(1)}kg)`);

        // Cálculos Mesas e Cadeiras
        const lugaresPorMesa = currentParams.mesa || 8;
        const mesasNecessarias = Math.ceil(totalPresentesChurrasco / lugaresPorMesa);
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
