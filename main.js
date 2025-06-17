// main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjy4XjLQxDx0IyA5MNE6JuNDEDzQR3jeU",
  authDomain: "rotinaprincesa.firebaseapp.com",
  projectId: "rotinaprincesa",
  storageBucket: "rotinaprincesa.appspot.com",
  messagingSenderId: "988323884361",
  appId: "1:988323884361:web:892a1681bdddb553273e98",
  databaseURL: "https://rotinaprincesa-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dataInput = document.getElementById("data");
const sonoOpcao = document.getElementById("sonoOpcao");
const sono = document.getElementById("sono");
const urina = document.getElementById("urina");
const fezes = document.getElementById("fezes");
const fezesOpcao = document.getElementById("fezesOpcao");
const mamada = document.getElementById("mamada");
const vitaminaD = document.getElementById("vitaminaD");
const estimulacao = document.getElementById("estimulacao");
const resultado = document.getElementById("resultado");
const salvarBtn = document.getElementById("salvar");
const carregarBtn = document.getElementById("carregarBtn");
const dataConsulta = document.getElementById("dataConsulta");
const gerarPdfBtn = document.getElementById("gerarPdf");
const compartilharBtn = document.getElementById("compartilhar");
const calcularTotaisBtn = document.getElementById("calcularTotais");

sonoOpcao.addEventListener("change", () => {
  const opcao = sonoOpcao.value;
  if (opcao) {
    const hora = prompt(`Qual horário para: ${opcao}? (formato HH:MM)`);
    if (hora) {
      const entrada = `${opcao} ${hora}`;
      sono.value = sono.value ? `${sono.value}; ${entrada}` : entrada;
    }
    sonoOpcao.value = "";
  }
});

fezesOpcao.addEventListener("change", () => {
  const tipo = fezesOpcao.value;
  if (tipo) {
    const hora = prompt(`Qual horário para: ${tipo}? (formato HH:MM)`);
    if (hora) {
      const entrada = `${hora} ${tipo}`;
      fezes.value = fezes.value ? `${fezes.value}; ${entrada}` : entrada;
    }
    fezesOpcao.value = "";
  }
});

salvarBtn.addEventListener("click", async () => {
  const data = dataInput.value;
  if (!data) return alert("Selecione uma data.");
  const diaRef = ref(db, "rotina/" + data);
  const snapshot = await get(diaRef);
  const dadosAntigos = snapshot.exists() ? snapshot.val() : {};
  const novosDados = {
    sono: concat(dadosAntigos.sono, sono.value),
    urina: concat(dadosAntigos.urina, urina.value),
    fezes: concat(dadosAntigos.fezes, fezes.value),
    mamada: concat(dadosAntigos.mamada, mamada.value),
    vitaminaD: concat(dadosAntigos.vitaminaD, vitaminaD.value),
    estimulacao: concat(dadosAntigos.estimulacao, estimulacao.value),
  };
  await set(diaRef, novosDados);
  alert("Dados salvos com sucesso!");
  sono.value = urina.value = fezes.value = mamada.value = vitaminaD.value = estimulacao.value = "";
});

function concat(antigo, novo) {
  if (!novo.trim()) return antigo || "";
  if (!antigo) return novo.trim();
  return `${antigo.trim()}; ${novo.trim()}`;
}

carregarBtn.addEventListener("click", async () => {
  const data = dataConsulta.value;
  if (!data) return alert("Selecione uma data para consultar.");
  resultado.innerHTML = "<p>🔄 Carregando...</p>";
  try {
    const diaRef = ref(db, "rotina/" + data);
    const snapshot = await get(diaRef);
    if (snapshot.exists()) {
      const dados = snapshot.val();
      resultado.innerHTML = `
        <h3>Dados de ${data}</h3>
        <p><strong>🛏 Sono:</strong> ${dados.sono || "Sem dados"}</p>
        <p><strong>💧 Urina:</strong> ${dados.urina || "Sem dados"}</p>
        <p><strong>💩 Fezes:</strong> ${dados.fezes || "Sem dados"}</p>
        <p><strong>🍼 Mamada:</strong> ${dados.mamada || "Sem dados"}</p>
        <p><strong>🌞 Vitamina D:</strong> ${dados.vitaminaD || "Sem dados"}</p>
        <p><strong>🎯 Estimulação:</strong> ${dados.estimulacao || "Sem dados"}</p>
      `;
    } else {
      resultado.innerHTML = `<p>⚠️ Nenhum dado encontrado para ${data}</p>`;
    }
  } catch (e) {
    resultado.innerHTML = `<p>Erro ao carregar dados. Verifique sua conexão ou tente novamente.</p>`;
  }
});

calcularTotaisBtn.addEventListener("click", () => {
  const texto = resultado.innerText;
  const horasSono = calcularHorasSono(texto);
  const qtdUrina = (texto.match(/💧 Urina:/gi) || []).length || (texto.match(/💧/g) || []).length;
  const qtdFezes = (texto.match(/\b(PQ|MQ|GQ|GGQ)\b/g) || []).length;

  const div = document.createElement("div");
  div.innerHTML = `
    <h3>📊 Totais</h3>
    <p><strong>Horas de sono:</strong> ${horasSono} horas</p>
    <p><strong>Quantidade de urina:</strong> ${qtdUrina}</p>
    <p><strong>Quantidade de fezes:</strong> ${qtdFezes}</p>
  `;
  resultado.appendChild(div);
});

function calcularHorasSono(texto) {
  const regex = /dormiu (\d{2}:\d{2})|acordou (\d{2}:\d{2})/gi;
  const eventos = [];
  let match;
  while ((match = regex.exec(texto))) {
    const hora = match[1] || match[2];
    const tipo = match[1] ? "dormiu" : "acordou";
    eventos.push({ tipo, hora });
  }

  eventos.sort((a, b) => a.hora.localeCompare(b.hora));

  let totalMin = 0;
  let dormindo = true;
  let inicio = "00:00";
  for (const ev of eventos) {
    const fim = ev.hora;
    if (dormindo) {
      totalMin += calcularMin(inicio, fim);
    }
    inicio = fim;
    dormindo = ev.tipo === "acordou";
  }

  if (dormindo) totalMin += calcularMin(inicio, "23:59");

  return (totalMin / 60).toFixed(1);
}

function calcularMin(inicio, fim) {
  const [h1, m1] = inicio.split(":"), [h2, m2] = fim.split(":");
  return (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1));
}

// PDF e WhatsApp

gerarPdfBtn.addEventListener("click", () => {
  const texto = resultado.innerText;
  const blob = new Blob([texto], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "rotina.pdf";
  link.click();
});

compartilharBtn.addEventListener("click", () => {
  const texto = resultado.innerText;
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
});
