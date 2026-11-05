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

    // Start Master RAF Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    const w = (wrapper && wrapper.clientWidth) ? wrapper.clientWidth : window.innerWidth;
    const h = (wrapper && wrapper.clientHeight) ? wrapper.clientHeight : window.innerHeight;
    this.canvas.width = Math.max(w, 320);
    this.canvas.height = Math.max(h, 240);
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
      const clickX = e.clientX - rect.left + this.camera.x;
      const clickY = e.clientY - rect.top + this.camera.y;

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
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-name">${b.name}</span>
      `;
      badgeContainer.appendChild(bEl);
    });
  }

  renderRoomGrid() {
    const grid = document.getElementById('room-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const rooms = window.mapEngine.rooms;
    const currentKey = window.mapEngine.currentRoomKey;

    // Room info directory
    const roomDirectory = {
      'hallway': { loc: '중앙 허브', friend: '모든 구역 연결', friendIcon: '🚪' },
      'classroom': { loc: '복도 위쪽 1번 문', friend: '2학년 교실 & 칠판', friendIcon: '📚' },
      'student_council': { loc: '복도 위쪽 2번 문', friend: '태오 & 지민 (학생회)', friendKey: 'taeo', friendIcon: '🏛️' },
      'broadcast': { loc: '복도 위쪽 3번 문', friend: '유나 (방송부)', friendKey: 'yuna', friendIcon: '🎙️' },
      'gym': { loc: '복도 왼쪽 문', friend: '체육관 & 운동 시설', friendIcon: '🏀' },
      'cafeteria': { loc: '복도 오른쪽 문', friend: '하은 (급식실)', friendKey: 'haeun', friendIcon: '🍱' },
      'counseling': { loc: '복도 아래쪽 1번 문', friend: '민우 (진로상담)', friendKey: 'minwoo', friendIcon: '💬' },
      'nurse': { loc: '복도 아래쪽 2번 문', friend: '진혁 (보건실)', friendKey: 'jinhyeuk', friendIcon: '🩺' },
      'club': { loc: '복도 아래쪽 3번 문', friend: '현서 (동아리실)', friendKey: 'hyunseo', friendIcon: '🎨' },
      'playground': { loc: '복도 중앙 아래 문', friend: '수아 (야외 운동장)', friendKey: 'sua', friendIcon: '⚽' },
      'core_chamber': { loc: '복도 왼쪽 구석 문', friend: '편견의 핵 (지하)', friendIcon: '🔮', requiresAct: 6 }
    };

    for (const [key, room] of Object.entries(rooms)) {
      if (key === 'core_chamber' && window.scenarioManager.currentAct < 6) continue;

      const isCurrent = (key === currentKey);
      const info = roomDirectory[key] || { loc: '교내 구역', friend: '친구' };

      let statusBadge = '';
      if (isCurrent) {
        statusBadge = `<span class="map-card-tag tag-current">🚩 현재 위치</span>`;
      } else if (info.friendKey) {
        const isResolved = window.scenarioManager.resolvedScenarios.includes(info.friendKey);
        if (isResolved) {
          statusBadge = `<span class="map-card-tag tag-done">✔ 해결 완료</span>`;
        } else {
          statusBadge = `<span class="map-card-tag tag-quest">❓ 고민 중</span>`;
        }
      }

      const card = document.createElement('div');
      card.className = `map-location-card ${isCurrent ? 'current-location' : ''}`;
      card.innerHTML = `
        <div class="map-card-header">
          <span class="map-card-icon">${room.icon}</span>
          <span class="map-card-name">${room.name}</span>
          ${statusBadge}
        </div>
        <div class="map-card-body">
          <div class="map-card-loc">📍 <b>위치:</b> ${info.loc}</div>
          <div class="map-card-friend">${info.friendIcon} <b>주요 인물/시설:</b> ${info.friend}</div>
        </div>
      `;

      grid.appendChild(card);
    }
  }

  warpToRoom(roomKey) {
    const spawn = window.mapEngine.switchRoom(roomKey);
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

      this.showToast(`🚪 ${window.mapEngine.getCurrentRoom().name}에 도착했습니다.`, '#2ed573');
    }
  }

  // --------------------------------------------------------------------------
  // Interaction & Dialogue System (STRICT 1-TIME ONLY!)
  // --------------------------------------------------------------------------
  tryInteract() {
    const player = window.entityManager.player;
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
    this.isDialogueActive = true;
    this.currentNPC = npc;

    const scenario = window.scenarioManager.scenarios[npc.scenarioKey];
    if (!scenario) return;

    // Check if this NPC's mission has already been cleared!
    const isAlreadyResolved = window.scenarioManager.resolvedScenarios.includes(npc.scenarioKey);

    let dialogueNode = scenario.dialogues.initial;
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
    const nImg = document.getElementById('standing-npc-img');
    if (nImg) {
      nImg.src = `assets/images/${portraitKey}_standing.png`;
      nImg.onerror = () => { nImg.src = 'assets/images/sua_standing.png'; };
    }
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
    this.isTyping = true;
    const textEl = document.getElementById('dialogue-text');
    const choicesEl = document.getElementById('dialogue-choices');
    const promptEl = document.getElementById('dialogue-next-prompt');

    if (textEl) textEl.textContent = '';
    if (choicesEl) choicesEl.innerHTML = '';
    if (promptEl) promptEl.classList.add('hidden');

    let idx = 0;
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    this.typewriterTimer = setInterval(() => {
      if (idx < fullText.length) {
        if (textEl) textEl.textContent += fullText.charAt(idx);
        if (idx % 2 === 0 && window.soundEngine) {
          window.soundEngine.playDialogueBlip();
        }
        idx++;
      } else {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
        if (onComplete) onComplete();
      }
    }, 18);
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

    choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.innerHTML = `<span class="choice-num">◈ ${i + 1}.</span> <span>${c.text}</span>`;
      btn.onclick = () => {
        this.handleChoiceSelect(npcKey, c);
      };
      choicesEl.appendChild(btn);
    });
  }

  handleChoiceSelect(npcKey, choice) {
    const scenario = window.scenarioManager.scenarios[npcKey];

    // Apply choice (returns false if already resolved!)
    const isApplied = window.scenarioManager.applyChoice(npcKey, choice);
    if (!isApplied) {
      this.closeDialogue();
      return;
    }

    if (window.soundEngine) {
      window.soundEngine.playStatUp();
    }

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
      rewardText.innerHTML = `
        <div style="font-size:1.15rem; color:#1a3b68; margin-bottom:8px;">
          <b>${scenario ? scenario.name : '친구'}</b>의 고민을 멋진 양성평등 가치로 해결했습니다!
        </div>
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

  closeDialogue() {
    this.isDialogueActive = false;
    const box = document.getElementById('dialogue-box');
    if (box) box.classList.add('hidden');
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

    mission.options.forEach(opt => {
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
          this.showToast(`❌ 아쉬워요! 성별 고정관념을 강화하는 생각입니다. 다시 생각해보세요.`, '#ff4757');
        }
      };

      optionsContainer.appendChild(btn);
    });
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

    // Smooth Camera Follow Player
    if (player) {
      const targetCamX = player.x + 16 - this.canvas.width / 2;
      const targetCamY = player.y + 16 - this.canvas.height / 2;
      this.camera.x += (targetCamX - this.camera.x) * 0.12;
      this.camera.y += (targetCamY - this.camera.y) * 0.12;
    }

    // Render Frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Map Tiles & Props
    window.mapEngine.render(this.ctx, this.camera);

    // 2. NPCs
    roomNPCs.forEach(npc => npc.render(this.ctx, this.camera));

    // 3. Player
    if (player) {
      player.render(this.ctx, this.camera);
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Global Toast function
window.showGameToast = function(msg, color) {
  if (window.gameApp) window.gameApp.showToast(msg, color);
};

// Initialize Application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
