(async function () {
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";
  const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());

  const sizeSelect = document.getElementById("size-select");
  const densityInput = document.getElementById("density-input");
  const capInput = document.getElementById("cap-input");
  const botolInput = document.getElementById("botol-input");
  const cartonInput = document.getElementById("carton-input");
  const toleransiInput = document.getElementById("toleransi-input");
  const labelInput = document.getElementById("label-input");
  const layerInput = document.getElementById("layer-input");
  const foldingInput = document.getElementById("folding-input");

  const getEl = (id) => document.getElementById(id);
  const inputs = [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput];

  if (densityInput && !densityInput.value) densityInput.classList.add("input-error");

  function hitungBerat() {
    const s = packaging.find((x) => x.size === sizeSelect.value);
    const d = parseFloat(densityInput.value);
    if (!s || isNaN(d) || d <= 0) return;

    const nT = s.volume * d;
    getEl("nett-target").value = nT.toFixed(2);
    getEl("nett-min").value = ((s.volume - s.toleransi) * d).toFixed(2);
    getEl("nett-max").value = ((s.volume + s.toleransi) * d).toFixed(2);

    const b = parseFloat(botolInput.value)||0, c = parseFloat(capInput.value)||0;
    const gT = nT + b + c;
    getEl("gross-target").value = gT.toFixed(2);
    getEl("gross-min").value = (parseFloat(getEl("nett-min").value) + b + c).toFixed(2);
    getEl("gross-max").value = (parseFloat(getEl("nett-max").value) + b + c).toFixed(2);

    const crt = parseFloat(cartonInput.value)||0, lb = parseFloat(labelInput.value)||0, fd = parseFloat(foldingInput.value)||0, isi = s.isi||0;
    const totBahan = lb + fd;
    const gPcsT = parseFloat(getEl("gross-target").value), gPcsM = parseFloat(getEl("gross-max").value);

    const targetC = (((gPcsT + totBahan) * isi) + crt) / 1000;
    const maxC = (((gPcsM + totBahan) * isi) + crt) / 1000;

    getEl("carton-target").value = targetC.toFixed(3);
    getEl("carton-max").value = maxC.toFixed(3);

    if (s.volume <= 250) {
      getEl("carton-min").value = ((((gPcsT + totBahan) * isi) + crt) - nT) / 1000;
      getEl("carton-toleransi").value = ((gPcsT - 15) / 1000).toFixed(3);
    } else {
      getEl("carton-min").value = (((parseFloat(getEl("gross-min").value) + totBahan) * isi) + crt) / 1000;
      getEl("carton-toleransi").value = (maxC - targetC).toFixed(3);
    }
  }

  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
  packaging.forEach(i => { sizeSelect.innerHTML += `<option value="${i.size}">${i.size}</option>`; });

  sizeSelect.addEventListener("change", function () {
    const s = packaging.find(x => x.size === this.value);
    if (s) {
      capInput.value = s.cap; botolInput.value = s.botol; cartonInput.value = s.carton;
      toleransiInput.value = s.toleransi; labelInput.value = s.label; foldingInput.value = s.folding;
    }
    hitungBerat();
  });

  inputs.forEach(i => i?.addEventListener("input", (e) => {
    if (e.target === densityInput) densityInput.classList.toggle("input-error", !e.target.value);
    hitungBerat();
  }));

  document.getElementById("qc-clear-data").onclick = () => {
    document.querySelectorAll("input").forEach(i => i.value = "");
    sizeSelect.value = "";
    densityInput.classList.add("input-error");
  };
})();
