window.Camisas = (function() {
    function getModeloBase(modelo) {
        if (!modelo) return 'Tradicional';
        const m = modelo.toLowerCase().trim();
        if (m.includes('baby')) return 'Baby Look';
        if (m.includes('infantil')) return 'Infantil';
        return 'Tradicional';
    }

    function getTimeCamisa(p) {
        if (!p) return 'Solteiros';
        const m = (p.modelo_camisa || '').toLowerCase();
        const isGol = m.includes('goleiro') || p.posicao_campo === 'Goleiro';
        const isCasado = m.includes('casado') || p.categoria === 'Jogador Casado';

        if (isGol) {
            return isCasado ? 'Goleiro Casados' : 'Goleiro Solteiros';
        }
        return isCasado ? 'Casados' : 'Solteiros';
    }

    function isTamanhoExtra(tamanho) {
        if (!tamanho) return false;
        const t = tamanho.toUpperCase().trim();
        return ['XG', 'XGG', 'XXG', 'XXXG', '3XG', '4XG', 'EG', 'EGG', 'G1', 'G2', 'G3', 'G4', 'EXG'].includes(t) || t.includes('XG') || t.includes('EGG');
    }

    // Nova tabela de preços: Solteiros (Polo) = R$ 75,00 | Casados = R$ 60,00
    function calcularPrecoCamisa(modelo, tamanho, p = null) {
        const hasMod = modelo || (p && p.modelo_camisa);
        const hasTam = tamanho || (p && p.tam_camisa);
        if (!hasMod && !hasTam) return 0;

        let time = 'Solteiros';
        if (p) {
            time = getTimeCamisa(p);
        } else if (modelo) {
            const m = String(modelo).toLowerCase();
            if (m.includes('casado')) time = 'Casados';
        }
        return (time === 'Casados' || time === 'Goleiro Casados') ? 60 : 75;
    }

    function buildProgressBar(percent, blocks = 10) {
        const clamped = Math.max(0, Math.min(100, Math.round(percent)));
        const filled = Math.round((clamped / 100) * blocks);
        const empty = Math.max(0, blocks - filled);
        const pctStr = String(clamped).padStart(2, '0') + '%';
        return `[${'🟩'.repeat(filled)}${'⬜'.repeat(empty)}] ${pctStr}`;
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
        const btnZapPagamentos = document.getElementById('btn-camisas-whatsapp-pagamentos');
        if (btnZapPagamentos) {
            btnZapPagamentos.addEventListener('click', exportPagamentosWhatsapp);
        }

        // Click handler for camisa edit and payment
        const tbody = document.getElementById('camisas-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (!window.App || !window.App.state || !window.App.state.isAdmin) return;
                const editBtn = e.target.closest('.btn-edit-camisa');
                if (editBtn) {
                    window.App.editParticipante(parseInt(editBtn.dataset.id));
                    return;
                }
                const btn = e.target.closest('.camisa-pago-btn');
                if (btn) {
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

        // Separate models by 4 categories: Solteiros, Goleiro Solteiros, Casados, Goleiro Casados
        let totalizadorSolteiros = {};
        let totalizadorGoleiroSolteiros = {};
        let totalizadorCasados = {};
        let totalizadorGoleiroCasados = {};

        let countSolteiros = 0;
        let countGoleiroSolteiros = 0;
        let countCasados = 0;
        let countGoleiroCasados = 0;

        let totalCamisasCount = 0;
        let totalCamisasEsperado = 0;
        let totalCamisasArrecadado = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                totalCamisasCount++;
                const time = getTimeCamisa(p);
                const modBase = getModeloBase(p.modelo_camisa);
                
                let targetDict = totalizadorSolteiros;
                if (time === 'Goleiro Solteiros') {
                    targetDict = totalizadorGoleiroSolteiros;
                    countGoleiroSolteiros++;
                } else if (time === 'Casados') {
                    targetDict = totalizadorCasados;
                    countCasados++;
                } else if (time === 'Goleiro Casados') {
                    targetDict = totalizadorGoleiroCasados;
                    countGoleiroCasados++;
                } else {
                    targetDict = totalizadorSolteiros;
                    countSolteiros++;
                }

                if (!targetDict[modBase]) targetDict[modBase] = {};
                if (targetDict[modBase][p.tam_camisa] === undefined) targetDict[modBase][p.tam_camisa] = 0;
                targetDict[modBase][p.tam_camisa]++;

                const preco = calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa, p);
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
                    ${renderBlocoTime('Solteiros (Polo - R$ 75)', '⚪', 'border-slate-700', totalizadorSolteiros, countSolteiros)}
                    ${renderBlocoTime('Goleiro Solteiros (R$ 75)', '🧤', 'border-sky-900/60', totalizadorGoleiroSolteiros, countGoleiroSolteiros)}
                    ${renderBlocoTime('Casados (R$ 60)', '⚫', 'border-slate-800', totalizadorCasados, countCasados)}
                    ${renderBlocoTime('Goleiro Casados (R$ 60)', '🧤', 'border-amber-900/60', totalizadorGoleiroCasados, countGoleiroCasados)}
                </div>
            </div>
        `;

        // Render Camisas Table
        tbody.innerHTML = '';
        state.participantes.forEach(p => {
            let color = 'slate';
            let perfil_label = 'Acompanhante';
            if (p.categoria === 'Jogador Solteiro' || p.categoria === 'Jogador Casado') {
                if (p.posicao_campo === 'Goleiro') {
                    color = 'amber';
                    perfil_label = 'Goleiro';
                } else {
                    color = 'sky';
                    perfil_label = 'Jogador';
                }
            }
            else if (p.categoria === 'Resenha') { color = 'amber'; perfil_label = 'Torcedor'; }
            else if (p.categoria === 'Criança') { color = 'emerald'; perfil_label = 'Criança'; }
            else if (p.categoria === 'Somente Camisa') { color = 'violet'; perfil_label = 'Somente Camisa'; }

            const time = getTimeCamisa(p);
            let time_emoji = '⚪';
            if (time === 'Casados') time_emoji = '⚫';
            else if (time.includes('Goleiro')) time_emoji = '🧤';

            const hasCamisa = !!(p.modelo_camisa && p.tam_camisa);
            const valorCamisa = hasCamisa ? calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa, p) : 0;
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
            const modBase = getModeloBase(p.modelo_camisa);
            const modExibicao = hasCamisa ? `${modBase} - ${time}` : '-';
            const numExibicao = (p.num_camisa !== null && p.num_camisa !== undefined && p.num_camisa !== '') ? p.num_camisa : '-';
            
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-3 font-semibold">${p.nome}</td>
                    <td class="text-center px-3 py-3">
                        <span class="text-xs px-2 py-1 rounded bg-${color}-500/20 text-${color}-400">${perfil_label}</span>
                    </td>
                    <td class="text-center px-3 py-3">${time_emoji} ${time}</td>
                    <td class="text-center px-3 py-3">${modExibicao}</td>
                    <td class="text-center px-3 py-3 font-semibold">${p.tam_camisa || '-'}</td>
                    <td class="text-center px-3 py-3 font-bold text-lg">${numExibicao}</td>
                    <td class="text-center px-3 py-3 uppercase tracking-wider">${p.nome_camisa || '-'}</td>
                    <td class="text-right px-3 py-3 font-semibold admin-only ${adminClass}">${valorCamisa > 0 ? formatBRL(valorCamisa) : '-'}</td>
                    <td class="text-right px-3 py-3 admin-only ${adminClass}"><span class="${pagoClickClass} ${camisaPago > 0 ? 'text-emerald-400' : 'text-slate-500'} font-semibold" data-id="${p.id}">${valorCamisa > 0 ? formatBRL(camisaPago) : '-'}</span></td>
                    <td class="text-center px-3 py-3 admin-only ${adminClass}">${camisaStatus}</td>
                    <td class="text-center px-3 py-3 admin-only ${adminClass}">
                        <div class="flex gap-1.5 justify-center">
                            <button class="btn-edit-camisa p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs transition-colors" data-id="${p.id}" title="Editar Camisa / Participante">✏️</button>
                            ${valorCamisa > 0 ? `<button class="camisa-pago-btn p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-xs transition-colors" data-id="${p.id}" title="Atualizar Pagamento da Camisa">💰</button>` : ''}
                        </div>
                    </td>
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
            const modBase = getModeloBase(p.modelo_camisa);
            const modExibicao = (p.modelo_camisa && p.tam_camisa) ? `${modBase} - ${time}` : (p.modelo_camisa || '');
            const num = (p.num_camisa !== null && p.num_camisa !== undefined) ? p.num_camisa : '';
            
            csv += `"${p.nome}","${modExibicao}","${p.tam_camisa || ''}","${num}","${p.nome_camisa || ''}","${time}","${perfil}"\n`;
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
        let groupsGoleiroSolteiros = {};
        let groupsCasados = {};
        let groupsGoleiroCasados = {};
        let total = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                const time = getTimeCamisa(p);
                const mod = getModeloBase(p.modelo_camisa);
                const key = `${mod} ${p.tam_camisa}`;
                
                let targetDict = groupsSolteiros;
                if (time === 'Goleiro Solteiros') targetDict = groupsGoleiroSolteiros;
                else if (time === 'Casados') targetDict = groupsCasados;
                else if (time === 'Goleiro Casados') targetDict = groupsGoleiroCasados;
                
                const num = (p.num_camisa !== null && p.num_camisa !== undefined && p.num_camisa !== '') ? p.num_camisa : '-';
                if (!targetDict[key]) targetDict[key] = [];
                targetDict[key].push(`• #${num} ${p.nome_camisa || p.nome.toUpperCase()}`);
                total++;
            }
        });

        function formatSection(title, dict) {
            let sec = `${title}\n`;
            if (Object.keys(dict).length === 0) {
                sec += `(Nenhuma)\n\n`;
            } else {
                for (let key in dict) {
                    sec += `*${key}* (${dict[key].length} un.)\n${dict[key].join('\n')}\n\n`;
                }
            }
            return sec;
        }

        let text = `📋 *PEDIDO DE CAMISAS - SOLTEIROS & CASADOS 2026*\nTotal: *${total} camisas*\n\n`;
        text += formatSection('⚪ *--- CAMISAS SOLTEIROS (POLO) ---*', groupsSolteiros);
        text += formatSection('🧤 *--- CAMISAS GOLEIRO SOLTEIROS ---*', groupsGoleiroSolteiros);
        text += formatSection('⚫ *--- CAMISAS CASADOS ---*', groupsCasados);
        text += formatSection('🧤 *--- CAMISAS GOLEIRO CASADOS ---*', groupsGoleiroCasados);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.App) window.App.showToast('Resumo de confecção copiado para o WhatsApp!');
            });
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    function gerarTextoPagamentosWhatsapp(state) {
        const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const comCamisa = (state.participantes || []).filter(p => p.modelo_camisa && p.tam_camisa);

        let totalEsperado = 0;
        let totalArrecadado = 0;

        const quitados = [];
        const parciais = [];
        const pendentes = [];

        comCamisa.forEach(p => {
            const valor = calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa, p);
            const pago = parseFloat(p.camisa_pago || 0);
            totalEsperado += valor;
            totalArrecadado += pago;

            const pctInd = valor > 0 ? Math.min(100, Math.round((pago / valor) * 100)) : 0;
            const barInd = buildProgressBar(pctInd, 5);
            const time = getTimeCamisa(p);
            const linha = `• *${p.nome}* (${time}): ${barInd} — ${formatBRL(pago)} / ${formatBRL(valor)}`;

            if (pago >= valor && valor > 0) {
                quitados.push(linha);
            } else if (pago > 0) {
                parciais.push(linha);
            } else {
                pendentes.push(linha);
            }
        });

        const totalPendente = Math.max(0, totalEsperado - totalArrecadado);
        const pctGeral = totalEsperado > 0 ? Math.min(100, (totalArrecadado / totalEsperado) * 100) : 0;
        const barraGeral = buildProgressBar(pctGeral, 10);

        let text = `👕 *ARRECADAÇÃO DAS CAMISAS - SOLTEIROS & CASADOS 2026*\n\n`;
        text += `📊 *Progresso Geral:*\n${barraGeral}\n\n`;
        text += `💰 *Arrecadado:* ${formatBRL(totalArrecadado)} de ${formatBRL(totalEsperado)}\n`;
        text += `⏳ *Falta Arrecadar:* ${formatBRL(totalPendente)}\n`;
        text += `👕 *Total de Camisas:* ${comCamisa.length} un.\n\n`;

        text += `✅ *QUITADOS - 100% (${quitados.length}):*\n`;
        text += quitados.length > 0 ? `${quitados.join('\n')}\n\n` : `(Nenhum ainda)\n\n`;

        if (parciais.length > 0) {
            text += `🟡 *PAGAMENTO PARCIAL (${parciais.length}):*\n${parciais.join('\n')}\n\n`;
        }

        if (pendentes.length > 0) {
            text += `🔴 *PENDENTES - 00% (${pendentes.length}):*\n${pendentes.join('\n')}\n`;
        }

        return text.trim();
    }

    function exportPagamentosWhatsapp() {
        if (!window.App || !window.App.state) return;
        const text = gerarTextoPagamentosWhatsapp(window.App.state);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.App) window.App.showToast('Resumo de arrecadação das camisas copiado!');
            });
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    return { init, render, calcularPrecoCamisa, getTimeCamisa, getModeloBase, buildProgressBar, gerarTextoPagamentosWhatsapp, exportPagamentosWhatsapp };
})();
