(async function () {
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";
  let panel = document.getElementById("qc-panel");

  // --- 1. SETUP UI ---
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

  // --- 2. DEFINISI INPUT ---
  const allInputs = Array.from(panel.querySelectorAll("input"));
  const findByPlaceholder = (text) => allInputs.find((i) => i.getAttribute("placeholder") === text);

  const sizeSelect = document.getElementById("size-select");
  const capInput = document.getElementById("cap-input");
  const botolInput = document.getElementById("botol-input");
  const cartonInput = document.getElementById("carton-input");
  const toleransiInput = document.getElementById("toleransi-input");
  const labelInput = document.getElementById("label-input");
  const layerInput = document.getElementById("layer-input");
  const foldingInput = document.getElementById("folding-input");
  const densityInput = findByPlaceholder("INPUT DENSITY");
  const inputPO = findByPlaceholder("TEXT INPUT HASIL SCAN PO");
  const inputBatch = findByPlaceholder("TEXT INPUT HASIL SCAN BATCH");

  // --- 3. HELPER FUNCTIONS ---
  function checkDensity(el) {
    if (!el || !el.value || el.value.trim() === "") el.classList.add("input-error");
    else el.classList.remove("input-error");
  }

  function simpanMemoriInput() {
    const dataScan = { size: sizeSelect.value, density: densityInput?.value, po: inputPO?.value, batch: inputBatch?.value, cap: capInput?.value, botol: botolInput?.value, carton: cartonInput?.value, label: labelInput?.value, layer: layerInput?.value, folding: foldingInput?.value, toleransi: toleransiInput?.value };
    localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));
  }

  function hitungBerat() {
    const selected = packaging.find((x) => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);
    if (!selected || isNaN(density) || density <= 0) return;
    
    // Logika perhitungan tetap sama...
    const targetNettVal = selected.volume * density;
    // (Lanjutkan logika hitung berat Anda di sini)
  }

  // --- 4. DROPDOWN & AUTO-CHECK LOGIC ---
  function initDropdown() {
    if (!sizeSelect) { setTimeout(initDropdown, 100); return; }
    sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
    packaging.forEach((item) => {
      const o = document.createElement("option");
      o.value = item.size; o.textContent = item.size;
      sizeSelect.appendChild(o);
    });

    sizeSelect.addEventListener("change", function () {
      const s = packaging.find((x) => x.size === this.value);
      if (s) {
        capInput.value = s.cap; botolInput.value = s.botol;
        cartonInput.value = s.carton; toleransiInput.value = s.toleransi.toFixed(2);
        labelInput.value = s.label; layerInput.value = s.layer;
        foldingInput.value = s.folding;

        // AUTO-CHECK BERDASARKAN JSON VOLUME
        const targetVolText = s.volume + " mL";
        document.querySelectorAll('span[class*="text-"]').forEach(span => {
          if (span.textContent.trim() === targetVolText) {
            const checkbox = span.closest('.checkListItemSimpleChecklist-0-2-755')?.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
              checkbox.click();
            }
          }
        });
      }
      simpanMemoriInput();
      hitungBerat();
    });
  }

  // --- 5. SCANNER & SUBMIT ---
  // (Masukkan logika startScanner dan qc-submit Anda di sini)
  document.getElementById('qc-submit').onclick = function() {
    // Implementasi logic State Injection Anda
  };

  initDropdown();
  // (Load memory logic Anda)
})();
