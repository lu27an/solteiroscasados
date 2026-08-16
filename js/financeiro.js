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
    }

    function render(state) {
        const tbody = document.getElementById('financeiro-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const today = new Date();

        const parcelasByParticipante = {};
        state.parcelas.forEach(p => {
            if (!parcelasByParticipante[p.participante_id]) {
                parcelasByParticipante[p.participante_id] = [];
            }
            parcelasByParticipante[p.participante_id].push(p);
        });

        for (let pid in parcelasByParticipante) {
            parcelasByParticipante[pid].sort((a, b) => a.numero_parcela - b.numero_parcela);
        }

        let filtered = state.participantes.filter(p => {
            if (currentSearch && !p.nome.toLowerCase().includes(currentSearch)) return false;
            
            const p_parcelas = parcelasByParticipante[p.id] || [];
            if (currentFilter === 'pagos') {
                return p_parcelas.length === 4 && p_parcelas.every(x => x.pago);
            }
            if (currentFilter === 'atraso') {
                return p_parcelas.some(x => !x.pago && new Date(x.data_vencimento + 'T23:59:59') < today);
            }
            if (currentFilter === 'sem-chopp') {
                return p.tipo_consumo === 'Sem Chopp';
            }
            if (currentFilter === 'criancas') {
                return p.tipo_consumo === 'Crianca Meia';
            }
            return true;
        });

        const emojis = {
            'Jogador Solteiro': '⚪',
            'Jogador Casado': '⚫',
            'Resenha': '🍻',
            'Acompanhante': '👥'
        };

        const consumoLabels = {
            'Completo': 'Com Chopp',
            'Sem Chopp': 'Sem Álcool',
            'Crianca Meia': 'Criança'
        };

        let meta = 0;
        state.despesas.forEach(d => meta += parseFloat(d.valor || 0));
        let totalEsperado = 0;
        state.participantes.forEach(p => totalEsperado += parseFloat(p.valor_total || 0));
        let numberOfPayers = state.participantes.filter(p => p.categoria !== 'Acompanhante').length;
        let discount = (totalEsperado > meta && meta > 0 && numberOfPayers > 0) ? (totalEsperado - meta) / numberOfPayers : 0;

        filtered.forEach(p => {
            const p_parcelas = parcelasByParticipante[p.id] || [];
            
            let responsavelText = '';
            if (p.categoria === 'Acompanhante' && p.responsavel_id) {
                const resp = state.participantes.find(x => x.id == p.responsavel_id);
                if (resp) responsavelText = `<div class="text-xs text-slate-500">Dep. de ${resp.nome}</div>`;
            }

            let parcelasHtml = '';
            for (let i = 1; i <= 4; i++) {
                const parc = p_parcelas.find(x => x.numero_parcela == i);
                if (!parc) {
                    parcelasHtml += `<td class="text-center px-3 py-3">-</td>`;
                    continue;
                }

                let tagHtml = '';
                const pDate = new Date(parc.data_vencimento + 'T23:59:59');
                const classBase = state.isAdmin ? 'parcela-tag cursor-pointer' : 'parcela-tag';
                
                let valorComDesconto = parc.valor;
                if (i === 4 && p.categoria !== 'Acompanhante' && discount > 0) {
                    valorComDesconto -= discount;
                }

                if (parc.pago) {
                    tagHtml = `<span class="${classBase} tag-pago text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400" data-parcela-id="${parc.id}" data-pago="${parc.pago}">✓ Pago</span>`;
                } else if (pDate >= today) {
                    tagHtml = `<span class="${classBase} tag-pendente text-xs px-2 py-1 rounded bg-slate-700 text-slate-300" data-parcela-id="${parc.id}" data-pago="${parc.pago}">Pendente</span>`;
                } else {
                    tagHtml = `<span class="${classBase} tag-atraso text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-400" data-parcela-id="${parc.id}" data-pago="${parc.pago}">Em Atraso</span>`;
                }

                if (i === 4 && p.categoria !== 'Acompanhante' && discount > 0) {
                    tagHtml += `<div class="text-[10px] text-emerald-400 mt-1">Desc. ${discount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>`;
                }

                parcelasHtml += `<td class="text-center px-3 py-3">${tagHtml}</td>`;
            }

            const valTotalFormatado = parseFloat(p.valor_total || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
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
                ${parcelasHtml}
                <td class="text-center px-3 py-3 font-semibold">${valTotalFormatado}</td>
                <td class="text-center px-3 py-3 admin-only ${adminClass}">
                    <div class="flex gap-1 justify-center">
                        <button class="btn-edit" data-id="${p.id}" title="Editar">✏️</button>
                        <button class="btn-pix" data-id="${p.id}" title="PIX">💠</button>
                        <button class="btn-whatsapp" data-id="${p.id}" title="WhatsApp">📱</button>
                        <button class="btn-delete" data-id="${p.id}" title="Excluir">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    return { init, render };
})();
