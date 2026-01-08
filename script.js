// ESTADO GLOBAL
let currentPath = "luz";         // luz | sombra | intervalo
let currentMood = "silencio";    // silencio | fluxo | intensidade
let currentSetIndex = 0;
let initialized = false;

let lastInteractionTime = Date.now();
let lastMouseX = null;
let lastMouseY = null;
let lastMoveTime = null;
let lastOracleUpdate = 0;        // limita frequência de frases do oráculo

const scene = document.querySelector(".scene");
const halo = document.querySelector(".halo");
const whisperEls = document.querySelectorAll(".whisper");
const hintButton = document.querySelector(".hint-toggle");
const oracleText = document.getElementById("oracleText");
const menuToggle = document.getElementById("menuToggle");
const menuOverlay = document.getElementById("menuOverlay");
const pathControls = document.getElementById("pathControls");
const moodControls = document.getElementById("moodControls");
const hotspots = document.querySelectorAll(".hotspot");

// FRAGMENTOS BASE
const baseFragments = {
  luz: [
    [
      "Uma curva de luz ensaia o gesto de existir, roçando o ponto onde o escuro começa a escutar.",
      "Há um brilho que não reclama lugar: apenas inclina o silêncio noutra direção.",
      "Entre a sombra que guarda e o dourado que se insinua, algo testa a forma de um quase."
    ],
    [
      "Nada toca o centro, mas o centro já não é o mesmo.",
      "O ar aprende outra órbita sem saber quando começou a girar.",
      "Na superfície, é cor. No fundo, é um modo diferente de respirar."
    ],
    [
      "O contorno mantém-se, mas a intenção inclina-se.",
      "O escuro não recua: reorganiza-se.",
      "A luz não chega: deixa-se adivinhar."
    ]
  ],
  sombra: [
    [
      "A penumbra dobra-se sobre si mesma, como se escondesse uma lembrança que ainda não aceita nome.",
      "Há zonas onde a luz não entra: não por recusa, mas por respeito.",
      "Entre o que se vê e o que se pressente, o preto aprende novas profundidades."
    ],
    [
      "O contorno do silêncio é mais nítido do que qualquer linha.",
      "Há um peso suave no ar, como se as histórias não contadas tivessem ganho densidade.",
      "Na ausência de brilho, pequenos movimentos tornam-se evidentes."
    ],
    [
      "O escuro não é fim: é intervalo entre formas.",
      "Há detalhes que só a penumbra sabe revelar.",
      "Aquilo que não aparece ainda assim influencia tudo o que se move aqui."
    ]
  ],
  intervalo: [
    [
      "Nada começa, nada termina: tudo oscila num território de quase.",
      "A forma parece prestes a escolher um lado, mas prefere o limiar.",
      "O espaço entre um gesto e o seguinte ganha espessura."
    ],
    [
      "O tempo estica-se discretamente, como se quisesse caber em mais possibilidades.",
      "Nem avanço nem recuo: apenas suspensão.",
      "A imagem não decide se é ascensão ou curva de regresso."
    ],
    [
      "Um centro invisível organiza o que parece disperso.",
      "O que ainda não aconteceu já influencia o que se sente.",
      "O intervalo é o lugar onde a intenção experimenta corpo."
    ]
  ]
};

// FRAGMENTOS SECRETOS – RITUAL DE DESCOBERTA
const secretFragments = {
  1: [
    "Quando a luz hesita, não é fraqueza: é escuta.",
    "Algumas verdades precisam de roçar o contorno antes de se deixarem ver.",
    "Há gestos que só fazem sentido depois do atraso."
  ],
  2: [
    "Nem toda a sombra é recuo: às vezes é abrigo.",
    "O que se cala também escreve a paisagem.",
    "Há silêncios que afinam o ouvido para o que ainda não nasceu."
  ],
  3: [
    "Entre o impulso e o ato, um campo inteiro reorganiza o destino.",
    "O quase também é uma forma de chegar.",
    "Há encontros que só existem enquanto hipótese – e, ainda assim, tocam."
  ]
};

// FRASES DO ORÁCULO – INTERPRETAÇÃO DO MOVIMENTO
const oracleMessages = {
  slow: [
    "O gesto lento permite que o campo te responda com precisão.",
    "Quando abrandas, a imagem começa a lembrar-se de outros contornos.",
    "Ritmos suaves abrem camadas que a pressa não vê."
  ],
  medium: [
    "O movimento mede a distância entre o que já sabes e o que ainda exploras.",
    "A curva acompanha o teu passo: nem à frente, nem atrás.",
    "Há uma conversa discreta entre a tua velocidade e a forma que te observa."
  ],
  fast: [
    "A pressa dobra a luz em ângulos inesperados.",
    "O campo quase perde o rasto, mas ganha intensidade.",
    "Algumas buscas precisam de excesso antes de encontrarem direção."
  ],
  idle: [
    "Quando te calas, o cenário continua a reorganizar-se à tua volta.",
    "A imobilidade também é um tipo de pergunta.",
    "Às vezes, o não gesto é o ponto mais nítido da curva."
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// CARREGAR FRAGMENTOS
function loadFragmentSet(path, index) {
  const setArray = baseFragments[path] || baseFragments["luz"];
  const set = setArray[index % setArray.length];

  whisperEls.forEach((el, i) => {
    el.style.opacity = 0;
    el.style.filter = "blur(4px)";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.textContent = set[i] || "";
      requestAnimationFrame(() => {
        el.style.opacity = 1;
        el.style.filter = "blur(0)";
        el.style.transform = "translateY(0)";
      });
    }, 220 + i * 180);
  });
}

// APLICAR ESTADO EMOCIONAL
function applyMood(mood) {
  if (mood === "silencio") {
    scene.style.transition = "filter 600ms ease, box-shadow 600ms ease";
    scene.style.filter = "grayscale(0.1) saturate(0.9)";
    whisperEls.forEach((w) => (w.style.opacity = 0.9));
  } else if (mood === "fluxo") {
    scene.style.filter = "saturate(1.05)";
    halo.style.opacity = 0.9;
    whisperEls.forEach((w) => (w.style.opacity = 1));
  } else if (mood === "intensidade") {
    scene.style.filter = "saturate(1.25) contrast(1.08)";
    halo.style.opacity = 1;
    whisperEls.forEach((w) => (w.style.opacity = 1));
  }
}

// APLICAR CAMINHO
function applyPath(path) {
  if (path === "luz") {
    scene.style.background =
      "radial-gradient(circle at 10% 0%, #2b1634 0%, #06010a 55%, #000 100%)";
  } else if (path === "sombra") {
    scene.style.background =
      "radial-gradient(circle at 0% 100%, #100818 0%, #020105 55%, #000 100%)";
  } else if (path === "intervalo") {
    scene.style.background =
      "radial-gradient(circle at 50% 0%, #24142e 0%, #05020b 55%, #000 100%)";
  }
}

// ORÁCULO – MENOS FREQUÊNCIA, MAIS RESPIRAÇÃO
function updateOracleFromSpeed(speed) {
  const now = Date.now();
  const elapsed = now - lastOracleUpdate;

  // limita: no mínimo 1300ms entre frases
  if (elapsed < 1300) return;

  let bucket = "medium";

  if (speed < 0.015) {
    bucket = "slow";
  } else if (speed > 0.08) {
    bucket = "fast";
  }

  const msg = pickRandom(oracleMessages[bucket]);
  oracleText.textContent = msg;
  lastOracleUpdate = now;
}

// MARCAR INTERAÇÃO
function markInteraction() {
  lastInteractionTime = Date.now();
  if (scene.classList.contains("idle")) {
    scene.classList.remove("idle");
    oracleText.textContent = pickRandom([
      "O campo ajusta-se ao teu regresso.",
      "A pausa deixou marcas subtis na forma.",
      "Voltaste a mover-te: a curva acompanha."
    ]);
  }
}

// BOTÃO DE FRAGMENTOS
hintButton.addEventListener("click", () => {
  if (!initialized) {
    scene.classList.add("active");
    initialized = true;
  }

  currentSetIndex++;
  loadFragmentSet(currentPath, currentSetIndex);
  markInteraction();
});

// HOTSPOTS – DESCOBERTA
hotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", () => {
    const key = hotspot.getAttribute("data-secret");
    const set = secretFragments[key];
    if (!set) return;

    const chosen = pickRandom(set);
    oracleText.textContent = chosen;

    hotspot.classList.add("discovered");
    hotspot.style.opacity = 0.55;
    hotspot.style.boxShadow = "0 0 22px rgba(249, 197, 90, 0.9)";

    markInteraction();
  });
});

// CONTROLOS DE CAMINHO
pathControls.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-path]");
  if (!btn) return;

  const path = btn.getAttribute("data-path");
  currentPath = path;

  pathControls.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  applyPath(currentPath);
  loadFragmentSet(currentPath, currentSetIndex);
  markInteraction();
});

// CONTROLOS DE ESTADO EMOCIONAL
moodControls.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-mood]");
  if (!btn) return;

  const mood = btn.getAttribute("data-mood");
  currentMood = mood;

  moodControls.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  applyMood(currentMood);
  markInteraction();
});

// INICIALIZAÇÃO DA CENA
window.addEventListener("load", () => {
  scene.classList.add("active");
  scene.classList.add("parallax-on");
  applyPath(currentPath);
  applyMood(currentMood);
  loadFragmentSet(currentPath, currentSetIndex);
});

// PARALLAX + ORÁCULO (MENOS SENSÍVEL)
scene.addEventListener("mousemove", (event) => {
  const rect = scene.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  const core = document.querySelector(".core");
  const arcOuter = document.querySelector(".arc-outer");
  const arcInner = document.querySelector(".arc-inner");

  const coreOffsetX = x * 10;
  const coreOffsetY = y * 10;
  const outerOffsetX = x * -14;
  const outerOffsetY = y * 10;
  const innerOffsetX = x * -8;
  const innerOffsetY = y * 6;

  core.style.transform = `translate(${coreOffsetX}px, ${coreOffsetY}px)`;
  arcOuter.style.transform = `translateY(${28 + outerOffsetY}px) translateX(${
    -6 + outerOffsetX
  }px) rotate(-4deg)`;
  arcInner.style.transform = `translateY(${60 + innerOffsetY}px) translateX(${
    -10 + innerOffsetX
  }px) rotate(-10deg)`;

  const now = Date.now();

  if (lastMouseX !== null && lastMouseY !== null && lastMoveTime !== null) {
    const dx = (event.clientX - lastMouseX) / rect.width;
    const dy = (event.clientY - lastMouseY) / rect.height;
    const dt = (now - lastMoveTime) / 1000;

    // evitar ruído: ignora movimentos muito pequenos
    if (dt > 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.01) { // só reage a movimentos um pouco mais significativos
        const speed = dist / dt;
        updateOracleFromSpeed(speed);
      }
    }
  }

  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
  lastMoveTime = now;

  markInteraction();
});

scene.addEventListener("mouseleave", () => {
  const core = document.querySelector(".core");
  const arcOuter = document.querySelector(".arc-outer");
  const arcInner = document.querySelector(".arc-inner");

  core.style.transform = `translate(0, 0)`;
  arcOuter.style.transform = `translateY(28px) translateX(-6px) rotate(-4deg)`;
  arcInner.style.transform = `translateY(60px) translateX(-10px) rotate(-10deg)`;
});

// SISTEMA DE RESPIRAÇÃO (IDLE)
setInterval(() => {
  const now = Date.now();
  const diff = now - lastInteractionTime;

  if (diff > 8000) {
    if (!scene.classList.contains("idle")) {
      scene.classList.add("idle");
      oracleText.textContent = pickRandom(oracleMessages.idle);
      lastOracleUpdate = now;
    }
  }
}, 1000);

// MENU – efeito de dobra + suspensão do parallax
menuToggle.addEventListener("click", () => {
  const isActive = menuOverlay.classList.contains("active");

  menuToggle.classList.toggle("active");
  menuOverlay.classList.toggle("active");

  if (!isActive) {
    scene.classList.remove("parallax-on");
  } else {
    setTimeout(() => {
      scene.classList.add("parallax-on");
    }, 400);
  }
});