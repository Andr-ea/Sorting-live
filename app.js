/**
 * Quick start: apri index.html in un browser moderno. Controlli:
 * - Space per start/pause, R per reset.
 * - Usa i toggle per numeri/audio/tema. Velocità in ms per step.
 * Architettura: generatori di azioni per ogni sort, renderer a barre, motore di playback con pausa/step.
 */

const $ = (id) => document.getElementById(id);

const barsContainer = $('bars');
const algorithmSelect = $('algorithmSelect');
const sizeSlider = $('sizeSlider');
const speedSlider = $('speedSlider');
const presetSelect = $('presetSelect');
const sizeValue = $('sizeValue');
const speedValue = $('speedValue');
const generateBtn = $('generateBtn');
const startBtn = $('startBtn');
const pauseBtn = $('pauseBtn');
const stepBtn = $('stepBtn');
const resetBtn = $('resetBtn');
const numbersToggle = $('numbersToggle');
const audioToggle = $('audioToggle');
const togglePanelBtn = $('togglePanel');
const controlPanel = $('controlPanel');
const compareCountEl = $('compareCount');
const swapCountEl = $('swapCount');
const timeElapsedEl = $('timeElapsed');
const algoDescriptionEl = $('algoDescription');
const stabilityTag = $('stabilityTag');
const bestCaseEl = $('bestCase');
const avgCaseEl = $('avgCase');
const worstCaseEl = $('worstCase');
const infoBtn = $('infoBtn');
const infoModal = $('infoModal');
const infoTitle = $('infoTitle');
const infoBody = $('infoBody');
const infoClose = $('infoClose');

const algorithmInfo = {
  bubble: {
    name: 'Bubble Sort',
    stable: true,
    best: 'O(n)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    desc: 'Confronta coppie adiacenti e le scambia se fuori ordine. Ripete finché l’array è ordinato. Facile da capire ma poco efficiente.',
    details: 'Bubble sort attraversa ripetutamente l’array confrontando elementi adiacenti e scambiandoli se sono in ordine sbagliato. Dopo ogni passata l’elemento più grande “bolle” alla fine. È stabile, semplice da implementare, ma scala male su input grandi.'
  },
  selection: {
    name: 'Selection Sort',
    stable: false,
    best: 'O(n²)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    desc: 'Seleziona il minimo nella parte non ordinata e lo porta in posizione. Riduce i passaggi ma resta quadratico.',
    details: 'Selection sort divide l’array in una parte ordinata e una non ordinata. A ogni iterazione trova il minimo della zona non ordinata e lo porta in testa. Esegue sempre lo stesso numero di confronti, ma non è stabile e resta O(n²).'
  },
  insertion: {
    name: 'Insertion Sort',
    stable: true,
    best: 'O(n)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    desc: 'Inserisce ogni elemento nella sezione già ordinata spostando quelli maggiori. Ottimo per array piccoli o quasi ordinati.',
    details: 'Insertion sort considera la parte sinistra già ordinata e inserisce ogni nuovo elemento nella posizione corretta spostando quelli più grandi. È stabile e molto veloce su input piccoli o quasi ordinati, ma degrada a O(n²) su input casuali grandi.'
  },
  merge: {
    name: 'Merge Sort',
    stable: true,
    best: 'O(n log n)',
    avg: 'O(n log n)',
    worst: 'O(n log n)',
    desc: 'Divide ricorsivamente in metà, ordina e fonde mantenendo l’ordine. Stabile e garantito log-lineare, usa memoria extra.',
    details: 'Merge sort divide l’array a metà fino a raggiungere sottovettori di 1 elemento, poi fonde le parti mantenendo l’ordine. Offre complessità O(n log n) garantita ed è stabile, ma richiede spazio aggiuntivo per l’array di supporto.'
  },
  quick: {
    name: 'Quick Sort',
    stable: false,
    best: 'O(n log n)',
    avg: 'O(n log n)',
    worst: 'O(n²)',
    desc: 'Sceglie un pivot, partiziona in minori e maggiori, poi ricorsione. Tipicamente il più veloce in pratica, ma pivot sfortunati lo degradano.',
    details: 'Quick sort sceglie un pivot, partiziona l’array in elementi minori e maggiori del pivot, poi ordina ricorsivamente le due parti. Di solito è rapidissimo grazie alla località di riferimento, ma un pivot pessimo porta a O(n²). Non è stabile.'
  },
  heap: {
    name: 'Heap Sort',
    stable: false,
    best: 'O(n log n)',
    avg: 'O(n log n)',
    worst: 'O(n log n)',
    desc: 'Costruisce un max-heap e sposta il massimo in fondo iterativamente. Complessità log-lineare, in-place, non stabile.',
    details: 'Heap sort costruisce un max-heap e poi estrae ripetutamente il massimo scambiandolo con l’ultima posizione e riducendo l’heap. Offre O(n log n) anche nel caso pessimo ed è in-place, ma non stabile e con costante maggiore rispetto a quick sort.'
  }
};

const state = {
  baseArray: [],
  workingArray: [],
  actions: [],
  algorithm: 'bubble',
  size: 50,
  speed: 40,
  preset: 'random',
  showNumbers: true,
  playAudio: false,
  playing: false,
  paused: false,
  actionIndex: 0,
  comparisons: 0,
  swaps: 0,
  elapsedAccum: 0,
  startTimestamp: 0,
  timerRAF: null,
  playTimeout: null,
  maxValue: 100
};

let audioCtx = null;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function init() {
  sizeValue.textContent = state.size;
  speedValue.textContent = state.speed;
  attachEvents();
  updateAlgoInfo();
  generateAndRender();
}

function attachEvents() {
  algorithmSelect.addEventListener('change', (e) => {
    state.algorithm = e.target.value;
    updateAlgoInfo();
  });

  sizeSlider.addEventListener('input', (e) => {
    state.size = Number(e.target.value);
    sizeValue.textContent = state.size;
    generateAndRender();
  });

  speedSlider.addEventListener('input', (e) => {
    state.speed = Number(e.target.value);
    speedValue.textContent = state.speed;
  });

  presetSelect.addEventListener('change', (e) => {
    state.preset = e.target.value;
    generateAndRender();
  });

  generateBtn.addEventListener('click', generateAndRender);
  startBtn.addEventListener('click', startPlayback);
  pauseBtn.addEventListener('click', togglePause);
  stepBtn.addEventListener('click', stepOnce);
  resetBtn.addEventListener('click', resetVisualizer);

  numbersToggle.addEventListener('change', (e) => {
    state.showNumbers = e.target.checked;
    updateNumbersVisibility();
  });

  audioToggle.addEventListener('change', (e) => {
    state.playAudio = e.target.checked;
  });

  togglePanelBtn.addEventListener('click', () => {
    controlPanel.classList.toggle('collapsed');
    const expanded = !controlPanel.classList.contains('collapsed');
    togglePanelBtn.setAttribute('aria-expanded', expanded);
  });

  infoBtn.addEventListener('click', () => openInfoModal());
  infoClose.addEventListener('click', () => closeInfoModal());
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) closeInfoModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      state.playing && !state.paused ? togglePause() : startPlayback();
    }
    if (e.code === 'KeyR') {
      resetVisualizer();
    }
    if (e.code === 'Escape') {
      closeInfoModal();
    }
  });
}

function generateArray(preset, size) {
  const arr = [];
  if (preset === 'reversed') {
    for (let i = size; i >= 1; i -= 1) arr.push(i);
  } else {
    for (let i = 1; i <= size; i += 1) {
      const value = Math.floor(Math.random() * (size + 20)) + 5;
      arr.push(value);
    }
    if (preset === 'nearly') {
      arr.sort((a, b) => a - b);
      const swaps = Math.max(1, Math.floor(size * 0.1));
      for (let i = 0; i < swaps; i += 1) {
        const a = Math.floor(Math.random() * size);
        const b = Math.floor(Math.random() * size);
        [arr[a], arr[b]] = [arr[b], arr[a]];
      }
    }
  }
  return arr;
}

function generateAndRender() {
  const arr = generateArray(state.preset, state.size);
  setArray(arr);
  stopPlayback();
  resetStats();
}

function setArray(arr) {
  state.baseArray = [...arr];
  state.workingArray = [...arr];
  state.maxValue = Math.max(...arr);
  renderBars(arr);
}

function renderBars(values) {
  barsContainer.innerHTML = '';
  const maxVal = Math.max(...values);
  values.forEach((value) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const height = (value / maxVal) * 100;
    bar.style.height = `${height}%`;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `Valore ${value}`);
    const label = document.createElement('small');
    label.textContent = value;
    bar.appendChild(label);
    barsContainer.appendChild(bar);
  });
  updateNumbersVisibility();
}

function updateNumbersVisibility() {
  barsContainer.querySelectorAll('.bar small').forEach((el) => {
    el.style.display = state.showNumbers ? 'block' : 'none';
  });
}

function clearTransientClasses() {
  barsContainer.querySelectorAll('.bar').forEach((bar) => {
    bar.classList.remove('compare', 'swap', 'pivot', 'merge-write');
  });
}

function setBarHeight(index, value) {
  const bar = barsContainer.children[index];
  if (!bar) return;
  const height = (value / state.maxValue) * 100;
  bar.style.height = `${height}%`;
  const label = bar.querySelector('small');
  if (label) label.textContent = value;
}

function applyAction(action) {
  clearTransientClasses();
  switch (action.type) {
    case 'compare': {
      highlightBars([action.i, action.j], 'compare');
      state.comparisons += 1;
      tickSound();
      break;
    }
    case 'swap': {
      const { i, j } = action;
      [state.workingArray[i], state.workingArray[j]] = [state.workingArray[j], state.workingArray[i]];
      setBarHeight(i, state.workingArray[i]);
      setBarHeight(j, state.workingArray[j]);
      highlightBars([i, j], 'swap');
      state.swaps += 1;
      tickSound();
      break;
    }
    case 'set': {
      const { i, value } = action;
      state.workingArray[i] = value;
      setBarHeight(i, value);
      highlightBars([i], 'merge-write');
      tickSound();
      break;
    }
    case 'markSorted': {
      action.indices.forEach((idx) => {
        const bar = barsContainer.children[idx];
        if (bar) bar.classList.add('sorted');
      });
      break;
    }
    case 'pivot': {
      highlightBars([action.index], 'pivot');
      break;
    }
    default:
      break;
  }
  updateStats();
}

function highlightBars(indices, className) {
  indices.forEach((idx) => {
    const bar = barsContainer.children[idx];
    if (bar) bar.classList.add(className);
  });
}

function updateStats() {
  compareCountEl.textContent = state.comparisons;
  swapCountEl.textContent = state.swaps;
}

function updateTimer() {
  if (!state.playing || state.paused) return;
  const now = performance.now();
  const elapsed = state.elapsedAccum + (now - state.startTimestamp);
  timeElapsedEl.textContent = `${Math.floor(elapsed)} ms`;
  state.timerRAF = requestAnimationFrame(updateTimer);
}

function startPlayback() {
  if (state.playing && !state.paused) return;
  if (state.actionIndex === 0 || state.actionIndex >= state.actions.length) {
    buildActions();
    resetStats();
    state.workingArray = [...state.baseArray];
    renderBars(state.workingArray);
  }
  pauseBtn.textContent = 'Pause';
  state.playing = true;
  state.paused = false;
  state.startTimestamp = performance.now();
  state.timerRAF = requestAnimationFrame(updateTimer);
  runLoop();
}

function togglePause() {
  if (!state.playing) {
    startPlayback();
    pauseBtn.textContent = 'Pause';
    return;
  }
  state.paused = !state.paused;
  if (state.paused) {
    state.elapsedAccum += performance.now() - state.startTimestamp;
    pauseBtn.textContent = 'Resume';
  } else {
    state.startTimestamp = performance.now();
    state.timerRAF = requestAnimationFrame(updateTimer);
    runLoop();
    pauseBtn.textContent = 'Pause';
  }
}

function stopPlayback() {
  state.playing = false;
  state.paused = false;
  clearTimeout(state.playTimeout);
  if (state.timerRAF) cancelAnimationFrame(state.timerRAF);
}

function resetStats() {
  state.comparisons = 0;
  state.swaps = 0;
  state.elapsedAccum = 0;
  state.startTimestamp = performance.now();
  timeElapsedEl.textContent = '0 ms';
  updateStats();
}

function resetVisualizer() {
  stopPlayback();
  state.actionIndex = 0;
  state.actions = [];
  state.workingArray = [...state.baseArray];
  renderBars(state.workingArray);
  barsContainer.querySelectorAll('.bar').forEach((bar) => {
    bar.classList.remove('sorted', 'compare', 'swap', 'pivot', 'merge-write');
  });
  resetStats();
  pauseBtn.textContent = 'Pause';
}

function runLoop() {
  if (!state.playing || state.paused) return;
  if (state.actionIndex >= state.actions.length) {
    state.playing = false;
    state.elapsedAccum += performance.now() - state.startTimestamp;
    timeElapsedEl.textContent = `${Math.floor(state.elapsedAccum)} ms`;
    pauseBtn.textContent = 'Pause';
    return;
  }
  stepOnce(false);
  state.playTimeout = setTimeout(runLoop, state.speed);
}

function stepOnce(manual = true) {
  if (manual && state.actions.length === 0) {
    buildActions();
    resetStats();
    state.workingArray = [...state.baseArray];
    renderBars(state.workingArray);
  }
  if (state.actionIndex >= state.actions.length) return;
  const action = state.actions[state.actionIndex];
  applyAction(action);
  state.actionIndex += 1;
}

function buildActions() {
  const arrCopy = [...state.baseArray];
  let actions = [];
  switch (state.algorithm) {
    case 'bubble':
      actions = bubbleSortActions(arrCopy);
      break;
    case 'selection':
      actions = selectionSortActions(arrCopy);
      break;
    case 'insertion':
      actions = insertionSortActions(arrCopy);
      break;
    case 'merge':
      actions = mergeSortActions(arrCopy);
      break;
    case 'quick':
      actions = quickSortActions(arrCopy);
      break;
    case 'heap':
      actions = heapSortActions(arrCopy);
      break;
    default:
      actions = bubbleSortActions(arrCopy);
  }
  actions.push({ type: 'markSorted', indices: [...Array(arrCopy.length).keys()] });
  state.actions = actions;
  state.actionIndex = 0;
}

function bubbleSortActions(arr) {
  const actions = [];
  const n = arr.length;
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < n - i - 1; j += 1) {
      actions.push({ type: 'compare', i: j, j: j + 1 });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        actions.push({ type: 'swap', i: j, j: j + 1 });
      }
    }
    actions.push({ type: 'markSorted', indices: [n - i - 1] });
  }
  actions.push({ type: 'markSorted', indices: [0] });
  return actions;
}

function selectionSortActions(arr) {
  const actions = [];
  const n = arr.length;
  for (let i = 0; i < n; i += 1) {
    let min = i;
    for (let j = i + 1; j < n; j += 1) {
      actions.push({ type: 'compare', i: min, j });
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      actions.push({ type: 'swap', i, j: min });
    }
    actions.push({ type: 'markSorted', indices: [i] });
  }
  return actions;
}

function insertionSortActions(arr) {
  const actions = [];
  for (let i = 1; i < arr.length; i += 1) {
    let j = i;
    while (j > 0) {
      actions.push({ type: 'compare', i: j - 1, j });
      if (arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        actions.push({ type: 'swap', i: j - 1, j });
      } else {
        break;
      }
      j -= 1;
    }
  }
  actions.push({ type: 'markSorted', indices: [...Array(arr.length).keys()] });
  return actions;
}

function mergeSortActions(arr) {
  const actions = [];
  const aux = [...arr];

  function merge(left, mid, right) {
    let i = left;
    let j = mid + 1;
    let k = left;

    while (i <= mid && j <= right) {
      actions.push({ type: 'compare', i, j });
      if (aux[i] <= aux[j]) {
        arr[k] = aux[i];
        actions.push({ type: 'set', i: k, value: aux[i] });
        i += 1;
      } else {
        arr[k] = aux[j];
        actions.push({ type: 'set', i: k, value: aux[j] });
        j += 1;
      }
      k += 1;
    }

    while (i <= mid) {
      arr[k] = aux[i];
      actions.push({ type: 'set', i: k, value: aux[i] });
      i += 1;
      k += 1;
    }

    while (j <= right) {
      arr[k] = aux[j];
      actions.push({ type: 'set', i: k, value: aux[j] });
      j += 1;
      k += 1;
    }

    for (let t = left; t <= right; t += 1) aux[t] = arr[t];
  }

  function divide(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    divide(left, mid);
    divide(mid + 1, right);
    merge(left, mid, right);
  }

  divide(0, arr.length - 1);
  return actions;
}

function quickSortActions(arr) {
  const actions = [];

  function partition(low, high) {
    const pivotVal = arr[high];
    actions.push({ type: 'pivot', index: high });
    let i = low;
    for (let j = low; j < high; j += 1) {
      actions.push({ type: 'compare', i: j, j: high });
      if (arr[j] < pivotVal) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        actions.push({ type: 'swap', i, j });
        i += 1;
      }
    }
    [arr[i], arr[high]] = [arr[high], arr[i]];
    actions.push({ type: 'swap', i, j: high });
    actions.push({ type: 'markSorted', indices: [i] });
    return i;
  }

  function quick(low, high) {
    if (low >= high) {
      if (low === high) actions.push({ type: 'markSorted', indices: [low] });
      return;
    }
    const pivotIndex = partition(low, high);
    quick(low, pivotIndex - 1);
    quick(pivotIndex + 1, high);
  }

  quick(0, arr.length - 1);
  return actions;
}

function heapSortActions(arr) {
  const actions = [];
  const n = arr.length;

  function heapify(length, root) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < length) {
      actions.push({ type: 'compare', i: left, j: largest });
      if (arr[left] > arr[largest]) largest = left;
    }
    if (right < length) {
      actions.push({ type: 'compare', i: right, j: largest });
      if (arr[right] > arr[largest]) largest = right;
    }
    if (largest !== root) {
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      actions.push({ type: 'swap', i: root, j: largest });
      heapify(length, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) heapify(n, i);

  for (let end = n - 1; end > 0; end -= 1) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    actions.push({ type: 'swap', i: 0, j: end });
    actions.push({ type: 'markSorted', indices: [end] });
    heapify(end, 0);
  }
  actions.push({ type: 'markSorted', indices: [0] });
  return actions;
}

function updateAlgoInfo() {
  const meta = algorithmInfo[state.algorithm];
  algoDescriptionEl.textContent = meta.desc;
  stabilityTag.textContent = meta.stable ? 'Stabile' : 'Non stabile';
  bestCaseEl.textContent = meta.best;
  avgCaseEl.textContent = meta.avg;
  worstCaseEl.textContent = meta.worst;
  setInfoModalContent(meta);
}

function tickSound() {
  if (!state.playAudio) return;
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 420;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

function setInfoModalContent(meta) {
  infoTitle.textContent = meta.name;
  infoBody.textContent = meta.details;
}

function openInfoModal() {
  const meta = algorithmInfo[state.algorithm];
  setInfoModalContent(meta);
  infoModal.classList.add('open');
  infoModal.setAttribute('aria-hidden', 'false');
  infoClose.focus();
}

function closeInfoModal() {
  infoModal.classList.remove('open');
  infoModal.setAttribute('aria-hidden', 'true');
}

init();
