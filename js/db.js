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
            try {
                if (!localStorage.getItem('sc2026_config')) {
                    setLocalObj('config', defaultConfig);
                } else {
                    let conf = getLocalObj('config');
                    if (conf.admin_pin === '2026') {
                        conf.admin_pin = '302712';
                        setLocalObj('config', conf);
                    }
                }
            } catch (e) {
                console.warn('localStorage is disabled or restricted:', e);
            }
        }
    }

    function isLocal() {
        return _isLocal;
    }

    function getLocal(key) {
        try {
            const item = localStorage.getItem(`sc2026_${key}`);
            return item ? JSON.parse(item) : [];
        } catch (e) { return []; }
    }

    function setLocal(key, data) {
        try {
            localStorage.setItem(`sc2026_${key}`, JSON.stringify(data));
        } catch (e) {}
    }
    
    function getLocalObj(key) {
        try {
            const item = localStorage.getItem(`sc2026_${key}`);
            return item ? JSON.parse(item) : {};
        } catch (e) { return {}; }
    }

    function setLocalObj(key, data) {
        try {
            localStorage.setItem(`sc2026_${key}`, JSON.stringify(data));
        } catch (e) {}
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
                try {
                    const { data, error } = await supabaseClient.from('participantes').select('*').order('nome');
                    if (!error && data) return data;
                } catch(e) {
                    console.warn("Supabase participantes.list fallback:", e);
                }
            }
            const list = getLocal('participantes');
            return list.sort((a, b) => a.nome.localeCompare(b.nome));
        },
        async create(data) {
            if (!_isLocal) {
                try {
                    const { data: created, error } = await supabaseClient.from('participantes').insert(data).select().single();
                    if (!error && created) return created;
                    if (error) console.warn("Supabase participantes.create error:", error);
                } catch(e) {
                    console.warn("Supabase participantes.create fallback:", e);
                }
            }
            const list = getLocal('participantes');
            const newObj = { ...data, id: generateId('participantes'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('participantes', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                try {
                    const { data: updated, error } = await supabaseClient.from('participantes').update(updates).eq('id', id).select().single();
                    if (!error && updated) return updated;
                } catch(e) {
                    console.warn("Supabase participantes.update fallback:", e);
                }
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
                try {
                    await supabaseClient.from('parcelas').delete().eq('participante_id', id);
                    await supabaseClient.from('participantes').update({ responsavel_id: null }).eq('responsavel_id', id);
                    const { error: err3 } = await supabaseClient.from('participantes').delete().eq('id', id);
                    if (!err3) return;
                } catch(e) {
                    console.warn("Supabase participantes.delete fallback:", e);
                }
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
                try {
                    const { data, error } = await supabaseClient.from('parcelas').select('*');
                    if (!error && data) return data;
                } catch(e) {
                    console.warn("Supabase parcelas.list fallback:", e);
                }
            }
            return getLocal('parcelas');
        },
        async listByParticipante(participanteId) {
            if (!_isLocal) {
                try {
                    const { data, error } = await supabaseClient.from('parcelas').select('*').eq('participante_id', participanteId).order('numero_parcela');
                    if (!error && data) return data;
                } catch(e) {
                    console.warn("Supabase parcelas.listByParticipante fallback:", e);
                }
            }
            const list = getLocal('parcelas');
            return list.filter(p => p.participante_id == participanteId).sort((a, b) => a.numero_parcela - b.numero_parcela);
        },
        async create(data) {
            if (!_isLocal) {
                try {
                    const { data: created, error } = await supabaseClient.from('parcelas').insert(data).select().single();
                    if (!error && created) return created;
                } catch(e) {
                    console.warn("Supabase parcelas.create fallback:", e);
                }
            }
            const list = getLocal('parcelas');
            const newObj = { ...data, id: generateId('parcelas'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('parcelas', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                try {
                    const { data: updated, error } = await supabaseClient.from('parcelas').update(updates).eq('id', id).select().single();
                    if (!error && updated) return updated;
                } catch(e) {
                    console.warn("Supabase parcelas.update fallback:", e);
                }
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
                pago: false
            }));

            if (!_isLocal) {
                try {
                    const { data: created, error } = await supabaseClient.from('parcelas').insert(newParcelas).select();
                    if (!error && created) return created;
                } catch(e) {
                    console.warn("Supabase parcelas.createForParticipante fallback:", e);
                }
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
        async getAll() {
            if (!_isLocal) {
                try {
                    const { data, error } = await supabaseClient.from('configuracoes').select('*').limit(1).single();
                    if (!error && data) {
                        return {
                            pix_chave: data.pix_chave || defaultConfig.pix_chave,
                            pix_nome: data.pix_nome || defaultConfig.pix_nome,
                            pix_cidade: data.pix_cidade || defaultConfig.pix_cidade,
                            admin_pin: data.admin_pin || defaultConfig.admin_pin
                        };
                    }
                } catch(e) {}
                return defaultConfig;
            }
            return getLocalObj('config') || defaultConfig;
        },
        async set(keyValues) {
            if (!_isLocal) {
                const { error } = await supabaseClient.from('configuracoes').update(keyValues).eq('id', 1);
                if (error) throw error;
                return;
            }
            const conf = { ...getLocalObj('config'), ...keyValues };
            setLocalObj('config', conf);
        }
    };

    const inscricoes = {
        async list() {
            if (!_isLocal) {
                try {
                    const { data, error } = await supabaseClient.from('inscricoes').select('*').order('created_at', { ascending: false });
                    if (!error && data) return data;
                } catch (err) {
                    console.warn("Supabase inscricoes list error, using local fallback", err);
                }
            }
            return getLocal('inscricoes');
        },
        async create(data) {
            if (!_isLocal) {
                try {
                    const { data: created, error } = await supabaseClient.from('inscricoes').insert(data).select().single();
                    if (!error && created) return created;
                    if (error) console.warn("Supabase inscricoes.create error:", error);
                } catch(e) {
                    console.warn("Supabase inscricoes.create fallback:", e);
                }
            }
            const list = getLocal('inscricoes');
            const newObj = { ...data, id: generateId('inscricoes'), created_at: new Date().toISOString() };
            list.push(newObj);
            setLocal('inscricoes', list);
            return newObj;
        },
        async update(id, updates) {
            if (!_isLocal) {
                try {
                    const { data: updated, error } = await supabaseClient.from('inscricoes').update(updates).eq('id', id).select().single();
                    if (!error && updated) return updated;
                } catch(e) {
                    console.warn("Supabase inscricoes.update fallback:", e);
                }
            }
            const list = getLocal('inscricoes');
            const index = list.findIndex(i => i.id == id);
            if (index !== -1) {
                list[index] = { ...list[index], ...updates };
                setLocal('inscricoes', list);
                return list[index];
            }
            return null;
        },
        async delete(id) {
            if (!_isLocal) {
                try {
                    const { error } = await supabaseClient.from('inscricoes').delete().eq('id', id);
                    if (!error) return;
                } catch(e) {
                    console.warn("Supabase inscricoes.delete fallback:", e);
                }
            }
            let list = getLocal('inscricoes');
            list = list.filter(i => i.id != id);
            setLocal('inscricoes', list);
        }
    };

    return { init, isLocal, participantes, parcelas, despesas, config, inscricoes };
})();
