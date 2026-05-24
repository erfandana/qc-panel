(async function () {
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  const css = await fetch(`${BASE_URL}/style.css`).then((r) => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  const html = await fetch(`${BASE_URL}/panel.html`).then((r) => r.text());
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());

  const panel = document.getElementById("qc-panel");
  const sizeSelect = document.getElementById("size-select");
  const allInputs = Array.from(panel.querySelectorAll("input"));

  const findByPlaceholder = (text) => allInputs.find((input) => input.getAttribute("placeholder") === text);

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

  const targetFields = allInputs.filter((input) => input.getAttribute("placeholder") === "TARGET");
  const minFields = allInputs.filter((input) => input.getAttribute("placeholder") === "MINIMUM");
  const maxFields = allInputs.filter((input) => input.getAttribute("placeholder") === "MAXIMUM");

  const nettTarget = targetFields[0], nettMin = minFields[0], nettMax = maxFields[0];
  const grossPcsTarget = targetFields[1], grossPcsMin = minFields[1], grossPcsMax = maxFields[1];
  const cartonTarget = targetFields[2], cartonMin = minFields[2], cartonMax = maxFields[2];
  const cartonToleransiInput = allInputs.filter((input) => input.getAttribute("placeholder") === "TOLERANSI").find((input) => input !== toleransiInput);

  const readonlyFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, toleransiInput, cartonToleransiInput];
  readonlyFields.forEach((field) => { if (field) field.readOnly = true; });

  const btnClear = document.getElementById("qc-clear-data");
  
  // --- LOGIKA DENSITY ERROR ---
  if (densityInput) {
    if (!densityInput.value) densityInput.classList.add("input-error");
  }

  function simpanMemoriInput() {
    const dataScan = { size: sizeSelect.value, density: densityInput?.value, po: inputPO?.value, batch: inputBatch?.value, cap: capInput?.value, botol: botolInput?.value, carton: cartonInput?.value, label: labelInput?.value, layer: layerInput?.value, folding: foldingInput?.value, toleransi: toleransiInput?.value };
    localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));
  }

  function muatMemoriInput() {
    const simpanan = localStorage.getItem("qc_panel_memori");
    if (simpanan) {
      const data = JSON.parse(simpanan);
      if (sizeSelect) sizeSelect.value = data.size || "";
      if (densityInput) {
        densityInput.value = data.density || "";
        densityInput.classList.toggle("input-error", !densityInput.value);
      }
      if (inputPO) inputPO.value = data.po || "";
      if (inputBatch) inputBatch.value = data.batch || "";
      if (capInput) capInput.value = data.cap || "";
      if (botolInput) botolInput.value = data.botol || "";
      if (cartonInput) cartonInput.value = data.carton || "";
      if (labelInput) labelInput.value = data.label || "";
      if (layerInput) layerInput.value = data.layer || "";
      if (foldingInput) foldingInput.value = data.folding || "";
      if (toleransiInput) toleransiInput.value = data.toleransi || "";
    }
  }

  function filterInputAngka(e) {
    let val = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    e.target.value = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : val;
    
    // Toggle error class untuk density
    if (e.target === densityInput) {
      e.target.classList.toggle("input-error", e.target.value.trim() === "");
    }
    
    simpanMemoriInput();
    hitungBerat();
  }

  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
  packaging.forEach((item) => { const option = document.createElement("option"); option.value = item.size; option.textContent = item.size; sizeSelect.appendChild(option); });

  muatMemoriInput();

  function hitungBerat() {
    const selected = packaging.find((x) => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    if (!selected || isNaN(density) || density <= 0) {
      [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput].forEach((input) => { if (input) input.value = ""; });
      return;
    }

    const targetNettVal = selected.volume * density;
    const minNettVal = (selected.volume - selected.toleransi) * density;
    const maxNettVal = (selected.volume + selected.toleransi) * density;

    if (nettTarget) nettTarget.value = targetNettVal.toFixed(2);
    if (nettMin) nettMin.value = minNettVal.toFixed(2);
    if (nettMax) nettMax.value = maxNettVal.toFixed(2);

    const btlAct = parseFloat(botolInput.value) || 0;
    const capAct = parseFloat(capInput.value) || 0;
    const targetGrossPcsVal = targetNettVal + btlAct + capAct;
    const minGrossPcsVal = minNettVal + btlAct + capAct;
    const maxGrossPcsVal = maxNettVal + btlAct + capAct;

    if (grossPcsTarget) grossPcsTarget.value = targetGrossPcsVal.toFixed(2);
    if (grossPcsMin) grossPcsMin.value = minGrossPcsVal.toFixed(2);
    if (grossPcsMax) grossPcsMax.value = maxGrossPcsVal.toFixed(2);

    const crtAct = parseFloat(cartonInput.value) || 0;
    const lblAct = parseFloat(labelInput.value) || 0;
    const fldAct = parseFloat(foldingInput.value) || 0;
    const isiVal = selected.isi || 0;
    const totalBahanInDus = lblAct + fldAct;

    const targetCartonVal = ((targetGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;
    const maxCartonVal = ((maxGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;
    let minCartonVal = (selected.volume <= 250) ? (targetCartonVal - targetGrossPcsVal / 1000) : ((minGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;
    let toleransiCartonVal = (selected.volume <= 250) ? ((targetGrossPcsVal - 15) / 1000) : (maxCartonVal - targetCartonVal);

    if (cartonTarget) cartonTarget.value = targetCartonVal.toFixed(3);
    if (cartonMin) cartonMin.value = minCartonVal.toFixed(3);
    if (cartonMax) cartonMax.value = maxCartonVal.toFixed(3);
    if (cartonToleransiInput) cartonToleransiInput.value = toleransiCartonVal.toFixed(3);
  }

  sizeSelect.addEventListener("change", function () {
    const selected = packaging.find((x) => x.size === this.value);
    if (!selected) {
      [capInput, botolInput, cartonInput, toleransiInput, labelInput, layerInput, foldingInput].forEach((inp) => { if (inp) inp.value = ""; });
    } else {
      if (capInput) capInput.value = selected.cap;
      if (botolInput) botolInput.value = selected.botol;
      if (cartonInput) cartonInput.value = selected.carton;
      if (toleransiInput) toleransiInput.value = selected.toleransi.toFixed(2);
      if (labelInput) labelInput.value = selected.label || 0;
      if (layerInput) layerInput.value = selected.layer || 0;
      if (foldingInput) foldingInput.value = selected.folding || 0;
    }
    simpanMemoriInput();
    hitungBerat();
  });

  const inputsDiedit = [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput];
  inputsDiedit.forEach((input) => { if (input) input.addEventListener("input", filterInputAngka); });

  [inputPO, inputBatch].forEach((inp) => { if (inp) inp.addEventListener("input", simpanMemoriInput); });

  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(script);
  }

  // Scanner Logic ...
  // (Sisa kode scanner dan clear data Anda tetap sama)

  if (btnClear) {
    btnClear.onclick = () => {
      if (confirm("Apakah Anda yakin ingin mengosongkan semua isi form/scan?")) {
        localStorage.removeItem("qc_panel_memori");
        if (sizeSelect) sizeSelect.value = "";
        const inputsHarusBersih = [densityInput, inputPO, inputBatch, capInput, botolInput, cartonInput, toleransiInput, labelInput, layerInput, foldingInput];
        inputsHarusBersih.forEach((inp) => { if (inp) inp.value = ""; });
        allInputs.forEach((input) => { if (input.readOnly) input.value = ""; });
        if (densityInput) densityInput.classList.add("input-error");
      }
    };
  }

  document.getElementById("qc-close-panel").onclick = () => {
    document.getElementById("qc-panel")?.remove();
  };
})();
