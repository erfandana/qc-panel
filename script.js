document.getElementById('qc-submit').onclick = function() {
    const textAreaPO = document.querySelector('textarea[class*="textarea"]');
    const divBatch = document.querySelector('div[data-lexical-editor="true"]');

    // 1. PROSES PO
    if (inputPO && textAreaPO) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(textAreaPO, inputPO.value);
        textAreaPO.dispatchEvent(new Event('input', { bubbles: true }));
        textAreaPO.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2. PROSES BATCH (Menggunakan metode Force Reset)
    if (inputBatch && divBatch) {
        divBatch.focus();
        
        // Mengosongkan editor Lexical secara paksa
        divBatch.innerHTML = '<p><br></p>';
        divBatch.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'deleteContentBackward'
        }));

        // Memasukkan teks baru via ClipboardEvent
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', inputBatch.value);
        
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dataTransfer
        });
        
        divBatch.dispatchEvent(pasteEvent);
    }

    // 3. PROSES OTOMATIS CEKLIS KEMASAN
    if (sizeSelect.value) {
        const selectedSize = sizeSelect.value; // Contoh: "100 X 100ML"
        const parts = selectedSize.split(' X ');
        
        if (parts.length >= 2) {
            // Mengambil bagian "100ML" dan menyamakan format
            const targetVolume = parts[1].toLowerCase().replace(/\s/g, ''); 
            const checkboxes = document.querySelectorAll('div[class*="checkListItemSimpleChecklist"]');

            checkboxes.forEach(container => {
                const labelText = container.querySelector('span').textContent.toLowerCase().replace(/\s/g, '');
                const input = container.querySelector('input[type="checkbox"]');
                
                // Jika teks cocok, klik untuk centang. Jika tidak, pastikan tidak centang.
                if (labelText === targetVolume) {
                    if (!input.checked) input.click();
                } else {
                    if (input.checked) input.click();
                }
            });
        }
    }

    simpanMemoriInput();
    console.log("Submit berhasil: PO diisi, Batch direset & diisi, Kemasan terpilih.");
};
