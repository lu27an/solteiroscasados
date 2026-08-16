window.Camisas = (function() {
    // Tabela de preços de camisa
    const PRECOS = {
        'Jogador':     { base: 50, extra: 60 },
        'Tradicional': { base: 50, extra: 60 },
        'Polo':        { base: 65, extra: 75 },
        'Baby Look':   { base: 50, extra: 50 },
        'Infantil':    { base: 40, extra: 40 }
    };

    function getModeloBase(modelo) {
        if (!modelo) return 'Tradicional';
        const m = modelo.toLowerCase().trim();
        if (m.includes('polo')) return 'Polo';
        if (m.includes('baby')) return 'Baby Look';
        if (m.includes('infantil')) return 'Infantil';
        if (m.includes('jogador')) return 'Jogador';
        if (m.includes('tradicional')) return 'Tradicional';
        return 'Tradicional';
    }

    function isTamanhoExtra(tamanho) {
        if (!tamanho) return false;
        const t = tamanho.toUpperCase().trim();
        return ['XG', 'XGG', 'XXG', 'XXXG', '3XG', '4XG', 'EG', 'EGG', 'G1', 'G2', 'G3', 'G4'].includes(t) || t.includes('XG') || t.includes('EGG');
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

        let models = {};
        let totalCamisasCount = 0;
        let totalCamisasEsperado = 0;
        let totalCamisasArrecadado = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                totalCamisasCount++;
                const modName = p.modelo_camisa;
                if (!models[modName]) models[modName] = {};
                if (models[modName][p.tam_camisa] === undefined) models[modName][p.tam_camisa] = 0;
                models[modName][p.tam_camisa]++;

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

        // Render Totalizador por Modelo
        totalsContainer.innerHTML = `<div class="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6 w-full shadow-sm">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">📊 Totalizador para Confecção (${totalCamisasCount} camisas)</h3>
            ${Object.keys(models).length === 0 ? '<p class="text-xs text-slate-500">Nenhuma camisa solicitada ainda.</p>' : Object.keys(models).map(mod => {
                let count = 0;
                let sizesHtml = '';
                for (let sz in models[mod]) {
                    if (models[mod][sz] > 0) {
                        count += models[mod][sz];
                        sizesHtml += `
                            <div class="bg-slate-800 rounded-lg px-3 py-2 text-center min-w-[3.5rem] border border-slate-700">
                                <span class="text-xs text-slate-400 block font-medium">${sz}</span>
                                <span class="text-lg font-bold text-white">${models[mod][sz]}</span>
                            </div>
                        `;
                    }
                }
                if (count === 0) return '';
                return `
                    <div class="mb-4 last:mb-0">
                        <h4 class="text-sm font-semibold text-slate-300 mb-2">${mod} — <span class="text-emerald-400 font-bold">${count} un.</span></h4>
                        <div class="flex flex-wrap gap-2">
                            ${sizesHtml}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>`;

        // Render Camisas Table
        tbody.innerHTML = '';
        state.participantes.forEach(p => {
            let color = 'slate';
            let perfil_label = 'Acompanhante';
            if (p.categoria === 'Jogador Solteiro' || p.categoria === 'Jogador Casado') { color = 'sky'; perfil_label = 'Jogador'; }
            else if (p.categoria === 'Resenha') { color = 'amber'; perfil_label = 'Torcedor'; }

            let time = 'Resenha';
            let time_emoji = '🍻';
            if (p.categoria === 'Jogador Solteiro') { time = 'Solteiros'; time_emoji = '⚪'; }
            else if (p.categoria === 'Jogador Casado') { time = 'Casados'; time_emoji = '⚫'; }

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
            
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-3 font-semibold">${p.nome}</td>
                    <td class="text-center px-3 py-3">
                        <span class="text-xs px-2 py-1 rounded bg-${color}-500/20 text-${color}-400">${perfil_label}</span>
                    </td>
                    <td class="text-center px-3 py-3">${time_emoji} ${time}</td>
                    <td class="text-center px-3 py-3">${p.modelo_camisa || '-'}</td>
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
            let perfil = 'Acompanhante';
            if (p.categoria === 'Jogador Solteiro' || p.categoria === 'Jogador Casado') perfil = 'Jogador';
            else if (p.categoria === 'Resenha') perfil = 'Torcedor';
            
            let time = 'Resenha';
            if (p.categoria === 'Jogador Solteiro') time = 'Solteiros';
            else if (p.categoria === 'Jogador Casado') time = 'Casados';
            
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
        
        let groups = {};
        let total = 0;

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                const key = `${p.modelo_camisa} ${p.tam_camisa}`;
                if (!groups[key]) groups[key] = [];
                let time = 'Resenha';
                if (p.categoria === 'Jogador Solteiro') time = 'Solteiros';
                else if (p.categoria === 'Jogador Casado') time = 'Casados';
                
                groups[key].push(`• #${p.num_camisa || '-'} ${p.nome_camisa || p.nome.toUpperCase()} - ${time}`);
                total++;
            }
        });

        let text = `📋 *PEDIDO DE CAMISAS - Solteiros e Casados 2026*\nTotal: ${total} camisas\n\n`;
        
        for (let key in groups) {
            text += `*${key}* (${groups[key].length} un.)\n${groups[key].join('\n')}\n\n`;
        }

        navigator.clipboard.writeText(text).then(() => {
            if (window.App) window.App.showToast('Copiado para a área de transferência!');
        });
    }

    return { init, render, calcularPrecoCamisa };
})();
