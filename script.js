(async function () {

  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // Hapus panel lama jika ada
  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  // Load CSS
  const css = await fetch(`${BASE_URL}/style.css`).then(r => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // Load HTML
  const html = await fetch(`${BASE_URL}/panel.html`).then(r => r.text());
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Load Data JSON
  const packaging = await fetch(`${BASE_URL}/packaging.json`).then(r => r.json());

  // Seleksi Elemen
  const panel = document.getElementById("qc-panel");
  const sizeSelect = document.getElementById("size-select");
  const allInputs = Array.from(panel.querySelectorAll("input"));

  const findByPlaceholder = (text) => allInputs.find(input => input.getAttribute("placeholder") === text);

  // Input Spesifikasi (Dapat diedit manual jika aktual lapangan berubah)
  const densityInput = findByPlaceholder("TEXT INPUT DENSITY");
  const capInput     = findByPlaceholder("TEXT INPUT CAP");
  const botolInput   = findByPlaceholder("TEXT INPUT BOTOL");
  const cartonInput  = findByPlaceholder("TEXT INPUT CARTON");
  
  const toleransiInput = allInputs.find(input => 
    input.getAttribute("placeholder") === "TEXT INPUT TOLERANSI" || 
    input.previousElementSibling?.textContent.trim() === "TOLERANSI"
  );

  // Input Hasil Scanner
  const inputPO    = findByPlaceholder("TEXT INPUT HASIL SCAN PO");
  const inputBatch = findByPlaceholder("TEXT INPUT HASIL SCAN BATCH");

  // Input Hasil Kalkulasi (Target, Min, Max)
  const targetFields = allInputs.filter(input => input.getAttribute("placeholder") === "DROPDOWN SIZE");
  const minFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MINIMUM");
  const maxFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MAXIMUM");

  const nettTarget = targetFields[0];
  const nettMin    = minFields[0];
  const nettMax    = maxFields[0];

  const grossPcsTarget = targetFields[1];
  const grossPcsMin    = minFields[1];
  const grossPcsMax    = maxFields[1];

  const cartonTarget = targetFields[2];
  const cartonMin    = minFields[2];
  const cartonMax    = maxFields[2];
  
  const cartonToleransiInput = findByPlaceholder("TEXT INPUT TOLERANSI");

  // KUNCI komponen kalkulasi agar tidak bisa diinput manual oleh operator (Read-Only)
  const readonlyFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput];
  readonlyFields.forEach(field => { if (field) field.readOnly = true; });

  // Setup Dropdown Size
  sizeSelect.innerHTML = '<option value="">DROPDOWN SIZE</option>';
  packaging.forEach(item => {
    const option = document.createElement("option");
    option.value = item.size;
    option.textContent = item.size;
    sizeSelect.appendChild(option);
  });

  // FUNGSI UTAMA KALKULASI BERAT
  function hitungBerat() {
    const selected = packaging.find(x => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    if (!selected || isNaN(density) || density <= 0) {
      readonlyFields.forEach(f => { if (f) f.value = ""; });
      return;
    }

    // 1. BERAT NETT PER PCS (gr) -> Selesai dalam kurung dulu baru dikali density
    const targetNettVal = selected.volume * density;
    const minNettVal    = (selected.volume - selected.toleransi) * density;
    const maxNettVal    = (selected.volume + selected.toleransi) * density;

    if (nettTarget) nettTarget.value = targetNettVal.toFixed(2);
    if (nettMin)    nettMin.value    = minNettVal.toFixed(2);
    if (nettMax)    nettMax.value    = maxNettVal.toFixed(2);

    // 2. BERAT GROSS PER PCS (gr) -> Hasil Nett + Input aktual Botol + Input aktual Cap
    const btlAct = parseFloat(botolInput.value) || 0;
    const capAct = parseFloat(capInput.value) || 0;

    const targetGrossPcsVal = targetNettVal + btlAct + capAct;
    const minGrossPcsVal    = minNettVal + btlAct + capAct;
    const maxGrossPcsVal    = maxNettVal + btlAct + capAct;

    if (grossPcsTarget) grossPcsTarget.value = targetGrossPcsVal.toFixed(2);
    if (grossPcsMin)    grossPcsMin.value    = minGrossPcsVal.toFixed(2);
    if (grossPcsMax)    grossPcsMax.value    = maxGrossPcsVal.toFixed(2);

    // 3. BERAT GROSS PER CARTON (kg) -> Sesuai rumus baru gabungan layer & folding
    const lblVal = selected.label || 0;
    const lyrVal = selected.layer || 0;
    const fldVal = selected.folding || 0;
    const isiVal = selected.isi || 0;
    const crtAct = parseFloat(cartonInput.value) || 0;

    const targetCartonVal = ((targetGrossPcsVal * isiVal) + (lblVal * isiVal) + crtAct + lyrVal + fldVal) / 1000;
    const minCartonVal    = ((minGrossPcsVal * isiVal) + (lblVal * isiVal) + crtAct + lyrVal + fldVal) / 1000;
    const maxCartonVal    = ((maxGrossPcsVal * isiVal) + (lblVal * isiVal) + crtAct + lyrVal + fldVal) / 1000;

    if (cartonTarget) cartonTarget.value = targetCartonVal.toFixed(3);
    if (cartonMin)    cartonMin.value    = minCartonVal.toFixed(3);
    if (cartonMax)    cartonMax.value    = maxCartonVal.toFixed(3);

    // Hitung Toleransi Carton Otomatis (Selisih Max dan Target)
    if (cartonToleransiInput) {
      const toleransiCarton = maxCartonVal - targetCartonVal;
      cartonToleransiInput.value = toleransiCarton.toFixed(3);
    }
  }

  // Event Listener (Pemicu hitung ulang otomatis saat diketik manual)
  sizeSelect.addEventListener("change", function () {
    const selected = packaging.find(x => x.size === this.value);
    if (!selected) {
      if (capInput)       capInput.value = "";
      if (botolInput)     botolInput.value = "";
      if (cartonInput)    cartonInput.value = "";
      if (toleransiInput) toleransiInput.value = "";
    } else {
      if (capInput)       capInput.value = selected.cap;
      if (botolInput)     botolInput.value = selected.botol;
      if (cartonInput)    cartonInput.value = selected.carton;
      if (toleransiInput) toleransiInput.value = selected.toleransi; // Auto-load toleransi atas dari JSON
    }
    hitungBerat();
  });

  if (densityInput) densityInput.addEventListener("input", hitungBerat);
  if (capInput)     capInput.addEventListener("input", hitungBerat);
  if (botolInput)   botolInput.addEventListener("input", hitungBerat);
  if (cartonInput)  cartonInput.addEventListener("input", hitungBerat);

  // Integrasi QR Scanner
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(script);
    await new Promise(resolve => { script.onload = resolve; });
  }

  let scanner = null;
  let activeInput = null;
  const cameraContainer = document.getElementById("qc-camera-container");

  async function startScanner(targetInput) {
    activeInput = targetInput;
    cameraContainer.style.display = "block";
    if (scanner) {
      try { if (scanner.isScanning) await scanner.stop(); } catch (e) {}
    } else {
      scanner = new Html5Qrcode("qc-scanner");
    }
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        activeInput.value = decodedText;
        activeInput.style.backgroundColor = "#d4ffd4";
        setTimeout(() => { activeInput.style.backgroundColor = "#fff"; }, 700);
        stopScanner();
      },
      () => {}
    ).catch(err => console.error(err));
  }

  function stopScanner() {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => { cameraContainer.style.display = "none"; });
    } else {
      cameraContainer.style.display = "none";
    }
  }

  document.getElementById("btn-scan-po").onclick    = () => startScanner(inputPO);
  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);
  document.getElementById("btn-close-cam").onclick   = stopScanner;

  document.getElementById("qc-submit").onclick = () => {
    if (!sizeSelect.value || !densityInput.value) {
      alert("Harap pilih SIZE dan isi DENSITY terlebih dahulu!");
      return;
    }
    alert("SUBMIT BERHASIL!\nData berat produk siap dikirim ke sistem.");
  };

  document.getElementById("qc-close-panel").onclick = () => {
    stopScanner();
    setTimeout(() => { document.getElementById("qc-panel")?.remove(); }, 300);
  };

})();
