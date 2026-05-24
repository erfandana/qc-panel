// LOGIKA SUBMIT (Disesuaikan)
  document.getElementById('qc-submit').onclick = function() {
    const textAreaPO = document.querySelector('textarea[class*="textarea"]');
    // Selector yang lebih stabil untuk Lexical Editor
    const divBatch = document.querySelector('div[data-lexical-editor="true"]');

    // Proses PO
    if (inputPO && textAreaPO) {
        textAreaPO.value = inputPO.value;
        textAreaPO.dispatchEvent(new Event('input', { bubbles: true }));
        // inputPO.value = ''; // Dihapus agar nilai tidak kosong
    }

    // Proses Batch (Menggunakan cara InsertText agar Lexical mendeteksi)
    if (inputBatch && inputBatch.value.trim() !== "" && divBatch) {
        // Fokus tetap diperlukan secara teknis untuk execCommand, 
        // tapi kita bisa mengembalikan fokus ke elemen sebelumnya jika perlu.
        // Namun, jika dibiarkan, ini adalah cara paling aman untuk input Lexical.
        divBatch.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, inputBatch.value);
        divBatch.dispatchEvent(new Event('input', { bubbles: true }));
        
        // inputBatch.value = ''; // Dihapus agar nilai tidak kosong
    }

    // inputPO.focus(); // Dihapus agar tidak memindahkan fokus
    simpanMemoriInput();
  };
