document.getElementById('qc-submit').onclick = async function() {
    const textAreaPO = document.querySelector('textarea[class*="textarea"]');
    const divBatch = document.querySelector('div[data-lexical-editor="true"]');

    // 1. PROSES PO (Sudah benar)
    if (inputPO && textAreaPO) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(textAreaPO, inputPO.value);
        textAreaPO.dispatchEvent(new Event('input', { bubbles: true }));
        textAreaPO.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2. PROSES BATCH (Metode Reset via Selection + Delete)
    if (inputBatch && divBatch) {
        divBatch.focus();

        // A. Pilih semua teks di editor (Select All)
        document.execCommand('selectAll', false, null);
        // B. Hapus teks (Delete)
        document.execCommand('delete', false, null);
        // C. Pastikan editor bersih (opsional: reset ke <p><br></p>)
        divBatch.innerHTML = '<p><br></p>';

        // D. Simulasi paste dengan jeda singkat agar Lexical sempat memproses "delete"
        await new Promise(resolve => setTimeout(resolve, 50)); 

        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', inputBatch.value);
        
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dataTransfer
        });
        
        divBatch.dispatchEvent(pasteEvent);
        
        // E. Trigger input agar Lexical mendeteksi perubahan akhir
        divBatch.dispatchEvent(new Event('input', { bubbles: true, bubbles: true }));
    }

    // 3. PROSES OTOMATIS CEKLIS (Sudah benar)
    if (sizeSelect.value) {
        const selectedSize = sizeSelect.value;
        const parts = selectedSize.split(' X ');
        
        if (parts.length >= 2) {
            const targetVolume = parts[1].toLowerCase().replace(/\s/g, ''); 
            const checkboxes = document.querySelectorAll('div[class*="checkListItemSimpleChecklist"]');

            checkboxes.forEach(container => {
                const labelText = container.querySelector('span').textContent.toLowerCase().replace(/\s/g, '');
                const input = container.querySelector('input[type="checkbox"]');
                
                if (input) {
                    const shouldBeChecked = (labelText === targetVolume);
                    if (input.checked !== shouldBeChecked) {
                        input.click(); 
                    }
                }
            });
        }
    }

    simpanMemoriInput();
    console.log("Submit berhasil: Semua komponen telah diproses.");
};
  loadMemoriInput();
})(); 
