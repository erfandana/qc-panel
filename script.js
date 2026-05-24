(async function () {
    const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";
    let panel = document.getElementById("qc-panel");

    // --- Fungsi Helper: Checklist Otomatis ---
    function setCheckboxByVolume(isiValue) {
        let targetText = isiValue >= 1000 ? (isiValue / 1000) + " L" : isiValue + " mL";
        const allLabels = document.querySelectorAll('label');
        
        allLabels.forEach(label => {
            const textSpan = label.querySelector('span');
            const checkbox = label.querySelector('input[type="checkbox"]');
            
            if (textSpan && checkbox) {
                if (textSpan.textContent.trim() === targetText) {
                    if (!checkbox.checked) setTimeout(() => checkbox.click(), 100);
                } else {
                    if (checkbox.checked) setTimeout(() => checkbox.click(), 100);
                }
            }
        });
    }

    // --- Fungsi Helper: Input & UI ---
    if (!panel) {
        const css = await fetch(`${BASE_URL}/style.css`).then((r) => r.text());
        const style = document.createElement("style");
        style.innerHTML = css;
        document.head.appendChild(style);
        const html = await fetch(`${BASE_URL}/panel.html`).then((r) => r.text());
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);
        panel = document.getElementById("qc-panel");
    }

    const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());
    const sizeSelect = document.getElementById("size-select");
    const densityInput = document.querySelector('input[placeholder="INPUT DENSITY"]');
    const inputPO = document.querySelector('input[placeholder="TEXT INPUT HASIL SCAN PO"]');
    const inputBatch = document.querySelector('input[placeholder="TEXT INPUT HASIL SCAN BATCH"]');

    // Inisialisasi Dropdown
    sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
    packaging.forEach((item) => {
        const o = document.createElement("option");
        o.value = item.size; o.textContent = item.size;
        sizeSelect.appendChild(o);
    });

    // --- Tombol Submit Utama ---
    document.getElementById('qc-submit').onclick = function() {
        // 1. Eksekusi Centang Otomatis
        const selected = packaging.find((x) => x.size === sizeSelect.value);
        if (selected) setCheckboxByVolume(selected.isi);

        // 2. Inject Data ke Form React/Lexical
        const textAreaPO = document.querySelector('textarea[class*="textarea"]');
        const divBatch = document.querySelector('div[data-lexical-editor="true"]');
        
        if (inputPO && textAreaPO) {
            Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(textAreaPO, inputPO.value);
            textAreaPO.dispatchEvent(new Event('input', { bubbles: true }));
            textAreaPO.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (inputBatch && divBatch) {
            divBatch.focus();
            divBatch.innerText = inputBatch.value;
            divBatch.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        console.log("Submit selesai.");
    };

    // Load Memory
    const saved = localStorage.getItem("qc_panel_memori");
    if (saved) {
        const data = JSON.parse(saved);
        sizeSelect.value = data.size || "";
    }
})();
