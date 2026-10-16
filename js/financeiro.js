window.Financeiro = (function() {
    let currentSearch = '';
    let currentFilter = 'todos';

    function init() {
        const searchInput = document.getElementById('financeiro-search');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    currentSearch = e.target.value.toLowerCase();
                    if (window.App && window.App.state) render(window.App.state);
                }, 200);
            });
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white');
                    b.classList.add('bg-slate-800', 'text-slate-300');
                });
                const target = e.currentTarget;
                target.classList.remove('bg-slate-800', 'text-slate-300');
                target.classList.add('bg-emerald-600', 'text-white');
                currentFilter = target.dataset.filter || 'todos';
                if (window.App && window.App.state) render(window.App.state);
            });
        });

        const btnZapFinanceiro = document.getElementById('btn-financeiro-whatsapp');
        if (btnZapFinanceiro) {
            btnZapFinanceiro.addEventListener('click', exportArrecadacaoWhatsapp);
        }
    }

    function buildProgressBar(percent, blocks = 10) {
        const clamped = Math.max(0, Math.min(100, Math.round(percent)));
        const filled = Math.round((clamped / 100) * blocks);
        const empty = Math.max(0, blocks - filled);
        const pctStr = String(clamped).padStart(2, '0') + '%';
        return `[${'🟩'.repeat(filled)}${'⬜'.repeat(empty)}] ${pctStr}`;
    }

    function gerarTextoArrecadacaoWhatsapp(state) {
        const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const pagantes = (state.participantes || []).filter(p => parseFloat(p.valor_total || 0) > 0);

        let totalEsperado = 0;
        let totalArrecadado = 0;

        const quitados = [];
        const parciais = [];
        const pendentes = [];

        pagantes.forEach(p => {
            const valor = parseFloat(p.valor_total || 0);
            const pago = parseFloat(p.valor_pago || 0);
            totalEsperado += valor;
            totalArrecadado += pago;

            const pctInd = valor > 0 ? Math.min(100, Math.round((pago / valor) * 100)) : 0;
            const barInd = buildProgressBar(pctInd, 5);
            const linha = `• *${p.nome}*: ${barInd} — ${formatBRL(pago)} / ${formatBRL(valor)}`;

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

        let text = `🥩 *ARRECADAÇÃO DO CHURRASCO - SOLTEIROS & CASADOS 2026*\n\n`;
        text += `📊 *Progresso Geral:*\n${barraGeral}\n\n`;
        text += `💰 *Arrecadado:* ${formatBRL(totalArrecadado)} de ${formatBRL(totalEsperado)}\n`;
        text += `⏳ *Falta Arrecadar:* ${formatBRL(totalPendente)}\n`;
        text += `👥 *Participantes Pagantes:* ${pagantes.length}\n\n`;

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

    function exportArrecadacaoWhatsapp() {
        if (!window.App || !window.App.state) return;
        const text = gerarTextoArrecadacaoWhatsapp(window.App.state);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.App) window.App.showToast('Resumo de arrecadação do churrasco copiado!');
            });
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    function render(state) {
        const tbody = document.getElementById('financeiro-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        let filtered = state.participantes.filter(p => {
            if (currentSearch && !p.nome.toLowerCase().includes(currentSearch)) return false;
            
            const valorPago = parseFloat(p.valor_pago || 0);
            const valorTotal = parseFloat(p.valor_total || 0);
            
            if (currentFilter === 'quitados') return valorPago >= valorTotal && valorTotal > 0;
            if (currentFilter === 'parcial') return valorPago > 0 && valorPago < valorTotal;
            if (currentFilter === 'sem-pagamento') return valorPago === 0 && valorTotal > 0;
            if (currentFilter === 'patrocinadores') return valorPago > valorTotal && valorTotal > 0;
            return true;
        });

        const emojis = {
            'Jogador Solteiro': '⚪',
            'Jogador Casado': '⚫',
            'Resenha': '🍻',
            'Acompanhante': '👥',
            'Criança': '👶',
            'Somente Camisa': '👕'
        };

        const consumoLabels = {
            'Completo': 'Com Chopp',
            'Sem Chopp': 'Sem Álcool',
            'Crianca Meia': 'Criança (Grátis)',
            'Criança': 'Criança (Grátis)',
            'Somente Camisa': 'Somente Camisa'
        };

        filtered.forEach(p => {
            const valorTotal = parseFloat(p.valor_total || 0);
            const valorPago = parseFloat(p.valor_pago || 0);
            const restante = valorTotal - valorPago;
            
            let responsavelText = '';
            if (p.categoria === 'Acompanhante' && p.responsavel_id) {
                const resp = state.participantes.find(x => x.id == p.responsavel_id);
                if (resp) responsavelText = `<div class="text-xs text-slate-500">Dep. de ${resp.nome}</div>`;
            }

            // Status badge
            let statusHtml = '';
            if (valorTotal === 0) {
                statusHtml = '<span class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">—</span>';
            } else if (valorPago > valorTotal) {
                statusHtml = '<span class="text-xs px-2 py-1 rounded bg-sky-500/20 text-sky-400">🤝 Patrocinador</span>';
            } else if (valorPago >= valorTotal) {
                statusHtml = '<span class="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">✅ Quitado</span>';
            } else if (valorPago > 0) {
                statusHtml = '<span class="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">🟡 Parcial</span>';
            } else {
                statusHtml = '<span class="text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-400">🔴 Pendente</span>';
            }

            // Pago column - clickable for admin
            const pagoClass = state.isAdmin ? 'cursor-pointer hover:text-emerald-300 transition-colors valor-pago-btn' : '';
            const pagoHtml = `<span class="${pagoClass} font-semibold ${valorPago > 0 ? 'text-emerald-400' : 'text-slate-500'}" data-id="${p.id}" data-tipo="churrasco">${formatBRL(valorPago)}</span>`;

            // Restante column
            let restanteHtml = '';
            if (restante > 0) {
                restanteHtml = `<span class="text-amber-400 font-semibold">${formatBRL(restante)}</span>`;
            } else if (restante < 0) {
                restanteHtml = `<span class="text-sky-400 font-semibold">+${formatBRL(Math.abs(restante))}</span>`;
            } else {
                restanteHtml = `<span class="text-emerald-400 font-semibold">R$ 0,00</span>`;
            }

            const adminClass = state.isAdmin ? '' : 'hidden';

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-800/50 transition-colors';
            tr.innerHTML = `
                <td class="px-4 py-3">
                    <div class="font-semibold">${p.nome}</div>
                    <div class="text-xs text-slate-500">
                        ${emojis[p.categoria] || ''} ${p.categoria} • ${consumoLabels[p.tipo_consumo] || p.tipo_consumo}
                    </div>
                    ${responsavelText}
                </td>
                <td class="text-right px-4 py-3 font-semibold">${formatBRL(valorTotal)}</td>
                <td class="text-right px-4 py-3">${pagoHtml}</td>
                <td class="text-right px-4 py-3">${restanteHtml}</td>
                <td class="text-center px-4 py-3">${statusHtml}</td>
                <td class="text-center px-4 py-3 admin-only ${adminClass}">
                    <div class="flex gap-1 justify-center">
                        <button class="btn-edit" data-id="${p.id}" title="Editar">✏️</button>
                        <button class="btn-whatsapp" data-id="${p.id}" title="Cobrança WhatsApp">📱</button>
                        <button class="btn-delete" data-id="${p.id}" title="Excluir">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    return { init, render, buildProgressBar, gerarTextoArrecadacaoWhatsapp, exportArrecadacaoWhatsapp };
})();
