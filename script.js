(async function () {
    const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";
    let panel = document.getElementById("qc-panel");

    // --- Fungsi Helper untuk Checkbox ---
    function setCheckboxByVolume(isiValue) {
        let targetText = isiValue >= 1000 ? (isiValue / 1000) + " L" : isiValue + " mL";
        const checkboxes = document.querySelectorAll('div[class*="checkListItem"]');
        
        checkboxes.forEach(container => {
            const textSpan = container.querySelector('span');
            const checkbox = container.querySelector('input[type="checkbox"]');
            if (textSpan && checkbox) {
                if (textSpan.textContent.trim() === targetText) {
                    if (!checkbox.checked) {
                        setTimeout(() => checkbox.click(), 100);
                    }
                }
            }
        });
    }

    function checkDensity(el) {
        if (!el || !el.value || el.value.trim() === "") el.classList.add("input-error");
        else el.classList.remove("input-error");
    }

    // 1. Load UI
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
    } else {
        panel.style.display = "block";
    }

    const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());

    // 2. Inisialisasi Dropdown
    const sizeSelect = document.getElementById("size-select");
    const capInput = document.getElementById("cap-input");
    const botolInput = document.getElementById("botol-input");
    const cartonInput = document.getElementById("carton-input");
    const toleransiInput = document.getElementById("toleransi-input");
    const labelInput = document.getElementById("label-input");
    const layerInput = document.getElementById("layer-input");
    const foldingInput = document.getElementById("folding-input");
    const densityInput = document.querySelector('input[placeholder="INPUT DENSITY"]');
    const inputPO = document.querySelector('input[placeholder="TEXT INPUT HASIL SCAN PO"]');
    const inputBatch = document.querySelector('input[placeholder="TEXT INPUT HASIL SCAN BATCH"]');

    sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
    packaging.forEach((item) => {
        const o = document.createElement("option");
        o.value = item.size;
        o.textContent = item.size;
        sizeSelect.appendChild(o);
    });

    sizeSelect.addEventListener("change", function () {
        const s = packaging.find((x) => x.size === this.value);
        if (s) {
            capInput.value = s.cap; botolInput.value = s.botol;
            cartonInput.value = s.carton; toleransiInput.value = s.toleransi.toFixed(2);
            labelInput.value = s.label; layerInput.value = s.layer;
            foldingInput.value = s.folding;
        }
        simpanMemoriInput();
        hitungBerat();
    });

    // 3. Scanner & Memory (Fungsi pendukung)
    function simpanMemoriInput() {
        const dataScan = { size: sizeSelect.value, density: densityInput?.value, po: inputPO?.value, batch: inputBatch?.value, cap: capInput?.value, botol: botolInput?.value, carton: cartonInput?.value, label: labelInput?.value, layer: layerInput?.value, folding: foldingInput?.value, toleransi: toleransiInput?.value };
        localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));
    }

    function hitungBerat() {
        const selected = packaging.find((x) => x.size === sizeSelect.value);
        const density = parseFloat(densityInput.value);
        if (!selected || isNaN(density) || density <= 0) return;
        // ... (Logika hitung berat tetap sama) ...
    }

    // 4. Submit & Auto-Check
    document.getElementById('qc-submit').onclick = function() {
        // A. Proses Checkbox Otomatis
        const selected = packaging.find((x) => x.size === sizeSelect.value);
        if (selected) setCheckboxByVolume(selected.isi);

        // B. Proses PO & Batch (React Injection)
        const textAreaPO = document.querySelector('textarea[class*="textarea"]');
        const divBatch = document.querySelector('div[data-lexical-editor="true"]');
        
        if (inputPO && textAreaPO) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            nativeSetter.call(textAreaPO, inputPO.value);
            textAreaPO.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (inputBatch && divBatch) {
            divBatch.focus();
            divBatch.innerText = inputBatch.value;
            divBatch.dispatchEvent(new Event('input', { bubbles: true }));
        }
        simpanMemoriInput();
    };

    // Load Memory
    const saved = localStorage.getItem("qc_panel_memori");
    if (saved) {
        const data = JSON.parse(saved);
        sizeSelect.value = data.size || "";
        // ... (set input lainnya) ...
    }
})();
