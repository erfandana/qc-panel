(async function () {

  // =========================
  // BASE GITHUB REPO
  // =========================
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // =========================
  // REMOVE OLD PANEL
  // =========================
  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  // =========================
  // LOAD CSS
  // =========================
  const css = await fetch(`${BASE_URL}/style.css`).then(r => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // =========================
  // LOAD HTML
  // =========================
  let html = await fetch(`${BASE_URL}/panel.html`).then(r => r.text());

  // Injeksi ID secara dinamis ke panel.html agar tidak merusak file mentah Anda
  html = html
    .replace('placeholder="TEXT INPUT DENSITY"', 'id="density-input" placeholder="TEXT INPUT DENSITY"')
    .replace('label="TARGET"><input type="text" placeholder="DROPDOWN SIZE"', 'label="TARGET"><input type="text" id="nett-target" placeholder="TARGET NETT" readonly')
    .replace('label="MINIMUM"><input type="text" placeholder="TEXT INPUT MINIMUM"', 'label="MINIMUM"><input type="text" id="nett-min" placeholder="MIN NETT" readonly')
    .replace('label="MAXIMUM"><input type="text" placeholder="TEXT INPUT MAXIMUM"', 'label="MAXIMUM"><input type="text" id="nett-max" placeholder="MAX NETT" readonly')
    .replace('label="TARGET"><input type="text" placeholder="DROPDOWN SIZE"', 'label="TARGET"><input type="text" id="gross-pcs-target" placeholder="TARGET GROSS PCS" readonly')
    .replace('label="MINIMUM"><input type="text" placeholder="TEXT INPUT MINIMUM"', 'label="MINIMUM"><input type="text" id="gross-pcs-min" placeholder="MIN GROSS PCS" readonly')
    .replace('label="MAXIMUM"><input type="text" placeholder="TEXT INPUT MAXIMUM"', 'label="MAXIMUM"><input type="text" id="gross-pcs-max" placeholder="MAX GROSS PCS" readonly')
    .replace('label="TARGET"><input type="text" placeholder="DROPDOWN SIZE"', 'label="TARGET"><input type="text" id="carton-target" placeholder="TARGET GROSS CARTON" readonly')
    .replace('label="MINIMUM"><input type="text" placeholder="TEXT INPUT MINIMUM"', 'label="MINIMUM"><input type="text" id="carton-min" placeholder="MIN GROSS CARTON" readonly')
    .replace('label="MAXIMUM"><input type="text" placeholder="TEXT INPUT MAXIMUM"', 'label="MAXIMUM"><input type="text" id="carton-max" placeholder="MAX GROSS CARTON" readonly')
    .replace('label="TOLERANSI"><input type="text" placeholder="TEXT INPUT TOLERANSI"', 'label="TOLERANSI"><input type="text" id="carton-toleransi-input" placeholder="TOLERANSI CARTON" readonly');

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // =========================
  // LOAD JSON
  // =========================
  const packaging = await fetch(`${BASE_URL}/packaging.json`).then(r => r.json());

  // =========================
  // ELEMENTS
  // =========================
  const sizeSelect = document.getElementById("size-select");
  const densityInput = document.getElementById("density-input");
  const capInput = document.getElementById("cap-input");
  const botolInput = document.getElementById("botol-input");
  const cartonInput = document.getElementById("carton-input");
  const toleransiInput = document.getElementById("toleransi-input");

  // Output Elements (Kalkulasi)
  const nettTarget = document.getElementById("nett-target");
  const nettMin = document.getElementById("nett-min");
  const nettMax = document.getElementById("nett-max");

  const grossPcsTarget = document.getElementById("gross-pcs-target");
  const grossPcsMin = document.getElementById("gross-pcs-min");
  const grossPcsMax = document.getElementById("gross-pcs-max");

  const cartonTarget = document.getElementById("carton-target");
  const cartonMin = document.getElementById("carton-min");
  const cartonMax = document.getElementById("carton-max");
  const cartonToleransiInput = document.getElementById("carton-toleransi-input");

  // =========================
  // FILL DROPDOWN
  // =========================
  sizeSelect.innerHTML = '<option value="">DROPDOWN SIZE</option>';
  packaging.forEach(item => {
    const option = document.createElement("option");
    option.value = item.size;
    option.textContent = item.size;
    sizeSelect.appendChild(option);
  });

  // =========================
  // KALKULASI OTOMATIS BERAT
  // =========================
  function hitungBerat() {
    const selected = packaging.find(x => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    // Validasi jika size belum dipilih atau density belum diisi angka valid
    if (!selected || isNaN(density) || density <= 0) {
      const fields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput];
      fields.forEach(f => { if(f) f.value = ""; });
      return;
    }

    // 1. Hitung Nett Per Pcs (gram)
    const targetNettVal = selected.volume * density;
    const minNettVal = targetNettVal - selected.toleransi;
    const maxNettVal = targetNettVal + selected.toleransi;

    nettTarget.value = targetNettVal.toFixed(2);
    nettMin.value = minNettVal.toFixed(2);
    nettMax.value = maxNettVal.toFixed(2);

    // 2. Hitung Gross Per Pcs (gram)
    const targetGrossPcsVal = targetNettVal + selected.botol + selected.cap + selected.label;
    const minGrossPcsVal = targetGrossPcsVal - selected.toleransi;
    const maxGrossPcsVal = targetGrossPcsVal + selected.toleransi;

    grossPcsTarget.value = targetGrossPcsVal.toFixed(2);
    grossPcsMin.value = minGrossPcsVal.toFixed(2);
    grossPcsMax.value = maxGrossPcsVal.toFixed(2);

    // 3. Hitung Gross Per Carton (kg)
    const targetCartonVal = ((targetGrossPcsVal * selected.isi) + selected.carton) / 1000;
    const toleransiCartonVal = (selected.toleransi * selected.layer) / 1000; 
    const minCartonVal = targetCartonVal - toleransiCartonVal;
    const maxCartonVal = targetCartonVal + toleransiCartonVal;

    cartonTarget.value = targetCartonVal.toFixed(3);
    cartonMin.value = minCartonVal.toFixed(3);
    cartonMax.value = maxCartonVal.toFixed(3);
    cartonToleransiInput.value = toleransiCartonVal.toFixed(3);
  }

  // =========================
  // EVENTS HANDLER
  // =========================
  sizeSelect.addEventListener("change", function () {
    const selected = packaging.find(x => x.size === this.value);
    if (!selected) {
      capInput.value = "";
      botolInput.value = "";
      cartonInput.value = "";
      toleransiInput.value = "";
    } else {
      capInput.value = selected.cap;
      botolInput.value = selected.botol;
      cartonInput.value = selected.carton;
      toleransiInput.value = selected.toleransi;
    }
    hitungBerat();
  });

  densityInput.addEventListener("input", hitungBerat);

  // =========================
  // LOAD QR LIB & SCANNER
  // =========================
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(script);
    await new Promise(resolve => { script.onload = resolve; });
  }

  let scanner = null;
  let activeInput = null;
  const cameraContainer = document.getElementById("qc-camera-container");
  const inputPO = document.getElementById("input-scan-po");
  const inputBatch = document.getElementById("input-scan-batch");

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
    ).catch(err => console.error("Gagal menjalankan kamera:", err));
  }

  function stopScanner() {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => { cameraContainer.style.display = "none"; });
    } else {
      cameraContainer.style.display = "none";
    }
  }

  // Button Trigger Events
  document.getElementById("btn-scan-po").onclick = () => startScanner(inputPO);
  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);
  document.getElementById("btn-close-cam").onclick = stopScanner;
  
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
