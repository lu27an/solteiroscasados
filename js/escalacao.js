const Escalacao = (function() {
    function init() {}

    function render(state) {
        const solteiros = state.participantes.filter(p => p.categoria === 'Jogador Solteiro');
        const casados = state.participantes.filter(p => p.categoria === 'Jogador Casado');
        const resenha = state.participantes.filter(p => p.categoria === 'Resenha' || p.categoria === 'Acompanhante' || p.posicao_campo === 'Nao Joga');

        const sortPlayers = (a, b) => {
            if (a.posicao_campo === 'Goleiro' && b.posicao_campo !== 'Goleiro') return -1;
            if (a.posicao_campo !== 'Goleiro' && b.posicao_campo === 'Goleiro') return 1;
            const numA = parseInt(a.num_camisa) || 999;
            const numB = parseInt(b.num_camisa) || 999;
            return numA - numB;
        };

        solteiros.sort(sortPlayers);
        casados.sort(sortPlayers);
        resenha.sort((a, b) => a.nome.localeCompare(b.nome));

        const elCountSolteiros = document.getElementById('count-solteiros');
        if (elCountSolteiros) elCountSolteiros.textContent = solteiros.length;
        const elCountCasados = document.getElementById('count-casados');
        if (elCountCasados) elCountCasados.textContent = casados.length;
        const elCountResenha = document.getElementById('count-resenha');
        if (elCountResenha) elCountResenha.textContent = resenha.length;

        const renderGroup = (containerId, players, showPos) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            
            if (players.length === 0) {
                container.innerHTML = `<p class="text-slate-600 italic text-sm">Nenhum jogador escalado</p>`;
                return;
            }

            players.forEach(p => {
                let posColor = 'slate';
                let posIcon = '📣';
                if (p.posicao_campo === 'Goleiro') { posColor = 'emerald'; posIcon = '🧤'; }
                else if (p.posicao_campo === 'Linha') { posColor = 'sky'; posIcon = '⚽'; }

                const adminBtn = state.isAdmin ? `<button class="btn-edit-player text-slate-500 hover:text-white" data-id="${p.id}">✏️</button>` : '';

                container.innerHTML += `
                    <div class="player-card flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors mb-2">
                        <div class="w-10 h-10 rounded-full bg-${posColor}-500/20 text-${posColor}-400 flex items-center justify-center font-bold text-sm shrink-0">
                            ${p.num_camisa || '-'}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-sm truncate">${p.nome}</p>
                            ${showPos ? `<p class="text-xs text-slate-500">${posIcon} ${p.posicao_campo} ${p.nome_camisa ? '• ' + p.nome_camisa : ''}</p>` : `<p class="text-xs text-slate-500">${p.categoria}</p>`}
                        </div>
                        ${adminBtn}
                    </div>
                `;
            });
        };

        renderGroup('escalacao-solteiros', solteiros, true);
        renderGroup('escalacao-casados', casados, true);
        renderGroup('escalacao-resenha', resenha, false);
    }

    return { init, render };
})();
