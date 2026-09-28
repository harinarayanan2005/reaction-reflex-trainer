// ============================================================================
// REFLEXFORGE ULTRA - MASTER CONTROLLER & COGNITIVE ENGINE
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const app = new ReflexForgeUltra();
  app.init();
});

class ReflexForgeUltra {
  constructor() {
    this.currentMode = "visual";

    // Theme & Audio State
    this.isDark = true;
    this.soundPack = "cyber";

    // Stats & History
    this.totalTestsCompleted = parseInt(localStorage.getItem("rf_total_tests") || "0", 10);
    this.reactionHistory = JSON.parse(localStorage.getItem("rf_reaction_history") || "[]");

    // 1. Visual Mode
    this.visualState = "waiting"; // waiting, armed, ready, early, result
    this.visualTimer = null;
    this.visualStartTime = 0;
    this.visualBest = parseInt(localStorage.getItem("rf_visual_best") || "0", 10);

    // 2. Grid Shot Mode
    this.gridActive = false;
    this.gridRemaining = 30;
    this.gridInterval = null;
    this.gridHits = 0;
    this.gridClicks = 0;
    this.gridStartTime = 0;
    this.gridActiveCells = new Set();
    this.gridBestScore = parseInt(localStorage.getItem("rf_grid_best_score") || "0", 10);
    this.gridBestPace = parseFloat(localStorage.getItem("rf_grid_best_pace") || "0");

    // 3. Aim Mode
    this.aimActive = false;
    this.aimRemaining = 30;
    this.aimInterval = null;
    this.aimScore = 0;
    this.aimClicks = 0;
    this.aimHits = 0;
    this.aimHitSpeeds = [];
    this.aimTargetTimeout = null;
    this.aimSpawnStartTime = 0;
    this.aimBestScore = parseInt(localStorage.getItem("rf_aim_best") || "0", 10);

    // 4. Audio Mode
    this.audioState = "waiting";
    this.audioTimer = null;
    this.audioStartTime = 0;
    this.audioBest = parseInt(localStorage.getItem("rf_audio_best") || "0", 10);

    // 5. Typing Rush Mode
    this.typingActive = false;
    this.typingRemaining = 30;
    this.typingInterval = null;
    this.typingSpawnInterval = null;
    this.fallingWords = [];
    this.typingWordsDestroyed = 0;
    this.typingStreak = 0;
    this.typingBestStreak = 0;
    this.typingBestWpm = parseInt(localStorage.getItem("rf_typing_best_wpm") || "0", 10);
    this.wordBank = [
      "ping", "cyber", "vector", "kernel", "matrix", "cipher", "buffer", 
      "stream", "syntax", "daemon", "thread", "packet", "socket", "quantum", 
      "server", "bypass", "portal", "neural", "script", "reflex", "speed"
    ];

    // 6. Stroop Mode
    this.stroopActive = false;
    this.stroopRemaining = 30;
    this.stroopInterval = null;
    this.stroopScore = 0;
    this.stroopAttempts = 0;
    this.stroopReactionTimes = [];
    this.stroopStartTime = 0;
    this.currentStroop = null;
    this.stroopBestScore = parseInt(localStorage.getItem("rf_stroop_best") || "0", 10);
    this.colorPalette = [
      { name: "RED", hex: "#ef4444" },
      { name: "BLUE", hex: "#3b82f6" },
      { name: "GREEN", hex: "#10b981" },
      { name: "YELLOW", hex: "#f59e0b" },
      { name: "PURPLE", hex: "#a855f7" }
    ];

    // 7. Tempo Mode
    this.tempoActive = false;
    this.tempoInterval = null;
    this.tempoBeatDuration = 500; // 120 BPM
    this.tempoLastBeatTime = 0;
    this.tempoOffsets = [];
    this.tempoPerfectCount = 0;

    // 8. Memory Mode
    this.memoryLevel = 1;
    this.memoryBestLevel = parseInt(localStorage.getItem("rf_memory_best") || "1", 10);
    this.memoryNextStep = 1;
    this.memoryTilesCount = 4;
    this.memoryTotalGridCells = 20;
    this.memoryActive = false;

    // Ambient Particles Canvas
    this.particles = [];
    this.ambientCanvas = null;
    this.ambientCtx = null;
  }

  init() {
    this.cacheDom();
    this.initAmbientParticles();
    this.bindEvents();
    this.loadSavedStats();
    this.drawPerformanceGraph();
    this.initGridShotCells();
  }

  cacheDom() {
    // Top Controls
    this.soundToggleBtn = document.getElementById("soundToggleBtn");
    this.soundIcon = document.getElementById("soundIcon");
    this.soundPackSelect = document.getElementById("soundPackSelect");
    this.themeToggleBtn = document.getElementById("themeToggleBtn");
    this.themeIcon = document.getElementById("themeIcon");
    this.gamerCardBtn = document.getElementById("gamerCardBtn");

    // Quickbar HUD
    this.hudGlobalRank = document.getElementById("hudGlobalRank");
    this.hudVisualPb = document.getElementById("hudVisualPb");
    this.hudAimPb = document.getElementById("hudAimPb");
    this.hudGridPb = document.getElementById("hudGridPb");
    this.hudTotalTests = document.getElementById("hudTotalTests");

    // Navigation & Arenas
    this.modeTabs = document.querySelectorAll(".mode-tab");
    this.arenas = document.querySelectorAll(".mode-arena");

    // 1. Visual Mode
    this.visualTriggerBox = document.getElementById("visualTriggerBox");
    this.visualIcon = document.getElementById("visualIcon");
    this.visualTitle = document.getElementById("visualTitle");
    this.visualDesc = document.getElementById("visualDesc");
    this.visualResultBadge = document.getElementById("visualResultBadge");
    this.visualLastScore = document.getElementById("visualLastScore");
    this.visualBestScore = document.getElementById("visualBestScore");
    this.visualAvgScore = document.getElementById("visualAvgScore");
    this.visualRank = document.getElementById("visualRank");

    // 2. Grid Shot Mode
    this.gridCellsContainer = document.getElementById("gridCellsContainer");
    this.gridOverlay = document.getElementById("gridOverlay");
    this.gridStartBtn = document.getElementById("gridStartBtn");
    this.gridModalStartBtn = document.getElementById("gridModalStartBtn");
    this.gridTimerEl = document.getElementById("gridTimer");
    this.gridHitsEl = document.getElementById("gridHits");
    this.gridPaceEl = document.getElementById("gridPace");
    this.gridAccuracyEl = document.getElementById("gridAccuracy");
    this.gridBestScoreEl = document.getElementById("gridBestScore");
    this.gridBestPaceEl = document.getElementById("gridBestPace");
    this.gridAvgFlickEl = document.getElementById("gridAvgFlick");

    // 3. Aim Mode
    this.aimField = document.getElementById("aimField");
    this.aimOverlay = document.getElementById("aimOverlay");
    this.aimStartBtn = document.getElementById("aimStartBtn");
    this.aimModalStartBtn = document.getElementById("aimModalStartBtn");
    this.aimTimerEl = document.getElementById("aimTimer");
    this.aimScoreEl = document.getElementById("aimScore");
    this.aimAccuracyEl = document.getElementById("aimAccuracy");
    this.aimStatHits = document.getElementById("aimStatHits");
    this.aimStatAvgSpeed = document.getElementById("aimStatAvgSpeed");
    this.aimStatBest = document.getElementById("aimStatBest");

    // 4. Audio Mode
    this.audioTriggerBox = document.getElementById("audioTriggerBox");
    this.audioIcon = document.getElementById("audioIcon");
    this.audioTitle = document.getElementById("audioTitle");
    this.audioDesc = document.getElementById("audioDesc");
    this.audioResultBadge = document.getElementById("audioResultBadge");
    this.audioLastScore = document.getElementById("audioLastScore");
    this.audioBestScore = document.getElementById("audioBestScore");
    this.audioComparison = document.getElementById("audioComparison");

    // 5. Typing Mode
    this.typingArena = document.getElementById("typingArena");
    this.typingOverlay = document.getElementById("typingOverlay");
    this.fallingWordsField = document.getElementById("fallingWordsField");
    this.typingInput = document.getElementById("typingInput");
    this.typingStartBtn = document.getElementById("typingStartBtn");
    this.typingModalStartBtn = document.getElementById("typingModalStartBtn");
    this.typingTimerEl = document.getElementById("typingTimer");
    this.typingWordsHitEl = document.getElementById("typingWordsHit");
    this.typingWpmEl = document.getElementById("typingWpm");
    this.typingStreakEl = document.getElementById("typingStreak");
    this.typingBestWpmEl = document.getElementById("typingBestWpm");
    this.typingBestStreakEl = document.getElementById("typingBestStreak");
    this.typingAccuracyEl = document.getElementById("typingAccuracy");

    // 6. Stroop Mode
    this.stroopOverlay = document.getElementById("stroopOverlay");
    this.stroopStartBtn = document.getElementById("stroopStartBtn");
    this.stroopModalStartBtn = document.getElementById("stroopModalStartBtn");
    this.stroopTimerEl = document.getElementById("stroopTimer");
    this.stroopScoreEl = document.getElementById("stroopScore");
    this.stroopAccuracyEl = document.getElementById("stroopAccuracy");
    this.stroopWordDisplay = document.getElementById("stroopWordDisplay");
    this.stroopMatchBtn = document.getElementById("stroopMatchBtn");
    this.stroopNoMatchBtn = document.getElementById("stroopNoMatchBtn");
    this.stroopCorrectCount = document.getElementById("stroopCorrectCount");
    this.stroopAvgSpeed = document.getElementById("stroopAvgSpeed");
    this.stroopBestScoreEl = document.getElementById("stroopBestScore");

    // 7. Tempo Mode
    this.tempoActionBtn = document.getElementById("tempoActionBtn");
    this.tempoOuterRing = document.getElementById("tempoOuterRing");
    this.tempoOffsetBadge = document.getElementById("tempoOffsetBadge");
    this.tempoLastOffset = document.getElementById("tempoLastOffset");
    this.tempoAvgError = document.getElementById("tempoAvgError");
    this.tempoPerfectHits = document.getElementById("tempoPerfectHits");

    // 8. Memory Mode
    this.memoryGrid = document.getElementById("memoryGrid");
    this.memoryLevelEl = document.getElementById("memoryLevel");
    this.memoryInstruction = document.getElementById("memoryInstruction");
    this.memoryStartBtn = document.getElementById("memoryStartBtn");
    this.memoryBestLevelEl = document.getElementById("memoryBestLevel");
    this.memoryTilesCountEl = document.getElementById("memoryTilesCount");

    // Analytics Graph & Gamer Card Modal
    this.perfCanvas = document.getElementById("performanceGraph");
    this.clearHistoryBtn = document.getElementById("clearHistoryBtn");
    this.gamerCardModal = document.getElementById("gamerCardModal");
    this.modalCloseBtn = document.getElementById("modalCloseBtn");
    this.copyStatsBtn = document.getElementById("copyStatsBtn");
  }

  // ==========================================
  // AMBIENT PARTICLES CANVAS
  // ==========================================
  initAmbientParticles() {
    this.ambientCanvas = document.getElementById("ambientCanvas");
    if (!this.ambientCanvas) return;
    this.ambientCtx = this.ambientCanvas.getContext("2d");

    const resize = () => {
      this.ambientCanvas.width = window.innerWidth;
      this.ambientCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    this.particles = [];
    const count = Math.min(45, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.ambientCanvas.width,
        y: Math.random() * this.ambientCanvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.2
      });
    }

    const animate = () => {
      this.ambientCtx.clearRect(0, 0, this.ambientCanvas.width, this.ambientCanvas.height);
      const w = this.ambientCanvas.width;
      const h = this.ambientCanvas.height;

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        this.ambientCtx.beginPath();
        this.ambientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ambientCtx.fillStyle = `rgba(0, 242, 254, ${p.alpha})`;
        this.ambientCtx.fill();
      });

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  bindEvents() {
    // Mode Switcher
    this.modeTabs.forEach(tab => {
      tab.addEventListener("click", () => this.switchMode(tab.dataset.mode));
    });

    // Theme & Sound Controls
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    this.soundToggleBtn.addEventListener("click", () => {
      const isMuted = sound.toggleMute();
      this.soundIcon.textContent = isMuted ? "🔇" : "🔊";
    });
    this.soundPackSelect.addEventListener("change", (e) => {
      sound.setSoundPack(e.target.value);
    });

    // Gamer Card Modal
    this.gamerCardBtn.addEventListener("click", () => this.openGamerCard());
    this.modalCloseBtn.addEventListener("click", () => this.gamerCardModal.classList.add("hidden"));
    this.copyStatsBtn.addEventListener("click", () => this.copyGamerCardScore());
    this.gamerCardModal.addEventListener("click", (e) => {
      if (e.target === this.gamerCardModal) this.gamerCardModal.classList.add("hidden");
    });

    // 1. Visual Trigger
    this.visualTriggerBox.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      sound.ensureContext();
      this.handleVisualClick();
    });

    // 2. Grid Shot
    this.gridStartBtn.addEventListener("click", () => this.startGridGame());
    this.gridModalStartBtn.addEventListener("click", () => this.startGridGame());

    // 3. Aim Mode
    this.aimStartBtn.addEventListener("click", () => this.startAimGame());
    this.aimModalStartBtn.addEventListener("click", () => this.startAimGame());
    this.aimField.addEventListener("pointerdown", (e) => this.handleAimMiss(e));

    // 4. Audio Trigger
    this.audioTriggerBox.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      sound.ensureContext();
      this.handleAudioClick();
    });

    // 5. Typing Mode
    this.typingStartBtn.addEventListener("click", () => this.startTypingGame());
    this.typingModalStartBtn.addEventListener("click", () => this.startTypingGame());
    this.typingInput.addEventListener("input", () => this.handleTypingAutoBlast());
    this.typingInput.addEventListener("keydown", (e) => this.handleTypingKeydown(e));

    // 6. Stroop Mode
    this.stroopStartBtn.addEventListener("click", () => this.startStroopGame());
    this.stroopModalStartBtn.addEventListener("click", () => this.startStroopGame());
    this.stroopMatchBtn.addEventListener("click", () => this.handleStroopAnswer(true));
    this.stroopNoMatchBtn.addEventListener("click", () => this.handleStroopAnswer(false));

    // 7. Tempo Mode
    this.tempoActionBtn.addEventListener("click", () => this.toggleTempoMetronome());

    // 8. Memory Mode
    this.memoryStartBtn.addEventListener("click", () => this.startMemoryRound());

    // Clear History Button
    this.clearHistoryBtn.addEventListener("click", () => this.clearHistory());

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.repeat) {
        if (this.currentMode === "visual") {
          e.preventDefault();
          this.handleVisualClick();
        } else if (this.currentMode === "audio") {
          e.preventDefault();
          this.handleAudioClick();
        } else if (this.currentMode === "tempo" && this.tempoActive) {
          e.preventDefault();
          this.handleTempoTap();
        }
      } else if (this.currentMode === "stroop" && this.stroopActive) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          this.handleStroopAnswer(true);
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          this.handleStroopAnswer(false);
        }
      }
    });
  }

  // ==========================================
  // MODE NAVIGATION & HUD UPDATES
  // ==========================================
  switchMode(modeKey) {
    this.currentMode = modeKey;
    this.modeTabs.forEach(t => t.classList.toggle("active", t.dataset.mode === modeKey));
    this.arenas.forEach(arena => arena.classList.toggle("active", arena.id === `${modeKey}Mode`));

    // Stop active games if switching away
    if (modeKey !== "grid" && this.gridActive) this.endGridGame();
    if (modeKey !== "aim" && this.aimActive) this.endAimGame();
    if (modeKey !== "typing" && this.typingActive) this.endTypingGame();
    if (modeKey !== "stroop" && this.stroopActive) this.endStroopGame();
    if (modeKey !== "tempo" && this.tempoActive) this.toggleTempoMetronome();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.setAttribute("data-theme", this.isDark ? "dark" : "light");
    this.themeIcon.textContent = this.isDark ? "🌙" : "☀️";
    this.drawPerformanceGraph();
  }

  incrementTotalTests() {
    this.totalTestsCompleted++;
    localStorage.setItem("rf_total_tests", this.totalTestsCompleted);
    this.hudTotalTests.textContent = this.totalTestsCompleted;
    this.updateGlobalRank();
  }

  updateGlobalRank() {
    let rank = "APPRENTICE";
    let color = "#94a3b8";

    if (this.visualBest > 0 && this.visualBest < 190) {
      rank = "GODLIKE ⚡";
      color = "#f43f5e";
    } else if (this.visualBest > 0 && this.visualBest < 225) {
      rank = "ESPORTS PRO 🎮";
      color = "#00f2fe";
    } else if (this.visualBest > 0 && this.visualBest < 270) {
      rank = "MASTER 💎";
      color = "#10b981";
    } else if (this.totalTestsCompleted > 10) {
      rank = "CONTENDER 🔥";
      color = "#f59e0b";
    }

    this.hudGlobalRank.textContent = rank;
    this.hudGlobalRank.style.color = color;
  }

  loadSavedStats() {
    // Visual PB
    if (this.visualBest > 0) {
      this.visualBestScore.textContent = `${this.visualBest} ms`;
      this.hudVisualPb.textContent = `${this.visualBest} ms`;
    }
    this.updateVisualAverage();

    // Aim PB
    if (this.aimBestScore > 0) {
      this.aimStatBest.textContent = `${this.aimBestScore} pts`;
      this.hudAimPb.textContent = `${this.aimBestScore} pts`;
    }

    // Grid Shot PB
    if (this.gridBestScore > 0) {
      this.gridBestScoreEl.textContent = `${this.gridBestScore} hits`;
      this.gridBestPaceEl.textContent = `${this.gridBestPace.toFixed(2)} /s`;
      this.hudGridPb.textContent = `${this.gridBestPace.toFixed(2)} /s`;
    }

    // Audio PB
    if (this.audioBest > 0) {
      this.audioBestScore.textContent = `${this.audioBest} ms`;
    }

    // Typing PB
    if (this.typingBestWpm > 0) {
      this.typingBestWpmEl.textContent = `${this.typingBestWpm} WPM`;
    }

    // Stroop PB
    if (this.stroopBestScore > 0) {
      this.stroopBestScoreEl.textContent = `${this.stroopBestScore} pts`;
    }

    // Memory Best
    this.memoryBestLevelEl.textContent = this.memoryBestLevel;
    this.hudTotalTests.textContent = this.totalTestsCompleted;
    this.updateGlobalRank();
    this.initMemoryGrid();
  }

  // ==========================================
  // 1. VISUAL REFLEX
  // ==========================================
  handleVisualClick() {
    if (this.visualState === "waiting" || this.visualState === "result" || this.visualState === "early") {
      this.visualState = "armed";
      this.visualTriggerBox.className = "reaction-card state-armed";
      this.visualIcon.textContent = "⏳";
      this.visualTitle.textContent = "Wait for Green...";
      this.visualDesc.textContent = "Hold steady. Do not click prematurely!";
      this.visualResultBadge.classList.add("hidden");

      const delay = Math.floor(Math.random() * 2600) + 1500;
      this.visualTimer = setTimeout(() => {
        if (this.visualState === "armed") {
          this.visualState = "ready";
          this.visualTriggerBox.className = "reaction-card state-ready";
          this.visualIcon.textContent = "⚡";
          this.visualTitle.textContent = "CLICK NOW!";
          this.visualDesc.textContent = "Fast as you can!";
          this.visualStartTime = performance.now();
          sound.playGreenTrigger();
        }
      }, delay);

    } else if (this.visualState === "armed") {
      clearTimeout(this.visualTimer);
      this.visualState = "early";
      this.visualTriggerBox.className = "reaction-card state-early";
      this.visualIcon.textContent = "⚠️";
      this.visualTitle.textContent = "Too Early!";
      this.visualDesc.textContent = "Clicked before green. Penalty applied! Click to reset.";
      sound.playEarlyPenalty();

    } else if (this.visualState === "ready") {
      const elapsed = Math.round(performance.now() - this.visualStartTime);
      this.visualState = "result";
      this.visualTriggerBox.className = "reaction-card state-result";
      this.visualIcon.textContent = "⚡";
      this.visualTitle.textContent = `${elapsed} ms`;
      this.visualDesc.textContent = "Click anywhere or press [SPACE] to test again.";
      
      const rankInfo = this.getReactionRank(elapsed);
      this.visualResultBadge.textContent = rankInfo.rank;
      this.visualResultBadge.classList.remove("hidden");

      if (elapsed < 200) {
        sound.playVictory();
      } else {
        sound.playTargetHit(0);
      }

      this.visualLastScore.textContent = `${elapsed} ms`;
      if (!this.visualBest || elapsed < this.visualBest) {
        this.visualBest = elapsed;
        localStorage.setItem("rf_visual_best", this.visualBest);
        this.visualBestScore.textContent = `${this.visualBest} ms`;
        this.hudVisualPb.textContent = `${this.visualBest} ms`;
      }

      this.reactionHistory.push({ score: elapsed, date: Date.now() });
      if (this.reactionHistory.length > 20) this.reactionHistory.shift();
      localStorage.setItem("rf_reaction_history", JSON.stringify(this.reactionHistory));

      this.updateVisualAverage();
      this.visualRank.textContent = rankInfo.rank;
      this.visualRank.style.color = rankInfo.color;
      this.drawPerformanceGraph();
      this.incrementTotalTests();
    }
  }

  updateVisualAverage() {
    if (this.reactionHistory.length > 0) {
      const recent = this.reactionHistory.slice(-5);
      const avg = Math.round(recent.reduce((acc, cur) => acc + cur.score, 0) / recent.length);
      this.visualAvgScore.textContent = `${avg} ms`;
    }
  }

  getReactionRank(ms) {
    if (ms < 180) return { rank: "Godlike (Top 1%)", color: "#f43f5e" };
    if (ms < 215) return { rank: "Esports Pro 🎮", color: "#00f2fe" };
    if (ms < 265) return { rank: "Healthy Fast ⚡", color: "#10b981" };
    return { rank: "Casual ☕", color: "#f59e0b" };
  }

  // ==========================================
  // 2. GRID SHOT MODE (FPS Warmup)
  // ==========================================
  initGridShotCells() {
    this.gridCellsContainer.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.cellId = i;
      this.gridCellsContainer.appendChild(cell);
    }
  }

  startGridGame() {
    sound.ensureContext();
    this.gridActive = true;
    this.gridRemaining = 30;
    this.gridHits = 0;
    this.gridClicks = 0;
    this.gridStartTime = performance.now();
    this.gridActiveCells.clear();

    this.gridHitsEl.textContent = "0";
    this.gridPaceEl.textContent = "0.00 /s";
    this.gridAccuracyEl.textContent = "100%";
    this.gridTimerEl.textContent = `${this.gridRemaining}s`;
    this.gridOverlay.classList.add("hidden");

    this.initGridShotCells();

    // Spawn initial 3 targets
    for (let i = 0; i < 3; i++) {
      this.spawnGridTarget();
    }

    clearInterval(this.gridInterval);
    this.gridInterval = setInterval(() => {
      this.gridRemaining--;
      this.gridTimerEl.textContent = `${this.gridRemaining}s`;

      const elapsedSec = (performance.now() - this.gridStartTime) / 1000;
      const pace = elapsedSec > 0 ? (this.gridHits / elapsedSec) : 0;
      this.gridPaceEl.textContent = `${pace.toFixed(2)} /s`;

      if (this.gridRemaining <= 0) {
        this.endGridGame();
      }
    }, 1000);
  }

  spawnGridTarget() {
    if (!this.gridActive) return;
    const available = [];
    for (let i = 0; i < 16; i++) {
      if (!this.gridActiveCells.has(i)) available.push(i);
    }
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.gridActiveCells.add(chosen);

    const cell = this.gridCellsContainer.children[chosen];
    cell.innerHTML = "";

    const disc = document.createElement("div");
    disc.className = "grid-target-disc";

    disc.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.handleGridTargetHit(chosen, disc);
    });

    cell.appendChild(disc);
  }

  handleGridTargetHit(cellIndex, discEl) {
    if (!this.gridActive) return;
    this.gridHits++;
    this.gridClicks++;
    this.gridHitsEl.textContent = this.gridHits;

    // Spatial sound panning calculation based on horizontal position (0 to 3)
    const col = cellIndex % 4;
    const pan = (col / 3) * 1.6 - 0.8;
    sound.playTargetHit(pan);

    this.gridActiveCells.delete(cellIndex);
    discEl.remove();

    // Spawn a new target immediately
    this.spawnGridTarget();
  }

  endGridGame() {
    this.gridActive = false;
    clearInterval(this.gridInterval);
    this.gridActiveCells.clear();
    this.initGridShotCells();

    const pace = this.gridHits / 30;
    const avgFlick = this.gridHits > 0 ? Math.round(30000 / this.gridHits) : 0;

    this.gridAvgFlickEl.textContent = avgFlick > 0 ? `${avgFlick} ms` : "--";

    if (this.gridHits > this.gridBestScore) {
      this.gridBestScore = this.gridHits;
      this.gridBestPace = pace;
      localStorage.setItem("rf_grid_best_score", this.gridBestScore);
      localStorage.setItem("rf_grid_best_pace", this.gridBestPace);
      this.gridBestScoreEl.textContent = `${this.gridBestScore} hits`;
      this.gridBestPaceEl.textContent = `${this.gridBestPace.toFixed(2)} /s`;
      this.hudGridPb.textContent = `${this.gridBestPace.toFixed(2)} /s`;
      sound.playVictory();
    }

    this.gridOverlay.innerHTML = `
      <div class="overlay-modal">
        <span class="overlay-icon">🏆</span>
        <h2>Grid Shot Session Over!</h2>
        <p>Total Hits: <strong>${this.gridHits}</strong> • Pace: <strong>${pace.toFixed(2)} hits/sec</strong></p>
        <button id="gridRestartBtn" class="btn btn-primary btn-large">Deploy Again</button>
      </div>
    `;
    this.gridOverlay.classList.remove("hidden");
    document.getElementById("gridRestartBtn").addEventListener("click", () => this.startGridGame());
    this.incrementTotalTests();
  }

  // ==========================================
  // 3. AIM TARGET BLITZ
  // ==========================================
  startAimGame() {
    sound.ensureContext();
    this.aimActive = true;
    this.aimRemaining = 30;
    this.aimScore = 0;
    this.aimClicks = 0;
    this.aimHits = 0;
    this.aimHitSpeeds = [];

    this.aimScoreEl.textContent = "0";
    this.aimAccuracyEl.textContent = "100%";
    this.aimTimerEl.textContent = `${this.aimRemaining}s`;
    this.aimOverlay.classList.add("hidden");

    this.clearAimTargets();
    this.spawnAimTarget();

    clearInterval(this.aimInterval);
    this.aimInterval = setInterval(() => {
      this.aimRemaining--;
      this.aimTimerEl.textContent = `${this.aimRemaining}s`;
      if (this.aimRemaining <= 0) this.endAimGame();
    }, 1000);
  }

  spawnAimTarget() {
    if (!this.aimActive) return;
    this.clearAimTargets();

    const target = document.createElement("div");
    target.className = "aim-target";

    const fieldRect = this.aimField.getBoundingClientRect();
    const radius = 30;
    const padding = 45;

    const maxX = fieldRect.width - padding;
    const minX = padding;
    const maxY = fieldRect.height - padding;
    const minY = padding;

    const posX = Math.floor(Math.random() * (maxX - minX)) + minX;
    const posY = Math.floor(Math.random() * (maxY - minY)) + minY;

    target.style.width = `${radius * 2}px`;
    target.style.height = `${radius * 2}px`;
    target.style.left = `${posX}px`;
    target.style.top = `${posY}px`;

    this.aimSpawnStartTime = performance.now();

    target.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.handleTargetHit(target, posX, posY, fieldRect.width);
    });

    this.aimField.appendChild(target);

    this.aimTargetTimeout = setTimeout(() => {
      if (this.aimActive && target.parentElement) {
        target.remove();
        this.spawnAimTarget();
      }
    }, 1300);
  }

  handleTargetHit(target, x, y, fieldWidth) {
    if (!this.aimActive) return;
    const hitSpeed = Math.round(performance.now() - this.aimSpawnStartTime);
    this.aimHitSpeeds.push(hitSpeed);

    clearTimeout(this.aimTargetTimeout);
    target.remove();

    this.aimHits++;
    this.aimClicks++;
    this.aimScore += 100;

    const pan = (x / fieldWidth) * 2 - 1;
    sound.playTargetHit(pan);

    this.spawnHitBurst(x, y);

    this.aimScoreEl.textContent = this.aimScore;
    const acc = Math.round((this.aimHits / this.aimClicks) * 100);
    this.aimAccuracyEl.textContent = `${acc}%`;

    this.spawnAimTarget();
  }

  handleAimMiss(e) {
    if (!this.aimActive) return;
    if (e.target.classList.contains("aim-target")) return;

    this.aimClicks++;
    this.aimScore = Math.max(0, this.aimScore - 25);
    this.aimScoreEl.textContent = this.aimScore;
    sound.playMiss();
    const acc = Math.round((this.aimHits / this.aimClicks) * 100);
    this.aimAccuracyEl.textContent = `${acc}%`;
  }

  spawnHitBurst(x, y) {
    const burst = document.createElement("div");
    burst.className = "hit-burst";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    this.aimField.appendChild(burst);
    setTimeout(() => burst.remove(), 400);
  }

  clearAimTargets() {
    clearTimeout(this.aimTargetTimeout);
    this.aimField.querySelectorAll(".aim-target, .hit-burst").forEach(el => el.remove());
  }

  endAimGame() {
    this.aimActive = false;
    clearInterval(this.aimInterval);
    this.clearAimTargets();

    const avgHitSpeed = this.aimHitSpeeds.length > 0 
      ? Math.round(this.aimHitSpeeds.reduce((a, b) => a + b, 0) / this.aimHitSpeeds.length)
      : 0;

    this.aimStatHits.textContent = this.aimHits;
    this.aimStatAvgSpeed.textContent = avgHitSpeed > 0 ? `${avgHitSpeed} ms` : "--";

    if (this.aimScore > this.aimBestScore) {
      this.aimBestScore = this.aimScore;
      localStorage.setItem("rf_aim_best", this.aimBestScore);
      this.aimStatBest.textContent = `${this.aimBestScore} pts`;
      this.hudAimPb.textContent = `${this.aimBestScore} pts`;
      sound.playVictory();
    }

    this.aimOverlay.innerHTML = `
      <div class="overlay-modal">
        <span class="overlay-icon">🏆</span>
        <h2>Target Blitz Complete!</h2>
        <p>Score: <strong>${this.aimScore} pts</strong> • Reaction: <strong>${avgHitSpeed} ms</strong></p>
        <button id="aimModalRestartBtn" class="btn btn-primary btn-large">Play Again</button>
      </div>
    `;
    this.aimOverlay.classList.remove("hidden");
    document.getElementById("aimModalRestartBtn").addEventListener("click", () => this.startAimGame());
    this.incrementTotalTests();
  }

  // ==========================================
  // 4. AUDIO REFLEX
  // ==========================================
  handleAudioClick() {
    if (this.audioState === "waiting" || this.audioState === "result" || this.audioState === "early") {
      this.audioState = "armed";
      this.audioTriggerBox.className = "reaction-card state-audio-armed";
      this.audioIcon.textContent = "🤫";
      this.audioTitle.textContent = "Listening...";
      this.audioDesc.textContent = "Focus on the sound tone!";
      this.audioResultBadge.classList.add("hidden");

      const delay = Math.floor(Math.random() * 2500) + 1800;
      this.audioTimer = setTimeout(() => {
        if (this.audioState === "armed") {
          this.audioState = "ready";
          this.audioTriggerBox.className = "reaction-card state-audio-trigger";
          this.audioIcon.textContent = "🔔";
          this.audioTitle.textContent = "CLICK NOW!";
          this.audioDesc.textContent = "Sound frequency detected!";
          this.audioStartTime = performance.now();
          sound.playAudioStimulus();
        }
      }, delay);

    } else if (this.audioState === "armed") {
      clearTimeout(this.audioTimer);
      this.audioState = "early";
      this.audioTriggerBox.className = "reaction-card state-early";
      this.audioIcon.textContent = "⚠️";
      this.audioTitle.textContent = "Too Soon!";
      this.audioDesc.textContent = "No sound played yet! Click to try again.";
      sound.playEarlyPenalty();

    } else if (this.audioState === "ready") {
      const elapsed = Math.round(performance.now() - this.audioStartTime);
      this.audioState = "result";
      this.audioTriggerBox.className = "reaction-card state-result";
      this.audioIcon.textContent = "🎧";
      this.audioTitle.textContent = `${elapsed} ms`;
      this.audioDesc.textContent = "Click to test audio reaction again.";
      
      this.audioResultBadge.textContent = "Auditory Stimulus Captured";
      this.audioResultBadge.classList.remove("hidden");
      sound.playTargetHit(0);

      this.audioLastScore.textContent = `${elapsed} ms`;
      if (!this.audioBest || elapsed < this.audioBest) {
        this.audioBest = elapsed;
        localStorage.setItem("rf_audio_best", this.audioBest);
        this.audioBestScore.textContent = `${this.audioBest} ms`;
      }

      if (this.visualBest > 0) {
        const diff = this.visualBest - elapsed;
        if (diff > 0) {
          this.audioComparison.textContent = `${diff}ms Faster than Vision! ⚡`;
          this.audioComparison.style.color = "#10b981";
        } else {
          this.audioComparison.textContent = `${Math.abs(diff)}ms Slower than Vision`;
          this.audioComparison.style.color = "#f59e0b";
        }
      }
      this.incrementTotalTests();
    }
  }

  // ==========================================
  // 5. TYPING APM RUSH
  // ==========================================
  startTypingGame() {
    sound.ensureContext();
    this.typingActive = true;
    this.typingRemaining = 30;
    this.typingWordsDestroyed = 0;
    this.typingStreak = 0;
    this.typingBestStreak = 0;
    this.fallingWords = [];

    this.fallingWordsField.innerHTML = "";
    this.typingWordsHitEl.textContent = "0";
    this.typingWpmEl.textContent = "0 WPM";
    this.typingStreakEl.textContent = "0x";
    this.typingTimerEl.textContent = `${this.typingRemaining}s`;

    this.typingOverlay.classList.add("hidden");
    this.typingInput.disabled = false;
    this.typingInput.value = "";
    this.typingInput.focus();

    // Spawn words loop
    clearInterval(this.typingInterval);
    clearInterval(this.typingSpawnInterval);

    this.typingSpawnInterval = setInterval(() => {
      if (this.typingActive) this.spawnFallingWord();
    }, 1100);

    this.typingInterval = setInterval(() => {
      this.typingRemaining--;
      this.typingTimerEl.textContent = `${this.typingRemaining}s`;

      const wpm = Math.round((this.typingWordsDestroyed / (30 - this.typingRemaining)) * 60);
      this.typingWpmEl.textContent = `${wpm} WPM`;

      if (this.typingRemaining <= 0) this.endTypingGame();
    }, 1000);

    // Frame animation for falling words
    this.animateFallingWords();
  }

  spawnFallingWord() {
    const wordText = this.wordBank[Math.floor(Math.random() * this.wordBank.length)];
    const el = document.createElement("div");
    el.className = "falling-word";
    el.textContent = wordText;

    const maxWidth = this.fallingWordsField.clientWidth - 110;
    const posX = Math.floor(Math.random() * Math.max(10, maxWidth)) + 15;

    el.style.left = `${posX}px`;
    el.style.top = `-30px`;

    this.fallingWordsField.appendChild(el);
    this.fallingWords.push({
      el,
      text: wordText.toLowerCase(),
      y: -30,
      speed: 1.1 + Math.random() * 0.8
    });
  }

  animateFallingWords() {
    if (!this.typingActive) return;
    const firewallY = this.fallingWordsField.clientHeight - 40;

    for (let i = this.fallingWords.length - 1; i >= 0; i--) {
      const item = this.fallingWords[i];
      item.y += item.speed;
      item.el.style.top = `${item.y}px`;

      // Breached firewall?
      if (item.y >= firewallY) {
        sound.playEarlyPenalty();
        item.el.remove();
        this.fallingWords.splice(i, 1);
        this.typingStreak = 0;
        this.typingStreakEl.textContent = "0x";
      }
    }

    requestAnimationFrame(() => this.animateFallingWords());
  }

  handleTypingAutoBlast() {
    if (!this.typingActive) return;
    const query = this.typingInput.value.trim().toLowerCase();
    if (!query) {
      // Clear target highlights
      this.fallingWords.forEach(w => {
        w.el.classList.remove("targeted");
        w.el.textContent = w.text;
      });
      return;
    }

    // 1. Check for EXACT match -> Instant Auto-Blast (No Enter key required!)
    const exactIndex = this.fallingWords.findIndex(w => w.text === query && !w.isBlasting);
    if (exactIndex !== -1) {
      this.blastWord(this.fallingWords[exactIndex], exactIndex);
      this.typingInput.value = "";
      return;
    }

    // 2. Prefix matching & target lock visual feedback
    let foundTarget = false;
    this.fallingWords.forEach(w => {
      if (w.isBlasting) return;
      if (!foundTarget && w.text.startsWith(query)) {
        foundTarget = true;
        w.el.classList.add("targeted");
        // Highlight matched letters
        const matchedPart = w.text.slice(0, query.length);
        const restPart = w.text.slice(query.length);
        w.el.innerHTML = `<span class="matched-char">${matchedPart}</span>${restPart}`;
      } else {
        w.el.classList.remove("targeted");
        w.el.textContent = w.text;
      }
    });
  }

  handleTypingKeydown(e) {
    if (!this.typingActive) return;
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      const query = this.typingInput.value.trim().toLowerCase();
      if (!query) return;

      const exactIndex = this.fallingWords.findIndex(w => w.text === query && !w.isBlasting);
      if (exactIndex !== -1) {
        this.blastWord(this.fallingWords[exactIndex], exactIndex);
      } else {
        sound.playMiss();
      }
      this.typingInput.value = "";
    }
  }

  blastWord(matchedWord, index) {
    matchedWord.isBlasting = true;

    // Get position of the word for particle explosion
    const wordRect = matchedWord.el.getBoundingClientRect();
    const fieldRect = this.fallingWordsField.getBoundingClientRect();
    const blastX = (wordRect.left - fieldRect.left) + (wordRect.width / 2);
    const blastY = (wordRect.top - fieldRect.top) + (wordRect.height / 2);

    // Apply exploding class
    matchedWord.el.classList.add("exploding");

    // Spawn spectacular multi-particle blast
    this.spawnWordBlastEffect(blastX, blastY);

    // Play dual-layer synthesized blast sound
    sound.playWordBlast(this.typingStreak + 1);

    // Increment stats
    this.typingWordsDestroyed++;
    this.typingStreak++;
    if (this.typingStreak > this.typingBestStreak) {
      this.typingBestStreak = this.typingStreak;
      this.typingBestStreakEl.textContent = `${this.typingBestStreak}x`;
    }

    this.typingWordsHitEl.textContent = this.typingWordsDestroyed;
    this.typingStreakEl.textContent = `${this.typingStreak}x`;

    // Clean up DOM element and remove from list
    setTimeout(() => {
      if (matchedWord.el && matchedWord.el.parentElement) {
        matchedWord.el.remove();
      }
      const currentIndex = this.fallingWords.indexOf(matchedWord);
      if (currentIndex !== -1) {
        this.fallingWords.splice(currentIndex, 1);
      }
    }, 220);
  }

  spawnWordBlastEffect(x, y) {
    // 1. Expanding shockwave ring
    const ring = document.createElement("div");
    ring.className = "word-blast-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    this.fallingWordsField.appendChild(ring);
    setTimeout(() => ring.remove(), 400);

    // 2. 12 Laser shard particles radiating outwards in 360 degrees
    const shardCount = 12;
    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement("div");
      shard.className = "word-blast-shard";
      shard.style.left = `${x}px`;
      shard.style.top = `${y}px`;

      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 35 + Math.random() * 45;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      shard.style.setProperty("--tx", `${tx}px`);
      shard.style.setProperty("--ty", `${ty}px`);

      if (i % 2 === 0) {
        shard.style.background = "var(--accent-gold)";
        shard.style.boxShadow = "0 0 12px var(--accent-gold), 0 0 20px #fff";
      }

      this.fallingWordsField.appendChild(shard);
      setTimeout(() => shard.remove(), 420);
    }
  }

  endTypingGame() {
    this.typingActive = false;
    clearInterval(this.typingInterval);
    clearInterval(this.typingSpawnInterval);
    this.typingInput.disabled = true;

    const wpm = this.typingWordsDestroyed * 2;
    if (wpm > this.typingBestWpm) {
      this.typingBestWpm = wpm;
      localStorage.setItem("rf_typing_best_wpm", this.typingBestWpm);
      this.typingBestWpmEl.textContent = `${this.typingBestWpm} WPM`;
      sound.playVictory();
    }

    this.typingOverlay.innerHTML = `
      <div class="overlay-modal">
        <span class="overlay-icon">⌨️</span>
        <h2>Terminal Run Complete!</h2>
        <p>Destroyed: <strong>${this.typingWordsDestroyed} words</strong> • Speed: <strong>${wpm} WPM</strong></p>
        <button id="typingRestartBtn" class="btn btn-primary btn-large">Deploy Again</button>
      </div>
    `;
    this.typingOverlay.classList.remove("hidden");
    document.getElementById("typingRestartBtn").addEventListener("click", () => this.startTypingGame());
    this.incrementTotalTests();
  }

  // ==========================================
  // 6. STROOP COLOR CLASH
  // ==========================================
  startStroopGame() {
    sound.ensureContext();
    this.stroopActive = true;
    this.stroopRemaining = 30;
    this.stroopScore = 0;
    this.stroopAttempts = 0;
    this.stroopReactionTimes = [];

    this.stroopScoreEl.textContent = "0";
    this.stroopAccuracyEl.textContent = "100%";
    this.stroopTimerEl.textContent = `${this.stroopRemaining}s`;
    this.stroopOverlay.classList.add("hidden");

    this.nextStroopRound();

    clearInterval(this.stroopInterval);
    this.stroopInterval = setInterval(() => {
      this.stroopRemaining--;
      this.stroopTimerEl.textContent = `${this.stroopRemaining}s`;
      if (this.stroopRemaining <= 0) this.endStroopGame();
    }, 1000);
  }

  nextStroopRound() {
    if (!this.stroopActive) return;
    const isMatch = Math.random() < 0.5;
    const wordObj = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];

    let inkObj;
    if (isMatch) {
      inkObj = wordObj;
    } else {
      const others = this.colorPalette.filter(c => c.name !== wordObj.name);
      inkObj = others[Math.floor(Math.random() * others.length)];
    }

    this.currentStroop = { word: wordObj.name, ink: inkObj.hex, isMatch };
    this.stroopWordDisplay.textContent = this.currentStroop.word;
    this.stroopWordDisplay.style.color = this.currentStroop.ink;
    this.stroopStartTime = performance.now();
  }

  handleStroopAnswer(userSaidMatch) {
    if (!this.stroopActive || !this.currentStroop) return;
    const elapsed = Math.round(performance.now() - this.stroopStartTime);
    this.stroopAttempts++;

    if (userSaidMatch === this.currentStroop.isMatch) {
      this.stroopScore += 100;
      this.stroopReactionTimes.push(elapsed);
      sound.playTargetHit(0);
    } else {
      this.stroopScore = Math.max(0, this.stroopScore - 50);
      sound.playEarlyPenalty();
    }

    this.stroopScoreEl.textContent = this.stroopScore;
    const acc = Math.round((this.stroopReactionTimes.length / this.stroopAttempts) * 100);
    this.stroopAccuracyEl.textContent = `${acc}%`;

    this.nextStroopRound();
  }

  endStroopGame() {
    this.stroopActive = false;
    clearInterval(this.stroopInterval);

    const avgSpeed = this.stroopReactionTimes.length > 0 
      ? Math.round(this.stroopReactionTimes.reduce((a, b) => a + b, 0) / this.stroopReactionTimes.length)
      : 0;

    this.stroopCorrectCount.textContent = this.stroopReactionTimes.length;
    this.stroopAvgSpeed.textContent = avgSpeed > 0 ? `${avgSpeed} ms` : "--";

    if (this.stroopScore > this.stroopBestScore) {
      this.stroopBestScore = this.stroopScore;
      localStorage.setItem("rf_stroop_best", this.stroopBestScore);
      this.stroopBestScoreEl.textContent = `${this.stroopBestScore} pts`;
      sound.playVictory();
    }

    this.stroopOverlay.innerHTML = `
      <div class="overlay-modal">
        <span class="overlay-icon">🧠</span>
        <h2>Stroop Evaluation Complete!</h2>
        <p>Score: <strong>${this.stroopScore} pts</strong> • Reaction: <strong>${avgSpeed} ms</strong></p>
        <button id="stroopRestartBtn" class="btn btn-primary btn-large">Test Again</button>
      </div>
    `;
    this.stroopOverlay.classList.remove("hidden");
    document.getElementById("stroopRestartBtn").addEventListener("click", () => this.startStroopGame());
    this.incrementTotalTests();
  }

  // ==========================================
  // 7. TEMPO PRECISION METRONOME
  // ==========================================
  toggleTempoMetronome() {
    sound.ensureContext();
    if (this.tempoActive) {
      this.tempoActive = false;
      clearInterval(this.tempoInterval);
      this.tempoOuterRing.classList.remove("pulse-anim");
      this.tempoActionBtn.textContent = "Start Metronome";
    } else {
      this.tempoActive = true;
      this.tempoOffsets = [];
      this.tempoPerfectCount = 0;
      this.tempoLastBeatTime = performance.now();
      this.tempoOuterRing.classList.add("pulse-anim");
      this.tempoActionBtn.textContent = "Tap on Beat (or Stop)";

      this.tempoInterval = setInterval(() => {
        this.tempoLastBeatTime = performance.now();
        sound.playTempoTick();
      }, this.tempoBeatDuration);
    }
  }

  handleTempoTap() {
    if (!this.tempoActive) return;
    const now = performance.now();
    const elapsedSinceBeat = now - this.tempoLastBeatTime;

    let offset;
    if (elapsedSinceBeat <= this.tempoBeatDuration / 2) {
      offset = Math.round(elapsedSinceBeat); // Late
    } else {
      offset = Math.round(elapsedSinceBeat - this.tempoBeatDuration); // Early
    }

    this.tempoOffsets.push(Math.abs(offset));
    this.tempoLastOffset.textContent = `${offset > 0 ? "+" : ""}${offset} ms`;

    if (Math.abs(offset) < 20) {
      this.tempoPerfectCount++;
      sound.playTargetHit(0);
      this.tempoOffsetBadge.textContent = "🎯 PERFECT (<20ms)";
      this.tempoOffsetBadge.style.color = "#10b981";
    } else {
      this.tempoOffsetBadge.textContent = `${offset > 0 ? "+" : ""}${offset} ms`;
      this.tempoOffsetBadge.style.color = Math.abs(offset) < 50 ? "#00f2fe" : "#f59e0b";
    }
    this.tempoOffsetBadge.classList.remove("hidden");

    this.tempoPerfectHits.textContent = this.tempoPerfectCount;
    const avgErr = Math.round(this.tempoOffsets.reduce((a, b) => a + b, 0) / this.tempoOffsets.length);
    this.tempoAvgError.textContent = `${avgErr} ms`;
  }

  // ==========================================
  // 8. CHIMP MEMORY SEQUENCE
  // ==========================================
  initMemoryGrid() {
    this.memoryGrid.innerHTML = "";
    for (let i = 0; i < this.memoryTotalGridCells; i++) {
      const tile = document.createElement("div");
      tile.className = "memory-tile";
      this.memoryGrid.appendChild(tile);
    }
  }

  startMemoryRound() {
    sound.ensureContext();
    this.memoryActive = true;
    this.memoryNextStep = 1;
    this.memoryLevelEl.textContent = this.memoryLevel;
    this.memoryInstruction.textContent = "Memorize positions, then click in order: 1, 2, 3...";
    this.memoryStartBtn.disabled = true;

    this.memoryTilesCount = Math.min(14, 3 + this.memoryLevel);
    this.memoryTilesCountEl.textContent = this.memoryTilesCount;

    this.initMemoryGrid();
    const allTiles = Array.from(this.memoryGrid.children);
    const shuffled = [...Array(this.memoryTotalGridCells).keys()].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, this.memoryTilesCount);

    selected.forEach((tileIdx, numIdx) => {
      const num = numIdx + 1;
      const tile = allTiles[tileIdx];
      tile.textContent = num;
      tile.classList.add("active-number");
      tile.addEventListener("click", () => this.handleMemoryTileClick(tile, num));
    });
  }

  handleMemoryTileClick(tile, number) {
    if (!this.memoryActive) return;

    if (number === this.memoryNextStep) {
      sound.playTileStep(this.memoryNextStep);
      tile.classList.remove("active-number", "hidden-number");
      tile.classList.add("cleared");

      if (this.memoryNextStep === 1) {
        this.memoryGrid.querySelectorAll(".active-number").forEach(t => t.classList.add("hidden-number"));
        this.memoryInstruction.textContent = "Recall sequence from memory!";
      }

      this.memoryNextStep++;

      if (this.memoryNextStep > this.memoryTilesCount) {
        sound.playVictory();
        this.memoryInstruction.textContent = `🎉 Level ${this.memoryLevel} Cleared!`;
        this.memoryLevel++;
        if (this.memoryLevel > this.memoryBestLevel) {
          this.memoryBestLevel = this.memoryLevel;
          localStorage.setItem("rf_memory_best", this.memoryBestLevel);
          this.memoryBestLevelEl.textContent = this.memoryBestLevel;
        }
        this.memoryStartBtn.disabled = false;
        this.memoryStartBtn.textContent = `Start Level ${this.memoryLevel}`;
        this.incrementTotalTests();
      }
    } else {
      sound.playEarlyPenalty();
      tile.classList.add("wrong");
      this.memoryInstruction.textContent = `❌ Game Over! Clicked ${number} instead of ${this.memoryNextStep}.`;
      this.memoryActive = false;
      this.memoryLevel = 1;
      this.memoryStartBtn.disabled = false;
      this.memoryStartBtn.textContent = "Retry Level 1";
      this.memoryGrid.querySelectorAll(".hidden-number").forEach(t => t.classList.remove("hidden-number"));
      this.incrementTotalTests();
    }
  }

  // ==========================================
  // PERFORMANCE GRAPH (Canvas Line Chart)
  // ==========================================
  drawPerformanceGraph() {
    if (!this.perfCanvas) return;
    const ctx = this.perfCanvas.getContext("2d");
    const rect = this.perfCanvas.getBoundingClientRect();
    this.perfCanvas.width = rect.width;
    this.perfCanvas.height = 180;

    const w = this.perfCanvas.width;
    const h = this.perfCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const history = this.reactionHistory;
    if (history.length < 2) {
      ctx.fillStyle = this.isDark ? "#64748b" : "#94a3b8";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Complete at least 2 Visual Reflex tests to plot performance curve.", w / 2, h / 2);
      return;
    }

    const scores = history.map(d => d.score);
    const minVal = Math.max(100, Math.min(...scores) - 20);
    const maxVal = Math.max(...scores) + 30;

    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const getX = (idx) => padLeft + (idx / (scores.length - 1)) * (w - padLeft - padRight);
    const getY = (val) => padBottom + (1 - (val - minVal) / (maxVal - minVal)) * (h - padTop - padBottom);

    // Grid lines
    ctx.strokeStyle = this.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const yVal = minVal + (i / 3) * (maxVal - minVal);
      const y = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.fillStyle = this.isDark ? "#64748b" : "#94a3b8";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(yVal)}ms`, padLeft - 8, y + 3);
    }

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    grad.addColorStop(0, "rgba(0, 242, 254, 0.35)");
    grad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(scores[0]));
    for (let i = 1; i < scores.length; i++) {
      ctx.lineTo(getX(i), getY(scores[i]));
    }
    ctx.lineTo(getX(scores.length - 1), h - padBottom);
    ctx.lineTo(getX(0), h - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(scores[0]));
    for (let i = 1; i < scores.length; i++) {
      ctx.lineTo(getX(i), getY(scores[i]));
    }
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data dots
    scores.forEach((val, i) => {
      const x = getX(i);
      const y = getY(val);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  clearHistory() {
    this.reactionHistory = [];
    localStorage.removeItem("rf_reaction_history");
    this.drawPerformanceGraph();
    this.updateVisualAverage();
  }

  // ==========================================
  // GAMER CARD MODAL
  // ==========================================
  openGamerCard() {
    document.getElementById("gcDate").textContent = new Date().toISOString().split("T")[0].replace(/-/g, ".");
    document.getElementById("gcVisualPb").textContent = this.visualBest > 0 ? `${this.visualBest} ms` : "-- ms";
    document.getElementById("gcAimPb").textContent = this.aimBestScore > 0 ? `${this.aimBestScore} pts` : "-- pts";
    document.getElementById("gcGridPb").textContent = this.gridBestPace > 0 ? `${this.gridBestPace.toFixed(2)} /s` : "-- /s";
    document.getElementById("gcAudioPb").textContent = this.audioBest > 0 ? `${this.audioBest} ms` : "-- ms";
    document.getElementById("gcRankTag").textContent = `${this.hudGlobalRank.textContent} TIER`;
    this.gamerCardModal.classList.remove("hidden");
  }

  copyGamerCardScore() {
    const text = `⚡ ReflexForge Ultra Benchmark Card ⚡\nRank: ${this.hudGlobalRank.textContent}\n• Visual Reaction: ${this.visualBest || '--'} ms\n• Target Blitz: ${this.aimBestScore || '--'} pts\n• Grid Shot Pace: ${this.gridBestPace ? this.gridBestPace.toFixed(2) : '--'} hits/s\n• Audio Reflex: ${this.audioBest || '--'} ms\nCan you beat my reaction time? 🚀`;
    navigator.clipboard.writeText(text).then(() => {
      this.copyStatsBtn.textContent = "✅ Copied Scorecard to Clipboard!";
      setTimeout(() => {
        this.copyStatsBtn.textContent = "📋 Copy Shareable Scorecard";
      }, 2500);
    });
  }
}
