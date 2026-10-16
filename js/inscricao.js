window.Inscricao = (function() {
    const STORAGE_KEY = 'sc2026_inscricoes';

    function init() {
        const form = document.getElementById('form-inscricao');
        const timeSelect = document.getElementById('insc-time');
        const querCamisa = document.getElementById('insc-quer-camisa');
        const camisaFields = document.getElementById('insc-camisa-fields');
        const querBolao = document.getElementById('insc-quer-bolao');
        const bolaoFields = document.getElementById('insc-bolao-fields');
        const posGroup = document.getElementById('insc-posicao-group');
        const timeCamisaGroup = document.getElementById('insc-time-camisa-container');
        const modeloSelect = document.getElementById('insc-modelo');
        const tamSelect = document.getElementById('insc-tamanho');
        const consumoSelect = document.getElementById('insc-consumo');

        // Dynamic sizes based on model
        if (modeloSelect && tamSelect) {
            modeloSelect.addEventListener('change', () => {
                const val = modeloSelect.value;
                tamSelect.innerHTML = '';
                let options = [];
                if (val === 'Jogador' || val === 'Tradicional') {
                    options = [
                        { val: 'PP', label: 'PP' },
                        { val: 'P', label: 'P' },
                        { val: 'M', label: 'M' },
                        { val: 'G', label: 'G' },
                        { val: 'GG', label: 'GG' },
                        { val: 'XGG', label: 'XGG' },
                        { val: 'G1', label: 'G1' },
                        { val: 'G2', label: 'G2' },
                        { val: 'G3', label: 'G3' }
                    ];
                } else if (val === 'Baby Look') {
                    options = [
                        { val: 'BL-P', label: 'BL-P' },
                        { val: 'BL-M', label: 'BL-M' },
                        { val: 'BL-G', label: 'BL-G' },
                        { val: 'BL-GG', label: 'BL-GG' },
                        { val: 'BL-XGG', label: 'BL-XGG' }
                    ];
                } else if (val === 'Infantil') {
                    options = [
                        { val: '2', label: '2' },
                        { val: '4', label: '4' },
                        { val: '6', label: '6' },
                        { val: '8', label: '8' },
                        { val: '10', label: '10' },
                        { val: '12', label: '12' },
                        { val: '14', label: '14' },
                        { val: '16', label: '16' }
                    ];
                }
                options.forEach(opt => {
                    tamSelect.innerHTML += `<option value="${opt.val}">${opt.label}</option>`;
                });
            });
        }

        // Toggle position field & shirt based on participation type
        const consumoGroup = document.getElementById('insc-consumo-group');
        if (timeSelect) {
            timeSelect.addEventListener('change', () => {
                const val = timeSelect.value;
                if (val === 'Somente Camisa') {
                    if (posGroup) posGroup.classList.add('hidden');
                    if (consumoGroup) consumoGroup.classList.add('hidden');
                    if (querCamisa) {
                        querCamisa.checked = true;
                        querCamisa.disabled = true;
                    }
                    if (camisaFields) camisaFields.classList.remove('hidden');
                    if (timeCamisaGroup) timeCamisaGroup.classList.remove('hidden');
                } else if (val === 'Resenha') {
                    if (posGroup) posGroup.classList.add('hidden');
                    if (consumoGroup) consumoGroup.classList.remove('hidden');
                    if (querCamisa) querCamisa.disabled = false;
                    if (timeCamisaGroup) timeCamisaGroup.classList.remove('hidden');
                } else {
                    if (posGroup) posGroup.classList.remove('hidden');
                    if (consumoGroup) consumoGroup.classList.remove('hidden');
                    if (querCamisa) {
                        querCamisa.checked = true;
                        querCamisa.disabled = true;
                    }
                    if (camisaFields) camisaFields.classList.remove('hidden');
                    if (timeCamisaGroup) timeCamisaGroup.classList.add('hidden');
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

        // Toggle bolão fields
        if (querBolao) {
            querBolao.addEventListener('change', () => {
                if (bolaoFields) {
                    bolaoFields.classList.toggle('hidden', !querBolao.checked);
                }
            });
        }

        // Submit form
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const nome = document.getElementById('insc-nome').value.trim();
                const time = document.getElementById('insc-time').value;
                const posicao = (time === 'Resenha' || time === 'Somente Camisa') ? 'Nao Joga' : document.getElementById('insc-posicao').value;
                const consumo = (time === 'Somente Camisa') ? 'Somente Camisa' : document.getElementById('insc-consumo').value;
                const wantShirt = document.getElementById('insc-quer-camisa').checked;
                const wantBolao = querBolao ? querBolao.checked : true;

                if (!nome) {
                    if (window.App) App.showToast('Preencha seu nome completo!');
                    return;
                }

                // Force shirt for players and Somente Camisa
                if ((time === 'Jogador Solteiro' || time === 'Jogador Casado' || time === 'Somente Camisa') && !wantShirt) {
                    if (window.App) App.showToast('Esta modalidade precisa ter camisa!');
                    return;
                }

                const btnSubmit = document.getElementById('btn-enviar-inscricao');
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.textContent = 'Enviando...';
                }

                // Format standardized shirt model: Modelo - Time (incluindo Goleiro separado)
                let modeloFormatado = null;
                if (wantShirt) {
                    const modBase = document.getElementById('insc-modelo').value;
                    let timeCamisa = 'Solteiros';
                    if (time === 'Jogador Solteiro') {
                        timeCamisa = (posicao === 'Goleiro') ? 'Goleiro Solteiros' : 'Solteiros';
                    } else if (time === 'Jogador Casado') {
                        timeCamisa = (posicao === 'Goleiro') ? 'Goleiro Casados' : 'Casados';
                    } else {
                        timeCamisa = document.getElementById('insc-time-camisa').value;
                    }
                    modeloFormatado = `${modBase} - ${timeCamisa}`;
                }

                const rawNum = wantShirt && document.getElementById('insc-numero') ? document.getElementById('insc-numero').value.trim() : '';

                const inscricao = {
                    nome,
                    telefone: null,
                    categoria: time,
                    posicao_campo: posicao,
                    tipo_consumo: consumo,
                    quer_camisa: wantShirt,
                    modelo_camisa: modeloFormatado,
                    tam_camisa: wantShirt ? document.getElementById('insc-tamanho').value : null,
                    num_camisa: rawNum !== '' ? rawNum : null,
                    nome_camisa: wantShirt ? (document.getElementById('insc-nome-camisa').value || '').toUpperCase() : null,
                    bolao_solteiros: wantBolao ? (parseInt(document.getElementById('insc-placar-solteiros').value) || 0) : null,
                    bolao_casados: wantBolao ? (parseInt(document.getElementById('insc-placar-casados').value) || 0) : null,
                    bolao_mensagem: wantBolao ? document.getElementById('insc-mensagem').value.trim() : null,
                    status: 'pendente'
                };

                try {
                    if (window.DB && DB.inscricoes) {
                        await DB.inscricoes.create(inscricao);
                    }

                    form.reset();
                    document.getElementById('insc-placar-solteiros').value = '0';
                    document.getElementById('insc-placar-casados').value = '0';
                    if (querCamisa) querCamisa.checked = true;
                    if (camisaFields) camisaFields.classList.remove('hidden');
                    if (querBolao) querBolao.checked = true;
                    if (bolaoFields) bolaoFields.classList.remove('hidden');

                    if (window.App) {
                        App.showToast('Inscrição enviada com sucesso! Aguarde aprovação do organizador.');
                        await App.refreshAll();
                    }
                } catch (err) {
                    console.error('Erro ao enviar inscricao:', err);
                    if (window.App) App.showToast('Erro ao enviar inscrição. Tente novamente.');
                } finally {
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.textContent = '🚀 Enviar Inscrição';
                    }
                }
            });
        }

        // Admin panel events (delegate)
        const pendentesContainer = document.getElementById('inscricoes-pendentes');
        if (pendentesContainer) {
            pendentesContainer.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = btn.dataset.id;
                if (!id) return;

                if (btn.classList.contains('btn-aprovar-inscricao')) {
                    await aprovarInscricao(id);
                } else if (btn.classList.contains('btn-rejeitar-inscricao')) {
                    await rejeitarInscricao(id);
                }
            });
        }

        // Mural do Bolão Admin actions (Editar / Excluir palpite)
        const muralContainer = document.getElementById('bolao-mural');
        if (muralContainer) {
            muralContainer.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = btn.dataset.id;
                if (!id) return;

                if (btn.classList.contains('btn-edit-bolao')) {
                    openEditBolao(id);
                } else if (btn.classList.contains('btn-delete-bolao')) {
                    await removerPalpiteBolao(id);
                }
            });
        }

        // Form de edição do Bolão
        const bolaoEditForm = document.getElementById('bolao-edit-form');
        if (bolaoEditForm) {
            bolaoEditForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('bolao-edit-id').value;
                const solteiros = parseInt(document.getElementById('bolao-edit-solteiros').value) || 0;
                const casados = parseInt(document.getElementById('bolao-edit-casados').value) || 0;
                const mensagem = document.getElementById('bolao-edit-mensagem').value.trim();

                if (window.DB && DB.inscricoes) {
                    await DB.inscricoes.update(id, {
                        bolao_solteiros: solteiros,
                        bolao_casados: casados,
                        bolao_mensagem: mensagem
                    });
                }

                const modal = document.getElementById('modal-bolao-edit');
                if (modal) modal.classList.add('hidden');
                if (window.App) {
                    await App.refreshAll();
                    App.showToast('Palpite do Bolão atualizado!');
                }
            });
        }
    }

    function openEditBolao(id) {
        const list = (window.App && window.App.state && window.App.state.inscricoes) ? window.App.state.inscricoes : [];
        const item = list.find(i => i.id == id);
        if (!item) return;

        document.getElementById('bolao-edit-id').value = item.id;
        document.getElementById('bolao-edit-nome').textContent = item.nome;
        document.getElementById('bolao-edit-solteiros').value = item.bolao_solteiros ?? 0;
        document.getElementById('bolao-edit-casados').value = item.bolao_casados ?? 0;
        document.getElementById('bolao-edit-mensagem').value = item.bolao_mensagem || '';

        const modal = document.getElementById('modal-bolao-edit');
        if (modal) modal.classList.remove('hidden');
    }

    async function removerPalpiteBolao(id) {
        try {
            if (window.DB && DB.inscricoes) {
                await DB.inscricoes.update(id, {
                    bolao_solteiros: null,
                    bolao_casados: null,
                    bolao_mensagem: null
                });
            }
            if (window.App) {
                await App.refreshAll();
                App.showToast('Palpite removido do Bolão!');
            }
        } catch (err) {
            console.error('Erro ao remover palpite do bolão:', err);
        }
    }

    async function aprovarInscricao(id) {
        let list = [];
        if (window.App && window.App.state && window.App.state.inscricoes) {
            list = window.App.state.inscricoes;
        } else if (window.DB && DB.inscricoes) {
            list = await DB.inscricoes.list();
        }
        const insc = list.find(i => i.id == id);
        if (!insc) return;

        // Calculate valor do churrasco (Crianças e Somente Camisa = 0)
        let valorChurrasco = 0;
        if (insc.tipo_consumo === 'Completo') valorChurrasco = 110;
        else if (insc.tipo_consumo === 'Sem Chopp') valorChurrasco = 80;
        else if (insc.tipo_consumo === 'Crianca Meia' || insc.tipo_consumo === 'Criança' || insc.tipo_consumo === 'Somente Camisa') {
            valorChurrasco = 0;
        }

        // Calculate camisa price if requested
        let precoCamisa = 0;
        if (insc.quer_camisa && insc.modelo_camisa && window.Camisas) {
            precoCamisa = Camisas.calcularPrecoCamisa(insc.modelo_camisa, insc.tam_camisa, insc);
        }

        const participanteData = {
            nome: insc.nome,
            telefone: null,
            categoria: insc.categoria,
            posicao_campo: insc.posicao_campo,
            tipo_consumo: insc.tipo_consumo,
            modelo_camisa: insc.modelo_camisa || (insc.quer_camisa ? 'Tradicional' : null),
            tam_camisa: insc.tam_camisa || (insc.quer_camisa ? 'M' : null),
            num_camisa: insc.num_camisa,
            nome_camisa: insc.nome_camisa || '',
            responsavel_id: null,
            valor_total: valorChurrasco,
            valor_pago: 0,
            valor_camisa: precoCamisa,
            camisa_pago: 0
        };

        try {
            await DB.participantes.create(participanteData);

            // Mark as approved in DB
            if (window.DB && DB.inscricoes) {
                await DB.inscricoes.update(id, { status: 'aprovado' });
            }

            if (window.App) {
                await App.refreshAll();
                App.showToast(`${insc.nome} foi aprovado(a) e adicionado(a) ao evento!`);
            }
        } catch (err) {
            console.error('Error approving inscription:', err);
            if (window.App) App.showToast('Erro ao aprovar inscrição.');
        }
    }

    async function rejeitarInscricao(id) {
        try {
            if (window.DB && DB.inscricoes) {
                await DB.inscricoes.update(id, { status: 'rejeitado' });
            }

            if (window.App) {
                await App.refreshAll();
                App.showToast('Inscrição rejeitada.');
            }
        } catch (err) {
            console.error('Error rejecting inscription:', err);
        }
    }

    function render(state) {
        const list = (state && state.inscricoes) ? state.inscricoes : [];
        const isAdmin = !!(state && state.isAdmin);
        const pendentes = list.filter(i => i.status === 'pendente');
        const palpitesBolao = list.filter(i => i.status === 'aprovado' && i.bolao_solteiros !== null && i.bolao_casados !== null && i.bolao_solteiros !== undefined && i.bolao_casados !== undefined);

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
                    const hasBolao = i.bolao_solteiros !== null && i.bolao_casados !== null && i.bolao_solteiros !== undefined && i.bolao_casados !== undefined;
                    const bolaoText = hasBolao ? `${i.bolao_solteiros} × ${i.bolao_casados}` : 'Sem palpite';
                    return `
                        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="font-semibold text-white">${timeIcon} ${i.nome}</p>
                                    <p class="text-xs text-slate-400">${i.categoria} • ${i.tipo_consumo}</p>
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

        // Render bolão mural (approved & opted-in only)
        const muralContainer = document.getElementById('bolao-mural');
        const bolaoCount = document.getElementById('bolao-count');
        if (muralContainer) {
            if (palpitesBolao.length === 0) {
                muralContainer.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-4">Nenhum palpite ainda. Seja o primeiro!</p>';
            } else {
                const adminBtnsClass = isAdmin ? '' : 'hidden';
                muralContainer.innerHTML = palpitesBolao.map(i => {
                    const solteirosWin = i.bolao_solteiros > i.bolao_casados;
                    const casadosWin = i.bolao_casados > i.bolao_solteiros;
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
                            <div class="flex items-center gap-2 shrink-0">
                                <div class="flex items-center gap-1 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-700/50">
                                    <span class="text-lg font-bold ${solteirosWin ? 'text-emerald-400' : 'text-slate-300'}">${i.bolao_solteiros}</span>
                                    <span class="text-xs text-slate-500">×</span>
                                    <span class="text-lg font-bold ${casadosWin ? 'text-emerald-400' : 'text-slate-300'}">${i.bolao_casados}</span>
                                </div>
                                <div class="flex items-center gap-1 admin-only ${adminBtnsClass}">
                                    <button class="btn-edit-bolao p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-xs transition-colors" data-id="${i.id}" title="Editar Palpite">✏️</button>
                                    <button class="btn-delete-bolao p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-xs transition-colors" data-id="${i.id}" title="Apagar do Bolão">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        if (bolaoCount) bolaoCount.textContent = palpitesBolao.length;
    }

    return { init, render };
})();
