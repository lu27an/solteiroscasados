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

        // Botões de Placar Oficial e WhatsApp do Bolão
        const btnSalvarPlacar = document.getElementById('btn-bolao-salvar-placar');
        if (btnSalvarPlacar) {
            btnSalvarPlacar.addEventListener('click', async () => {
                const sEl = document.getElementById('bolao-oficial-solteiros');
                const cEl = document.getElementById('bolao-oficial-casados');
                const sVal = sEl && sEl.value !== '' ? parseInt(sEl.value) : 0;
                const cVal = cEl && cEl.value !== '' ? parseInt(cEl.value) : 0;
                await salvarPlacarOficial(sVal, cVal);
            });
        }

        const btnLimparPlacar = document.getElementById('btn-bolao-limpar-placar');
        if (btnLimparPlacar) {
            btnLimparPlacar.addEventListener('click', async () => {
                await limparPlacarOficial();
            });
        }

        const btnZapApostas = document.getElementById('btn-bolao-whatsapp-apostas');
        if (btnZapApostas) {
            btnZapApostas.addEventListener('click', compartilharApostasWhatsapp);
        }

        const btnZapVencedores = document.getElementById('btn-bolao-whatsapp-vencedores');
        if (btnZapVencedores) {
            btnZapVencedores.addEventListener('click', compartilharVencedoresWhatsapp);
        }
    }

    const PLACAR_STORAGE_KEY = 'sc2026_bolao_placar_oficial';
    const PLACAR_RECORD_NAME = '__PLACAR_OFICIAL_BOLAO__';

    function getPlacarOficial(list = []) {
        const dbRec = (list || []).find(i => i.status === 'placar_oficial' || i.nome === PLACAR_RECORD_NAME);
        if (dbRec && dbRec.bolao_solteiros !== null && dbRec.bolao_casados !== null && dbRec.bolao_solteiros !== undefined && dbRec.bolao_casados !== undefined) {
            return {
                solteiros: Number(dbRec.bolao_solteiros),
                casados: Number(dbRec.bolao_casados),
                id: dbRec.id
            };
        }
        try {
            const raw = localStorage.getItem(PLACAR_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.solteiros !== null && parsed.casados !== null && parsed.solteiros !== undefined && parsed.casados !== undefined) {
                    return {
                        solteiros: Number(parsed.solteiros),
                        casados: Number(parsed.casados)
                    };
                }
            }
        } catch (e) {}
        return null;
    }

    async function salvarPlacarOficial(solteiros, casados) {
        const s = Math.max(0, parseInt(solteiros) || 0);
        const c = Math.max(0, parseInt(casados) || 0);
        try {
            localStorage.setItem(PLACAR_STORAGE_KEY, JSON.stringify({ solteiros: s, casados: c }));
        } catch (e) {}

        if (window.DB && DB.inscricoes) {
            try {
                const list = (window.App && window.App.state && window.App.state.inscricoes) ? window.App.state.inscricoes : await DB.inscricoes.list();
                const existing = list.find(i => i.status === 'placar_oficial' || i.nome === PLACAR_RECORD_NAME);
                if (existing) {
                    await DB.inscricoes.update(existing.id, {
                        bolao_solteiros: s,
                        bolao_casados: c,
                        status: 'placar_oficial'
                    });
                } else {
                    await DB.inscricoes.create({
                        nome: PLACAR_RECORD_NAME,
                        telefone: null,
                        categoria: 'Sistema',
                        posicao_campo: 'Nao Joga',
                        tipo_consumo: 'Sistema',
                        quer_camisa: false,
                        bolao_solteiros: s,
                        bolao_casados: c,
                        bolao_mensagem: 'Placar Oficial',
                        status: 'placar_oficial'
                    });
                }
            } catch (e) {
                console.warn('Fallback localStorage para placar oficial:', e);
            }
        }

        if (window.App) {
            await App.refreshAll();
            App.showToast(`Placar oficial definido: Solteiros ${s} × ${c} Casados!`);
        }
    }

    async function limparPlacarOficial() {
        try {
            localStorage.removeItem(PLACAR_STORAGE_KEY);
        } catch (e) {}

        const sEl = document.getElementById('bolao-oficial-solteiros');
        const cEl = document.getElementById('bolao-oficial-casados');
        if (sEl) sEl.value = '';
        if (cEl) cEl.value = '';

        if (window.DB && DB.inscricoes) {
            try {
                const list = (window.App && window.App.state && window.App.state.inscricoes) ? window.App.state.inscricoes : await DB.inscricoes.list();
                const existing = list.find(i => i.status === 'placar_oficial' || i.nome === PLACAR_RECORD_NAME);
                if (existing) {
                    await DB.inscricoes.delete(existing.id);
                }
            } catch (e) {}
        }

        if (window.App) {
            await App.refreshAll();
            App.showToast('Resultado oficial do Bolão limpo.');
        }
    }

    function getPalpitesValidos(list = []) {
        return (list || []).filter(i =>
            i.status === 'aprovado' &&
            i.nome !== PLACAR_RECORD_NAME &&
            i.bolao_solteiros !== null &&
            i.bolao_casados !== null &&
            i.bolao_solteiros !== undefined &&
            i.bolao_casados !== undefined
        );
    }

    function apurarVencedores(palpitesBolao, placar) {
        if (!placar) {
            return { exatos: [], resultado: [], vencedores: [], tipoVitoria: null };
        }
        const sOficial = Number(placar.solteiros);
        const cOficial = Number(placar.casados);
        const signOficial = Math.sign(sOficial - cOficial);

        const exatos = palpitesBolao.filter(i => Number(i.bolao_solteiros) === sOficial && Number(i.bolao_casados) === cOficial);
        const resultado = palpitesBolao.filter(i => Math.sign(Number(i.bolao_solteiros) - Number(i.bolao_casados)) === signOficial);

        if (exatos.length > 0) {
            return { exatos, resultado, vencedores: exatos, tipoVitoria: 'Cravou o Placar Exato 🎯' };
        }
        if (resultado.length > 0) {
            return { exatos, resultado, vencedores: resultado, tipoVitoria: 'Acertou o Vencedor/Empate (Sem placar exato) ⚽' };
        }
        return { exatos: [], resultado: [], vencedores: [], tipoVitoria: 'Nenhum acertador' };
    }

    function gerarTextoApostasBolaoWhatsapp(state) {
        const list = (state && state.inscricoes) ? state.inscricoes : [];
        const palpites = getPalpitesValidos(list);

        let vSolteiros = 0;
        let vCasados = 0;
        let empates = 0;

        const linhas = palpites.map(i => {
            const s = Number(i.bolao_solteiros);
            const c = Number(i.bolao_casados);
            if (s > c) vSolteiros++;
            else if (c > s) vCasados++;
            else empates++;

            const msg = i.bolao_mensagem ? ` — _"${i.bolao_mensagem}"_` : '';
            return `• *${i.nome}*: ⚪ ${s} × ${c} ⚫${msg}`;
        });

        let text = `🎯 *PALPITES DO BOLÃO - SOLTEIROS & CASADOS 2026*\n`;
        text += `Total de Apostas: *${palpites.length} palpites*\n`;
        text += `📊 * Favoritismo:* ⚪ Solteiros (${vSolteiros}) | 🤝 Empate (${empates}) | ⚫ Casados (${vCasados})\n\n`;
        text += `📋 *COMO CADA UM APOSTOU:*\n`;
        text += linhas.length > 0 ? linhas.join('\n') : '(Nenhuma aposta registrada ainda)';

        return text.trim();
    }

    function compartilharApostasWhatsapp() {
        if (!window.App || !window.App.state) return;
        const text = gerarTextoApostasBolaoWhatsapp(window.App.state);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.App) window.App.showToast('Lista de apostas do Bolão copiada!');
            });
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    function gerarTextoVencedoresBolaoWhatsapp(state, placarOverride = null) {
        const list = (state && state.inscricoes) ? state.inscricoes : [];
        const palpites = getPalpitesValidos(list);
        const placar = placarOverride || getPlacarOficial(list);

        if (!placar) {
            return '';
        }

        const apuracao = apurarVencedores(palpites, placar);
        const s = placar.solteiros;
        const c = placar.casados;
        const resultadoJogo = s > c ? 'Vitória dos SOLTEIROS ⚪' : c > s ? 'Vitória dos CASADOS ⚫' : 'EMPATE 🤝';

        let text = `🏆 *RESULTADO OFICIAL DO BOLÃO - SOLTEIROS & CASADOS 2026* 🏆\n\n`;
        text += `⚽ *PLACAR FINAL DO JOGO:*\n`;
        text += `⚪ *Solteiros ${s} × ${c} Casados* ⚫\n`;
        text += `_(${resultadoJogo})_\n\n`;

        if (apuracao.vencedores.length > 0) {
            text += `🎉 *VENCEDOR(ES) DO BOLÃO (${apuracao.tipoVitoria}):*\n`;
            apuracao.vencedores.forEach(v => {
                const msg = v.bolao_mensagem ? ` — _"${v.bolao_mensagem}"_` : '';
                text += `🥇 *${v.nome}* (Apostou: ${v.bolao_solteiros} × ${v.bolao_casados})${msg}\n`;
            });
            text += `\n👏 Parabéns por cravar o resultado no clássico Solteiros & Casados 2026!`;
        } else {
            text += `😱 *Ninguém acertou o placar ou o resultado deste clássico!*`;
        }

        return text.trim();
    }

    async function compartilharVencedoresWhatsapp() {
        if (!window.App || !window.App.state) return;
        const sEl = document.getElementById('bolao-oficial-solteiros');
        const cEl = document.getElementById('bolao-oficial-casados');
        let placar = getPlacarOficial(window.App.state.inscricoes);

        if (sEl && cEl && sEl.value !== '' && cEl.value !== '') {
            const sInput = parseInt(sEl.value) || 0;
            const cInput = parseInt(cEl.value) || 0;
            if (!placar || placar.solteiros !== sInput || placar.casados !== cInput) {
                await salvarPlacarOficial(sInput, cInput);
                placar = { solteiros: sInput, casados: cInput };
            }
        }

        if (!placar) {
            window.App.showToast('Defina primeiro o placar final do jogo para anunciar o vencedor!');
            return;
        }

        const text = gerarTextoVencedoresBolaoWhatsapp(window.App.state, placar);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.App) window.App.showToast('Mensagem dos vencedores copiada!');
            });
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
        const pendentes = list.filter(i => i.status === 'pendente' && i.nome !== PLACAR_RECORD_NAME);
        const palpitesBolao = getPalpitesValidos(list);
        const placarOficial = getPlacarOficial(list);
        const apuracao = apurarVencedores(palpitesBolao, placarOficial);
        const vencedorIds = new Set((apuracao.vencedores || []).map(v => String(v.id)));

        // Sync inputs do Admin se não estiverem com foco
        const sInput = document.getElementById('bolao-oficial-solteiros');
        const cInput = document.getElementById('bolao-oficial-casados');
        if (placarOficial) {
            if (sInput && document.activeElement !== sInput) sInput.value = placarOficial.solteiros;
            if (cInput && document.activeElement !== cInput) cInput.value = placarOficial.casados;
        }

        // Renderizar Banner de Resultado Oficial e Vencedores
        const bannerEl = document.getElementById('bolao-resultado-banner');
        if (bannerEl) {
            if (!placarOficial) {
                bannerEl.classList.add('hidden');
                bannerEl.innerHTML = '';
            } else {
                bannerEl.classList.remove('hidden');
                const vencedoresHtml = apuracao.vencedores.length > 0
                    ? apuracao.vencedores.map(v => `
                        <div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 text-amber-300 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow">
                            <span>🥇 ${v.nome}</span>
                            <span class="text-xs bg-slate-900/80 text-white px-2 py-0.5 rounded-lg">${v.bolao_solteiros} × ${v.bolao_casados}</span>
                        </div>
                    `).join('')
                    : `<p class="text-sm text-slate-300 italic">Ninguém acertou o placar ou o resultado deste jogo!</p>`;

                bannerEl.innerHTML = `
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="text-center sm:text-left">
                            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-0.5 rounded-full">⚽ Placar Final Oficial</span>
                            <div class="flex items-center justify-center sm:justify-start gap-3 mt-2">
                                <span class="text-base sm:text-lg font-bold text-white">⚪ Solteiros</span>
                                <span class="text-2xl sm:text-3xl font-black text-emerald-400 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-700">${placarOficial.solteiros} × ${placarOficial.casados}</span>
                                <span class="text-base sm:text-lg font-bold text-white">Casados ⚫</span>
                            </div>
                        </div>
                        <div class="flex-1 text-center sm:text-right">
                            <p class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">🏆 Vencedor(es) — ${apuracao.tipoVitoria}</p>
                            <div class="flex flex-wrap gap-2 justify-center sm:justify-end">
                                ${vencedoresHtml}
                            </div>
                        </div>
                    </div>
                `;
            }
        }

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
                    const isWinner = vencedorIds.has(String(i.id));
                    const cardClass = isWinner
                        ? 'bg-amber-950/30 border-amber-500/70 shadow-lg shadow-amber-950/30'
                        : 'bg-slate-800/50 border-slate-700/50';
                    const winnerBadge = isWinner
                        ? '<span class="ml-2 text-[10px] font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">🏆 Vencedor</span>'
                        : '';

                    return `
                        <div class="${cardClass} rounded-lg p-3 border flex items-center gap-3">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <div class="w-8 h-8 rounded-full ${isWinner ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-white'} flex items-center justify-center text-xs font-bold shrink-0">
                                    ${isWinner ? '🏆' : i.nome.substring(0, 2).toUpperCase()}
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-white truncate flex items-center">${i.nome}${winnerBadge}</p>
                                    ${i.bolao_mensagem ? `<p class="text-xs text-slate-400 truncate italic">${i.bolao_mensagem}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <div class="flex items-center gap-1 bg-slate-900/70 px-2.5 py-1 rounded-lg border ${isWinner ? 'border-amber-500/60' : 'border-slate-700/50'}">
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

    return {
        init,
        render,
        apurarVencedores,
        gerarTextoApostasBolaoWhatsapp,
        gerarTextoVencedoresBolaoWhatsapp,
        salvarPlacarOficial,
        limparPlacarOficial
    };
})();
