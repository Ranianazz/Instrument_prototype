const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let shapes = [];
let noteIndex = 0;
let melodyMode = false;
let autoPlayInterval = null;
let autoPlay = false;
let volume = 0.5;
let tempo = 80;
let selectedTone = "chime";
let selectedSong = "twinkle";

const songs = {
  twinkle: [
    0,
    0,
    3,
    3,
    4,
    4,
    3, // C4, C4, G4, G4, A4, A4, G4
    2,
    2,
    1,
    1,
    0,
    0,
    1, // E4, E4, D4, D4, C4, C4, D4
    3,
    3,
    2,
    2,
    1,
    1,
    0, // G4, G4, E4, E4, D4, D4, C4
    3,
    3,
    2,
    2,
    1,
    1,
    0, // G4, G4, E4, E4, D4, D4, C4
  ],
  mary: [
    2,
    1,
    0,
    1,
    2,
    2,
    2, // E D C D E E E
    1,
    1,
    1,
    2,
    3,
    3, // D D D E G G
    2,
    1,
    0,
    1,
    2,
    2,
    2, // E D C D E E E
    1,
    1,
    2,
    1,
    0, // D D E D C
  ],
  happy: [
    0,
    0,
    1,
    0,
    3,
    2, // C C D C G F
    0,
    0,
    1,
    0,
    4,
    3, // C C D C A G
    0,
    0,
    0,
    2,
    3,
    1,
    0, // C C C F G E D
    4,
    4,
    3,
    1,
    2,
    1, // A A G E F D (adapted)
  ],
};

const cMajorPentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // C4, D4, E4, G4, A4

const getElementByNote = (note) => document.querySelector(`[note="${note}"]`);

const keys = {
  A: { element: getElementByNote("C"), note: "C", octaveOffset: 0 },
  W: { element: getElementByNote("C#"), note: "C#", octaveOffset: 0 },
  S: { element: getElementByNote("D"), note: "D", octaveOffset: 0 },
  E: { element: getElementByNote("D#"), note: "D#", octaveOffset: 0 },
  D: { element: getElementByNote("E"), note: "E", octaveOffset: 0 },
  F: { element: getElementByNote("F"), note: "F", octaveOffset: 0 },
  T: { element: getElementByNote("F#"), note: "F#", octaveOffset: 0 },
  G: { element: getElementByNote("G"), note: "G", octaveOffset: 0 },
  Y: { element: getElementByNote("G#"), note: "G#", octaveOffset: 0 },
  H: { element: getElementByNote("A"), note: "A", octaveOffset: 1 },
  U: { element: getElementByNote("A#"), note: "A#", octaveOffset: 1 },
  J: { element: getElementByNote("B"), note: "B", octaveOffset: 1 },
  K: { element: getElementByNote("C2"), note: "C", octaveOffset: 1 },
  O: { element: getElementByNote("C#2"), note: "C#", octaveOffset: 1 },
  L: { element: getElementByNote("D2"), note: "D", octaveOffset: 1 },
  P: { element: getElementByNote("D#2"), note: "D#", octaveOffset: 1 },
  semicolon: { element: getElementByNote("E2"), note: "E", octaveOffset: 1 },
};

const getHz = (note = "A", octave = 4) => {
  const A4 = 440;
  let N = 0;
  switch (note) {
    case "A":
      N = 0;
      break;
    case "A#":
    case "Bb":
      N = 1;
      break;
    case "B":
      N = 2;
      break;
    case "C":
      N = 3;
      break;
    case "C#":
    case "Db":
      N = 4;
      break;
    case "D":
      N = 5;
      break;
    case "D#":
    case "Eb":
      N = 6;
      break;
    case "E":
      N = 7;
      break;
    case "F":
      N = 8;
      break;
    case "F#":
    case "Gb":
      N = 9;
      break;
    case "G":
      N = 10;
      break;
    case "G#":
    case "Ab":
      N = 11;
      break;
    default:
      N = 0;
  }
  N += 12 * (octave - 4);
  return A4 * Math.pow(2, N / 12);
};

const pressedNotes = new Map();
let clickedKey = "";

function playKey(key, x, y, isAuto = false) {
  if (!keys[key]) return;

  let freq;
  if (melodyMode || isAuto) {
    freq =
      cMajorPentatonic[
        songs[selectedSong][noteIndex % songs[selectedSong].length]
      ];
  } else {
    freq = getHz(keys[key].note, (keys[key].octaveOffset || 0) + 3);
  }
  const duration = 60 / tempo; // Note length based on tempo (BPM)
  let amplitude = volume * (melodyMode ? random(0.3, 0.5) : 0.5);

  if (selectedTone === "chime") {
    // Chime: dual sine waves
    const osc1 = audioContext.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, audioContext.currentTime);
    const gain1 = audioContext.createGain();
    gain1.gain.setValueAtTime(amplitude, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start();
    osc1.stop(audioContext.currentTime + duration);

    const osc2 = audioContext.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
    osc2.detune.setValueAtTime(random(-10, 10), 0);
    const gain2 = audioContext.createGain();
    gain2.gain.setValueAtTime(amplitude * 0.3, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start();
    osc2.stop(audioContext.currentTime + duration);

    pressedNotes.set(key, { osc1, osc2 });
  } else {
    // Single oscillator for other tones
    const osc = audioContext.createOscillator();
    osc.type = selectedTone;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(amplitude, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
    pressedNotes.set(key, { osc });
  }

  console.log(
    "Sound created: " + selectedTone + " at",
    freq,
    "Hz, duration:",
    duration,
    "amp:",
    amplitude
  );
  keys[key].element.classList.add("pressed");

  // Add visual shape
  shapes.push(
    new Shape(
      x || window.innerWidth / 2,
      y || window.innerHeight / 2,
      random(50, 150),
      color(random(255), random(255), random(255), 200)
    )
  );

  if (melodyMode || isAuto) {
    noteIndex = (noteIndex + 1) % songs[selectedSong].length;
    updateGlow();
  }
}

function stopKey(key) {
  if (!keys[key]) return;
  keys[key].element.classList.remove("pressed");
  const note = pressedNotes.get(key);
  if (note) {
    if (note.osc1 && note.osc2) {
      note.osc1.stop();
      note.osc2.stop();
    } else if (note.osc) {
      note.osc.stop();
    }
    pressedNotes.delete(key);
  }
}

function updateGlow() {
  Object.values(keys).forEach((key) => key.element.classList.remove("glow"));
  if (melodyMode || autoPlay) {
    const nextNoteIndex =
      songs[selectedSong][noteIndex % songs[selectedSong].length];
    const noteToKey = {
      0: ["A", "K"], // C
      1: ["S", "L"], // D
      2: ["D"], // E
      3: ["G"], // G
      4: ["H"], // A
    };
    (noteToKey[nextNoteIndex] || []).forEach((k) =>
      keys[k].element.classList.add("glow")
    );
  }
}

function autoPlaySong() {
  if (autoPlay) {
    const nextNoteIndex =
      songs[selectedSong][noteIndex % songs[selectedSong].length];
    const keyForNote = {
      0: "A",
      1: "S",
      2: "D",
      3: "G",
      4: "H",
    }[nextNoteIndex];
    playKey(keyForNote, window.innerWidth / 2, window.innerHeight / 2, true);
    redraw();
  }
}

// p5.js setup for visual effects
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-holder");
  background(255, 255, 255, 0);
  noLoop();
}

function draw() {
  clear();
  console.log("Drawing", shapes.length, "shapes");
  for (let i = shapes.length - 1; i >= 0; i--) {
    shapes[i].update();
    shapes[i].display();
    if (shapes[i].lifespan <= 0) {
      shapes.splice(i, 1);
    }
  }
}

class Shape {
  constructor(x, y, size, col) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.col = col;
    this.lifespan = 255;
    this.shapeType = floor(random(3));
  }

  update() {
    this.lifespan -= 2;
    this.size += 0.5;
    this.col.setAlpha(this.lifespan);
  }

  display() {
    noStroke();
    fill(this.col);
    if (this.shapeType === 0) {
      ellipse(this.x, this.y, this.size);
    } else if (this.shapeType === 1) {
      this.drawStar(this.x, this.y, this.size / 2, this.size, 5);
    } else {
      rectMode(CENTER);
      rect(this.x, this.y, this.size, this.size);
    }
  }

  drawStar(cx, cy, r1, r2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cx + cos(a) * r2;
      let sy = cy + sin(a) * r2;
      vertex(sx, sy);
      sx = cx + cos(a + halfAngle) * r1;
      sy = cy + sin(a + halfAngle) * r1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Event listeners
document.addEventListener("keydown", (e) => {
  const eventKey = e.key.toUpperCase();
  const key = eventKey === ";" ? "semicolon" : eventKey;
  if (!key || pressedNotes.get(key)) return;
  playKey(key, mouseX, mouseY);
  redraw();
});

document.addEventListener("keyup", (e) => {
  const eventKey = e.key.toUpperCase();
  const key = eventKey === ";" ? "semicolon" : eventKey;
  if (!key) return;
  stopKey(key);
});

for (const [key, { element }] of Object.entries(keys)) {
  element.addEventListener("mousedown", (e) => {
    playKey(key, e.clientX, e.clientY);
    clickedKey = key;
    redraw();
  });
  element.addEventListener("touchstart", (e) => {
    e.preventDefault();
    playKey(key, e.touches[0].clientX, e.touches[0].clientY);
    clickedKey = key;
    redraw();
  });
}

document.addEventListener("mouseup", () => {
  stopKey(clickedKey);
});

document.addEventListener("touchend", () => {
  stopKey(clickedKey);
});

document.getElementById("melodyToggle").addEventListener("click", () => {
  melodyMode = !melodyMode;
  document.getElementById("melodyToggle").textContent = melodyMode
    ? "Turn Off Melody Mode"
    : "Turn On Melody Mode";
  updateGlow();
  console.log("Melody mode:", melodyMode);
});

document.getElementById("autoPlayToggle").addEventListener("click", () => {
  autoPlay = !autoPlay;
  document.getElementById("autoPlayToggle").textContent = autoPlay
    ? "Stop Auto Play"
    : "Auto Play Song";
  if (autoPlay) {
    autoPlayInterval = setInterval(autoPlaySong, 60000 / tempo);
    updateGlow();
  } else {
    clearInterval(autoPlayInterval);
    updateGlow();
  }
  console.log("Auto play:", autoPlay);
});

document.getElementById("songSelect").addEventListener("change", (e) => {
  selectedSong = e.target.value;
  noteIndex = 0;
  updateGlow();
  console.log("Selected song:", selectedSong);
});

document.getElementById("toneSelect").addEventListener("change", (e) => {
  selectedTone = e.target.value;
  console.log("Selected tone:", selectedTone);
});

document.getElementById("volumeSlider").addEventListener("input", (e) => {
  volume = parseFloat(e.target.value);
  console.log("Volume:", volume);
});

document.getElementById("tempoSlider").addEventListener("input", (e) => {
  tempo = parseInt(e.target.value);
  if (autoPlay) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(autoPlaySong, 60000 / tempo);
  }
  console.log("Tempo:", tempo);
});

document.addEventListener("DOMContentLoaded", () => {
  if (audioContext.state !== "running") {
    audioContext
      .resume()
      .then(() => {
        console.log("AudioContext resumed successfully");
      })
      .catch((err) => {
        console.error("AudioContext resume failed:", err);
      });
  }
});
