(async function () {
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // Bersihkan panel lama
  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  // Load CSS & HTML
  const css = await fetch(`${BASE_URL}/style.css`).then((r) => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  const html = await fetch(`${BASE_URL}/panel.html`).then((r) => r.text());
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());

  // Helper Elements
  const getEl = (id) => document.getElementById(id);
  const sizeSelect = getEl("size-select");
  const densityInput = getEl("density-input");
  const capInput = getEl("cap-input");
  const botolInput = getEl("botol-input");
  const cartonInput = getEl("carton-input");
  const toleransiInput = getEl("toleransi-input");
  const labelInput = getEl("label-input");
  const layerInput = getEl("layer-input");
  const foldingInput = getEl("folding-input");
  const inputPO = getEl("input-scan-po");
  const inputBatch = getEl("input-scan-batch");

  // Inisialisasi awal error class
  if (densityInput && !densityInput.value) densityInput.classList.add("input-error");

  function simpanMemori() {
    localStorage.setItem("qc_panel_memori", JSON.stringify({
      size: sizeSelect.value, density: densityInput?.value, po: inputPO?.value, 
      batch: inputBatch?.value, cap: capInput?.value, botol: botolInput?.value, 
      carton: cartonInput?.value, label: labelInput?.value, layer: layerInput?.value, 
      folding: foldingInput?.value, toleransi: toleransiInput?.value
    }));
  }

  function hitungBerat() {
    const s = packaging.find((x) => x.size === sizeSelect.value);
    const d = parseFloat(densityInput.value);
    if (!s || isNaN(d) || d <= 0) return;

    // Nett
    const nT = s.volume * d;
    getEl("nett-target").value = nT.toFixed(2);
    getEl("nett-min").value = ((s.volume - s.toleransi) * d).toFixed(2);
    getEl("nett-max").value = ((s.volume + s.toleransi) * d).toFixed(2);

    // Gross Pcs
    const b = parseFloat(botolInput.value)||0, c = parseFloat(capInput.value)||0;
    const gT = nT + b + c;
    const gM = (parseFloat(getEl("nett-min").value) || 0) + b + c;
    const gMax = (parseFloat(getEl("nett-max").value) || 0) + b + c;
    
    getEl("gross-target").value = gT.toFixed(2);
    getEl("gross-min").value = gM.toFixed(2);
    getEl("gross-max").value = gMax.toFixed(2);

    // Gross Carton
    const crt = parseFloat(cartonInput.value)||0, lb = parseFloat(labelInput.value)||0, fd = parseFloat(foldingInput.value)||0, isi = s.isi||0;
    const totBahan = lb + fd;
    const targetC = (((gT + totBahan) * isi) + crt) / 1000;
    const maxC = (((gMax + totBahan) * isi) + crt) / 1000;

    getEl("carton-target").value = targetC.toFixed(3);
    getEl("carton-max").value = maxC.toFixed(3);

    if (s.volume <= 250) {
      getEl("carton-min").value = ((((gT + totBahan) * isi) + crt) - nT) / 1000;
      getEl("carton-toleransi").value = ((gT - 15) / 1000).toFixed(3);
    } else {
      getEl("carton-min").value = (((gM + totBahan) * isi) + crt) / 1000;
      getEl("carton-toleransi").value = (maxC - targetC).toFixed(3);
    }
  }

  // Events
  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
  packaging.forEach(i => { sizeSelect.innerHTML += `<option value="${i.size}">${i.size}</option>`; });

  sizeSelect.addEventListener("change", function () {
    const s = packaging.find(x => x.size === this.value);
    if (s) {
      capInput.value = s.cap; botolInput.value = s.botol; cartonInput.value = s.carton;
      toleransiInput.value = s.toleransi; labelInput.value = s.label; foldingInput.value = s.folding;
    }
    simpanMemori(); hitungBerat();
  });

  [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput].forEach(i => i?.addEventListener("input", (e) => {
    if (e.target === densityInput) densityInput.classList.toggle("input-error", !e.target.value);
    simpanMemori(); hitungBerat();
  }));

  getEl("qc-close-panel").onclick = () => document.getElementById("qc-panel")?.remove();

  getEl("qc-clear-data").onclick = () => {
    if (confirm("Reset semua data?")) {
      localStorage.removeItem("qc_panel_memori");
      location.reload();
    }
  };

  if (!window.Html5Qrcode) {
    const s = document.createElement("script"); s.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(s);
  }
})();
