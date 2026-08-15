const Caixa = (function() {
    function init() {
        const form = document.getElementById('caixa-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const descricao = document.getElementById('despesa-descricao').value;
                const categoria = document.getElementById('despesa-categoria').value;
                const valor = document.getElementById('despesa-valor').value;

                if (!descricao || !valor) return;

                if (window.DB && window.App) {
                    await DB.despesas.create({
                        descricao,
                        categoria,
                        valor: parseFloat(valor),
                        pago: false
                    });
                    form.reset();
                    await App.refreshAll();
                    App.showToast('Despesa adicionada com sucesso!');
                }
            });
        }

        const tbody = document.getElementById('despesas-tbody');
        if (tbody) {
            tbody.addEventListener('click', async (e) => {
                const btnToggle = e.target.closest('.btn-toggle-despesa');
                if (btnToggle) {
                    const id = btnToggle.dataset.id;
                    const pago = btnToggle.dataset.pago === 'true';
                    if (window.DB && window.App) {
                        await DB.despesas.update(id, { pago: !pago, data_pagamento: !pago ? new Date().toISOString() : null });
                        await App.refreshAll();
                    }
                }
                const btnDelete = e.target.closest('.btn-delete-despesa');
                if (btnDelete) {
                    const id = btnDelete.dataset.id;
                    if (window.App) App.confirmDeleteDespesa(id);
                }
            });
        }
    }

    function render(state) {
        let entradas = 0;
        state.parcelas.forEach(p => {
            if (p.pago) entradas += (parseFloat(p.valor || 0) - parseFloat(p.valor_desconto || 0));
        });

        let saidas = 0;
        state.despesas.forEach(d => {
            if (d.pago) saidas += parseFloat(d.valor || 0);
        });

        const saldo = entradas - saidas;

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        const elEntradas = document.getElementById('caixa-entradas');
        if (elEntradas) elEntradas.textContent = formatBRL(entradas);
        const elSaidas = document.getElementById('caixa-saidas');
        if (elSaidas) elSaidas.textContent = formatBRL(saidas);
        const elSaldo = document.getElementById('caixa-saldo');
        if (elSaldo) {
            elSaldo.textContent = formatBRL(saldo);
            elSaldo.className = `text-xl font-bold ${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
        }

        const tbody = document.getElementById('despesas-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        state.despesas.forEach(d => {
            const adminClass = state.isAdmin ? '' : 'hidden';
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-3 font-semibold">${d.descricao}</td>
                    <td class="text-center px-3 py-3">
                        <span class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">${d.categoria}</span>
                    </td>
                    <td class="text-center px-3 py-3 font-semibold">${formatBRL(parseFloat(d.valor || 0))}</td>
                    <td class="text-center px-3 py-3">
                        ${d.pago ? '<span class="tag-pago text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">✓ Pago</span>' : '<span class="tag-pendente text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">Pendente</span>'}
                    </td>
                    <td class="text-center px-3 py-3 admin-only ${adminClass}">
                        <div class="flex gap-1 justify-center">
                            <button class="btn-toggle-despesa" data-id="${d.id}" data-pago="${d.pago}" title="${d.pago ? 'Marcar pendente' : 'Marcar pago'}">
                                ${d.pago ? '↩️' : '✅'}
                            </button>
                            <button class="btn-delete-despesa" data-id="${d.id}" title="Excluir">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    return { init, render };
})();
