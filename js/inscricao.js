window.Inscricao = (function() {
    const STORAGE_KEY = 'sc2026_inscricoes';

    function getInscricoes() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveInscricoes(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function init() {
        const form = document.getElementById('form-inscricao');
        const timeSelect = document.getElementById('insc-time');
        const querCamisa = document.getElementById('insc-quer-camisa');
        const camisaFields = document.getElementById('insc-camisa-fields');
        const posGroup = document.getElementById('insc-posicao-group');

        // Toggle position field based on team
        if (timeSelect) {
            timeSelect.addEventListener('change', () => {
                if (timeSelect.value === 'Resenha') {
                    if (posGroup) posGroup.classList.add('hidden');
                    // Resenha can opt out of shirt
                    if (querCamisa) querCamisa.disabled = false;
                } else {
                    if (posGroup) posGroup.classList.remove('hidden');
                    // Jogadores MUST have shirt
                    if (querCamisa) {
                        querCamisa.checked = true;
                        querCamisa.disabled = true;
                    }
                    if (camisaFields) camisaFields.classList.remove('hidden');
                }
            });
        }

        // Toggle camisa fields
        if (querCamisa) {
            querCamisa.addEventListener('change', () => {
                if (camisaFields) {
                    camisaFields.classList.toggle('hidden', !querCamisa.checked);
                }
            });
        }

        // Submit form
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const nome = document.getElementById('insc-nome').value.trim();
                const telefone = document.getElementById('insc-telefone').value.trim();
                const time = document.getElementById('insc-time').value;
                const posicao = time === 'Resenha' ? 'Nao Joga' : document.getElementById('insc-posicao').value;
                const consumo = document.getElementById('insc-consumo').value;
                const wantShirt = document.getElementById('insc-quer-camisa').checked;

                if (!nome || !telefone) {
                    if (window.App) App.showToast('Preencha nome e telefone!');
                    return;
                }

                // Force shirt for players
                if (time !== 'Resenha' && !wantShirt) {
                    if (window.App) App.showToast('Jogadores precisam ter camisa!');
                    return;
                }

                const inscricao = {
                    id: Date.now(),
                    nome,
                    telefone,
                    categoria: time,
                    posicao_campo: posicao,
                    tipo_consumo: consumo,
                    quer_camisa: wantShirt,
                    modelo_camisa: wantShirt ? document.getElementById('insc-modelo').value : null,
                    tam_camisa: wantShirt ? document.getElementById('insc-tamanho').value : null,
                    num_camisa: wantShirt && document.getElementById('insc-numero').value ? parseInt(document.getElementById('insc-numero').value) : null,
                    nome_camisa: wantShirt ? (document.getElementById('insc-nome-camisa').value || '').toUpperCase() : null,
                    bolao_solteiros: parseInt(document.getElementById('insc-placar-solteiros').value) || 0,
                    bolao_casados: parseInt(document.getElementById('insc-placar-casados').value) || 0,
                    bolao_mensagem: document.getElementById('insc-mensagem').value.trim(),
                    status: 'pendente', // pendente, aprovado, rejeitado
                    created_at: new Date().toISOString()
                };

                const list = getInscricoes();
                list.push(inscricao);
                saveInscricoes(list);

                form.reset();
                document.getElementById('insc-placar-solteiros').value = '0';
                document.getElementById('insc-placar-casados').value = '0';
                if (querCamisa) querCamisa.checked = true;
                if (camisaFields) camisaFields.classList.remove('hidden');

                if (window.App) App.showToast('Inscrição enviada com sucesso! Aguarde aprovação do organizador.');
                render(window.App ? App.state : {});
            });
        }

        // Admin panel events (delegate)
        const pendentesContainer = document.getElementById('inscricoes-pendentes');
        if (pendentesContainer) {
            pendentesContainer.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = parseInt(btn.dataset.id);
                if (!id) return;

                if (btn.classList.contains('btn-aprovar-inscricao')) {
                    await aprovarInscricao(id);
                } else if (btn.classList.contains('btn-rejeitar-inscricao')) {
                    rejeitarInscricao(id);
                }
            });
        }
    }

    async function aprovarInscricao(id) {
        const list = getInscricoes();
        const insc = list.find(i => i.id === id);
        if (!insc) return;

        // Calculate valor
        let valor = 0;
        if (insc.tipo_consumo === 'Completo') valor = 110;
        else if (insc.tipo_consumo === 'Sem Chopp') valor = 80;
        else if (insc.tipo_consumo === 'Crianca Meia') valor = 40;

        const participanteData = {
            nome: insc.nome,
            telefone: insc.telefone,
            categoria: insc.categoria,
            posicao_campo: insc.posicao_campo,
            tipo_consumo: insc.tipo_consumo,
            modelo_camisa: insc.modelo_camisa || 'Jogador',
            tam_camisa: insc.tam_camisa || 'M',
            num_camisa: insc.num_camisa,
            nome_camisa: insc.nome_camisa || '',
            responsavel_id: null,
            valor_total: valor
        };

        try {
            const created = await DB.participantes.create(participanteData);
            await DB.parcelas.createForParticipante(created.id, valor);

            // Mark as approved
            insc.status = 'aprovado';
            saveInscricoes(list);

            if (window.App) {
                await App.refreshAll();
                App.showToast(`${insc.nome} foi aprovado(a) e adicionado(a) ao evento!`);
            }
        } catch (err) {
            console.error('Error approving inscription:', err);
            if (window.App) App.showToast('Erro ao aprovar inscrição.');
        }
    }

    function rejeitarInscricao(id) {
        const list = getInscricoes();
        const insc = list.find(i => i.id === id);
        if (!insc) return;

        insc.status = 'rejeitado';
        saveInscricoes(list);

        if (window.App) {
            App.showToast(`Inscrição de ${insc.nome} foi rejeitada.`);
        }
        render(window.App ? App.state : {});
    }

    function render(state) {
        const list = getInscricoes();
        const pendentes = list.filter(i => i.status === 'pendente');
        const aprovados = list.filter(i => i.status === 'aprovado');

        // Render pending inscriptions (admin only)
        const pendentesContainer = document.getElementById('inscricoes-pendentes');
        const pendentesCount = document.getElementById('pendentes-count');
        if (pendentesContainer) {
            if (pendentes.length === 0) {
                pendentesContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Nenhuma inscrição pendente.</p>';
            } else {
                pendentesContainer.innerHTML = pendentes.map(i => {
                    const timeIcon = i.categoria === 'Jogador Solteiro' ? '⚪' : i.categoria === 'Jogador Casado' ? '⚫' : '🍻';
                    const camisaInfo = i.quer_camisa ? `${i.modelo_camisa || ''} ${i.tam_camisa || ''} ${i.num_camisa ? '#' + i.num_camisa : ''} ${i.nome_camisa || ''}`.trim() : 'Sem camisa';
                    const bolaoText = `${i.bolao_solteiros} × ${i.bolao_casados}`;
                    return `
                        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="font-semibold text-white">${timeIcon} ${i.nome}</p>
                                    <p class="text-xs text-slate-400">📱 ${i.telefone} • ${i.tipo_consumo}</p>
                                </div>
                                <span class="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">Pendente</span>
                            </div>
                            <div class="flex flex-wrap gap-2 text-xs">
                                <span class="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">${i.posicao_campo}</span>
                                <span class="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">👕 ${camisaInfo}</span>
                                <span class="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">🎯 ${bolaoText}</span>
                            </div>
                            ${i.bolao_mensagem ? `<p class="text-xs text-slate-400 italic">"${i.bolao_mensagem}"</p>` : ''}
                            <div class="flex gap-2 pt-1">
                                <button class="btn-aprovar-inscricao flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 rounded-lg font-medium transition-colors" data-id="${i.id}">✓ Aprovar</button>
                                <button class="btn-rejeitar-inscricao flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs py-1.5 rounded-lg font-medium transition-colors" data-id="${i.id}">✗ Rejeitar</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        if (pendentesCount) pendentesCount.textContent = pendentes.length;

        // Render bolão mural (approved only)
        const muralContainer = document.getElementById('bolao-mural');
        const bolaoCount = document.getElementById('bolao-count');
        if (muralContainer) {
            if (aprovados.length === 0) {
                muralContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Nenhum palpite ainda. Seja o primeiro!</p>';
            } else {
                muralContainer.innerHTML = aprovados.map(i => {
                    const solteirosWin = i.bolao_solteiros > i.bolao_casados;
                    const casadosWin = i.bolao_casados > i.bolao_solteiros;
                    const empate = i.bolao_solteiros === i.bolao_casados;
                    return `
                        <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center gap-3">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    ${i.nome.substring(0, 2).toUpperCase()}
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-white truncate">${i.nome}</p>
                                    ${i.bolao_mensagem ? `<p class="text-xs text-slate-400 truncate italic">${i.bolao_mensagem}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <span class="text-lg font-bold ${solteirosWin ? 'text-emerald-400' : 'text-slate-300'}">${i.bolao_solteiros}</span>
                                <span class="text-xs text-slate-500">×</span>
                                <span class="text-lg font-bold ${casadosWin ? 'text-emerald-400' : 'text-slate-300'}">${i.bolao_casados}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        if (bolaoCount) bolaoCount.textContent = aprovados.length;
    }

    return { init, render };
})();
