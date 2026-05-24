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

  [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, toleransiInput, cartonToleransiInput].forEach(f => f && (f.readOnly = true));

  if (densityInput && !densityInput.value) densityInput.classList.add("input-error");

  function simpanMemoriInput() {
    const dataScan = { size: sizeSelect.value, density: densityInput?.value, po: inputPO?.value, batch: inputBatch?.value, cap: capInput?.value, botol: botolInput?.value, carton: cartonInput?.value, label: labelInput?.value, layer: layerInput?.value, folding: foldingInput?.value, toleransi: toleransiInput?.value };
    localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));
  }

  function filterInputAngka(e) {
    let val = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    e.target.value = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : val;
    if (e.target === densityInput) e.target.classList.toggle("input-error", e.target.value.trim() === "");
    simpanMemoriInput();
    hitungBerat();
  }

  function hitungBerat() {
    const selected = packaging.find((x) => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    if (!selected || isNaN(density) || density <= 0) {
      [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput].forEach(f => f && (f.value = ""));
      return;
    }

    const targetNettVal = selected.volume * density;
    nettTarget.value = targetNettVal.toFixed(2);
    nettMin.value = ((selected.volume - selected.toleransi) * density).toFixed(2);
    nettMax.value = ((selected.volume + selected.toleransi) * density).toFixed(2);

    const btlAct = parseFloat(botolInput.value) || 0, capAct = parseFloat(capInput.value) || 0;
    grossPcsTarget.value = (targetNettVal + btlAct + capAct).toFixed(2);
    grossPcsMin.value = (parseFloat(nettMin.value) + btlAct + capAct).toFixed(2);
    grossPcsMax.value = (parseFloat(nettMax.value) + btlAct + capAct).toFixed(2);

    const crtAct = parseFloat(cartonInput.value) || 0, lblAct = parseFloat(labelInput.value) || 0, fldAct = parseFloat(foldingInput.value) || 0, isiVal = selected.isi || 0;
    const totalBahanInDus = lblAct + fldAct;
    
    const targetGrossPcs = parseFloat(grossPcsTarget.value);
    const minGrossPcs = parseFloat(grossPcsMin.value);
    const maxGrossPcs = parseFloat(grossPcsMax.value);

    cartonTarget.value = (((targetGrossPcs + totalBahanInDus) * isiVal) + crtAct) / 1000;
    cartonMax.value = (((maxGrossPcs + totalBahanInDus) * isiVal) + crtAct) / 1000;

    if (selected.volume <= 250) {
      cartonMin.value = ((((targetGrossPcs + totalBahanInDus) * isiVal) + crtAct) - targetNettVal) / 1000;
      cartonToleransiInput.value = (targetGrossPcs - 15) / 1000;
    } else {
      cartonMin.value = (((minGrossPcs + totalBahanInDus) * isiVal) + crtAct) / 1000;
      cartonToleransiInput.value = parseFloat(cartonMax.value) - parseFloat(cartonTarget.value);
    }
    
    [cartonTarget, cartonMin, cartonMax, cartonToleransiInput].forEach(f => f && f.value && (f.value = parseFloat(f.value).toFixed(3)));
  }

  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
  packaging.forEach(item => { const o = document.createElement("option"); o.value = item.size; o.textContent = item.size; sizeSelect.appendChild(o); });

  sizeSelect.addEventListener("change", function () {
    const s = packaging.find((x) => x.size === this.value);
    if (s) {
      capInput.value = s.cap; botolInput.value = s.botol; cartonInput.value = s.carton;
      toleransiInput.value = s.toleransi.toFixed(2); labelInput.value = s.label;
      layerInput.value = s.layer; foldingInput.value = s.folding;
    }
    simpanMemoriInput(); hitungBerat();
  });

  [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput].forEach(i => i?.addEventListener("input", filterInputAngka));
  [inputPO, inputBatch].forEach(i => i?.addEventListener("input", simpanMemoriInput));

  document.getElementById("qc-clear-data").onclick = () => {
    if (confirm("Reset form?")) {
      localStorage.removeItem("qc_panel_memori");
      sizeSelect.value = "";
      allInputs.forEach(i => i.value = "");
      if (densityInput) densityInput.classList.add("input-error");
    }
  };

  if (!window.Html5Qrcode) {
    const s = document.createElement("script"); s.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(s);
  }
})();
