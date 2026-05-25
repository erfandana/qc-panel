(async function () {

  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  let panel = document.getElementById("qc-panel");



  // FUNGSI PENGECEKAN WARNA DENSITY

  function checkDensity(el) {

    if (!el || !el.value || el.value.trim() === "") {

      el.classList.add("input-error");

    } else {

      el.classList.remove("input-error");

    }

  }



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



  // Logika ReadOnly

  const targetFields = allInputs.filter((i) => i.getAttribute("placeholder") === "TARGET");

  const minFields = allInputs.filter((i) => i.getAttribute("placeholder") === "MINIMUM");

  const maxFields = allInputs.filter((i) => i.getAttribute("placeholder") === "MAXIMUM");

  const [nettTarget, nettMin, nettMax] = [targetFields[0], minFields[0], maxFields[0]];

  const [grossPcsTarget, grossPcsMin, grossPcsMax] = [targetFields[1], minFields[1], maxFields[1]];

  const [cartonTarget, cartonMin, cartonMax] = [targetFields[2], minFields[2], maxFields[2]];

  const cartonToleransiInput = allInputs.filter((i) => i.getAttribute("placeholder") === "TOLERANSI")[1];



  [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, toleransiInput, cartonToleransiInput].forEach((f) => f && (f.readOnly = true));



  // --- LOGIKA SCANNER ---

  let html5Qrcode = null;

  const camContainer = document.getElementById("qc-camera-container");



  function closeCamera() {

    if (html5Qrcode) {

      html5Qrcode

        .stop()

        .catch(() => {})

        .finally(() => {

          camContainer.style.display = "none";

        });

    }

  }



  function startScanner(targetInput) {

    camContainer.style.display = "block";

    html5Qrcode = new Html5Qrcode("qc-scanner");

    html5Qrcode

      .start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decodedText) => {

        targetInput.value = decodedText;

        simpanMemoriInput();

        checkDensity(densityInput);

        closeCamera();

      })

      .catch((err) => alert("Kamera gagal diakses: " + err));

  }



  document.getElementById("btn-scan-po").onclick = () => startScanner(inputPO);

  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);

  document.getElementById("btn-close-cam").onclick = closeCamera;

  document.getElementById("qc-close-panel").onclick = () => {

    panel.style.display = "none";

  };



  // --- FUNGSI DATA ---

  function simpanMemoriInput() {

    const dataScan = {

      size: sizeSelect.value,

      density: densityInput?.value,

      po: inputPO?.value,

      batch: inputBatch?.value,

      cap: capInput?.value,

      botol: botolInput?.value,

      carton: cartonInput?.value,

      label: labelInput?.value,

      layer: layerInput?.value,

      folding: foldingInput?.value,

      toleransi: toleransiInput?.value,

    };

    localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));

  }



  function loadMemoriInput() {

    const saved = localStorage.getItem("qc_panel_memori");

    if (saved) {

      const data = JSON.parse(saved);

      sizeSelect.value = data.size || "";

      densityInput.value = data.density || "";

      inputPO.value = data.po || "";

      inputBatch.value = data.batch || "";

      capInput.value = data.cap || "";

      botolInput.value = data.botol || "";

      cartonInput.value = data.carton || "";

      labelInput.value = data.label || "";

      layerInput.value = data.layer || "";

      foldingInput.value = data.folding || "";

      toleransiInput.value = data.toleransi || "";

      hitungBerat();

    }

    checkDensity(densityInput); // Pastikan warna terupdate saat pertama kali load

  }



  function hitungBerat() {

    const selected = packaging.find((x) => x.size === sizeSelect.value);

    const density = parseFloat(densityInput.value);

    if (!selected || isNaN(density) || density <= 0) return;



    const targetNettVal = selected.volume * density;

    nettTarget.value = targetNettVal.toFixed(2);

    nettMin.value = ((selected.volume - selected.toleransi) * density).toFixed(2);

    nettMax.value = ((selected.volume + selected.toleransi) * density).toFixed(2);



    const btlAct = parseFloat(botolInput.value) || 0,

      capAct = parseFloat(capInput.value) || 0;

    const grossTarget = targetNettVal + btlAct + capAct;

    grossPcsTarget.value = grossTarget.toFixed(2);

    grossPcsMin.value = (parseFloat(nettMin.value) + btlAct + capAct).toFixed(2);

    grossPcsMax.value = (parseFloat(nettMax.value) + btlAct + capAct).toFixed(2);



    const crtAct = parseFloat(cartonInput.value) || 0,

      lblAct = parseFloat(labelInput.value) || 0,

      fldAct = parseFloat(foldingInput.value) || 0;

    const isiVal = selected.isi || 0;

    const totalBahanInDus = lblAct + fldAct;



    const valTargetCarton = ((grossTarget + totalBahanInDus) * isiVal + crtAct) / 1000;

    cartonTarget.value = valTargetCarton.toFixed(3);

    cartonMax.value = (((parseFloat(grossPcsMax.value) + totalBahanInDus) * isiVal + crtAct) / 1000).toFixed(3);



    if (selected.volume <= 250) {

      cartonMin.value = ((grossTarget + totalBahanInDus) * isiVal + crtAct - targetNettVal) / 1000;

      cartonToleransiInput.value = (grossTarget - 15) / 1000;

    } else {

      cartonMin.value = ((parseFloat(grossPcsMin.value) + totalBahanInDus) * isiVal + crtAct) / 1000;

      cartonToleransiInput.value = parseFloat(cartonMax.value) - valTargetCarton;

    }

  }

  function isiField(index, sourceId) {
    const sourceEl = document.getElementById(sourceId);
    const target = document.querySelectorAll('textarea')[index];

    if (sourceEl && target) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, "value"
        ).set;
        
        nativeInputValueSetter.call(target, sourceEl.value);

        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log(`Berhasil mengisi textarea index ${index} dengan nilai dari ${sourceId}`);
    } else {
        console.error(`Gagal mengisi index ${index} atau ID ${sourceId} tidak ditemukan.`);
    }
}



  if (!window.Html5Qrcode) {

    const s = document.createElement("script");

    s.src = "https://unpkg.com/html5-qrcode";

    document.head.appendChild(s);

  }



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

      capInput.value = s.cap;

      botolInput.value = s.botol;

      cartonInput.value = s.carton;

      toleransiInput.value = s.toleransi.toFixed(2);

      labelInput.value = s.label;

      layerInput.value = s.layer;

      foldingInput.value = s.folding;

    }

    simpanMemoriInput();

    hitungBerat();

  });



  [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput].forEach((i) =>

    i?.addEventListener("input", () => {

      checkDensity(densityInput); // Cek setiap ada input

      simpanMemoriInput();

      hitungBerat();

    }),

  );



  document.getElementById("qc-clear-data").onclick = () => {

    if (confirm("Reset form?")) {

      localStorage.removeItem("qc_panel_memori");

      allInputs.forEach((i) => (i.value = ""));

      sizeSelect.value = "";

      checkDensity(densityInput); // Reset warna jadi merah saat dikosongkan

      hitungBerat();

    }

  };

document.getElementById('qc-submit').onclick = function() {
    //Proses BATCH
    const inputBatch = document.querySelector('input[placeholder="TEXT INPUT HASIL SCAN BATCH"]');
    const divBatch = document.querySelector('div[data-lexical-editor="true"]');
    if (inputBatch && divBatch) {
        divBatch.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', inputBatch.value);
        divBatch.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dataTransfer }));
    }


	//Otomatisasi Checkbox Kemasan Berdasarkan JSON 'item.volume'
    const selectedSize = document.getElementById("size-select").value;
    const item = packaging.find(p => p.size === selectedSize);

    if (item && item.volume) {
        // Konversi angka JSON ke format teks UI (contoh: 500 -> "500 mL", 1000 -> "1 L")
        const targetText = item.volume >= 1000 ? (item.volume / 1000) + " L" : item.volume + " mL";

        // Menggunakan selector class yang dinamis (menggunakan *="text-" untuk menghindari masalah perubahan angka class)
        const labels = document.querySelectorAll('label[class*="container-"]');
        
        labels.forEach(label => {
            const span = label.querySelector('span[class*="text-"]');
            const checkbox = label.querySelector('input[type="checkbox"]');
            
            if (span && checkbox && span.textContent.trim().toLowerCase() === targetText.toLowerCase()) {
                if (!checkbox.checked) {
                    // Paksa centang dengan cara "Native"
                    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set;
                    nativeSetter.call(checkbox, true);
                    
                    // Memicu event agar React mendeteksi perubahan
                    checkbox.dispatchEvent(new Event('click', { bubbles: true }));
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    console.log("Checkbox terpilih: " + targetText);
                }
            }
        });
    }

    // Cukup panggil fungsi ini untuk setiap field yang ingin diisi
    isiField(0, "input-scan-po");  
    isiField(1, "input-density");
    isiField(2, "target-gross-pcs");
    isiField(3, "target-minimum-gross-pcs");
    isiField(4, "target-maximum-gross-pcs");
    isiField(5, "target-gross-carton");
    isiField(6, "target-minimum-gross-carton");
    isiField(7, "target-maximum-gross-carton");
  	
    console.log("Semua field berhasil diisi!");
};
  loadMemoriInput();

})();
