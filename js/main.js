/**
 * COLOR UP SCHOOL - Master Game Controller & Core Loop
 * Manages canvas rendering, touch & keyboard input, dialogue typewriter, and UI interactions.
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.camera = { x: 0, y: 0 };
    this.lastTime = 0;
    this.isDialogueActive = false;
    this.isTyping = false;
    this.currentDialogueData = null;
    this.typewriterTimer = null;
    this.currentNPC = null;
    this.activeModal = null;
    this.keys = {};
    this.isJoystickActive = false;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindTitleControls();
    this.bindKeyboardControls();
    this.bindTouchJoystick();
    this.bindCanvasTouchMovement();
    this.bindHUDButtons();
    this.bindModals();
    this.enhanceUI();
    this.placeNPCs();
    this.setupDialogueSafety();

    // Start Master RAF Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // 화면 크기에 맞춰 캔버스를 꽉 채우고, 고해상도(레티나) 화면에서도 선명하게
  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    const w = (wrapper && wrapper.clientWidth) ? wrapper.clientWidth : window.innerWidth;
    const h = (wrapper && wrapper.clientHeight) ? wrapper.clientHeight : window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = Math.max(w, 320);
    this.viewH = Math.max(h, 240);
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.computeZoom();
  }

  // 방이 화면을 빈틈없이 덮도록 확대 배율 계산
  computeZoom() {
    if (!window.mapEngine) { this.zoom = 1; return; }
    const room = window.mapEngine.getCurrentRoom();
    const rw = room.width * 32, rh = room.height * 32;
    const cover = Math.max(this.viewW / rw, this.viewH / rh);
    this.zoom = Math.min(Math.max(cover, 1), 2.8);
    this.snapCamera = true;
  }

  getView() {
    return { w: this.viewW / this.zoom, h: this.viewH / this.zoom };
  }

  // --------------------------------------------------------------------------
  // Title & Avatar Selection
  // --------------------------------------------------------------------------
  bindTitleControls() {
    let selectedAvatar = '1';

    document.querySelectorAll('.avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAvatar = btn.getAttribute('data-avatar');
        if (window.soundEngine) window.soundEngine.playClick();
      });
    });

    const startBtn = document.getElementById('btn-start-game');
    startBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('player-name-input').value.trim();
      const playerName = nameInput || '루다';

      window.entityManager.player.name = playerName;
      window.entityManager.player.setAvatarStyle(selectedAvatar);

      // Start Audio & Transition
      if (window.soundEngine) {
        window.soundEngine.init();
        window.soundEngine.playBGM('monochrome'); // Starts with grayscale music
      }

      document.getElementById('title-screen').classList.remove('active');
      document.getElementById('game-view').classList.add('active');

      this.resizeCanvas();
      window.scenarioManager.updateColorProgress();
      window.scenarioManager.checkActProgression();

      this.showToast(`✨ ${playerName}님, COLOR UP SCHOOL에 오신 것을 환영합니다!`, '#70a1ff');
      if (!window.scenarioManager.mindPre) setTimeout(() => this.showMindCheck('pre'), 400);
    });

    // How to Play Modal
    const howBtn = document.getElementById('btn-how-to-play');
    const howModal = document.getElementById('how-to-modal');
    const closeHow = document.getElementById('btn-close-how');
    const confirmHow = document.getElementById('btn-confirm-how');

    howBtn.onclick = () => { howModal.classList.remove('hidden'); if (window.soundEngine) window.soundEngine.playClick(); };
    closeHow.onclick = () => howModal.classList.add('hidden');
    confirmHow.onclick = () => howModal.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // Keyboard Controls (Precise Movement - Stops on Release!)
  // --------------------------------------------------------------------------
  bindKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (!this.isDialogueActive) {
          this.tryInteract();
        } else if (this.isTyping) {
          this.finishTyping();
        } else if (!this.isTyping && this.currentDialogueData && (!this.currentDialogueData.choices || this.currentDialogueData.choices.length === 0)) {
          this.closeDialogue();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // If window loses focus, release all keys
    window.addEventListener('blur', () => {
      this.keys = {};
      if (window.entityManager && window.entityManager.player) {
        window.entityManager.player.inputVector = { x: 0, y: 0 };
      }
    });
  }

  // --------------------------------------------------------------------------
  // Touch Virtual Joystick Controls (Bottom-Right)
  // --------------------------------------------------------------------------
  bindTouchJoystick() {
    const container = document.getElementById('virtual-joystick-container');
    const stick = document.getElementById('joystick-stick');
    if (!container || !stick) return;

    let activeTouchId = null;
    let baseCenterX = 0;
    let baseCenterY = 0;
    const maxRadius = 38;

    const handleStart = (e) => {
      const touch = e.changedTouches[0];
      activeTouchId = touch.identifier;
      this.isJoystickActive = true;
      const rect = container.getBoundingClientRect();
      baseCenterX = rect.left + rect.width / 2;
      baseCenterY = rect.top + rect.height / 2;
      handleMove(e);
    };

    const handleMove = (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          const dx = touch.clientX - baseCenterX;
          const dy = touch.clientY - baseCenterY;
          const dist = Math.hypot(dx, dy);

          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);
          const stickX = Math.cos(angle) * clampedDist;
          const stickY = Math.sin(angle) * clampedDist;

          stick.style.transform = `translate(${stickX}px, ${stickY}px)`;

          // Normalize vector
          window.entityManager.player.inputVector = {
            x: stickX / maxRadius,
            y: stickY / maxRadius
          };
          break;
        }
      }
    };

    const handleEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          this.isJoystickActive = false;
          stick.style.transform = `translate(0px, 0px)`;
          window.entityManager.player.inputVector = { x: 0, y: 0 };
          break;
        }
      }
    };

    container.addEventListener('touchstart', handleStart, { passive: false });
    container.addEventListener('touchmove', handleMove, { passive: false });
    container.addEventListener('touchend', handleEnd, { passive: false });
    container.addEventListener('touchcancel', handleEnd, { passive: false });

    // Floating Touch Action Button
    const actionBtn = document.getElementById('touch-action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        this.tryInteract();
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }
  }

  // --------------------------------------------------------------------------
  // Canvas Touch/Click-to-Move
  // --------------------------------------------------------------------------
  bindCanvasTouchMovement() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isDialogueActive) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / this.zoom + this.camera.x;
      const clickY = (e.clientY - rect.top) / this.zoom + this.camera.y;

      window.entityManager.player.targetPos = { x: clickX, y: clickY };
    });
  }

  // --------------------------------------------------------------------------
  // HUD Buttons & Modals
  // --------------------------------------------------------------------------
  bindHUDButtons() {
    // 1. SNS Button
    const snsBtn = document.getElementById('btn-open-sns');
    const snsModal = document.getElementById('sns-modal');
    const closeSns = document.getElementById('btn-close-sns');

    if (snsBtn) {
      snsBtn.onclick = () => {
        if (snsModal) {
          snsModal.classList.remove('hidden');
          if (window.snsEngine) window.snsEngine.renderFeed('sns-feed-list');
        }
        if (window.soundEngine) window.soundEngine.playClick();
      };
    }
    if (closeSns && snsModal) closeSns.onclick = () => snsModal.classList.add('hidden');

    // 2. Status / Stats Button
    const statusBtn = document.getElementById('btn-open-status');
    const statusModal = document.getElementById('status-modal');
    const closeStatus = document.getElementById('btn-close-status');

    if (statusBtn) {
      statusBtn.onclick = () => {
        if (statusModal) {
          statusModal.classList.remove('hidden');
          this.updateStatusModal();
        }
        if (window.soundEngine) window.soundEngine.playClick();
      };
    }
    if (closeStatus && statusModal) closeStatus.onclick = () => statusModal.classList.add('hidden');

    // 3. Map Button
    const mapBtn = document.getElementById('btn-open-map');
    const mapModal = document.getElementById('map-modal');
    const closeMap = document.getElementById('btn-close-map');

    if (mapBtn) {
      mapBtn.onclick = () => {
        if (mapModal) {
          mapModal.classList.remove('hidden');
          this.renderRoomGrid();
        }
        if (window.soundEngine) window.soundEngine.playClick();
      };
    }
    if (closeMap && mapModal) closeMap.onclick = () => mapModal.classList.add('hidden');

    // 4. Audio Toggle Button
    const audioBtn = document.getElementById('btn-toggle-audio');
    const audioIcon = document.getElementById('audio-icon');

    if (audioBtn) {
      audioBtn.onclick = () => {
        if (!window.soundEngine) return;
        const isMuted = window.soundEngine.toggleMute();
        if (audioIcon) audioIcon.textContent = isMuted ? '🔇' : '🔊';
      };
    }
  }

  // 지도 그림 속 친구 위치로 NPC 배치
  placeNPCs() {
    const rooms = window.mapEngine.rooms;
    window.entityManager.npcs.forEach(n => {
      const r = rooms[n.roomKey];
      const spot = r && r.npcSpots && r.npcSpots[n.key];
      if (spot) { n.x = spot.x * 32; n.y = spot.y * 32; }
    });
    const sp = rooms.hallway.spawn;
    window.entityManager.player.x = sp.x * 32; window.entityManager.player.y = sp.y * 32;
  }

  // 화면 꾸밈 요소 추가 (타이틀 캐릭터 라인업, 모바일 퀘스트 접기)
  enhanceUI() {
    const title = document.getElementById('title-screen');
    if (title && !document.querySelector('.title-cast')) {
      const cast = document.createElement('div');
      cast.className = 'title-cast';
      ['sua', 'haeun', 'taeo', 'player', 'yuna', 'jinhyeuk', 'hyunseo'].forEach((k, i) => {
        const img = document.createElement('img');
        img.src = `assets/images/${k}_standing.png`;
        img.alt = '';
        img.style.setProperty('--i', i);
        if (k === 'player') img.classList.add('is-player');
        cast.appendChild(img);
      });
      title.insertBefore(cast, title.firstChild);
    }

    const quest = document.getElementById('quest-tracker-box');
    if (quest) {
      quest.addEventListener('click', () => quest.classList.toggle('expanded'));
    }

    this.buildTitleScreen();
    this.swapStatIcons();

    // 말랑한 웹툰 로고
    const logo = document.querySelector('.title-logo');
    if (logo) logo.innerHTML = '<span class="wt-logo"><span class="l1">COLOR UP</span><span class="l2">SCHOOL</span></span>';
    const hudLeft = document.querySelector('.hud-left');
    if (hudLeft && !hudLeft.querySelector('.hud-logo')) {
      const hl = document.createElement('div');
      hl.className = 'hud-logo wt-logo';
      hl.innerHTML = '<span class="l1">COLOR UP</span><span class="l2">SCHOOL</span>';
      hudLeft.insertBefore(hl, hudLeft.firstChild);
    }

    // 대화 장면: 장소 배경 + 집중선 + 반짝이, 선택지는 말풍선 밖(오른쪽)으로
    const box = document.getElementById('dialogue-box');
    if (box && !box.querySelector('.dlg-bg')) {
      const bg = document.createElement('div'); bg.className = 'dlg-bg'; bg.id = 'dlg-bg';
      const fx = document.createElement('div'); fx.className = 'dlg-fx';
      box.insertBefore(fx, box.firstChild);
      box.insertBefore(bg, box.firstChild);
      ['s1', 's2', 's3', 's4'].forEach(c => {
        const sp = document.createElement('div'); sp.className = 'dlg-spark ' + c; sp.textContent = '✦';
        box.appendChild(sp);
      });
      const choices = document.getElementById('dialogue-choices');
      if (choices) box.appendChild(choices);
    }
  }

  // --------------------------------------------------------------------------
  // 시작 화면: 그림(title_screen.jpg) 속 버튼을 실제로 누를 수 있게 만듦
  // --------------------------------------------------------------------------
  buildTitleScreen() {
    const screen = document.getElementById('title-screen');
    if (!screen || screen.querySelector('.title-stage')) return;
    screen.classList.add('art-title');

    const blur = document.createElement('div');
    blur.className = 'title-art-blur';
    const stage = document.createElement('div');
    stage.className = 'title-stage';
    stage.innerHTML = `<img src="assets/images/title_screen.jpg" alt="COLOR UP SCHOOL 학교를 바꾸는 선택" draggable="false">`;

    // 그림 속 버튼 위치 (원본 그림 1672×941 기준 픽셀)
    const IW = 1672, IH = 941;
    const spots = [
      { id: 'hs-start', label: '게임 시작하기', box: [645, 528, 1085, 622], cls: 'hs-start' },
      { id: 'hs-story', label: '이야기', box: [655, 652, 780, 762] },
      { id: 'hs-howto', label: '게임 방법', box: [802, 652, 928, 762] },
      { id: 'hs-setting', label: '설정', box: [950, 652, 1076, 762] }
    ];
    spots.forEach(sp => {
      const b = document.createElement('button');
      b.className = 'title-hotspot ' + (sp.cls || '');
      b.id = sp.id;
      b.setAttribute('aria-label', sp.label);
      const [x0, y0, x1, y1] = sp.box;
      Object.assign(b.style, { left: (x0 / IW * 100) + '%', top: (y0 / IH * 100) + '%', width: ((x1 - x0) / IW * 100) + '%', height: ((y1 - y0) / IH * 100) + '%' });
      stage.appendChild(b);
    });
    screen.appendChild(blur);
    screen.appendChild(stage);

    // 그림 크기 맞추기: 넓은 화면은 꽉 채우고, 세로 휴대폰은 가운데(로고+버튼)가 잘리지 않게
    const layout = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const cover = Math.max(W / IW, H / IH);
      const fitCenter = (W * 0.96) / 480;      // 가운데 버튼 영역(약 480px 폭)이 화면에 들어오는 배율
      const scale = Math.min(cover, Math.max(fitCenter, Math.min(W / IW, H / IH)));
      const w = IW * scale, h = IH * scale;
      const focusX = 864 * scale;              // 로고·버튼의 가운데
      let left = W / 2 - focusX;
      left = Math.min(0, Math.max(W - w, left));
      if (w < W) left = (W - w) / 2;
      const top = h < H ? (H - h) / 2 : (H - h) / 2;
      Object.assign(stage.style, { width: w + 'px', height: h + 'px', left: left + 'px', top: top + 'px' });
    };
    layout();
    window.addEventListener('resize', layout);

    // 이름 입력 창 (기존 이름/캐릭터 선택과 시작 버튼을 옮겨옴)
    const nameModal = document.createElement('div');
    nameModal.id = 'name-modal';
    nameModal.className = 'modal-backdrop hidden';
    nameModal.innerHTML = `<div class="rpg-modal name-modal">
        <div class="modal-header"><h2>🌸 이름을 알려줘!</h2><button class="btn-close-modal" id="btn-close-name">✕</button></div>
        <div class="modal-body" id="name-modal-body"></div>
      </div>`;
    screen.appendChild(nameModal);
    const body = nameModal.querySelector('#name-modal-body');
    const selectBox = document.querySelector('.character-select-box');
    const startBtn = document.getElementById('btn-start-game');
    if (selectBox) {
      body.appendChild(selectBox);
      const lab = selectBox.querySelector('label[for="player-name-input"]');
      if (lab) lab.textContent = '선생님이 출석부에 적을 수 있게 이름을 알려줘!';
      const hint = document.createElement('div');
      hint.className = 'name-hint';
      hint.textContent = '최대 6글자까지 쓸 수 있어요';
      const row = selectBox.querySelector('.input-row');
      if (row) row.after(hint);
      const input = document.getElementById('player-name-input');
      if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const b = document.getElementById('btn-start-game'); if (b) b.click(); } });
    }
    if (startBtn) { startBtn.classList.add('name-start-btn'); startBtn.innerHTML = '🏫 등교하기!'; body.appendChild(startBtn); }
    nameModal.querySelector('#btn-close-name').onclick = () => nameModal.classList.add('hidden');
    nameModal.addEventListener('click', e => { if (e.target === nameModal) nameModal.classList.add('hidden'); });

    // 설정 창
    const setModal = document.createElement('div');
    setModal.id = 'setting-modal';
    setModal.className = 'modal-backdrop hidden';
    setModal.innerHTML = `<div class="rpg-modal setting-modal">
        <div class="modal-header"><h2>⚙️ 설정</h2><button class="btn-close-modal" id="btn-close-setting">✕</button></div>
        <div class="modal-body">
          <button class="setting-row" id="set-bgm"><span>🔊 배경음악·효과음</span><b id="set-bgm-state">켜짐</b></button>
          <button class="setting-row" id="set-full"><span>⛶ 전체 화면</span><b>전환</b></button>
        </div>
      </div>`;
    screen.appendChild(setModal);
    setModal.querySelector('#btn-close-setting').onclick = () => setModal.classList.add('hidden');
    setModal.addEventListener('click', e => { if (e.target === setModal) setModal.classList.add('hidden'); });
    setModal.querySelector('#set-bgm').onclick = () => {
      if (!window.soundEngine) return;
      const muted = window.soundEngine.toggleMute();
      setModal.querySelector('#set-bgm-state').textContent = muted ? '꺼짐' : '켜짐';
      const icon = document.getElementById('audio-icon');
      if (icon) icon.textContent = muted ? '🔇' : '🔊';
    };
    setModal.querySelector('#set-full').onclick = () => {
      const el = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };

    const howModal = document.getElementById('how-to-modal');
    const openHow = (sectionIndex) => {
      if (!howModal) return;
      howModal.classList.remove('hidden');
      const sections = howModal.querySelectorAll('.guide-section');
      const target = sections[sectionIndex];
      const body2 = howModal.querySelector('.modal-body');
      if (body2) body2.scrollTop = target ? target.offsetTop - body2.offsetTop - 8 : 0;
    };
    const click = () => { if (window.soundEngine) window.soundEngine.playClick(); };
    stage.querySelector('#hs-start').onclick = () => { click(); nameModal.classList.remove('hidden'); setTimeout(() => { const i = document.getElementById('player-name-input'); if (i && window.matchMedia('(pointer: fine)').matches) i.focus(); }, 300); };
    stage.querySelector('#hs-story').onclick = () => { click(); openHow(0); };
    stage.querySelector('#hs-howto').onclick = () => { click(); openHow(2); };
    stage.querySelector('#hs-setting').onclick = () => { click(); setModal.classList.remove('hidden'); };

    // 시작 화면 음악: 브라우저 규칙상 첫 터치/클릭 때 재생
    const startTitleMusic = () => {
      if (!screen.classList.contains('active') || !window.soundEngine) return;
      if (window.soundEngine.currentFile !== 'title') window.soundEngine.playBGM('title');
    };
    screen.addEventListener('pointerdown', startTitleMusic);

    // 시작하면 열려 있던 창 닫기
    if (startBtn) startBtn.addEventListener('click', () => { nameModal.classList.add('hidden'); setModal.classList.add('hidden'); });
  }

  // 기기마다 모양이 다른 능력치 이모지를 그림 아이콘으로 교체
  swapStatIcons(root = document) {
    const map = { '🦁': 'courage', '💖': 'empathy', '🤝': 'respect', '🌟': 'opportunity', '🕊️': 'freedom' };
    root.querySelectorAll('.chip-icon, .stat-icon, .stat-big-icon, .stat-result-box .icon, .boss-skill-btn .skill-icon').forEach(el => {
      const k = map[el.textContent.trim()];
      if (k) el.innerHTML = `<img class="ico-img" src="assets/images/ico_${k}.png" alt="">`;
    });
  }

  // 방마다 대화 배경 그림 (assets/images/dlg_*.jpg)
  getDialogueBg(roomKey) {
    const map = { hallway: 'dlg_hallway', classroom: 'dlg_classroom', playground: 'dlg_playground', counseling: 'dlg_counseling',
      gym: 'dlg_gym', cafeteria: 'dlg_cafeteria', nurse: 'dlg_nurse', broadcast: 'dlg_broadcast', club: 'dlg_club',
      student_council: 'dlg_council', core_chamber: 'dlg_hallway' };
    return `assets/images/${map[roomKey] || 'dlg_hallway'}.jpg`;
  }

  // 표정 그림이 있으면 사용 (이름_sad.png / 이름_happy.png), 없으면 기본 그림
  setNpcFace(key, mood) {
    const img = document.getElementById('standing-npc-img');
    if (!img) return;
    const base = `assets/images/${key}_standing.png`;
    const want = mood ? `assets/images/${key}_${mood}.png` : base;
    img.style.visibility = 'visible';
    img.onerror = () => {
      if (img.src.indexOf('_standing.png') === -1) img.src = base;
      else img.style.visibility = 'hidden';   // 그림이 아직 없는 친구
    };
    img.src = want;
    img.classList.remove('pop'); void img.offsetWidth;
    if (mood === 'happy') img.classList.add('pop');
  }

  bindModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  updateStatusModal() {
    const stats = window.scenarioManager.playerStats;
    for (const [s, v] of Object.entries(stats)) {
      const valEl = document.getElementById(`modal-val-${s}`);
      const barEl = document.getElementById(`modal-bar-${s}`);
      if (valEl) valEl.textContent = `${v} P`;
      if (barEl) barEl.style.width = `${v}%`;
    }

    const badgeContainer = document.getElementById('badge-collection-grid');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = '';

    const badgeDefs = [
      { id: 'badge_emotion', name: '감정 표현의 자유', icon: '💖', desc: '감정 억압 편견 타파' },
      { id: 'badge_potential', name: '무한한 잠재력', icon: '🌟', desc: '학습 성별 편견 타파' },
      { id: 'badge_sports', name: '공정한 스포츠', icon: '⚽', desc: '체육 활동 평등' },
      { id: 'badge_career', name: '꿈꾸는 개척자', icon: '🕊️', desc: '직업 성별 분업 타파' },
      { id: 'badge_dignity', name: '인간 존엄성', icon: '🤝', desc: '외모 지상주의 탈피' }
    ];

    badgeDefs.forEach(b => {
      const isUnlocked = window.scenarioManager.badges.includes(b.id);
      const bEl = document.createElement('div');
      bEl.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
      bEl.innerHTML = `
        <img class="badge-img" src="assets/images/${b.id}.png" alt="">
        <span class="badge-name">${b.name}</span>
      `;
      badgeContainer.appendChild(bEl);
    });
  }

  // --------------------------------------------------------------------------
  // 🗺️ 학교 전체 지도 (campus_map.jpg 위에 방 이름·상태·현재 위치 표시)
  // --------------------------------------------------------------------------
  renderRoomGrid() {
    const grid = document.getElementById('room-selection-grid');
    if (!grid) return;
    const sm = window.scenarioManager;
    const currentKey = window.mapEngine.currentRoomKey;
    // 그림 속 각 방의 위치 (%), 친구, 짧은 설명
    const spots = [
      { key: 'classroom', x: 21, y: 19, friend: 'jimin', topic: '반장 선거' },
      { key: 'student_council', x: 43, y: 19, friend: 'taeo', topic: '축제 역할 나누기' },
      { key: 'playground', x: 75, y: 6, friend: 'sua', topic: '여자 축구부' },
      { key: 'broadcast', x: 84, y: 19, friend: 'yuna', topic: '단톡방 성희롱 밈' },
      { key: 'gym', x: 20, y: 44, friend: 'doyun', topic: '남자 댄스부' },
      { key: 'hallway', x: 57, y: 41, friend: 'seoyeon', topic: '집안일 분담' },
      { key: 'cafeteria', x: 85, y: 46, friend: 'haeun', topic: '외모 압박' },
      { key: 'counseling', x: 30, y: 72, friend: 'minwoo', topic: '유치원 교사의 꿈' },
      { key: 'nurse', x: 56, y: 72, friend: 'jinhyeuk', topic: '아파도 참기' },
      { key: 'club', x: 81, y: 72, friend: 'hyunseo', topic: '여자 공학자' },
      { key: 'core_chamber', x: 8, y: 72, friend: null, topic: '편견의 코어 (마지막 보스)' }
    ];
    const statusOf = (sp) => {
      if (sp.key === 'core_chamber') return sm.currentAct >= 6 ? { cls: 'open', ico: '⚡', txt: '열림' } : { cls: 'lock', ico: '🔒', txt: '잠김' };
      if (sm.resolvedScenarios.includes(sp.friend)) return { cls: 'done', ico: '✔', txt: '해결' };
      if ((sm.hurtBy || {})[sp.friend]) return { cls: 'hurt', ico: '💧', txt: '다시 대화' };
      return { cls: 'quest', ico: '❓', txt: '고민 중' };
    };

    grid.className = 'campus-map-wrap';
    grid.innerHTML = `<div class="campus-map"><img src="assets/images/campus_map.jpg" alt="학교 전체 지도" draggable="false"></div>
      <div class="campus-info" id="campus-info">방을 누르면 그 방 친구와 고민을 볼 수 있어요.</div>`;
    const mapEl = grid.querySelector('.campus-map');
    spots.forEach(sp => {
      const room = window.mapEngine.rooms[sp.key];
      const st = statusOf(sp);
      const here = sp.key === currentKey;
      const pin = document.createElement('button');
      pin.className = `campus-pin ${st.cls}${here ? ' here' : ''}`;
      pin.style.left = sp.x + '%'; pin.style.top = sp.y + '%';
      pin.innerHTML = `${here ? '<img class="pin-me" src="assets/images/chibi_player.png" alt="">' : ''}
        <span class="pin-label"><i>${st.ico}</i>${room ? room.name.replace(/\s*\(.*\)/, '') : sp.key}</span>`;
      pin.onclick = () => {
        mapEl.querySelectorAll('.campus-pin').forEach(p => p.classList.remove('sel'));
        pin.classList.add('sel');
        const sc = sp.friend && sm.scenarios[sp.friend];
        const info = document.getElementById('campus-info');
        info.innerHTML = `${sp.friend ? `<img class="ci-face" src="assets/images/chibi_${sp.friend}.png" onerror="this.style.display='none'">` : ''}
          <div><b>${room ? room.name : ''}</b> ${here ? '<span class="ci-here">📍 지금 여기</span>' : ''}<br>
          ${sc ? `${sc.name} · ${sp.topic} — <span class="ci-st ${st.cls}">${st.ico} ${st.txt}</span>` : sp.topic + ` — <span class="ci-st ${st.cls}">${st.ico} ${st.txt}</span>`}<br>
          <small>${sp.key === 'hallway' ? '모든 방으로 가는 중앙 로비예요.' : '로비에서 이 방 문 앞으로 걸어가 [들어가기]를 누르세요.'}</small></div>`;
        if (window.soundEngine) window.soundEngine.playClick();
      };
      mapEl.appendChild(pin);
    });
    const done = spots.filter(sp => sp.friend && sm.resolvedScenarios.includes(sp.friend)).length;
    const head = document.querySelector('.map-guide-badge');
    if (head) head.textContent = `🌈 도운 친구 ${done} / 10 · 📱 댓글 미션 ${sm.snsMissionDone ? '완료' : '미완료'}`;
    const foot = document.querySelector('.map-footer-guide');
    if (foot) foot.style.display = 'none';
  }

  warpToRoom(roomKey) {
    // 로비로 돌아올 때는 방금 나온 방의 문 앞에 서도록
    const fromKey = window.mapEngine.currentRoomKey;
    let backSpot = null;
    const target = window.mapEngine.rooms[roomKey];
    if (target && target.doors) {
      const d = target.doors.find(dd => dd.to === fromKey);
      if (d && roomKey === 'hallway') { const L = target.layout; const cy = L ? L.h * 0.5 / L.h * target.height : target.height / 2; backSpot = { x: d.x + (d.x < target.width * 0.2 ? 1 : d.x > target.width * 0.8 ? -1 : 0), y: d.y + (d.y < cy - 2 ? 1 : d.y > cy + 2 ? -1 : 0) }; }
    }
    const spawn = window.mapEngine.switchRoom(roomKey, backSpot);
    if (spawn) {
      window.entityManager.player.x = spawn.x * 32;
      window.entityManager.player.y = spawn.y * 32;
      window.entityManager.player.targetPos = null;
      window.entityManager.player.inputVector = { x: 0, y: 0 };

      // Update Location Display
      const locDisplay = document.getElementById('current-location-display');
      if (locDisplay) {
        locDisplay.innerHTML = `<span class="loc-icon">${window.mapEngine.getCurrentRoom().icon}</span><span class="loc-name">${window.mapEngine.getCurrentRoom().name}</span>`;
      }

      // Check if entered Core Chamber (Act 6 Boss!)
      if (roomKey === 'core_chamber') {
        if (window.bossEngine) window.bossEngine.startBattle();
      }

      this.computeZoom();
      this.showRoomBanner(window.mapEngine.getCurrentRoom());
    }
  }

  // --------------------------------------------------------------------------
  // Interaction & Dialogue System (STRICT 1-TIME ONLY!)
  // --------------------------------------------------------------------------
  tryInteract() {
    const player = window.entityManager.player;
    if (this.isDialogueActive) return;
    const talker = this.nearSideTalker && this.nearSideTalker();
    if (talker) { this.startSideTalk(talker); return; }
    const currentRoom = window.mapEngine.currentRoomKey;

    // 1. Check Doors
    const door = window.mapEngine.checkDoor(player.x + 16, player.y + 16);
    if (door) {
      if (door.requiresAct && window.scenarioManager.currentAct < door.requiresAct) {
        this.showToast(`⚠️ 아직 들어갈 수 없습니다! 모든 친구들을 돕고 학교 편견을 완전히 정화하세요!`, '#ff4757');
        return;
      }
      this.warpToRoom(door.to);
      return;
    }

    // 2. Check Bias Posters
    const poster = window.mapEngine.checkBiasPoster(player.x + 16, player.y + 16);
    if (poster && poster.biasId) {
      this.openBiasModal(poster.biasId);
      return;
    }

    // 3. Check NPCs
    const nearNPC = window.entityManager.checkProximity(currentRoom);
    if (nearNPC) {
      this.startDialogue(nearNPC);
    }
  }

  startDialogue(npc) {
    if (this.isDialogueActive) return;
    const scenario = window.scenarioManager.scenarios[npc.scenarioKey];
    if (!scenario) return;
    this.isDialogueActive = true;
    this.currentNPC = npc;

    // Check if this NPC's mission has already been cleared!
    const isAlreadyResolved = window.scenarioManager.resolvedScenarios.includes(npc.scenarioKey);

    let dialogueNode = scenario.dialogues.initial;
    const wasHurt = (window.scenarioManager.hurtBy || {})[npc.scenarioKey];
    if (wasHurt && scenario.dialogues.retry) dialogueNode = scenario.dialogues.retry;
    if (isAlreadyResolved) {
      dialogueNode = scenario.dialogues.revisit_supported || {
        text: '루다야, 네가 건넨 따뜻한 양성평등의 한마디 덕분에 정말 많은 게 변했어! 고마워!',
        choices: []
      };
    }

    this.currentDialogueData = dialogueNode;

    // Set Left Character (Player - Ruda)
    const pImg = document.getElementById('standing-player-img');
    if (pImg) pImg.src = 'assets/images/player_standing.png';
    const pName = document.getElementById('standing-player-name');
    if (pName) pName.textContent = window.entityManager.player.name || '루다';

    // Set Right Character (NPC Standing Illustration)
    const portraitKey = scenario.portrait || npc.scenarioKey;
    this.setNpcFace(portraitKey, isAlreadyResolved ? 'happy' : 'sad');
    const roomKey = window.mapEngine.currentRoomKey;
    const dlgBg = document.getElementById('dlg-bg');
    if (dlgBg) {
      const url = this.getDialogueBg(roomKey);
      const probe = new Image();
      probe.onload = () => { dlgBg.style.backgroundImage = `url('${url}')`; };
      probe.onerror = () => { dlgBg.style.backgroundImage = `url('${this.getDialogueBg('classroom')}')`; };
      probe.src = url;
      dlgBg.classList.toggle('colored', isAlreadyResolved);
    }
    document.getElementById('game-view').classList.add('in-dialogue');
    const nName = document.getElementById('standing-npc-name');
    if (nName) nName.textContent = scenario.name;

    // Set Dialogue Box Speaker & Trust
    const speakerEl = document.getElementById('dialogue-speaker');
    if (speakerEl) speakerEl.textContent = scenario.name;
    const trust = window.scenarioManager.npcTrust[npc.scenarioKey] || (isAlreadyResolved ? 100 : 20);
    const trustValEl = document.getElementById('npc-trust-val');
    if (trustValEl) trustValEl.textContent = isAlreadyResolved ? '신뢰도 100% (완료)' : `신뢰도 ${trust}%`;

    const box = document.getElementById('dialogue-box');
    if (box) box.classList.remove('hidden');

    // Hide Door portal prompt during dialogue
    const portalPrompt = document.getElementById('door-portal-prompt');
    if (portalPrompt) portalPrompt.classList.add('hidden');

    // Typewriter Text
    this.typewriterText(dialogueNode.text, () => {
      // If already resolved, choices are strictly empty!
      const choicesToRender = isAlreadyResolved ? [] : dialogueNode.choices;
      this.renderChoices(choicesToRender, npc.scenarioKey);
    });
  }

  typewriterText(fullText, onComplete) {
    const pname = (window.entityManager && window.entityManager.player.name) || '루다';
    fullText = String(fullText).replace(/루다/g, pname).replace(/\\n/g, '\n');
    this.isTyping = true;
    const textEl = document.getElementById('dialogue-text');
    const choicesEl = document.getElementById('dialogue-choices');
    const promptEl = document.getElementById('dialogue-next-prompt');

    if (textEl) textEl.textContent = '';
    if (choicesEl) choicesEl.innerHTML = '';
    if (promptEl) promptEl.classList.add('hidden');

    let idx = 0;
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    this._tw = { fullText, onComplete, textEl, done: false };
    const tw = this._tw;

    this.typewriterTimer = setInterval(() => {
      if (tw.done) { clearInterval(this.typewriterTimer); return; }
      if (idx < fullText.length) {
        if (textEl) textEl.textContent += fullText.charAt(idx);
        // (대사 '삐삐' 소리는 꺼 둠)
        idx++;
      } else {
        this.finishTyping();
      }
    }, 18);
  }

  // 글자가 다 나오기 전에 화면을 누르면 바로 전체 문장 보이기
  finishTyping() {
    const tw = this._tw;
    if (!tw || tw.done) return;
    tw.done = true;
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (tw.textEl) tw.textEl.textContent = tw.fullText;
    this.isTyping = false;
    if (tw.onComplete) tw.onComplete();
  }

  // --------------------------------------------------------------------------
  // 🛟 대화가 멈췄을 때를 대비한 안전장치
  //  - 대화창 오른쪽 위 [← 나가기] 버튼: 언제든 대화를 닫고 학교로 돌아감 (진행 상황은 그대로)
  //  - 휴대폰 '뒤로가기' 버튼/제스처도 대화창·팝업 닫기로 동작
  //  - 대사가 다 나왔는데 선택지도 다음 버튼도 없으면 자동으로 [다음] 버튼을 다시 보여 줌
  // --------------------------------------------------------------------------
  setupDialogueSafety() {
    const box = document.getElementById('dialogue-box');
    if (!box) return;
    if (!document.getElementById('dlg-exit-btn')) {
      const btn = document.createElement('button');
      btn.id = 'dlg-exit-btn';
      btn.className = 'dlg-exit-btn';
      btn.type = 'button';
      btn.innerHTML = '<span>←</span> 나가기';
      btn.title = '대화를 닫고 학교로 돌아가기 (지금까지 한 것은 저장돼요)';
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.exitDialogue(); });
      box.appendChild(btn);
    }
    // 대사 영역을 누르면 글자 바로 다 보이기
    const win = box.querySelector('.arpia-dialogue-window');
    if (win) win.addEventListener('click', (e) => {
      if (this.isTyping && !e.target.closest('button')) this.finishTyping();
    });

    // 휴대폰 뒤로가기
    try { history.replaceState({ cus: 'base' }, ''); history.pushState({ cus: 'game' }, ''); } catch (e) {}
    window.addEventListener('popstate', () => {
      const handled = this.closeTopLayer();
      try { history.pushState({ cus: 'game' }, ''); } catch (e) {}
      if (!handled) this.showToast('🏫 게임을 끝내려면 브라우저 탭을 닫아 주세요.', '#a78bfa');
    });

    // 막힘 감시
    setInterval(() => this.dialogueWatchdog(), 900);
  }

  exitDialogue() {
    if (!this.isDialogueActive) return;
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    if (this._tw) this._tw.done = true;
    this.isTyping = false;
    const rm = document.getElementById('mission-reward-modal');
    if (rm && !rm.classList.contains('hidden')) {
      // 보상 창이 떠 있으면 확인 버튼을 대신 눌러 보상은 받은 채로 닫기
      const ok = document.getElementById('btn-reward-confirm');
      if (ok) ok.click();
      if (this._tw) this._tw.done = true;
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    }
    this.closeDialogue();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  // 맨 위에 떠 있는 창 하나 닫기 (닫았으면 true)
  closeTopLayer() {
    const modals = [...document.querySelectorAll('.modal-backdrop:not(.hidden), .rpg-modal-backdrop:not(.hidden)')]
      .filter(m => m.offsetParent !== null || getComputedStyle(m).display !== 'none');
    const top = modals[modals.length - 1];
    if (top) {
      const closeBtn = top.querySelector('.modal-close, .close-btn, [id^="btn-close"], .btn-close, [data-close]');
      if (closeBtn) { closeBtn.click(); return true; }
      if (top.id !== 'mission-reward-modal') { top.classList.add('hidden'); return true; }
    }
    if (this.isDialogueActive) { this.exitDialogue(); return true; }
    return false;
  }

  dialogueWatchdog() {
    if (!this.isDialogueActive || this.isTyping) { this._stuck = 0; return; }
    const box = document.getElementById('dialogue-box');
    const prompt = document.getElementById('dialogue-next-prompt');
    const choices = document.getElementById('dialogue-choices');
    const think = document.getElementById('think-panel');
    const anyModal = document.querySelector('.modal-backdrop:not(.hidden)');
    const overlay = document.querySelector('.p2-overlay');
    const hasChoices = choices && choices.querySelector('button:not([disabled])');
    const thinkOpen = think && !think.classList.contains('hidden') && think.querySelector('button:not([disabled])');
    const promptOn = prompt && !prompt.classList.contains('hidden');
    const boxHidden = !box || box.classList.contains('hidden');
    if (boxHidden) { this.isDialogueActive = false; return; }   // 대화창이 사라졌는데 대화 중으로 남아 있는 경우
    if (hasChoices || thinkOpen || promptOn || anyModal || overlay) { this._stuck = 0; return; }
    this._stuck = (this._stuck || 0) + 1;
    if (this._stuck >= 2 && prompt) {
      prompt.classList.remove('hidden');
      prompt.onclick = () => this.closeDialogue();
      this._stuck = 0;
    }
  }

  renderChoices(choices, npcKey) {
    const choicesEl = document.getElementById('dialogue-choices');
    const promptEl = document.getElementById('dialogue-next-prompt');
    if (choicesEl) choicesEl.innerHTML = '';

    if (!choices || choices.length === 0) {
      if (promptEl) {
        promptEl.classList.remove('hidden');
        promptEl.onclick = () => this.closeDialogue();
      }
      return;
    }

    const shuffled = choices.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.innerHTML = `<span class="choice-num" data-n="${i + 1}">${i + 1}</span> <span>${c.text}</span>`;
      btn.onclick = () => {
        this.handleChoiceSelect(npcKey, c);
      };
      choicesEl.appendChild(btn);
    });
  }

  handleChoiceSelect(npcKey, choice, skipWhy) {
    const scenario = window.scenarioManager.scenarios[npcKey];
    document.querySelectorAll('.dialogue-choice-btn').forEach(b => { b.disabled = true; });
    if (choice.grade === 'bad') { this.handleBadChoice(npcKey, choice, scenario); return; }
    // 좋은 말을 골랐으면: "왜 좋은 말일까?" 이유 카드부터
    if (!skipWhy && scenario && scenario.why) { this.askWhy(npcKey, choice, scenario); return; }
    this.hideThink();

    // Apply choice (returns false if already resolved!)
    const isApplied = window.scenarioManager.applyChoice(npcKey, choice);
    if (!isApplied) {
      this.closeDialogue();
      return;
    }
    // 대화가 끝나면 이 친구 자리에서부터 방에 색이 퍼져나감
    if (this.currentNPC) this.pendingBloom = { x: this.currentNPC.x + 16, y: this.currentNPC.y + 16 };

    if (window.soundEngine) {
      window.soundEngine.playStatUp();
    }

    if (window.scenarioManager.hurtBy) delete window.scenarioManager.hurtBy[npcKey];
    const tv = document.getElementById('npc-trust-val');
    if (tv) tv.textContent = `신뢰도 ${window.scenarioManager.npcTrust[npcKey]}% ▲`;
    // Format stat rewards
    let statText = [];
    if (choice.stats) {
      for (const [s, v] of Object.entries(choice.stats)) {
        const icon = { courage: '🦁 용기', empathy: '💖 공감', respect: '🤝 존중', opportunity: '🌟 기회', freedom: '🕊️ 자유' }[s];
        statText.push(`${icon} +${v}`);
      }
    }

    // Show Arpia-style Mission Clear Popup Modal
    const rewardModal = document.getElementById('mission-reward-modal');
    const rewardText = document.getElementById('reward-modal-text');
    const rewardBtn = document.getElementById('btn-reward-confirm');

    const totalResolved = window.scenarioManager.resolvedScenarios.length;
    const totalGoal = window.scenarioManager.totalNPCMissions;

    if (rewardModal && rewardText) {
      const modalBox = rewardModal.querySelector('.arpia-reward-modal');
      if (modalBox) modalBox.classList.remove('is-bad');
      document.getElementById('reward-modal-title').textContent = choice.grade === 'good' ? '고민 해결!' : '최고의 한마디!';
      rewardText.innerHTML = `
        <div style="font-size:1.15rem; color:#1a3b68; margin-bottom:8px;">
          <b>${scenario ? scenario.name : '친구'}</b>의 고민을 양성평등한 말로 해결했어요!
        </div>
        ${choice.grade === 'good' ? '<div style="font-size:0.9rem; color:#7a6a88; margin-bottom:6px;">💡 좋은 방법이었어요. 친구 마음을 먼저 알아주는 말이었다면 점수가 더 높았을 거예요!</div>' : ''}
        <div style="background:#fff; border:2px dashed #70a1ff; border-radius:10px; padding:12px; margin:10px 0;">
          <div style="font-size:1rem; color:#e67e22; font-weight:800;">
            선행 점수 획득: ${statText.join(' · ')}
          </div>
          <div style="font-size:0.95rem; color:#27ae60; font-weight:700; margin-top:6px;">
            🎨 학교 색채 복원율: <b>${window.scenarioManager.colorProgress}%</b>
          </div>
          <div style="font-size:0.85rem; color:#3498db; margin-top:4px;">
            [미션 완료 현황: <b>${totalResolved} / ${totalGoal}명</b> 해결 완료]
          </div>
        </div>
      `;
      rewardModal.classList.remove('hidden');

      rewardBtn.onclick = () => {
        rewardModal.classList.add('hidden');
        if (window.soundEngine) window.soundEngine.playClick();
        if (scenario) this.setNpcFace(scenario.portrait || npcKey, 'happy');
        const dlgBg = document.getElementById('dlg-bg');
        if (dlgBg) dlgBg.classList.add('colored');

        // Continue with NPC's final response
        const speakerEl = document.getElementById('dialogue-speaker');
        if (speakerEl && scenario) speakerEl.textContent = scenario.name;

        this.currentDialogueData = { text: choice.response, choices: [] };
        this.typewriterText(choice.response, () => {
          const promptEl = document.getElementById('dialogue-next-prompt');
          if (promptEl) {
            promptEl.classList.remove('hidden');
            promptEl.onclick = () => this.closeDialogue();
          }
        });
      };
    } else {
      this.currentDialogueData = { text: choice.response, choices: [] };
      this.typewriterText(choice.response, () => {
        const promptEl = document.getElementById('dialogue-next-prompt');
        if (promptEl) {
          promptEl.classList.remove('hidden');
          promptEl.onclick = () => this.closeDialogue();
        }
      });
    }

    this.showToast(`✨ [${scenario ? scenario.name : '친구'}] 미션 완료! ${statText.join(' ')}`, '#ffd32a');
  }

  // --------------------------------------------------------------------------
  // 🧠 생각하는 단계 패널 (이유 카드 / 상처 찾기 / 다시 말해 보기)
  // --------------------------------------------------------------------------
  thinkPanel() {
    let el = document.getElementById('think-panel');
    if (!el) {
      el = document.createElement('div');
      el.id = 'think-panel';
      el.className = 'think-panel hidden';
      document.getElementById('dialogue-box').appendChild(el);
    }
    return el;
  }
  showThink(html) {
    const el = this.thinkPanel();
    el.innerHTML = html;
    el.classList.remove('hidden');
    const ch = document.getElementById('dialogue-choices');
    if (ch) ch.innerHTML = '';
    return el;
  }
  hideThink() { const el = document.getElementById('think-panel'); if (el) el.classList.add('hidden'); }
  shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); }

  // ① 이유 카드: 좋은 말을 고른 뒤 "왜 힘이 됐을까?"
  askWhy(npcKey, choice, scenario) {
    const w = scenario.why;
    const opts = this.shuffle(w.options.map((t, i) => ({ t, ok: i === 0 })));
    const el = this.showThink(`
      <div class="tp-tag">🤔 생각 한 번 더!</div>
      <div class="tp-q">${w.q}</div>
      <div class="tp-said">내가 한 말: “${choice.text}”</div>
      <div class="tp-opts">${opts.map((o, i) => `<button class="tp-opt" data-i="${i}"><span class="choice-num">${i + 1}</span><span>${o.t}</span></button>`).join('')}</div>
      <div class="tp-result"></div>`);
    el.querySelectorAll('.tp-opt').forEach(btn => {
      btn.onclick = () => {
        const o = opts[+btn.dataset.i];
        el.querySelectorAll('.tp-opt').forEach(b => { b.disabled = true; const oo = opts[+b.dataset.i]; if (oo.ok) b.classList.add('right'); });
        const sm = window.scenarioManager;
        const res = el.querySelector('.tp-result');
        if (o.ok) {
          btn.classList.add('right');
          sm.addStats({ [scenario.focus[0]]: 3 });
          sm.reasonRight = (sm.reasonRight || 0) + 1;
          res.innerHTML = `<b class="ok">✔ 정확해요! 이유까지 찾았어요 (+3)</b><br>${w.explain}`;
        } else {
          btn.classList.add('wrong');
          sm.reasonWrong = (sm.reasonWrong || 0) + 1;
          res.innerHTML = `<b class="ng">🤔 아쉬워요! 초록색이 진짜 이유예요.</b><br>${w.explain}`;
        }
        res.innerHTML += `<button class="tp-next">계속하기 ▶</button>`;
        res.querySelector('.tp-next').onclick = () => { this.hideThink(); this.handleChoiceSelect(npcKey, choice, true); };
      };
    });
  }

  // 편견이 섞인 말을 골랐을 때: 슬픈 표정 + 점수 차감 → 상처 찾기 → 다시 말해 보기
  handleBadChoice(npcKey, choice, scenario) {
    const sm = window.scenarioManager;
    const lost = sm.applyBadChoice(npcKey, choice);
    sm.hurtBy = sm.hurtBy || {};
    sm.hurtBy[npcKey] = true;
    if (window.soundEngine && window.soundEngine.playClick) window.soundEngine.playClick();

    this.setNpcFace(scenario.portrait || npcKey, 'sad');
    const bg = document.getElementById('dlg-bg');
    if (bg) bg.classList.remove('colored');
    const box = document.getElementById('dialogue-box');
    if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); }
    const trustValEl = document.getElementById('npc-trust-val');
    if (trustValEl) trustValEl.textContent = `신뢰도 ${sm.npcTrust[npcKey]}% ▼`;

    const names = { courage: '🦁 용기', empathy: '💖 공감', respect: '🤝 존중', opportunity: '🌟 기회', freedom: '🕊️ 자유' };
    const lostText = Object.entries(lost).map(([k, v]) => `${names[k]} ${v}`).join(' · ');
    this.showToast(`💔 ${scenario.name}의 마음이 다쳤어요. ${lostText}`, '#ff4d6d');

    this.currentDialogueData = { text: choice.response, choices: [] };
    this.typewriterText(choice.response, () => {
      const promptEl = document.getElementById('dialogue-next-prompt');
      if (promptEl) promptEl.classList.add('hidden');
      this.findHurt(npcKey, choice, scenario);
    });
  }

  // ② 상처 찾기: 내가 한 말에서 친구를 아프게 한 부분 누르기
  findHurt(npcKey, choice, scenario) {
    const parts = choice.parts || [{ t: choice.text, hurt: true }];
    const el = this.showThink(`
      <div class="tp-tag bad">💔 친구가 상처받았어요</div>
      <div class="tp-q">내가 한 말에서 <b>${scenario.name}</b>${((scenario.name.charCodeAt(scenario.name.length - 1) - 0xAC00) % 28) ? '을' : '를'} 아프게 한 부분을 눌러 보세요.</div>
      <div class="tp-parts">${parts.map((p, i) => `<button class="tp-part" data-i="${i}">${p.t}</button>`).join('')}</div>
      <div class="tp-result"></div>
      <button class="tp-skip">나중에 다시 이야기할래</button>`);
    el.querySelector('.tp-skip').onclick = () => { this.hideThink(); this.closeDialogue(); if (window.entityManager) window.entityManager.player.autoDialogueCooldown = 6; };
    let tries = 0;
    el.querySelectorAll('.tp-part').forEach(btn => {
      btn.onclick = () => {
        const p = parts[+btn.dataset.i];
        const res = el.querySelector('.tp-result');
        if (p.hurt) {
          el.querySelectorAll('.tp-part').forEach((b, i) => { b.disabled = true; if (parts[i].hurt) b.classList.add('hurt'); });
          res.innerHTML = `<b class="${tries ? 'ng' : 'ok'}">${tries ? '찾았어요!' : '✔ 바로 찾았어요!'}</b><br>💡 ${choice.lesson || ''}
            <button class="tp-next">다시 말해 보기 ▶</button>`;
          res.querySelector('.tp-next').onclick = () => this.rebuildSentence(npcKey, choice, scenario);
        } else {
          tries++;
          btn.classList.add('nope'); btn.disabled = true;
          res.innerHTML = `<span class="ng">이 부분은 괜찮아요. 친구가 왜 서운했는지 다시 생각해 봐요.</span>`;
        }
      };
    });
  }

  // ③ 다시 말해 보기: 칸마다 조각을 골라 문장 완성
  rebuildSentence(npcKey, choice, scenario) {
    const rb = scenario.rebuild;
    const slots = rb.slots.map(([good, bad]) => this.shuffle([{ t: good, ok: true }, { t: bad, ok: false }]));
    const picked = slots.map(() => null);
    const el = this.showThink(`
      <div class="tp-tag fix">✏️ 다시 말해 보기</div>
      <div class="tp-q">조각을 하나씩 골라 <b>${scenario.name}</b>에게 힘이 되는 말을 만들어 보세요.</div>
      <div class="tp-slots">${slots.map((sl, si) => `<div class="tp-slot" data-s="${si}"><span class="tp-sn">${si + 1}</span>${sl.map((o, oi) => `<button class="tp-piece" data-s="${si}" data-o="${oi}">${o.t}</button>`).join('')}</div>`).join('')}</div>
      <div class="tp-preview">“ … ”</div>
      <div class="tp-result"></div>
      <button class="tp-say" disabled>💬 이렇게 말하기</button>`);
    const preview = el.querySelector('.tp-preview');
    const sayBtn = el.querySelector('.tp-say');
    const refresh = () => {
      preview.textContent = '“ ' + picked.map(p => p ? p.t : '…').join(' ') + ' ”';
      sayBtn.disabled = picked.some(p => !p);
    };
    el.querySelectorAll('.tp-piece').forEach(btn => {
      btn.onclick = () => {
        const si = +btn.dataset.s;
        picked[si] = slots[si][+btn.dataset.o];
        el.querySelectorAll(`.tp-piece[data-s="${si}"]`).forEach(b => b.classList.toggle('on', b === btn));
        el.querySelector(`.tp-slot[data-s="${si}"]`).classList.remove('bad');
        el.querySelector('.tp-result').innerHTML = '';
        refresh();
      };
    });
    sayBtn.onclick = () => {
      const badIdx = picked.map((p, i) => (p.ok ? -1 : i)).filter(i => i >= 0);
      if (badIdx.length) {
        badIdx.forEach(i => el.querySelector(`.tp-slot[data-s="${i}"]`).classList.add('bad'));
        el.querySelector('.tp-result').innerHTML = `<span class="ng">🤔 빨간 칸의 조각에 아직 편견이 남아 있어요. 다른 조각으로 바꿔 보세요.</span>`;
        return;
      }
      const sentence = picked.map(p => p.t).join(' ');
      const sm = window.scenarioManager;
      // 기록: 상처 준 말 옆에 고쳐 말한 문장 남기기
      for (let i = sm.choiceLog.length - 1; i >= 0; i--) {
        if (sm.choiceLog[i].grade === 'bad' && sm.choiceLog[i].who === scenario.name && !sm.choiceLog[i].fixed) { sm.choiceLog[i].fixed = sentence; break; }
      }
      const best = scenario.dialogues.initial.choices.find(c => c.grade === 'best') || {};
      const synth = { grade: 'good', text: sentence, response: rb.response, snsTrigger: best.snsTrigger, rebuilt: true };
      this.hideThink();
      this.handleChoiceSelect(npcKey, synth, true);
    };
    refresh();
  }

  closeDialogue() {
    this.isDialogueActive = false;
    this.hideThink();
    if (this.maybeMeeting) this.maybeMeeting();
    const box = document.getElementById('dialogue-box');
    if (box) box.classList.add('hidden');
    document.getElementById('game-view').classList.remove('in-dialogue');
    if (this.pendingBloom) {
      const b = this.pendingBloom;
      this.pendingBloom = null;
      setTimeout(() => {
        window.mapEngine.triggerColorBloom(b.x, b.y);
        if (window.soundEngine && window.soundEngine.playBadgeUnlock) window.soundEngine.playBadgeUnlock();
        this.showToast('🌈 이 공간에 색이 돌아왔어요!', '#ffd43b');
      }, 250);
    }
    if (window.entityManager && window.entityManager.player) {
      window.entityManager.player.autoDialogueCooldown = 2.5; // 2.5 seconds cooldown
    }
  }

  // --------------------------------------------------------------------------
  // Bias Detection Modal (Strict 1-Time Resolution!)
  // --------------------------------------------------------------------------
  openBiasModal(biasId) {
    if (window.scenarioManager.completedBiases.includes(biasId)) {
      this.showToast(`✅ 이미 올바른 양성평등 관점으로 정화 완료된 편견 게시물입니다!`, '#2ed573');
      return;
    }

    const mission = window.scenarioManager.biasMissions[biasId];
    if (!mission) return;

    const modal = document.getElementById('bias-detector-modal');
    modal.classList.remove('hidden');

    document.getElementById('bias-quote-text').textContent = mission.quote;
    const optionsContainer = document.getElementById('bias-options-list');
    optionsContainer.innerHTML = '';

    mission.options.slice().sort(() => Math.random() - 0.5).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'bias-option-btn';
      btn.textContent = opt.text;

      btn.onclick = () => {
        modal.classList.add('hidden');
        if (opt.correct) {
          if (opt.stats) {
            for (const [s, v] of Object.entries(opt.stats)) {
              window.scenarioManager.playerStats[s] = Math.min(100, (window.scenarioManager.playerStats[s] || 0) + v);
            }
          }
          if (opt.badge && !window.scenarioManager.badges.includes(opt.badge)) {
            window.scenarioManager.badges.push(opt.badge);
            this.showToast(`🎖️ 새로운 양성평등 배지를 획득했습니다!`, '#ffd32a');
          }
          if (!window.scenarioManager.completedBiases.includes(biasId)) {
            window.scenarioManager.completedBiases.push(biasId);
          }

          window.scenarioManager.updateColorProgress();
          window.scenarioManager.checkActProgression();

          if (window.soundEngine) {
            window.soundEngine.playBadgeUnlock();
          }

          this.showToast(`✅ [편견 탐지 성공!] ${opt.explanation}`, '#2ed573');
        } else {
          window.scenarioManager.addStats({ respect: -5, empathy: -3 });
          window.scenarioManager.choiceLog.push({ who: '편견 포스터', text: opt.text, grade: 'bad', lesson: opt.explanation || '' });
          window.scenarioManager.hurtCount = (window.scenarioManager.hurtCount || 0) + 1;
          this.showToast(`❌ 오답! ${opt.explanation || '성별 고정관념이 숨어 있는 생각이에요.'} (🤝 존중 -5 · 💖 공감 -3) 포스터를 다시 조사해 보세요.`, '#ff4757');
        }
      };

      optionsContainer.appendChild(btn);
    });
  }

  // --------------------------------------------------------------------------
  // 방에 들어갈 때 화면 가운데 뜨는 장소 이름 배너
  // --------------------------------------------------------------------------
  showRoomBanner(room) {
    let el = document.getElementById('room-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'room-banner';
      document.getElementById('game-view').appendChild(el);
    }
    const friendKey = { playground: 'sua', counseling: 'minwoo', nurse: 'jinhyeuk', cafeteria: 'haeun',
      student_council: 'taeo', broadcast: 'yuna', club: 'hyunseo' }[window.mapEngine.currentRoomKey];
    let sub = '';
    if (friendKey) {
      const done = window.scenarioManager.resolvedScenarios.includes(friendKey);
      sub = done ? '🌈 색을 되찾은 공간' : '💭 누군가 고민에 빠져 있어요';
    }
    el.innerHTML = `<div class="rb-icon">${room.icon}</div><div class="rb-name">${room.name}</div>${sub ? `<div class="rb-sub">${sub}</div>` : ''}`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');

    // 짧은 화면 전환 효과
    const wrap = document.getElementById('canvas-wrapper');
    if (wrap) { wrap.classList.remove('room-fade'); void wrap.offsetWidth; wrap.classList.add('room-fade'); }
  }

  // --------------------------------------------------------------------------
  // Toast Notification Helper
  // --------------------------------------------------------------------------
  showToast(message, color = '#70a1ff') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.borderColor = color;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // Master Game Loop (Instant stop when keyboard is released!)
  // --------------------------------------------------------------------------
  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const player = window.entityManager ? window.entityManager.player : null;

    if (player && !this.isDialogueActive) {
      let kx = 0;
      let ky = 0;
      if (this.keys['arrowup'] || this.keys['w']) ky -= 1;
      if (this.keys['arrowdown'] || this.keys['s']) ky += 1;
      if (this.keys['arrowleft'] || this.keys['a']) kx -= 1;
      if (this.keys['arrowright'] || this.keys['d']) kx += 1;

      // Handle Keyboard Input
      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        player.inputVector = { x: kx / len, y: ky / len };
        player.targetPos = null;
      } 
      // Handle Touch Joystick Input (only when touch is actively held)
      else if (this.isJoystickActive) {
        // Keep joystick vector
      } 
      // Otherwise immediately STOP!
      else {
        player.inputVector = { x: 0, y: 0 };
      }

      // Update Player Movement & Collision
      player.update(dt, window.mapEngine);

      // Check near door for portal prompt badge
      const nearDoor = window.mapEngine.checkNearDoor(player.x + 16, player.y + 16);
      const portalPrompt = document.getElementById('door-portal-prompt');
      if (portalPrompt) {
        if (nearDoor && !this.isDialogueActive) {
          portalPrompt.classList.remove('hidden');
          const titleEl = document.getElementById('door-portal-title');
          if (titleEl) titleEl.textContent = nearDoor.label;
          const enterBtn = document.getElementById('door-portal-enter-btn');
          if (enterBtn) {
            enterBtn.onclick = () => {
              if (nearDoor.requiresAct && window.scenarioManager.currentAct < nearDoor.requiresAct) {
                this.showToast(`⚠️ 아직 들어갈 수 없습니다! 모든 친구들을 돕고 편견을 정화하세요!`, '#ff4757');
                return;
              }
              this.warpToRoom(nearDoor.to);
            };
          }
        } else {
          portalPrompt.classList.add('hidden');
        }
      }

      // Proximity Auto-Dialogue Trigger Check (Only if NPC has quest remaining!)
      if (player.autoDialogueCooldown <= 0) {
        const currentRoom = window.mapEngine.currentRoomKey;
        const nearNPC = window.entityManager.checkProximity(currentRoom);
        if (nearNPC) {
          // If already resolved, do not trigger auto-dialogue repeatedly!
          const isResolved = window.scenarioManager.resolvedScenarios.includes(nearNPC.scenarioKey);
          if (!isResolved) {
            this.startDialogue(nearNPC);
          }
        }
      }
    }

    // Update NPCs
    const currentRoomKey = window.mapEngine.currentRoomKey;
    const roomNPCs = window.entityManager ? window.entityManager.getNPCsInRoom(currentRoomKey) : [];
    if (player) {
      roomNPCs.forEach(npc => npc.update(dt, player));
    }

    // Smooth Camera Follow Player (방 밖은 보이지 않도록 가장자리에서 멈춤)
    const view = this.getView();
    if (player) {
      const room = window.mapEngine.getCurrentRoom();
      const rw = room.width * 32, rh = room.height * 32;
      const clampAxis = (target, viewSize, roomSize) =>
        roomSize <= viewSize ? (roomSize - viewSize) / 2 : Math.max(0, Math.min(target, roomSize - viewSize));
      const targetCamX = clampAxis(player.x + 16 - view.w / 2, view.w, rw);
      // 코드로 그린 방은 윗벽 장식이 HUD에 가리지 않도록 위쪽 여유 공간을 둠
      const hasImage = !!window.mapEngine.bgImages[room.bgKey || window.mapEngine.currentRoomKey];
      const topPad = hasImage ? 0 : 84 / this.zoom;
      const targetCamY = clampAxis(player.y + 16 - view.h / 2 + topPad / 2, view.h + topPad, rh) - topPad;
      if (this.snapCamera) {
        this.camera.x = targetCamX; this.camera.y = targetCamY; this.snapCamera = false;
      } else {
        this.camera.x += (targetCamX - this.camera.x) * 0.12;
        this.camera.y += (targetCamY - this.camera.y) * 0.12;
      }
    }

    // Render Frame
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0f1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = this.dpr * this.zoom;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // 1. 배경 & 소품
    window.mapEngine.render(ctx, this.camera);

    // 2. NPC (y 좌표 순서대로)
    if (window.crowdManager) window.crowdManager.update(dt, currentRoomKey, window.mapEngine);
    const drawList = roomNPCs.map(npc => ({ y: npc.y, render: (c, cam) => npc.render(c, cam) }))
      .concat(window.crowdManager ? window.crowdManager.drawables(currentRoomKey) : []);
    drawList.sort((a, b) => a.y - b.y).forEach(d => d.render(ctx, this.camera));

    // 3. 분위기 파티클
    window.mapEngine.renderAmbient(ctx, this.camera, view, dt);

    // 4. 아직 색을 되찾지 못한 공간은 회색으로
    window.mapEngine.applyColorGrade(ctx, this.camera, view, dt);

    // 5. 주인공은 언제나 컬러! (학교에 색을 가져오는 사람)
    if (player) {
      player.render(ctx, this.camera);
    }

    // 6. 문 / 편견 포스터 표시
    window.mapEngine.renderUI(ctx, this.camera);
    if (this.updateTalkPrompt && document.getElementById('game-view').classList.contains('active')) this.updateTalkPrompt();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}


// ============================================================================
// 🧠 2단계: 마음 체크 · 학급 회의 · 편견을 말한 친구와 대화
// ============================================================================

// 마음 체크 문장 (동의할수록 성별 고정관념이 강한 생각)
const MIND_ITEMS = [
  '남자는 슬퍼도 울지 않는 게 좋다.',
  '운동은 남학생에게 더 잘 어울린다.',
  '집안일은 엄마나 딸이 하는 게 자연스럽다.',
  '반장 같은 리더는 남학생이 더 잘한다.',
  '여학생은 외모를 더 신경 써야 한다.'
];
const MIND_SCALE = ['전혀 아니야', '아닌 편', '잘 모르겠어', '그런 편', '정말 그래'];

// 학급 회의: 정답이 하나가 아닌 문제 (점수 없음)
const MEETINGS = [
  {
    after: 3,
    title: '체육 수행평가 기준',
    q: '체육 수행평가에서 남학생과 여학생의 통과 기준(예: 오래달리기 시간)이 다른 건 차별일까?',
    voices: [
      { skin: 'extra5', name: '준호', t: '몸의 차이를 생각하면 기준이 다른 게 오히려 공정한 거 아냐?' },
      { skin: 'extra2', name: '다은', t: '근데 같은 성별 안에서도 체력 차이가 엄청 크잖아. 성별보다 내 실력이 얼마나 늘었는지를 봐야지.' },
      { skin: 'extra7', name: '시우', t: '아예 종목을 여러 개 만들어서 각자 고르게 하면 어때?' }
    ],
    choices: ['준호 생각에 가까워', '다은 생각에 가까워', '시우 생각에 가까워', '아직 잘 모르겠어'],
    wrap: '정답이 하나로 정해진 문제가 아니에요. 중요한 건 "이 기준이 모든 학생에게 공정한가?", "성별 말고 다른 차이는 없을까?"를 함께 따져 보는 거예요.'
  },
  {
    after: 6,
    title: '청소 구역 나누기',
    q: '화장실 청소는 사생활 공간이니까 같은 성별이 하는 게 맞을까? 그럼 다른 청소 구역도 성별로 나눠도 될까?',
    voices: [
      { skin: 'extra4', name: '서아', t: '화장실은 사생활이 걸린 공간이라 같은 성별이 하는 게 맞다고 생각해.' },
      { skin: 'extra1', name: '민준', t: '그러다 보면 "무거운 건 남자, 꼼꼼한 건 여자"처럼 다른 청소도 성별로 나누게 될까 봐 걱정돼.' },
      { skin: 'extra8', name: '하린', t: '화장실만 이유가 분명하니까 예외로 하고, 나머지는 자유롭게 신청하면 되지 않을까?' }
    ],
    choices: ['서아 생각에 가까워', '민준 생각에 가까워', '하린 생각에 가까워', '아직 잘 모르겠어'],
    wrap: '성별로 나누는 데 분명한 이유(사생활, 안전)가 있는지, 아니면 "원래 그래서"인지 구분해 보는 게 중요해요. 이유가 있는 구분과 고정관념에서 나온 구분은 달라요.'
  }
];

// 편견을 말한 친구와 대화 (방마다 한 명, 머리 위 💬)
const SIDE_TALKS = {
  playground: { name: '건우', skin: 'extra5', line: '여자가 무슨 축구야~ 피구나 하지.',
    origin: '음... 우리 형이 맨날 그렇게 말하거든. 체육 시간에도 다들 그렇게 나누고. 그냥 원래 그런 줄 알았어.',
    follow: [
      { t: '나도 그런 말 많이 들었어. 근데 수아 슛 보면 생각이 좀 달라질걸?', ok: true },
      { t: '형이 그런다고 너까지 따라 하면 어떡해.', ok: false, reply: '...뭐, 그냥 한 말인데. (머쓱해하며 고개를 돌린다)' }
    ], end: '...그러게. 직접 본 적도 없으면서 그렇게 말했네. 다음엔 같이 축구하자고 해 봐야겠다!' },
  cafeteria: { name: '예린', skin: 'extra6', line: '여자는 조금만 먹어야 예뻐 보이지~',
    origin: '...사실 나도 그 말 듣고 점심 자주 거르거든. 다들 그래야 한다고 하니까.',
    follow: [
      { t: '그 말 때문에 너도 힘들었겠다. 우리 그냥 맛있게 먹자.', ok: true },
      { t: '그런 말 하면 다른 애들이 상처받잖아.', ok: false, reply: '...알아. 근데 나도 어떻게 해야 할지 모르겠단 말이야.' }
    ], end: '고마워... 나도 사실 배고팠어. 오늘은 같이 든든하게 먹자!' },
  gym: { name: '태민', skin: 'extra1', line: '남자가 무슨 걸그룹 춤이야, 웃기지 않아?',
    origin: '나도 사실 춤 좋아하는데... 그거 말하면 놀림받을까 봐 먼저 놀렸던 것 같아.',
    follow: [
      { t: '그랬구나. 너도 좋아하는 거 있으면 같이 해 보자. 아무도 안 놀릴 거야.', ok: true },
      { t: '그럼 넌 겁쟁이라서 남을 놀린 거네.', ok: false, reply: '...야, 그렇게까지 말할 건 없잖아. (얼굴이 빨개져서 가 버린다)' }
    ], end: '...진짜? 그럼 나도 댄스부 오디션 구경 가 볼래. 도윤이한테 사과도 할게.' },
  classroom: { name: '현우', skin: 'extra3', line: '반장은 남자가 해야 카리스마 있지~',
    origin: '초등학교 때 반장이 다 남자였거든. 그래서 그런 줄 알았어. 깊게 생각해 본 적은 없어.',
    follow: [
      { t: '나도 그랬어. 근데 반장한테 필요한 건 친구들 말 잘 듣는 거 아닐까?', ok: true },
      { t: '그건 그냥 네가 성차별하는 거야.', ok: false, reply: '...내가 무슨 성차별이야? 그냥 내 생각 말한 건데. (팔짱을 낀다)' }
    ], end: '듣고 보니 그렇네. 지민이 공약 들어 보고 투표할게!' },
  hallway: { name: '수빈', skin: 'extra4', line: '집안일은 원래 엄마 몫이지~',
    origin: '우리 집은 늘 엄마가 다 하셔서... 그게 당연한 줄 알았어. 엄마가 힘들어 보이긴 했는데.',
    follow: [
      { t: '엄마가 힘들어 보였구나. 오늘 같이 설거지 해 드리는 건 어때?', ok: true },
      { t: '그럼 너희 엄마만 고생하는 거잖아. 너무하다.', ok: false, reply: '...나도 알아, 그렇게 말하면 기분 나쁘다고. (입을 삐죽 내민다)' }
    ], end: '맞아, 오늘은 내가 먼저 해 볼래. 엄마가 깜짝 놀라시겠다!' }
};
const SIDE_FIRST = [
  { t: '왜 그렇게 생각했어?', kind: 'ask' },
  { t: '너 그거 완전 성차별이야!', kind: 'blame', reply: '뭐? 그냥 한 말인데 왜 화를 내? (기분이 상해서 등을 돌린다)',
    lesson: '잘못된 말을 짚는 건 중요하지만, 비난부터 하면 상대는 귀를 닫아요. 먼저 "왜?"를 물어보면 대화가 시작돼요.' },
  { t: '(못 들은 척 그냥 지나간다)', kind: 'ignore', reply: '...(친구는 계속 같은 말을 하고 있다)',
    lesson: '못 들은 척하면 그 말이 괜찮은 것처럼 남아요. 부드럽게라도 한마디 건네 보세요.' }
];

const josa = (w, a, b) => (((w.charCodeAt(w.length - 1) - 0xAC00) % 28) ? a : b);
Object.assign(GameApp.prototype, {
  // ------------------------------------------------------------------------
  // 공용 오버레이
  // ------------------------------------------------------------------------
  overlay(html, cls = '') {
    let el = document.getElementById('p2-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'p2-overlay';
      document.getElementById('game-app').appendChild(el);
    }
    el.className = 'p2-overlay ' + cls;
    el.innerHTML = `<div class="p2-card">${html}</div>`;
    el.style.display = 'flex';
    this.isDialogueActive = true;   // 오버레이 동안 걷기 멈춤
    return el;
  },
  closeOverlay() {
    const el = document.getElementById('p2-overlay');
    if (el) el.style.display = 'none';
    this.isDialogueActive = false;
    if (window.entityManager) window.entityManager.player.autoDialogueCooldown = 3;
  },

  // ------------------------------------------------------------------------
  // 🌅 마음 체크 (게임 시작 전 / 엔딩 직전)
  // ------------------------------------------------------------------------
  showMindCheck(phase, done) {
    const pre = phase === 'pre';
    const answers = MIND_ITEMS.map(() => null);
    const el = this.overlay(`
      <div class="p2-tag">${pre ? '🌅 등교 전 마음 체크' : '🌈 하교 전 마음 체크'}</div>
      <div class="p2-title">${pre ? '게임을 시작하기 전에, 지금 내 생각을 솔직하게 골라 주세요.' : '게임을 마친 지금, 다시 한번 내 생각을 골라 주세요.'}</div>
      <div class="p2-sub">정답도 점수도 없어요. ${pre ? '끝날 때 다시 물어보고 생각이 어떻게 달라졌는지 보여 줄게요.' : '처음과 비교해서 보여 줄게요.'}</div>
      <div class="mc-list">${MIND_ITEMS.map((q, i) => `
        <div class="mc-item"><div class="mc-q">${i + 1}. ${q}</div>
          <div class="mc-scale">${MIND_SCALE.map((s, v) => `<button class="mc-b" data-i="${i}" data-v="${v + 1}">${s}</button>`).join('')}</div></div>`).join('')}
      </div>
      <button class="p2-go" disabled>${pre ? '🏫 학교로 출발!' : '📊 결과 보기'}</button>`, 'mind');
    const go = el.querySelector('.p2-go');
    el.querySelectorAll('.mc-b').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        answers[i] = +b.dataset.v;
        el.querySelectorAll(`.mc-b[data-i="${i}"]`).forEach(x => x.classList.toggle('on', x === b));
        go.disabled = answers.some(a => a === null);
      };
    });
    go.onclick = () => {
      window.scenarioManager[pre ? 'mindPre' : 'mindPost'] = answers;
      this.closeOverlay();
      if (done) done();
    };
  },

  // ------------------------------------------------------------------------
  // 🗳️ 학급 회의 (친구 3명, 6명을 도왔을 때)
  // ------------------------------------------------------------------------
  maybeMeeting() {
    const sm = window.scenarioManager;
    sm.meetingsDone = sm.meetingsDone || [];
    const n = sm.resolvedScenarios.length;
    const m = MEETINGS.find((mt, i) => n >= mt.after && !sm.meetingsDone.includes(i));
    if (!m) return;
    const idx = MEETINGS.indexOf(m);
    sm.meetingsDone.push(idx);
    setTimeout(() => this.showMeeting(m, idx), 2600);
  },
  showMeeting(m, idx) {
    const el = this.overlay(`
      <div class="p2-tag meet">📢 긴급 학급 회의!</div>
      <div class="p2-title">${m.title}</div>
      <div class="mt-q">${m.q}</div>
      <div class="mt-voices">${m.voices.map(v => `
        <div class="mt-voice"><img src="assets/images/chibi_${v.skin}.png" alt=""><div><b>${v.name}</b><p>${v.t}</p></div></div>`).join('')}</div>
      <div class="p2-sub">이 문제엔 정답이 없어요. 내 생각과 가장 가까운 걸 골라 보세요.</div>
      <div class="mt-choices">${m.choices.map((c, i) => `<button class="mt-c" data-i="${i}">${c}</button>`).join('')}</div>
      <div class="mt-wrap"></div>`, 'meeting');
    el.querySelectorAll('.mt-c').forEach(b => {
      b.onclick = () => {
        el.querySelectorAll('.mt-c').forEach(x => { x.disabled = true; x.classList.toggle('on', x === b); });
        const sm = window.scenarioManager;
        sm.meetingChoices = sm.meetingChoices || [];
        sm.meetingChoices.push({ title: m.title, pick: m.choices[+b.dataset.i] });
        sm.addStats({ respect: 3, opportunity: 2 });
        const w = el.querySelector('.mt-wrap');
        w.innerHTML = `<div class="mt-wrapbox">💡 ${m.wrap}</div><button class="p2-go">회의 끝! 계속 탐험하기 ▶</button>`;
        w.querySelector('.p2-go').onclick = () => { this.closeOverlay(); this.showToast('🗳️ 학급 회의에 참여했어요! (🤝 존중 +3 · 🌟 기회 +2)', '#7b6cff'); };
      };
    });
  },

  // ------------------------------------------------------------------------
  // 💬 편견을 말한 친구와 대화 (입장 바꾸기)
  // ------------------------------------------------------------------------
  nearSideTalker() {
    const cm = window.crowdManager, room = window.mapEngine.currentRoomKey;
    const t = cm && cm.talkerOf(room);
    if (!t || t.talked) return null;
    const p = window.entityManager.player;
    return Math.hypot(p.x - t.x, p.y - t.y) < 60 ? t : null;
  },
  updateTalkPrompt() {
    let btn = document.getElementById('side-talk-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'side-talk-btn';
      btn.className = 'side-talk-btn hidden';
      document.getElementById('game-view').appendChild(btn);
      btn.onclick = () => { const t = this.nearSideTalker(); if (t) this.startSideTalk(t); };
    }
    const t = this.isDialogueActive ? null : this.nearSideTalker();
    const want = t ? `💬 ${SIDE_TALKS[window.mapEngine.currentRoomKey].name}${josa(SIDE_TALKS[window.mapEngine.currentRoomKey].name, '이', '')}에게 말 걸기` : '';
    if (btn.dataset.txt !== want) {
      btn.dataset.txt = want;
      btn.innerHTML = want;
      btn.classList.toggle('hidden', !t);
    }
  },
  startSideTalk(talker) {
    const room = window.mapEngine.currentRoomKey;
    const d = SIDE_TALKS[room];
    const bgUrl = this.getDialogueBg(room);
    const render = (speech, body) => this.overlay(`
      <div class="st-stage" style="background-image:url('${bgUrl}')"><img src="assets/images/chibi_${d.skin}.png" alt=""></div>
      <div class="st-name">${d.name}</div>
      <div class="st-speech">${speech}</div>
      <div class="st-body">${body}</div>`, 'sidetalk');

    const step1 = () => {
      const opts = this.shuffle(SIDE_FIRST.slice());
      const el = render(`“${d.line}”`, `<div class="p2-sub">${d.name}${josa(d.name, '이가', '가')} 편견 섞인 말을 했어요. 어떻게 말을 걸까?</div>
        ${opts.map((o, i) => `<button class="st-opt" data-i="${i}"><span class="choice-num">${i + 1}</span><span>${o.t}</span></button>`).join('')}`);
      el.querySelectorAll('.st-opt').forEach(b => {
        b.onclick = () => {
          const o = opts[+b.dataset.i];
          if (o.kind === 'ask') return step2();
          const sm = window.scenarioManager;
          sm.choiceLog.push({ who: d.name + ' (편견을 말한 친구)', text: o.t, grade: 'bad', lesson: o.lesson });
          sm.hurtCount = (sm.hurtCount || 0) + 1;
          const el2 = render(o.reply, `<div class="st-lesson">💡 ${o.lesson}</div><button class="p2-go">다시 말 걸어 보기 ↺</button>`);
          el2.querySelector('.p2-go').onclick = step1;
        };
      });
    };
    const step2 = () => {
      const opts = this.shuffle(d.follow.slice());
      const el = render(d.origin, `<div class="p2-sub">${d.name}${josa(d.name, '이도', '도')} 어디선가 들은 말을 그대로 했던 거였어요. 뭐라고 말해 줄까?</div>
        ${opts.map((o, i) => `<button class="st-opt" data-i="${i}"><span class="choice-num">${i + 1}</span><span>${o.t}</span></button>`).join('')}`);
      el.querySelectorAll('.st-opt').forEach(b => {
        b.onclick = () => {
          const o = opts[+b.dataset.i];
          if (!o.ok) {
            const el2 = render(o.reply, `<div class="st-lesson">💡 맞는 말이어도 상대를 몰아세우면 마음을 닫아요. ${d.name}${josa(d.name, '이', '')}의 마음도 알아주면서 말해 보세요.</div><button class="p2-go">다시 말해 보기 ↺</button>`);
            el2.querySelector('.p2-go').onclick = step2;
            return;
          }
          talker.talked = true;
          const sm = window.scenarioManager;
          sm.sideTalksDone = (sm.sideTalksDone || 0) + 1;
          sm.changedRooms = sm.changedRooms || {};
          sm.changedRooms[room] = true;
          sm.addStats({ empathy: 4, respect: 3 });
          sm.choiceLog.push({ who: d.name + ' (편견을 말한 친구)', text: o.t, grade: 'best' });
          const el2 = render(d.end, `<div class="st-lesson ok">🌱 누구나 편견을 가질 수 있고, 대화로 바뀔 수 있어요. 비난 대신 "왜?"를 묻는 게 시작이에요. (💖 공감 +4 · 🤝 존중 +3)</div><button class="p2-go">좋아! ▶</button>`);
          el2.querySelector('.p2-go').onclick = () => this.closeOverlay();
        };
      });
    };
    step1();
  }
});

// Global Toast function
window.showGameToast = function(msg, color) {
  if (window.gameApp) window.gameApp.showToast(msg, color);
};

// Initialize Application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
