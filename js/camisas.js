window.Camisas = (function() {
    // Tabela de preços de camisa
    const PRECOS = {
        'Jogador':     { base: 50, extra: 60 },
        'Tradicional': { base: 50, extra: 60 },
        'Polo':        { base: 65, extra: 75 },
        'Baby Look':   { base: 50, extra: 60 },
        'Infantil':    { base: 40, extra: 40 }
    };

    function getModeloBase(modelo) {
        if (!modelo) return 'Tradicional';
        const m = modelo.toLowerCase().trim();
        if (m.includes('polo')) return 'Polo';
        if (m.includes('baby')) return 'Baby Look';
        if (m.includes('infantil')) return 'Infantil';
        // 'Jogador' e 'Tradicional' são o mesmo modelo
        return 'Tradicional';
    }

    function getTimeCamisa(p) {
        if (p.modelo_camisa) {
            const m = p.modelo_camisa.toLowerCase();
            if (m.includes('casado')) return 'Casados';
            if (m.includes('solteiro')) return 'Solteiros';
        }
        if (p.categoria === 'Jogador Casado') return 'Casados';
        if (p.categoria === 'Jogador Solteiro') return 'Solteiros';
        return 'Solteiros';
    }

    function isTamanhoExtra(tamanho) {
        if (!tamanho) return false;
        const t = tamanho.toUpperCase().trim();
        return ['XG', 'XGG', 'XXG', 'XXXG', '3XG', '4XG', 'EG', 'EGG', 'G1', 'G2', 'G3', 'G4', 'EXG'].includes(t) || t.includes('XG') || t.includes('EGG');
    }

    function calcularPrecoCamisa(modelo, tamanho) {
        if (!modelo && !tamanho) return 0;
        const modBase = getModeloBase(modelo);
        const precos = PRECOS[modBase] || PRECOS['Tradicional'];
        const isExtra = isTamanhoExtra(tamanho);
        return isExtra ? precos.extra : precos.base;
    }

    function init() {
        const btnCsv = document.getElementById('btn-export-csv');
        if (btnCsv) {
            btnCsv.addEventListener('click', exportCSV);
        }
        const btnZap = document.getElementById('btn-export-whatsapp');
        if (btnZap) {
            btnZap.addEventListener('click', exportWhatsapp);
        }

        // Click handler for camisa payment
        const tbody = document.getElementById('camisas-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('.camisa-pago-btn');
                if (btn && window.App && window.App.state && window.App.state.isAdmin) {
                    window.App.openPagamento(parseInt(btn.dataset.id), 'camisa');
                }
            });
        }
    }

    function render(state) {
        const totalsContainer = document.getElementById('camisas-totals');
        const tbody = document.getElementById('camisas-tbody');
        if (!totalsContainer || !tbody) return;

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        // Separate models by team: Solteiros and Casados
        let totalizadorSolteiros = {};
        let totalizadorCasados = {};
        let totalCamisasSolteiros = 0;
        let totalCamisasCasados = 0;
        let totalCamisasCount = 0;
        let totalCamisasEsperado = 0;
        let totalCamisasArrecadado = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                totalCamisasCount++;
                const time = getTimeCamisa(p);
                const modBase = getModeloBase(p.modelo_camisa);
                const targetDict = time === 'Casados' ? totalizadorCasados : totalizadorSolteiros;
                
                if (time === 'Casados') totalCamisasCasados++;
                else totalCamisasSolteiros++;

                if (!targetDict[modBase]) targetDict[modBase] = {};
                if (targetDict[modBase][p.tam_camisa] === undefined) targetDict[modBase][p.tam_camisa] = 0;
                targetDict[modBase][p.tam_camisa]++;

                const preco = parseFloat(p.valor_camisa || 0) || calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa);
                const pago = parseFloat(p.camisa_pago || 0);
                totalCamisasEsperado += preco;
                totalCamisasArrecadado += pago;
            }
        });

        const totalCamisasPendente = Math.max(0, totalCamisasEsperado - totalCamisasArrecadado);

        // Update Camisas Dashboard Metrics
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('metric-camisas-total', totalCamisasCount);
        setVal('metric-camisas-esperado', formatBRL(totalCamisasEsperado));
        setVal('metric-camisas-arrecadado', formatBRL(totalCamisasArrecadado));
        setVal('metric-camisas-pendente', formatBRL(totalCamisasPendente));

        // Update Camisas Thermometer
        const percent = totalCamisasEsperado > 0 ? Math.min(100, (totalCamisasArrecadado / totalCamisasEsperado) * 100) : 0;
        const bar = document.getElementById('camisas-thermometer-bar');
        if (bar) bar.style.width = `${percent}%`;

        setVal('camisas-thermometer-percent', `${percent.toFixed(1)}%`);
        setVal('camisas-thermometer-values', `${formatBRL(totalCamisasArrecadado)} de ${formatBRL(totalCamisasEsperado)}`);

        const statusBadge = document.getElementById('camisas-thermometer-status');
        if (statusBadge) {
            if (percent >= 100 && totalCamisasEsperado > 0) {
                statusBadge.classList.remove('hidden');
            } else {
                statusBadge.classList.add('hidden');
            }
        }

        // Render Totalizador por Time e Modelo
        function renderBlocoTime(titulo, emoji, borderClass, dict, totalTime) {
            const keys = Object.keys(dict);
            if (keys.length === 0) {
                return `
                    <div class="bg-slate-900 border ${borderClass} rounded-xl p-4 flex-1">
                        <h4 class="font-bold text-white text-sm mb-2 flex items-center justify-between">
                            <span>${emoji} ${titulo}</span>
                            <span class="text-xs text-slate-500">0 un.</span>
                        </h4>
                        <p class="text-xs text-slate-500">Nenhuma camisa solicitada.</p>
                    </div>
                `;
            }

            return `
                <div class="bg-slate-900 border ${borderClass} rounded-xl p-4 flex-1">
                    <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <h4 class="font-bold text-white text-sm flex items-center gap-2">
                            <span>${emoji} ${titulo}</span>
                        </h4>
                        <span class="text-xs bg-slate-800 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">${totalTime} un.</span>
                    </div>
                    <div class="space-y-3">
                        ${keys.map(mod => {
                            let count = 0;
                            let sizesHtml = '';
                            for (let sz in dict[mod]) {
                                if (dict[mod][sz] > 0) {
                                    count += dict[mod][sz];
                                    sizesHtml += `
                                        <div class="bg-slate-800 rounded-lg px-2.5 py-1.5 text-center min-w-[3rem] border border-slate-700">
                                            <span class="text-[10px] text-slate-400 block font-medium uppercase">${sz}</span>
                                            <span class="text-base font-bold text-white">${dict[mod][sz]}</span>
                                        </div>
                                    `;
                                }
                            }
                            if (count === 0) return '';
                            return `
                                <div>
                                    <div class="flex justify-between text-xs text-slate-300 font-semibold mb-1.5">
                                        <span>${mod}</span>
                                        <span class="text-slate-400">${count} un.</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1.5">
                                        ${sizesHtml}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        totalsContainer.innerHTML = `
            <div class="w-full space-y-4 mb-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">📊 Totalizador para Confecção (${totalCamisasCount} camisas no total)</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${renderBlocoTime('Solteiros (Branco)', '⚪', 'border-slate-700', totalizadorSolteiros, totalCamisasSolteiros)}
                    ${renderBlocoTime('Casados (Preto)', '⚫', 'border-slate-800', totalizadorCasados, totalCamisasCasados)}
                </div>
            </div>
        `;

        // Render Camisas Table
        tbody.innerHTML = '';
        state.participantes.forEach(p => {
            let color = 'slate';
            let perfil_label = 'Acompanhante';
            if (p.categoria === 'Jogador Solteiro' || p.categoria === 'Jogador Casado') { color = 'sky'; perfil_label = 'Jogador'; }
            else if (p.categoria === 'Resenha') { color = 'amber'; perfil_label = 'Torcedor'; }
            else if (p.categoria === 'Criança') { color = 'emerald'; perfil_label = 'Criança'; }
            else if (p.categoria === 'Somente Camisa') { color = 'violet'; perfil_label = 'Somente Camisa'; }

            const time = getTimeCamisa(p);
            const time_emoji = time === 'Solteiros' ? '⚪' : '⚫';

            const hasCamisa = !!(p.modelo_camisa && p.tam_camisa);
            const valorCamisa = hasCamisa ? (parseFloat(p.valor_camisa || 0) || calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa)) : 0;
            const camisaPago = parseFloat(p.camisa_pago || 0);
            const adminClass = state.isAdmin ? '' : 'hidden';

            // Status badge for camisa
            let camisaStatus = '';
            if (!hasCamisa || valorCamisa === 0) {
                camisaStatus = '<span class="text-xs px-2 py-1 rounded bg-slate-800 text-slate-500">Sem Camisa</span>';
            } else if (camisaPago >= valorCamisa) {
                camisaStatus = '<span class="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold">✅ Quitado</span>';
            } else if (camisaPago > 0) {
                camisaStatus = '<span class="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-semibold">🟡 Parcial</span>';
            } else {
                camisaStatus = '<span class="text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-semibold">🔴 Pendente</span>';
            }

            const pagoClickClass = state.isAdmin ? 'cursor-pointer hover:text-emerald-300 transition-colors camisa-pago-btn' : '';
            const modExibicao = p.modelo_camisa || '-';
            
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-3 font-semibold">${p.nome}</td>
                    <td class="text-center px-3 py-3">
                        <span class="text-xs px-2 py-1 rounded bg-${color}-500/20 text-${color}-400">${perfil_label}</span>
                    </td>
                    <td class="text-center px-3 py-3">${time_emoji} ${time}</td>
                    <td class="text-center px-3 py-3">${modExibicao}</td>
                    <td class="text-center px-3 py-3 font-semibold">${p.tam_camisa || '-'}</td>
                    <td class="text-center px-3 py-3 font-bold text-lg">${p.num_camisa || '-'}</td>
                    <td class="text-center px-3 py-3 uppercase tracking-wider">${p.nome_camisa || '-'}</td>
                    <td class="text-right px-3 py-3 font-semibold admin-only ${adminClass}">${valorCamisa > 0 ? formatBRL(valorCamisa) : '-'}</td>
                    <td class="text-right px-3 py-3 admin-only ${adminClass}"><span class="${pagoClickClass} ${camisaPago > 0 ? 'text-emerald-400' : 'text-slate-500'} font-semibold" data-id="${p.id}">${valorCamisa > 0 ? formatBRL(camisaPago) : '-'}</span></td>
                    <td class="text-center px-3 py-3 admin-only ${adminClass}">${camisaStatus}</td>
                </tr>
            `;
        });
    }

    function exportCSV() {
        if (!window.App || !window.App.state) return;
        const state = window.App.state;
        let csv = 'Nome,Modelo,Tamanho,Numero,NomeCostas,Time,Perfil\n';
        
        state.participantes.forEach(p => {
            let perfil = p.categoria || 'Participante';
            const time = getTimeCamisa(p);
            
            csv += `"${p.nome}","${p.modelo_camisa || ''}","${p.tam_camisa || ''}","${p.num_camisa || ''}","${p.nome_camisa || ''}","${time}","${perfil}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'camisas_solteiros_casados_2026.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportWhatsapp() {
        if (!window.App || !window.App.state) return;
        const state = window.App.state;
        
        let groupsSolteiros = {};
        let groupsCasados = {};
        let total = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                const time = getTimeCamisa(p);
                const mod = getModeloBase(p.modelo_camisa);
                const key = `${mod} ${p.tam_camisa}`;
                const targetDict = time === 'Casados' ? groupsCasados : groupsSolteiros;
                
                if (!targetDict[key]) targetDict[key] = [];
                targetDict[key].push(`• #${p.num_camisa || '-'} ${p.nome_camisa || p.nome.toUpperCase()}`);
                total++;
            }
        });

        let text = `📋 *PEDIDO DE CAMISAS - SOLTEIROS & CASADOS 2026*\nTotal: *${total} camisas*\n\n`;
        
        text += `⚪ *--- CAMISAS SOLTEIROS ---*\n`;
        if (Object.keys(groupsSolteiros).length === 0) text += `(Nenhuma)\n\n`;
        else {
            for (let key in groupsSolteiros) {
                text += `*${key}* (${groupsSolteiros[key].length} un.)\n${groupsSolteiros[key].join('\n')}\n\n`;
            }
        }

        text += `⚫ *--- CAMISAS CASADOS ---*\n`;
        if (Object.keys(groupsCasados).length === 0) text += `(Nenhuma)\n\n`;
        else {
            for (let key in groupsCasados) {
                text += `*${key}* (${groupsCasados[key].length} un.)\n${groupsCasados[key].join('\n')}\n\n`;
            }
        }

        navigator.clipboard.writeText(text).then(() => {
            if (window.App) window.App.showToast('Resumo de confecção copiado para o WhatsApp!');
        });
    }

    return { init, render, calcularPrecoCamisa, getTimeCamisa, getModeloBase };
})();
