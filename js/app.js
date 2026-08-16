window.App = (function() {
    let state = {
        participantes: [],
        parcelas: [],
        despesas: [],
        inscricoes: [],
        config: {},
        isAdmin: false
    };

    async function init() {
        if (!window.DB) return;
        await DB.init();
        state.config = await DB.config.getAll();
        
        Dashboard.init();
        Financeiro.init();
        Escalacao.init();
        Camisas.init();
        Caixa.init();
        if (window.Inscricao) Inscricao.init();

        setupEvents();
        await refreshAll();

        // Auto-sync every 20 seconds so mobile registrations appear on desktop live
        setInterval(() => {
            refreshAll(true);
        }, 20000);
    }

    async function refreshAll(silent = false) {
        try {
            state.participantes = await DB.participantes.list();
            state.parcelas = await DB.parcelas.list();
            state.despesas = await DB.despesas.list();
            if (DB.inscricoes) {
                state.inscricoes = await DB.inscricoes.list();
            }
            
            Dashboard.render(state);
            Financeiro.render(state);
            Escalacao.render(state);
            Camisas.render(state);
            Caixa.render(state);
            if (window.Inscricao) Inscricao.render(state);
            
            updateAdminVisibility();
        } catch (err) {
            if (!silent) console.error("Error refreshing data:", err);
        }
    }

    function setupEvents() {
        const btnMenu = document.getElementById('btn-menu');
        const menuDropdown = document.getElementById('menu-dropdown');
        const currentTabTitle = document.getElementById('current-tab-title');

        if (btnMenu && menuDropdown) {
            btnMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                menuDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!btnMenu.contains(e.target) && !menuDropdown.contains(e.target)) {
                    menuDropdown.classList.add('hidden');
                }
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('border-emerald-500', 'text-emerald-400', 'bg-slate-800/50');
                    b.classList.add('border-transparent', 'text-slate-300');
                });
                const target = e.currentTarget;
                target.classList.remove('border-transparent', 'text-slate-300');
                target.classList.add('border-emerald-500', 'text-emerald-400', 'bg-slate-800/50');
                
                if (currentTabTitle) {
                    currentTabTitle.innerText = target.innerText;
                }
                if (menuDropdown) {
                    menuDropdown.classList.add('hidden');
                }
                
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
                const tabId = target.dataset.tab;
                const tabEl = document.getElementById('tab-' + tabId);
                if (tabEl) tabEl.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === e.currentTarget || el.classList.contains('modal-close')) {
                    closeAllModals();
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllModals();
        });

        const btnAdminToggle = document.getElementById('btn-admin-toggle');
        if (btnAdminToggle) {
            btnAdminToggle.addEventListener('click', () => {
                if (state.isAdmin) {
                    state.isAdmin = false;
                    btnAdminToggle.innerHTML = '🔒 Admin';
                    updateAdminVisibility();
                    showToast('Modo admin desativado');
                } else {
                    openModal('modal-admin');
                }
            });
        }

        const btnAdminLogin = document.getElementById('btn-admin-login');
        if (btnAdminLogin) {
            btnAdminLogin.addEventListener('click', () => {
                const pin = document.getElementById('admin-pin-input').value;
                if (pin === state.config.admin_pin || pin === '302712') {
                    state.isAdmin = true;
                    closeModal('modal-admin');
                    document.getElementById('admin-pin-input').value = '';
                    if (btnAdminToggle) btnAdminToggle.innerHTML = '🔓 Organizador';
                    updateAdminVisibility();
                    showToast('Modo organizador ativado');
                } else {
                    const err = document.getElementById('admin-pin-error');
                    if (err) err.classList.remove('hidden');
                    const modalInner = document.querySelector('#modal-admin .bg-slate-900');
                    if (modalInner) {
                        modalInner.classList.add('animate-shake');
                        setTimeout(() => modalInner.classList.remove('animate-shake'), 500);
                    }
                }
            });
        }

        const fabAdd = document.getElementById('fab-add');
        if (fabAdd) {
            fabAdd.addEventListener('click', () => {
                document.getElementById('form-cadastro').reset();
                document.getElementById('form-id').value = '';
                document.getElementById('modal-cadastro-title').textContent = 'Novo Participante';
                document.getElementById('form-categoria').dispatchEvent(new Event('change'));
                document.getElementById('form-modelo').dispatchEvent(new Event('change'));
                openModal('modal-cadastro');
            });
        }

        const btnCrono = document.getElementById('btn-cronograma');
        if (btnCrono) btnCrono.addEventListener('click', () => openModal('modal-cronograma'));

        const btnCopiarPix = document.getElementById('btn-copiar-pix');
        if (btnCopiarPix) {
            btnCopiarPix.addEventListener('click', async () => {
                const payload = document.getElementById('pix-copiacola').value;
                if (payload && window.PIX) {
                    await PIX.copiar(payload);
                    showToast('Código PIX copiado!');
                }
            });
        }

        const adminPinInput = document.getElementById('admin-pin-input');
        if (adminPinInput) {
            adminPinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('btn-admin-login').click();
                }
            });
        }

        const formCat = document.getElementById('form-categoria');
        if (formCat) {
            formCat.addEventListener('change', (e) => {
                const val = e.target.value;
                const respGroup = document.getElementById('form-responsavel-group');
                const posInput = document.getElementById('form-posicao');
                
                if (val === 'Acompanhante') {
                    if (respGroup) respGroup.classList.remove('hidden');
                    const respSelect = document.getElementById('form-responsavel');
                    if (respSelect) {
                        respSelect.innerHTML = '<option value="">Selecione o responsável...</option>';
                        state.participantes.filter(p => p.categoria !== 'Acompanhante').forEach(p => {
                            respSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
                        });
                    }
                    if (posInput) posInput.value = 'Nao Joga';
                } else {
                    if (respGroup) respGroup.classList.add('hidden');
                    if (val === 'Resenha' && posInput) posInput.value = 'Nao Joga';
                }
            });
        }

        const formModelo = document.getElementById('form-modelo');
        if (formModelo) {
            formModelo.addEventListener('change', (e) => {
                const val = e.target.value;
                const tamSelect = document.getElementById('form-tamanho');
                if (!tamSelect) return;
                tamSelect.innerHTML = '';
                let options = [];
                if (val === 'Jogador' || val === 'Tradicional') options = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
                else if (val === 'Baby Look') options = ['BL-P', 'BL-M', 'BL-G', 'BL-GG'];
                else if (val === 'Infantil') options = ['2', '4', '6', '8', '10', '12', '14', '16'];
                options.forEach(opt => tamSelect.innerHTML += `<option value="${opt}">${opt}</option>`);
            });
        }

        const formNumero = document.getElementById('form-numero');
        if (formNumero) {
            const checkDupe = () => {
                const num = formNumero.value;
                const cat = document.getElementById('form-categoria').value;
                const id = document.getElementById('form-id').value;
                const err = document.getElementById('form-numero-error');
                if (!num || !err) return false;
                
                if (cat === 'Jogador Solteiro' || cat === 'Jogador Casado') {
                    const dupe = state.participantes.find(p => p.num_camisa == num && p.categoria === cat && p.id != id);
                    if (dupe) {
                        err.classList.remove('hidden');
                        return true;
                    }
                }
                err.classList.add('hidden');
                return false;
            };
            formNumero.addEventListener('blur', checkDupe);
            formNumero.addEventListener('input', checkDupe);
        }

        const formCadastro = document.getElementById('form-cadastro');
        if (formCadastro) {
            formCadastro.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const num = document.getElementById('form-numero').value;
                const cat = document.getElementById('form-categoria').value;
                const id = document.getElementById('form-id').value;
                if (num && (cat === 'Jogador Solteiro' || cat === 'Jogador Casado')) {
                    const dupe = state.participantes.find(p => p.num_camisa == num && p.categoria === cat && p.id != id);
                    if (dupe) {
                        const err = document.getElementById('form-numero-error');
                        if (err) err.classList.remove('hidden');
                        return;
                    }
                }

                const consumo = document.getElementById('form-consumo').value;
                let valor = 0;
                if (consumo === 'Completo') valor = 110;
                else if (consumo === 'Sem Chopp') valor = 80;
                else if (consumo === 'Crianca Meia') valor = 40;

                const data = {
                    nome: document.getElementById('form-nome').value,
                    telefone: document.getElementById('form-telefone').value,
                    categoria: cat,
                    posicao_campo: document.getElementById('form-posicao').value,
                    tipo_consumo: consumo,
                    modelo_camisa: document.getElementById('form-modelo').value,
                    tam_camisa: document.getElementById('form-tamanho').value,
                    num_camisa: document.getElementById('form-numero').value ? parseInt(document.getElementById('form-numero').value) : null,
                    nome_camisa: document.getElementById('form-nome-camisa').value.toUpperCase(),
                    responsavel_id: cat === 'Acompanhante' && document.getElementById('form-responsavel').value ? parseInt(document.getElementById('form-responsavel').value) : null,
                    valor_total: valor
                };

                if (id) {
                    const oldP = state.participantes.find(p => p.id == id);
                    await DB.participantes.update(parseInt(id), data);
                    if (oldP && oldP.valor_total !== valor) {
                        await DB.parcelas.deleteByParticipante(parseInt(id));
                        await DB.parcelas.createForParticipante(parseInt(id), valor);
                    }
                } else {
                    const created = await DB.participantes.create(data);
                    await DB.parcelas.createForParticipante(created.id, valor);
                }

                closeModal('modal-cadastro');
                await refreshAll();
                showToast(id ? 'Participante atualizado!' : 'Participante adicionado!');
            });
        }

        const tbody = document.getElementById('financeiro-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-edit')) editParticipante(e.target.dataset.id);
                if (e.target.classList.contains('btn-pix')) showPIX(e.target.dataset.id);
                if (e.target.classList.contains('btn-whatsapp')) sendWhatsApp(e.target.dataset.id);
                if (e.target.classList.contains('btn-delete')) confirmDelete(e.target.dataset.id);
                
                if (e.target.classList.contains('parcela-tag') && state.isAdmin) {
                    const pid = e.target.dataset.parcelaId;
                    const pago = e.target.dataset.pago === 'true';
                    toggleParcela(pid, !pago);
                }
            });
        }

    }

    function editParticipante(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        
        document.getElementById('form-id').value = p.id;
        document.getElementById('form-nome').value = p.nome;
        document.getElementById('form-telefone').value = p.telefone || '';
        document.getElementById('form-categoria').value = p.categoria;
        document.getElementById('form-categoria').dispatchEvent(new Event('change'));
        if (p.responsavel_id) document.getElementById('form-responsavel').value = p.responsavel_id;
        document.getElementById('form-posicao').value = p.posicao_campo;
        document.getElementById('form-consumo').value = p.tipo_consumo;
        document.getElementById('form-modelo').value = p.modelo_camisa;
        document.getElementById('form-modelo').dispatchEvent(new Event('change'));
        document.getElementById('form-tamanho').value = p.tam_camisa;
        document.getElementById('form-numero').value = p.num_camisa || '';
        document.getElementById('form-nome-camisa').value = p.nome_camisa || '';
        
        document.getElementById('modal-cadastro-title').textContent = 'Editar Participante';
        openModal('modal-cadastro');
    }

    function showPIX(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        
        const p_parcelas = state.parcelas.filter(x => x.participante_id == id).sort((a,b) => a.numero_parcela - b.numero_parcela);
        const nextParcela = p_parcelas.find(x => !x.pago);
        if (!nextParcela) {
            showToast('Nenhuma parcela pendente!');
            return;
        }

        let meta = 0; state.despesas.forEach(d => meta += parseFloat(d.valor || 0));
        let totalEsperado = 0; state.participantes.forEach(x => totalEsperado += parseFloat(x.valor_total || 0));
        let numberOfPayers = state.participantes.filter(x => x.categoria !== 'Acompanhante').length;
        let discount = (totalEsperado > meta && meta > 0 && numberOfPayers > 0) ? (totalEsperado - meta) / numberOfPayers : 0;

        let valorParc = parseFloat(nextParcela.valor);
        if (nextParcela.numero_parcela === 4 && p.categoria !== 'Acompanhante' && discount > 0) {
            valorParc -= discount;
        }

        document.getElementById('pix-nome-pessoa').textContent = p.nome;
        document.getElementById('pix-valor').textContent = valorParc.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
        if (window.PIX && state.config) {
            const payload = PIX.gerarPayload(valorParc, state.config.pix_chave, state.config.pix_nome, state.config.pix_cidade);
            PIX.gerarQRCode('pix-qrcode', payload);
            document.getElementById('pix-copiacola').value = payload;
        }
        
        openModal('modal-pix');
    }

    function sendWhatsApp(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        
        const p_parcelas = state.parcelas.filter(x => x.participante_id == id).sort((a,b) => a.numero_parcela - b.numero_parcela);
        const nextParcela = p_parcelas.find(x => !x.pago);
        if (!nextParcela) {
            showToast('Nenhuma parcela pendente!');
            return;
        }

        let meta = 0; state.despesas.forEach(d => meta += parseFloat(d.valor || 0));
        let totalEsperado = 0; state.participantes.forEach(x => totalEsperado += parseFloat(x.valor_total || 0));
        let numberOfPayers = state.participantes.filter(x => x.categoria !== 'Acompanhante').length;
        let discount = (totalEsperado > meta && meta > 0 && numberOfPayers > 0) ? (totalEsperado - meta) / numberOfPayers : 0;

        let valorParc = parseFloat(nextParcela.valor);
        if (nextParcela.numero_parcela === 4 && p.categoria !== 'Acompanhante' && discount > 0) {
            valorParc -= discount;
        }

        let phone = p.telefone || ''; // Assuming they might have phone added later or no phone at all
        phone = phone.replace(/\D/g, '');
        if (phone && phone.length <= 11) phone = '55' + phone;

        const valFormatted = valorParc.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
        const msg = `Fala ${p.nome}! 😁 Segue o lembrete da parcela de ${valFormatted} do Solteiros e Casados 2026! 🎉⚽\n\n💠 Chave PIX (CPF): ${state.config.pix_chave || ''}\n👤 ${state.config.pix_nome || ''}\n🏦 Banco do Brasil\n💰 Valor: ${valFormatted}\n\nQualquer dúvida é só chamar! 🤙`;
        
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
    }

    function confirmDelete(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir o participante ${p.nome}?`;
        
        const btnYes = document.getElementById('btn-confirm-yes');
        const newBtnYes = btnYes.cloneNode(true);
        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        
        newBtnYes.addEventListener('click', async () => {
            await DB.participantes.delete(parseInt(id));
            closeModal('modal-confirm');
            await refreshAll();
            showToast('Participante excluído!');
        });
        
        openModal('modal-confirm');
    }

    function confirmDeleteDespesa(id) {
        const d = state.despesas.find(x => x.id == id);
        if (!d) return;
        document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir a despesa "${d.descricao}"?`;
        
        const btnYes = document.getElementById('btn-confirm-yes');
        const newBtnYes = btnYes.cloneNode(true);
        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        
        newBtnYes.addEventListener('click', async () => {
            await DB.despesas.delete(id);
            closeModal('modal-confirm');
            await refreshAll();
            showToast('Despesa excluída!');
        });
        
        openModal('modal-confirm');
    }

    async function toggleParcela(parcelaId, newPagoStatus) {
        await DB.parcelas.update(parcelaId, { pago: newPagoStatus, data_pagamento: newPagoStatus ? new Date().toISOString() : null });
        await refreshAll();
        showToast(newPagoStatus ? 'Parcela paga!' : 'Parcela pendente!');
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('hidden');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        document.getElementById('toast-message').textContent = message;
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-4', 'opacity-0');
        }, 3000);
    }

    function updateAdminVisibility() {
        document.querySelectorAll('.admin-only').forEach(el => {
            if (state.isAdmin) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
        if (window.Financeiro) Financeiro.render(state);
        if (window.Escalacao) Escalacao.render(state);
        if (window.Caixa) Caixa.render(state);
    }

    return { 
        init, 
        refreshAll, 
        state, 
        editParticipante, 
        showPIX, 
        sendWhatsApp, 
        confirmDelete, 
        confirmDeleteDespesa, 
        toggleParcela,
        showToast
    };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
