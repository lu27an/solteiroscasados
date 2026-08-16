window.Escalacao = (function() {
    let currentTeam = 'solteiros'; // or 'casados'
    let currentLineup = {}; // { 'gol-1': playerId, 'zag-1': playerId, ... }
    let appState = null;

    function init() {
        const btnSolteiros = document.getElementById('btn-esc-solteiros');
        const btnCasados = document.getElementById('btn-esc-casados');
        const btnLimpar = document.getElementById('btn-limpar-escalacao');

        if (btnSolteiros) {
            btnSolteiros.addEventListener('click', () => {
                currentTeam = 'solteiros';
                updateTeamToggleUI();
                loadLineup();
                render(appState);
            });
        }
        if (btnCasados) {
            btnCasados.addEventListener('click', () => {
                currentTeam = 'casados';
                updateTeamToggleUI();
                loadLineup();
                render(appState);
            });
        }
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => {
                if(confirm('Limpar o campo e devolver todos ao banco?')) {
                    currentLineup = {};
                    saveLineup();
                    render(appState);
                }
            });
        }

        loadLineup();
        setupDragAndDrop();
    }

    function updateTeamToggleUI() {
        const btnSolteiros = document.getElementById('btn-esc-solteiros');
        const btnCasados = document.getElementById('btn-esc-casados');
        if (!btnSolteiros || !btnCasados) return;

        if (currentTeam === 'solteiros') {
            btnSolteiros.className = "flex-1 bg-slate-800 text-white rounded-lg py-3 font-semibold border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all";
            btnCasados.className = "flex-1 bg-slate-900 text-slate-400 rounded-lg py-3 font-semibold border border-slate-800 hover:bg-slate-800 transition-all";
        } else {
            btnCasados.className = "flex-1 bg-slate-800 text-white rounded-lg py-3 font-semibold border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all";
            btnSolteiros.className = "flex-1 bg-slate-900 text-slate-400 rounded-lg py-3 font-semibold border border-slate-800 hover:bg-slate-800 transition-all";
        }
    }

    function loadLineup() {
        const saved = localStorage.getItem(`sc2026_cartola_${currentTeam}`);
        if (saved) {
            try {
                currentLineup = JSON.parse(saved);
            } catch (e) {
                currentLineup = {};
            }
        } else {
            currentLineup = {};
        }
    }

    function saveLineup() {
        localStorage.setItem(`sc2026_cartola_${currentTeam}`, JSON.stringify(currentLineup));
    }

    function setupDragAndDrop() {
        // Drag over on slots
        document.querySelectorAll('.player-slot').forEach(slot => {
            slot.addEventListener('dragover', e => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });
            slot.addEventListener('drop', e => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                const playerId = e.dataTransfer.getData('text/plain');
                if (!playerId) return;

                const slotId = slot.getAttribute('data-slot');
                
                // If player was in another slot, clear it
                Object.keys(currentLineup).forEach(k => {
                    if (currentLineup[k] == playerId) delete currentLineup[k];
                });

                // Assign to new slot
                currentLineup[slotId] = parseInt(playerId);
                saveLineup();
                render(appState);
            });
        });

        // Drag over on bench (to remove from field)
        const bench = document.getElementById('banco-list');
        if (bench) {
            bench.addEventListener('dragover', e => e.preventDefault());
            bench.addEventListener('drop', e => {
                e.preventDefault();
                const playerId = e.dataTransfer.getData('text/plain');
                if (!playerId) return;
                
                // Remove from lineup
                Object.keys(currentLineup).forEach(k => {
                    if (currentLineup[k] == playerId) delete currentLineup[k];
                });
                
                saveLineup();
                render(appState);
            });
        }
    }

    function getPlayerIcon(posicao) {
        if (posicao === 'Goleiro') return '🧤';
        if (posicao === 'Linha') return '⚽';
        return '📣';
    }

    function render(state) {
        if (!state) return;
        appState = state;
        
        loadLineup();

        const teamCategory = currentTeam === 'solteiros' ? 'Jogador Solteiro' : 'Jogador Casado';
        
        // Filter players
        const teamPlayers = state.participantes.filter(p => p.categoria === teamCategory);
        const resenhaPlayers = state.participantes.filter(p => (p.categoria === 'Resenha' || p.categoria === 'Acompanhante') || (p.posicao_campo === 'Nao Joga' && p.categoria !== 'Jogador Solteiro' && p.categoria !== 'Jogador Casado'));

        // Clean slots
        document.querySelectorAll('.player-slot').forEach(slot => {
            slot.innerHTML = '';
        });

        // Track players in bench
        let benchPlayers = [];
        let fieldCount = 0;

        teamPlayers.forEach(p => {
            let onFieldSlot = null;
            Object.keys(currentLineup).forEach(slotId => {
                if (currentLineup[slotId] == p.id) onFieldSlot = slotId;
            });

            if (onFieldSlot) {
                const slotEl = document.querySelector(`.player-slot[data-slot="${onFieldSlot}"]`);
                if (slotEl) {
                    fieldCount++;
                    const initials = p.nome.substring(0, 2).toUpperCase();
                    const shortName = p.nome.split(' ')[0];
                    const num = p.num_camisa || '-';
                    
                    slotEl.innerHTML = `
                        <div class="pitch-player team-${currentTeam} cartola-player" draggable="true" data-id="${p.id}">
                            <div class="remove-player">×</div>
                            <div class="shirt">${num}</div>
                            <div class="name">${shortName}</div>
                        </div>
                    `;
                    
                    // Events for the spawned player in field
                    const playerEl = slotEl.querySelector('.pitch-player');
                    playerEl.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        playerEl.classList.add('dragging');
                    });
                    playerEl.addEventListener('dragend', () => playerEl.classList.remove('dragging'));
                    
                    // Click remove
                    playerEl.querySelector('.remove-player').addEventListener('click', (e) => {
                        e.stopPropagation();
                        delete currentLineup[onFieldSlot];
                        saveLineup();
                        render(appState);
                    });
                } else {
                    benchPlayers.push(p); // Fallback if slot doesn't exist
                }
            } else {
                benchPlayers.push(p);
            }
        });

        // Render Bench
        const benchList = document.getElementById('banco-list');
        const benchCount = document.getElementById('banco-count');
        if (benchList) {
            benchList.innerHTML = '';
            if (benchPlayers.length === 0) {
                benchList.innerHTML = `<p class="text-slate-500 text-sm italic text-center py-4">Todos os jogadores estão no campo!</p>`;
            } else {
                benchPlayers.sort((a, b) => {
                    if (a.posicao_campo === 'Goleiro' && b.posicao_campo !== 'Goleiro') return -1;
                    if (a.posicao_campo !== 'Goleiro' && b.posicao_campo === 'Goleiro') return 1;
                    return a.nome.localeCompare(b.nome);
                }).forEach(p => {
                    const icon = getPlayerIcon(p.posicao_campo);
                    benchList.innerHTML += `
                        <div class="cartola-player flex items-center gap-3 bg-slate-800/80 rounded-lg p-2 hover:bg-slate-700 transition-colors border border-slate-700" draggable="true" data-id="${p.id}">
                            <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-600">
                                ${p.num_camisa || '-'}
                            </div>
                            <div class="flex-1 min-w-0 pointer-events-none">
                                <p class="font-semibold text-sm text-slate-200 truncate">${p.nome}</p>
                                <p class="text-xs text-slate-400">${icon} ${p.posicao_campo}</p>
                            </div>
                            <div class="text-slate-500 text-xs pointer-events-none">⠿</div>
                        </div>
                    `;
                });

                // Attach drag events to bench players
                benchList.querySelectorAll('.cartola-player').forEach(el => {
                    el.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', el.getAttribute('data-id'));
                        el.classList.add('dragging');
                    });
                    el.addEventListener('dragend', () => el.classList.remove('dragging'));
                });
            }
        }
        if (benchCount) benchCount.textContent = benchPlayers.length;

        // Render Resenha
        const resenhaList = document.getElementById('resenha-list');
        const resenhaCount = document.getElementById('resenha-count');
        if (resenhaList) {
            resenhaList.innerHTML = '';
            resenhaPlayers.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
                resenhaList.innerHTML += `
                    <div class="flex items-center gap-3 bg-slate-800/40 rounded-lg p-2 border border-slate-800/50">
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-sm text-slate-300 truncate">${p.nome}</p>
                            <p class="text-xs text-slate-500">${p.categoria}</p>
                        </div>
                    </div>
                `;
            });
        }
        if (resenhaCount) resenhaCount.textContent = resenhaPlayers.length;
    }

    return { init, render };
})();
