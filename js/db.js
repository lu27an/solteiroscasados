window.DB = (() => {
    const SUPABASE_URL = 'https://xdzfepptulxsugsovjme.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkemZlcHB0dWx4c3Vnc292am1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTczMTUsImV4cCI6MjEwMjM5MzMxNX0.u0d20NryISK5OMl9lUI5MelJ_PgV1RLyq7oc-d580m0';
    let supabaseClient = null;
    let _isLocal = true;

    const defaultConfig = {
        pix_chave: '46413688807',
        pix_nome: 'LUAN AUGUSTO BARBOZA SIMAO',
        pix_cidade: 'GUARARAPES',
        admin_pin: '302712'
    };

    async function init() {
        if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
            try {
                const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const { error } = await client.from('configuracoes').select('*').limit(1);
                if (!error) {
                    supabaseClient = client;
                    _isLocal = false;
                }
            } catch (err) {
                console.error("Supabase init failed", err);
            }
        }
        
        if (_isLocal) {
            const banner = document.getElementById('localStorage-banner');
            if (banner) {
                banner.classList.remove('hidden');
            }
            if (!localStorage.getItem('sc2026_config')) {
                setLocalObj('config', defaultConfig);
            } else {
                let conf = getLocalObj('config');
                if (conf.admin_pin === '2026') {
                    conf.admin_pin = '302712';
                    setLocalObj('config', conf);
                }
            }
        }
    }

    function isLocal() {
        return _isLocal;
    }

    function getLocal(key) {
        const item = localStorage.getItem(`sc2026_${key}`);
        return item ? JSON.parse(item) : [];
    }

    function setLocal(key, data) {
        localStorage.setItem(`sc2026_${key}`, JSON.stringify(data));
    }
    
    function getLocalObj(key) {
        const item = localStorage.getItem(`sc2026_${key}`);
        return item ? JSON.parse(item) : {};
    }

    function setLocalObj(key, data) {
        localStorage.setItem(`sc2026_${key}`, JSON.stringify(data));
    }

    function generateId(table) {
        const key = `sc2026_nextId_${table}`;
        const nextId = parseInt(localStorage.getItem(key) || '1', 10);
        localStorage.setItem(key, (nextId + 1).toString());
        return nextId;
    }

    const participantes = {
        async list() {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('participantes').select('*').order('nome');
                if (error) throw error;
                return data;
            }
            const list = getLocal('participantes');
            return list.sort((a, b) => a.nome.localeCompare(b.nome));
        },
        async create(data) {
            if (!_isLocal) {
                const { data: created, error } = await supabaseClient.from('participantes').insert(data).select().single();
                if (error) throw error;
                return created;
            }
            const list = getLocal('participantes');
            const newObj = { ...data, id: generateId('participantes'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('participantes', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                const { data: updated, error } = await supabaseClient.from('participantes').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return updated;
            }
            const list = getLocal('participantes');
            const index = list.findIndex(p => p.id == id);
            if (index !== -1) {
                list[index] = { ...list[index], ...updates };
                setLocal('participantes', list);
                return list[index];
            }
            return null;
        },
        async delete(id) {
            if (!_isLocal) {
                const { error: err1 } = await supabaseClient.from('parcelas').delete().eq('participante_id', id);
                if (err1) throw err1;
                const { error: err2 } = await supabaseClient.from('participantes').update({ responsavel_id: null }).eq('responsavel_id', id);
                if (err2) throw err2;
                const { error: err3 } = await supabaseClient.from('participantes').delete().eq('id', id);
                if (err3) throw err3;
                return;
            }
            let list = getLocal('participantes');
            list = list.filter(p => p.id != id);
            
            list = list.map(p => {
                if (p.responsavel_id == id) {
                    return { ...p, responsavel_id: null };
                }
                return p;
            });
            setLocal('participantes', list);
            
            let parcelasList = getLocal('parcelas');
            parcelasList = parcelasList.filter(p => p.participante_id != id);
            setLocal('parcelas', parcelasList);
        }
    };

    const parcelas = {
        async list() {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('parcelas').select('*');
                if (error) throw error;
                return data;
            }
            return getLocal('parcelas');
        },
        async listByParticipante(participanteId) {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('parcelas').select('*').eq('participante_id', participanteId).order('numero_parcela');
                if (error) throw error;
                return data;
            }
            const list = getLocal('parcelas');
            return list.filter(p => p.participante_id == participanteId).sort((a, b) => a.numero_parcela - b.numero_parcela);
        },
        async create(data) {
            if (!_isLocal) {
                const { data: created, error } = await supabaseClient.from('parcelas').insert(data).select().single();
                if (error) throw error;
                return created;
            }
            const list = getLocal('parcelas');
            const newObj = { ...data, id: generateId('parcelas'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('parcelas', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                const { data: updated, error } = await supabaseClient.from('parcelas').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return updated;
            }
            const list = getLocal('parcelas');
            const index = list.findIndex(p => p.id == id);
            if (index !== -1) {
                list[index] = { ...list[index], ...updates };
                setLocal('parcelas', list);
                return list[index];
            }
            return null;
        },
        async createForParticipante(participanteId, valorTotal) {
            const vencimentos = ['2026-09-20', '2026-10-20', '2026-11-20', '2026-12-20'];
            const valorParcela = parseFloat((valorTotal / 4).toFixed(2));
            const newParcelas = vencimentos.map((v, i) => ({
                participante_id: participanteId,
                numero_parcela: i + 1,
                data_vencimento: v,
                valor: valorParcela,
                valor_desconto: 0,
                pago: false,
                data_pagamento: null
            }));

            if (!_isLocal) {
                const { data: created, error } = await supabaseClient.from('parcelas').insert(newParcelas).select();
                if (error) throw error;
                return created;
            }
            
            const list = getLocal('parcelas');
            const created = newParcelas.map(p => ({
                ...p,
                id: generateId('parcelas'),
                created_at: new Date().toISOString()
            }));
            
            list.push(...created);
            setLocal('parcelas', list);
            return created;
        },
        async deleteByParticipante(participanteId) {
            if (!_isLocal) {
                const { error } = await supabaseClient.from('parcelas').delete().eq('participante_id', participanteId);
                if (error) throw error;
                return;
            }
            let list = getLocal('parcelas');
            list = list.filter(p => p.participante_id != participanteId);
            setLocal('parcelas', list);
        },
        async delete(id) {
            if (!_isLocal) {
                const { error } = await supabaseClient.from('parcelas').delete().eq('id', id);
                if (error) throw error;
                return;
            }
            let list = getLocal('parcelas');
            list = list.filter(p => p.id != id);
            setLocal('parcelas', list);
        }
    };

    const despesas = {
        async list() {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('despesas').select('*').order('created_at');
                if (error) throw error;
                return data;
            }
            const list = getLocal('despesas');
            return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
        },
        async create(data) {
            if (!_isLocal) {
                const { data: created, error } = await supabaseClient.from('despesas').insert(data).select().single();
                if (error) throw error;
                return created;
            }
            const list = getLocal('despesas');
            const newObj = { ...data, id: generateId('despesas'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('despesas', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                const { data: updated, error } = await supabaseClient.from('despesas').update(updates).eq('id', id).select().single();
                if (error) throw error;
                return updated;
            }
            const list = getLocal('despesas');
            const index = list.findIndex(d => d.id == id);
            if (index !== -1) {
                list[index] = { ...list[index], ...updates };
                setLocal('despesas', list);
                return list[index];
            }
            return null;
        },
        async delete(id) {
            if (!_isLocal) {
                const { error } = await supabaseClient.from('despesas').delete().eq('id', id);
                if (error) throw error;
                return;
            }
            let list = getLocal('despesas');
            list = list.filter(d => d.id != id);
            setLocal('despesas', list);
        }
    };

    const config = {
        async get(chave) {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('configuracoes').select('valor').eq('chave', chave).single();
                if (error) return null;
                return data ? data.valor : null;
            }
            const conf = getLocalObj('config');
            return conf[chave] !== undefined ? conf[chave] : null;
        },
        async getAll() {
            if (!_isLocal) {
                const { data, error } = await supabaseClient.from('configuracoes').select('*');
                if (error) throw error;
                const conf = {};
                data.forEach(item => conf[item.chave] = item.valor);
                return conf;
            }
            return getLocalObj('config');
        },
        async set(chave, valor) {
            if (!_isLocal) {
                const { error } = await supabaseClient.from('configuracoes').upsert({ chave, valor }, { onConflict: 'chave' });
                if (error) throw error;
                return;
            }
            const conf = getLocalObj('config');
            conf[chave] = valor;
            setLocalObj('config', conf);
        }
    };

    return { init, isLocal, participantes, parcelas, despesas, config };
})();
