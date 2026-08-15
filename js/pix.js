window.PIX = (() => {
    function tlv(id, value) {
        const len = value.length.toString().padStart(2, '0');
        return id + len + value;
    }

    function crc16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    function formatText(text, maxLen) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, maxLen).toUpperCase();
    }

    function gerarPayload(valor, chave, nome, cidade) {
        nome = formatText(nome, 25);
        cidade = formatText(cidade, 15);
        const valorFormatado = Number(valor).toFixed(2);
        
        const payloadFormat = tlv('00', '01');
        const pointOfInitiation = tlv('01', '12');
        
        const merchantAccountInfoGui = tlv('00', 'br.gov.bcb.pix');
        const merchantAccountInfoChave = tlv('01', chave);
        const merchantAccountInfo = tlv('26', merchantAccountInfoGui + merchantAccountInfoChave);
        
        const merchantCategoryCode = tlv('52', '0000');
        const transactionCurrency = tlv('53', '986');
        const transactionAmount = tlv('54', valorFormatado);
        const countryCode = tlv('58', 'BR');
        const merchantName = tlv('59', nome);
        const merchantCity = tlv('60', cidade);
        
        const additionalDataReference = tlv('05', '***');
        const additionalDataField = tlv('62', additionalDataReference);
        
        const payloadStr = payloadFormat + 
                           pointOfInitiation + 
                           merchantAccountInfo + 
                           merchantCategoryCode + 
                           transactionCurrency + 
                           transactionAmount + 
                           countryCode + 
                           merchantName + 
                           merchantCity + 
                           additionalDataField + 
                           '6304';
        
        const crc = crc16(payloadStr);
        return payloadStr + crc;
    }

    function gerarQRCode(elementId, payload) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = '';
        if (window.QRCode) {
            new QRCode(el, {
                text: payload,
                width: 200,
                height: 200,
                colorDark: '#10b981',
                colorLight: '#00000000'
            });
        } else {
            console.error("QRCode library not loaded");
        }
    }

    async function copiar(payload) {
        try {
            await navigator.clipboard.writeText(payload);
        } catch (err) {
            console.error("Failed to copy to clipboard", err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = payload;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err2) {
                console.error("Fallback copy failed", err2);
            }
            document.body.removeChild(textArea);
        }
    }

    return { gerarPayload, gerarQRCode, copiar };
})();
