const participants = [
  "Alejandro Castellanos Arriola",
  "Alejandro De La Rosa Nolasco",
  "Araceli Alvarado Cervantes",
  "Carlos Luis De la Torre",
  "CESAR ALEJANDRO VALVERDE BAQUEDANO",
  "CESAR ESTEBAN DEL ANGEL VARGAS",
  "Christian Diaz",
  "Elizabeth Juárez",
  "Héctor Lavín Ríos",
  "Israel Ceron Martinez",
  "Jesús Cubillo",
  "Juan Alberto Vazquez",
  "Juan Jafet Monterrubio Delgado",
  "Lety Castellanos",
  "Marcos Muñoz",
  "María Graciela Sánchez Maldonado",
  "MARTIN URRUTIA",
  "Mary Gabriela Suarez Hurtado",
  "Paulina Elizabeth Varela",
  "Rocío Guadalupe Salinas Mandujano",
  "Rodrigo Cruz Pérez",
  "ROSA MARIA ALONZO MORA",
  "SAMMY NAÍ GAMBOA ZÁRATE",
  "Vanessa Lavin Rios",
];

const palette = [
  "#10284f",
  "#244371",
  "#365a8f",
  "#5578ad",
  "#83a7d4",
  "#1d385f",
  "#2e4e82",
  "#6f90bd",
];

const wheelWrap = document.querySelector(".wheel-wrap");
const wheelGroup = document.querySelector("#wheelGroup");
const pinGroup = document.querySelector("#pinGroup");
const participantList = document.querySelector("#participantList");
const winnerName = document.querySelector("#winnerName");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const statusText = document.querySelector("#statusText");
const celebration = document.querySelector("#celebration");

const radius = 212;
const innerPocketRadius = 94;
const labelRadius = 154;
const pocketLineStart = innerPocketRadius;
const pocketLineEnd = radius;
const pinRadius = 221;
const slice = 360 / participants.length;
let currentRotation = 0;
let activeIndex = -1;
let isSpinning = false;
let spinFrame = 0;

function polarToCartesian(angle, distance) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * distance,
    y: Math.sin(radians) * distance,
  };
}

function createSlicePath(startAngle, endAngle) {
  const outerStart = polarToCartesian(startAngle, radius);
  const outerEnd = polarToCartesian(endAngle, radius);
  const innerEnd = polarToCartesian(endAngle, innerPocketRadius);
  const innerStart = polarToCartesian(startAngle, innerPocketRadius);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerPocketRadius} ${innerPocketRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function shortenName(name) {
  const clean = name.replace(/\s+/g, " ").trim();
  return clean.length > 24 ? `${clean.slice(0, 22)}...` : clean;
}

function buildWheel() {
  participants.forEach((name, index) => {
    const startAngle = index * slice - 90;
    const endAngle = startAngle + slice;
    const middleAngle = startAngle + slice / 2;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "slice");
    path.setAttribute("d", createSlicePath(startAngle, endAngle));
    path.setAttribute("fill", palette[index % palette.length]);
    path.dataset.index = String(index);
    wheelGroup.appendChild(path);

    const labelPoint = polarToCartesian(middleAngle, labelRadius);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "name-label");
    text.setAttribute("x", labelPoint.x);
    text.setAttribute("y", labelPoint.y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("transform", `rotate(${middleAngle + 90} ${labelPoint.x} ${labelPoint.y})`);
    text.textContent = shortenName(name);
    wheelGroup.appendChild(text);

    const linePointA = polarToCartesian(startAngle, pocketLineStart);
    const linePointB = polarToCartesian(startAngle, pocketLineEnd);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "pocket-line");
    line.setAttribute("x1", linePointA.x);
    line.setAttribute("y1", linePointA.y);
    line.setAttribute("x2", linePointB.x);
    line.setAttribute("y2", linePointB.y);
    wheelGroup.appendChild(line);

    const pinPoint = polarToCartesian(middleAngle, pinRadius);
    const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pin.setAttribute("class", "pin");
    pin.setAttribute("cx", pinPoint.x);
    pin.setAttribute("cy", pinPoint.y);
    pin.setAttribute("r", index % 2 === 0 ? "4.2" : "3.2");
    pinGroup.appendChild(pin);
  });

  renderWheelRotation(0);
}

function buildParticipantList() {
  participants.forEach((name, index) => {
    const item = document.createElement("li");
    item.textContent = name;
    item.dataset.index = String(index);
    participantList.appendChild(item);
  });
}

function getRandomIndex(max) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function renderWheelRotation(rotation) {
  wheelGroup.setAttribute("transform", `rotate(${rotation} 0 0)`);
}

function easeOutQuart(progress) {
  return 1 - (1 - progress) ** 4;
}

function animateInternalWheel(from, to, duration, onFinish) {
  const startedAt = performance.now();
  cancelAnimationFrame(spinFrame);

  function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = easeOutQuart(progress);
    renderWheelRotation(from + (to - from) * eased);

    if (progress < 1) {
      spinFrame = requestAnimationFrame(tick);
      return;
    }

    spinFrame = 0;
    onFinish();
  }

  spinFrame = requestAnimationFrame(tick);
}

function highlightWinner(index) {
  document.querySelectorAll("#participantList li").forEach((item) => {
    item.classList.toggle("is-winner", Number(item.dataset.index) === index);
  });
}

function launchConfetti() {
  celebration.innerHTML = "";
  const colors = ["#ffffff", "#f7c95f", "#95d8ff", "#8da8d0", "#49699f"];
  const pieces = 110;

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--drift", `${Math.random() * 280 - 140}px`);
    piece.style.setProperty("--spin", `${Math.random() * 900 + 360}deg`);
    piece.style.setProperty("--fall-time", `${Math.random() * 1.7 + 2.2}s`);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    celebration.appendChild(piece);
  }

  window.setTimeout(() => {
    celebration.innerHTML = "";
  }, 4600);
}

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  activeIndex = getRandomIndex(participants.length);
  const selectedCenterAngle = activeIndex * slice + slice / 2 - 90;
  const desiredFinal = normalizeDegrees(-90 - selectedCenterAngle);
  const currentNormalized = normalizeDegrees(currentRotation);
  const correction = normalizeDegrees(desiredFinal - currentNormalized);
  const fullTurns = 6 + getRandomIndex(4);
  const targetRotation = currentRotation + fullTurns * 360 + correction;

  spinButton.disabled = true;
  wheelWrap.classList.add("is-spinning");
  winnerName.textContent = "Girando...";
  statusText.textContent = "La ruleta está eligiendo al azar";
  highlightWinner(-1);

  animateInternalWheel(currentRotation, targetRotation, 5400, () => {
    currentRotation = targetRotation;
    renderWheelRotation(currentRotation);
    winnerName.textContent = participants[activeIndex];
    statusText.textContent = "Ganador seleccionado";
    highlightWinner(activeIndex);
    launchConfetti();
    spinButton.disabled = false;
    wheelWrap.classList.remove("is-spinning");
    isSpinning = false;
  });
}

function resetWheel() {
  if (isSpinning) return;
  currentRotation = 0;
  activeIndex = -1;
  cancelAnimationFrame(spinFrame);
  spinFrame = 0;
  wheelWrap.classList.remove("is-spinning");
  renderWheelRotation(0);
  winnerName.textContent = "Listo para girar";
  statusText.textContent = `${participants.length} participantes cargados`;
  highlightWinner(-1);
  celebration.innerHTML = "";
}

buildWheel();
buildParticipantList();
spinButton.addEventListener("click", spinWheel);
resetButton.addEventListener("click", resetWheel);
