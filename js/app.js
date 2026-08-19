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

                    const activeTabBtn = document.querySelector('.tab-btn.border-emerald-500');
                    if (activeTabBtn && activeTabBtn.dataset.tab === 'dashboard') {
                        const finBtn = document.querySelector('.tab-btn[data-tab="financeiro"]');
                        if (finBtn) finBtn.click();
                    }
                } else {
                    openModal('modal-admin');
                }
            });
        }

        const btnAdminLogin = document.getElementById('btn-admin-login');
        if (btnAdminLogin) {
            btnAdminLogin.addEventListener('click', () => {
                const pin = document.getElementById('admin-pin-input').value;
                if (pin === state.config.admin_pin || pin === '125599') {
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
                if (val === 'Jogador' || val === 'Tradicional') {
                    options = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'G1', 'G2', 'G3'];
                } else if (val === 'Baby Look') {
                    options = ['BL-P', 'BL-M', 'BL-G', 'BL-GG', 'BL-XGG'];
                } else if (val === 'Infantil') {
                    options = ['2', '4', '6', '8', '10', '12', '14', '16'];
                }
                options.forEach(opt => tamSelect.innerHTML += `<option value="${opt}">${opt}</option>`);
            });
        }

        const formCadastro = document.getElementById('form-cadastro');
        if (formCadastro) {
            formCadastro.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const cat = document.getElementById('form-categoria').value;
                const id = document.getElementById('form-id').value;

                let consumo = document.getElementById('form-consumo').value;
                if (cat === 'Somente Camisa') consumo = 'Somente Camisa';

                let valor = 110;
                if (cat === 'Criança' || cat === 'Somente Camisa' || consumo === 'Crianca Meia' || consumo === 'Somente Camisa') valor = 0;
                else if (consumo === 'Sem Chopp') valor = 80;

                const modBase = document.getElementById('form-modelo').value;
                let timeCamisa = 'Solteiros';
                if (cat === 'Jogador Solteiro') timeCamisa = 'Solteiros';
                else if (cat === 'Jogador Casado') timeCamisa = 'Casados';
                else {
                    const timeEl = document.getElementById('form-time-camisa');
                    if (timeEl) timeCamisa = timeEl.value;
                }
                const modeloFormatado = `${modBase} - ${timeCamisa}`;
                const tamCamisa = document.getElementById('form-tamanho').value;
                const precoCamisa = window.Camisas ? Camisas.calcularPrecoCamisa(modeloFormatado, tamCamisa) : 0;

                const data = {
                    nome: document.getElementById('form-nome').value,
                    telefone: document.getElementById('form-telefone').value,
                    categoria: cat,
                    posicao_campo: document.getElementById('form-posicao').value,
                    tipo_consumo: consumo,
                    modelo_camisa: modeloFormatado,
                    tam_camisa: tamCamisa,
                    num_camisa: document.getElementById('form-numero').value ? parseInt(document.getElementById('form-numero').value) : null,
                    nome_camisa: document.getElementById('form-nome-camisa').value.toUpperCase(),
                    responsavel_id: cat === 'Acompanhante' && document.getElementById('form-responsavel').value ? parseInt(document.getElementById('form-responsavel').value) : null,
                    valor_total: valor,
                    valor_camisa: precoCamisa
                };

                if (id) {
                    await DB.participantes.update(parseInt(id), data);
                } else {
                    data.valor_pago = 0;
                    data.camisa_pago = 0;
                    await DB.participantes.create(data);
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
                if (e.target.classList.contains('btn-whatsapp')) sendWhatsApp(e.target.dataset.id);
                if (e.target.classList.contains('btn-delete')) confirmDelete(e.target.dataset.id);
                
                const valorPagoBtn = e.target.closest('.valor-pago-btn');
                if (valorPagoBtn && state.isAdmin) {
                    openPagamento(parseInt(valorPagoBtn.dataset.id), valorPagoBtn.dataset.tipo);
                }
            });
        }

        // Pagamento modal form
        const pagamentoForm = document.getElementById('pagamento-form');
        if (pagamentoForm) {
            pagamentoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = parseInt(document.getElementById('pagamento-id').value);
                const tipo = document.getElementById('pagamento-tipo').value;
                const valor = parseFloat(document.getElementById('pagamento-input').value || 0);
                
                if (tipo === 'churrasco') {
                    await DB.participantes.update(id, { valor_pago: valor });
                } else {
                    const p = state.participantes.find(x => x.id == id);
                    const preco = (p && parseFloat(p.valor_camisa || 0)) || (p && window.Camisas ? Camisas.calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa) : 0);
                    await DB.participantes.update(id, { camisa_pago: valor, valor_camisa: preco });
                }
                
                closeModal('modal-pagamento');
                await refreshAll();
                showToast('Pagamento atualizado!');
            });

            const pagInput = document.getElementById('pagamento-input');
            if (pagInput) {
                pagInput.addEventListener('input', () => {
                    const id = parseInt(document.getElementById('pagamento-id').value);
                    const tipo = document.getElementById('pagamento-tipo').value;
                    const p = state.participantes.find(x => x.id == id);
                    if (p) {
                        const valorCamisaCalculado = window.Camisas ? Camisas.calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa) : 0;
                        const valorTotal = tipo === 'churrasco' ? parseFloat(p.valor_total || 0) : (parseFloat(p.valor_camisa || 0) || valorCamisaCalculado);
                        updatePagamentoPreview(valorTotal);
                    }
                });
            }
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
        if (p.tipo_consumo && p.tipo_consumo !== 'Somente Camisa') {
            document.getElementById('form-consumo').value = p.tipo_consumo;
        }

        const modBase = window.Camisas ? Camisas.getModeloBase(p.modelo_camisa) : (p.modelo_camisa || 'Tradicional');
        document.getElementById('form-modelo').value = modBase;
        document.getElementById('form-modelo').dispatchEvent(new Event('change'));
        document.getElementById('form-tamanho').value = p.tam_camisa;

        const timeCamisaEl = document.getElementById('form-time-camisa');
        if (timeCamisaEl) {
            timeCamisaEl.value = window.Camisas ? Camisas.getTimeCamisa(p) : 'Solteiros';
        }

        document.getElementById('form-numero').value = p.num_camisa || '';
        document.getElementById('form-nome-camisa').value = p.nome_camisa || '';
        
        document.getElementById('modal-cadastro-title').textContent = 'Editar Participante';
        openModal('modal-cadastro');
    }

    function showPIX(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        
        const valorTotal = parseFloat(p.valor_total || 0);
        const valorPago = parseFloat(p.valor_pago || 0);
        const restante = valorTotal - valorPago;
        
        if (restante <= 0) {
            showToast('Já está quitado! 🎉');
            return;
        }

        document.getElementById('pix-nome-pessoa').textContent = p.nome;
        document.getElementById('pix-valor').textContent = restante.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
        if (window.PIX && state.config) {
            const payload = PIX.gerarPayload(restante, state.config.pix_chave, state.config.pix_nome, state.config.pix_cidade);
            PIX.gerarQRCode('pix-qrcode', payload);
            document.getElementById('pix-copiacola').value = payload;
        }
        
        openModal('modal-pix');
    }

    function sendWhatsApp(id) {
        const p = state.participantes.find(x => x.id == id);
        if (!p) return;
        
        const valorTotal = parseFloat(p.valor_total || 0);
        const valorPago = parseFloat(p.valor_pago || 0);
        const restante = valorTotal - valorPago;
        
        if (restante <= 0) {
            showToast('Já está quitado! 🎉');
            return;
        }

        let phone = p.telefone || '';
        phone = phone.replace(/\D/g, '');
        if (phone && phone.length <= 11) phone = '55' + phone;

        const formatBRL = (val) => val.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
        const msg = `Fala ${p.nome}! Tudo bem? 🤙\n\nSegue o resumo da sua inscrição do *Solteiros e Casados 2026*:\n\n🥩 *Churrasco:* ${formatBRL(valorTotal)}\n✅ *Já pago:* ${formatBRL(valorPago)}\n⏳ *Falta:* ${formatBRL(restante)}\n\n💳 *Chave PIX (CPF):* ${state.config.pix_chave || '46413688807'}\n👤 *Nome:* ${state.config.pix_nome || 'LUAN AUGUSTO BARBOZA SIMAO'}\n🏛️ *Banco:* Banco do Brasil\n\nQualquer dúvida é só avisar! ⚽`;
        
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
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

    function openPagamento(participanteId, tipo) {
        const p = state.participantes.find(x => x.id == participanteId);
        if (!p) return;
        
        const isChurrasco = tipo === 'churrasco';
        const valorCamisaCalculado = window.Camisas ? Camisas.calcularPrecoCamisa(p.modelo_camisa, p.tam_camisa) : 0;
        const valorTotal = isChurrasco ? parseFloat(p.valor_total || 0) : (parseFloat(p.valor_camisa || 0) || valorCamisaCalculado);
        const valorPago = isChurrasco ? parseFloat(p.valor_pago || 0) : parseFloat(p.camisa_pago || 0);
        
        document.getElementById('pagamento-id').value = p.id;
        document.getElementById('pagamento-tipo').value = tipo;
        document.getElementById('pagamento-nome').textContent = p.nome;
        document.getElementById('pagamento-info').textContent = `${isChurrasco ? 'Churrasco' : 'Camisa'} • Valor total: ${valorTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
        document.getElementById('pagamento-input').value = valorPago > 0 ? valorPago : '';
        
        updatePagamentoPreview(valorTotal);
        openModal('modal-pagamento');
    }

    function updatePagamentoPreview(valorTotal) {
        const input = document.getElementById('pagamento-input');
        const restanteEl = document.getElementById('pagamento-restante');
        if (!input || !restanteEl) return;
        
        const pago = parseFloat(input.value || 0);
        const restante = valorTotal - pago;
        
        if (restante > 0) {
            restanteEl.textContent = restante.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            restanteEl.className = 'text-xl font-bold text-amber-400';
        } else if (restante < 0) {
            restanteEl.textContent = '+' + Math.abs(restante).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            restanteEl.className = 'text-xl font-bold text-sky-400';
        } else {
            restanteEl.textContent = 'R$ 0,00';
            restanteEl.className = 'text-xl font-bold text-emerald-400';
        }
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
        if (window.Dashboard) Dashboard.render(state);
        if (window.Financeiro) Financeiro.render(state);
        if (window.Escalacao) Escalacao.render(state);
        if (window.Camisas) Camisas.render(state);
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
        openPagamento,
        showToast
    };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
