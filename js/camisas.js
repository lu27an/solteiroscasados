const Camisas = (function() {
    function init() {
        const btnCsv = document.getElementById('btn-export-csv');
        if (btnCsv) {
            btnCsv.addEventListener('click', exportCSV);
        }
        const btnZap = document.getElementById('btn-export-whatsapp');
        if (btnZap) {
            btnZap.addEventListener('click', exportWhatsapp);
        }
    }

    function render(state) {
        const totalsContainer = document.getElementById('camisas-totals');
        const tbody = document.getElementById('camisas-tbody');
        if (!totalsContainer || !tbody) return;

        let models = {
            'Tradicional': { 'P': 0, 'M': 0, 'G': 0, 'GG': 0, 'XG': 0 },
            'Baby Look': { 'BL-P': 0, 'BL-M': 0, 'BL-G': 0, 'BL-GG': 0 },
            'Infantil': { '2': 0, '4': 0, '6': 0, '8': 0, '10': 0, '12': 0, '14': 0, '16': 0 }
        };

        state.participantes.forEach(p => {
            if (p.modelo_camisa && p.tam_camisa) {
                if (!models[p.modelo_camisa]) models[p.modelo_camisa] = {};
                if (models[p.modelo_camisa][p.tam_camisa] === undefined) models[p.modelo_camisa][p.tam_camisa] = 0;
                models[p.modelo_camisa][p.tam_camisa]++;
            }
        });

        totalsContainer.innerHTML = `<div class="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">📊 Totalizador para Confecção</h3>
            ${Object.keys(models).map(mod => {
                let count = 0;
                let sizesHtml = '';
                for (let sz in models[mod]) {
                    if (models[mod][sz] > 0) {
                        count += models[mod][sz];
                        sizesHtml += `
                            <div class="bg-slate-800 rounded-lg px-3 py-2 text-center min-w-[3rem]">
                                <span class="text-xs text-slate-400 block">${sz}</span>
                                <span class="text-lg font-bold">${models[mod][sz]}</span>
                            </div>
                        `;
                    }
                }
                if (count === 0) return '';
                return `
                    <div class="mb-4">
                        <h4 class="text-sm font-semibold text-slate-300 mb-2">${mod} — ${count} un.</h4>
                        <div class="flex flex-wrap gap-2">
                            ${sizesHtml}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>`;

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

    return { init, render };
})();
