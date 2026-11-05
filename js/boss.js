/**
 * COLOR UP SCHOOL - Boss Battle: Core of Prejudice (편견의 코어) Engine
 * Final confrontation against school-wide gender stereotypes using accumulated 5-stat energies.
 */

class BossBattleEngine {
  constructor() {
    this.bossHp = 100;
    this.maxHp = 100;
    this.orbitingPhrases = [
      '“남자는 울면 안 돼”',
      '“여학생은 운동을 못해”',
      '“여자는 외모가 스펙이야”',
      '“남자는 이런 직업이 어울려”',
      '“성별에 맞는 역할이 따로 있어”'
    ];
    this.isDefeated = false;
    // 보스 복습 퀴즈: 게임에서 나온 편견 문장 + 반박 (options[0]이 정답)
    this.rebuttals = [
      { quote: '남자는 울면 안 돼!', options: ['울고 싶을 땐 우는 게 마음을 지키는 거야.', '남자도 가끔은 울어도 돼, 남들 앞만 아니면.', '맞아, 우는 건 약해 보이긴 해.'], why: '"가끔은", "남들 앞만 아니면"도 결국 감정을 숨기라는 말이에요.' },
      { quote: '여자가 무슨 축구야, 피구나 해!', options: ['운동은 하고 싶은 사람이 하는 거야.', '여자도 축구할 수 있어, 다치지만 않으면.', '피구도 재밌으니까 괜찮잖아.'], why: '"다치지만 않으면"처럼 조건을 다는 것도 기회를 막는 말이에요.' },
      { quote: '반장은 남자가 해야 카리스마 있지.', options: ['리더십은 성별이 아니라 생각과 책임감이야.', '여자 반장도 남자처럼 세게 하면 돼.', '부반장도 중요한 자리니까 괜찮아.'], why: '"남자처럼 하면 돼"는 여전히 남자를 기준으로 삼는 말이에요.' },
      { quote: '여자는 예뻐야 대접받아.', options: ['사람의 가치는 외모로 정해지지 않아.', '넌 충분히 예쁘니까 걱정하지 마.', '요즘은 남자도 외모가 중요해.'], why: '"넌 예뻐"도 외모가 중요하다는 생각을 그대로 둬요.' },
      { quote: '집안일은 엄마랑 딸이 하는 거야.', options: ['집안일은 같이 사는 가족 모두의 일이야.', '딸이 엄마를 돕는 건 착한 일이야.', '오빠가 바쁘면 어쩔 수 없지.'], why: '"착한 딸"이라는 칭찬도 딸에게만 집안일을 기대하게 만들어요.' },
      { quote: '웃자고 올린 밈인데 예민하긴~', options: ['누군가를 성적으로 놀리는 건 장난이 아니야.', '좀 심하긴 한데 웃기긴 하다.', '나랑 상관없으니까 그냥 넘어가자.'], why: '웃고 넘기거나 모른 척하면 피해가 계속돼요.' },
      { quote: '남자가 무슨 유치원 선생님이야.', options: ['아이들을 돌보는 일에 남녀가 따로 없어.', '남자 선생님은 체육 담당하면 되겠다.', '남자니까 돈 많이 버는 직업도 생각해 봐.'], why: '성별에 따라 맡을 일이나 벌어야 할 돈을 정하는 것도 고정관념이에요.' },
      { quote: '여자가 공학은 어렵지.', options: ['좋아하는 분야에 도전하는 데 성별은 없어.', '여자가 공학 하면 특이해서 눈에 띌걸?', '간호 쪽이 더 잘 맞을 것 같아.'], why: '"여자인데 특이해"도 성별로 사람을 보는 말이에요.' },
      { quote: '남자가 걸그룹 춤은 좀…', options: ['춤은 좋아하는 사람이 추는 거야.', '춰도 되는데 남자다운 춤으로 바꿔 봐.', '들키지 않게 몰래 추면 돼.'], why: '"남자다운 춤"을 정해 주거나 숨기라는 것도 고정관념이에요.' }
    ];
  }

  startBattle() {
    this.bossHp = 100;
    this.isDefeated = false;
    
    // Switch Screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const bossScreen = document.getElementById('boss-battle-screen');
    bossScreen.classList.remove('hidden');
    bossScreen.classList.add('active');

    // Switch Audio
    if (window.soundEngine) {
      window.soundEngine.playBGM('boss');
    }

    // 보스 그림 (assets/images/boss.png)
    const core = document.getElementById('boss-core-element');
    if (core && !core.querySelector('.boss-img')) {
      const img = document.createElement('img');
      img.className = 'boss-img'; img.src = 'assets/images/boss.png'; img.alt = '편견의 코어';
      core.insertBefore(img, core.firstChild);
    }
    if (core) core.classList.remove('defeated');

    // Render Orbiting Phrases
    this.renderOrbitingPhrases();
    this.updateHpUI();

    const logEl = document.getElementById('boss-log-text');
    if (logEl) {
      logEl.innerHTML = '⚡ 학교 깊은 곳에서 [편견의 코어]가 요동칩니다! 수집한 5대 에너지를 발동해 고정관념의 장벽을 부수세요!';
    }

    // Reset Rainbow Burst button
    const burstBtn = document.getElementById('btn-rainbow-burst');
    if (burstBtn) burstBtn.disabled = true;

    this.bindEvents();
  }

  renderOrbitingPhrases() {
    const container = document.getElementById('orbiting-phrases-container');
    if (!container) return;
    container.innerHTML = '';

    const total = this.orbitingPhrases.length;
    this.orbitingPhrases.forEach((phrase, idx) => {
      const angle = (idx / total) * Math.PI * 2;
      // 보스 둘레에 타원으로 배치 (화면 크기에 맞춰)
      const core = document.getElementById('boss-core-element');
      const rx = core ? core.clientWidth * 0.55 : 150, ry = core ? core.clientHeight * 0.42 : 120;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;

      const bubble = document.createElement('div');
      bubble.className = 'phrase-bubble';
      bubble.id = `phrase-bubble-${idx}`;
      bubble.textContent = phrase;
      bubble.style.left = `calc(50% + ${x}px)`; bubble.style.transform = 'translate(-50%, 0)';
      bubble.style.top = `calc(50% + ${y}px - 14px)`;
      container.appendChild(bubble);
    });
  }

  bindEvents() {
    // 🧠 보스전 = 복습 퀴즈: 편견 문장에 알맞은 반박을 골라야 공격!
    this.quizDeck = this.shuffleArr(this.rebuttals.slice());
    this.quizRight = 0; this.quizWrong = 0;
    this.renderQuiz();
  }

  shuffleArr(a) { return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]); }

  renderQuiz() {
    let box = document.getElementById('boss-quiz');
    if (!box) {
      box = document.createElement('div');
      box.id = 'boss-quiz';
      document.querySelector('.boss-hud').appendChild(box);
    }
    if (this.isDefeated) { box.innerHTML = ''; return; }
    if (!this.quizDeck.length) this.quizDeck = this.shuffleArr(this.rebuttals.slice());
    const r = this.quizDeck.shift();
    const opts = this.shuffleArr(r.options.map((t, i) => ({ t, ok: i === 0 })));
    box.innerHTML = `<div class="bq-quote">👁️ 코어: <b>“${r.quote}”</b></div>
      <div class="bq-q">어떤 말로 반박할까?</div>
      <div class="bq-opts">${opts.map((o, i) => `<button class="bq-opt" data-i="${i}"><span class="choice-num">${i + 1}</span><span>${o.t}</span></button>`).join('')}</div>`;
    box.querySelectorAll('.bq-opt').forEach(btn => {
      btn.onclick = () => {
        const o = opts[+btn.dataset.i];
        box.querySelectorAll('.bq-opt').forEach(b => { b.disabled = true; if (opts[+b.dataset.i].ok) b.classList.add('right'); });
        if (o.ok) this.quizHit(r); else { btn.classList.add('wrong'); this.quizMiss(r); }
        setTimeout(() => this.renderQuiz(), o.ok ? 1300 : 2600);
      };
    });
  }

  quizHit(r) {
    this.quizRight++;
    const logEl = document.getElementById('boss-log-text');
    this.dealDamage(22, `✨ 정확한 반박! “${r.quote}” 편견이 깨졌어요!`);
    if (window.soundEngine && window.soundEngine.playBossHit) window.soundEngine.playBossHit();
  }

  quizMiss(r) {
    this.quizWrong++;
    this.bossHp = Math.min(this.maxHp, this.bossHp + 8);
    this.updateHpUI();
    const logEl = document.getElementById('boss-log-text');
    if (logEl) logEl.innerHTML = `💢 코어가 힘을 되찾았어요! (+8) 💡 ${r.why}`;
    const core = document.getElementById('boss-core-element');
    if (core) { core.classList.remove('heal'); void core.offsetWidth; core.classList.add('heal'); }
  }

  dealDamage(damage, msg) {
    if (this.isDefeated) return;
    this.bossHp = Math.max(0, this.bossHp - damage);
    this.updateHpUI();
    const coreEl = document.getElementById('boss-core-element');
    if (coreEl) {
      coreEl.classList.remove('hit'); void coreEl.offsetWidth; coreEl.classList.add('hit');
      const pop = document.createElement('div');
      pop.className = 'boss-dmg'; pop.textContent = `-${damage}`;
      pop.style.left = `${40 + Math.random() * 20}%`;
      coreEl.appendChild(pop); setTimeout(() => pop.remove(), 900);
      const alive = coreEl.querySelectorAll('.phrase-bubble:not(.broken)');
      const shouldRemain = Math.ceil(this.bossHp / this.maxHp * this.orbitingPhrases.length);
      for (let i = 0; i < alive.length - shouldRemain; i++) alive[i].classList.add('broken');
    }
    const logEl = document.getElementById('boss-log-text');
    if (logEl) logEl.textContent = msg;
    if (this.bossHp <= 0) {
      if (coreEl) coreEl.classList.add('defeated');
      this.onVictory();
    }
  }

  useSkill(skillType) {
    if (this.isDefeated) return;

    const logEl = document.getElementById('boss-log-text');
    const stats = window.scenarioManager.playerStats;
    let damage = 25;
    let logMessage = '';

    if (skillType === 'courage') {
      damage = Math.round(20 + (stats.courage / 100) * 15);
      logMessage = `🦁 [용기의 외침!] "침묵하지 않고 진실을 말한다!" 편견의 코어에 ${damage}의 정화 충격을 가했습니다!`;
      this.removePhrase('“남자는 울면 안 돼”');
      if (window.soundEngine) window.soundEngine.playBossHit();
    } else if (skillType === 'empathy') {
      damage = Math.round(20 + (stats.empathy / 100) * 15);
      logMessage = `💖 [공감의 방패!] "상처받은 마음에 다가선다!" 편견의 장벽을 ${damage} 정화했습니다!`;
      this.removePhrase('“여자는 외모가 스펙이야”');
      if (window.soundEngine) window.soundEngine.playBossHit();
    } else if (skillType === 'respect') {
      damage = Math.round(20 + (stats.respect / 100) * 15);
      logMessage = `🤝 [존중의 빛!] "다양성을 있는 그대로 포용한다!" 코어의 균열에 ${damage}의 빛을 비췄습니다!`;
      this.removePhrase('“성별에 맞는 역할이 따로 있어”');
      if (window.soundEngine) window.soundEngine.playBossHit();
    } else if (skillType === 'opportunity') {
      damage = Math.round(20 + (stats.opportunity / 100) * 15);
      logMessage = `🌟 [기회의 열쇠!] "누구에게나 공평한 문을 열어준다!" 고정관념을 ${damage} 해체했습니다!`;
      this.removePhrase('“여학생은 운동을 못해”');
      if (window.soundEngine) window.soundEngine.playBossHit();
    } else if (skillType === 'freedom') {
      damage = Math.round(20 + (stats.freedom / 100) * 15);
      logMessage = `🕊️ [자유의 날개!] "나다운 꿈을 가로막는 틀을 부순다!" 코어의 결속력을 ${damage} 파괴했습니다!`;
      this.removePhrase('“남자는 이런 직업이 어울려”');
      if (window.soundEngine) window.soundEngine.playBossHit();
    } else if (skillType === 'rainbow') {
      damage = 100;
      logMessage = `🌈 [양성평등 프리즘 버스트!!] 용기·공감·존중·기회·자유의 5대 에너지가 찬란한 무지개 빛으로 폭발하며 코어를 완전히 정화합니다!`;
      if (window.soundEngine) window.soundEngine.playPurifyLaser();
    }

    this.bossHp = Math.max(0, this.bossHp - damage);
    this.updateHpUI();

    // Trigger visual screen shake on Core
    const coreEl = document.getElementById('boss-core-element');
    if (coreEl) {
      coreEl.classList.remove('hit'); void coreEl.offsetWidth; coreEl.classList.add('hit');
      const pop = document.createElement('div');
      pop.className = 'boss-dmg'; pop.textContent = `-${damage}`;
      pop.style.left = `${40 + Math.random() * 20}%`;
      coreEl.appendChild(pop); setTimeout(() => pop.remove(), 900);
      // 맞은 편견 말풍선 하나가 깨져서 사라짐
      const alive = coreEl.querySelectorAll('.phrase-bubble:not(.broken)');
      const ratio = this.bossHp / this.maxHp;
      const shouldRemain = Math.ceil(ratio * this.orbitingPhrases.length);
      for (let i = 0; i < alive.length - shouldRemain; i++) alive[i].classList.add('broken');
    }

    if (logEl) logEl.textContent = logMessage;

    // Enable Rainbow Burst when HP is low
    if (this.bossHp <= 40 && this.bossHp > 0) {
      const burstBtn = document.getElementById('btn-rainbow-burst');
      if (burstBtn) {
        burstBtn.disabled = false;
        burstBtn.classList.add('pulse-btn');
      }
    }

    // Check Victory
    if (this.bossHp <= 0) {
      if (coreEl) coreEl.classList.add('defeated');
      this.onVictory();
    }
  }

  removePhrase(targetPhrase) {
    const idx = this.orbitingPhrases.indexOf(targetPhrase);
    if (idx !== -1) {
      const el = document.getElementById(`phrase-bubble-${idx}`);
      if (el) {
        el.style.transform = 'scale(1.5)';
        el.style.opacity = '0';
        el.style.transition = 'all 0.5s ease-out';
        setTimeout(() => el.remove(), 500);
      }
    }
  }

  updateHpUI() {
    const bar = document.getElementById('boss-hp-bar');
    const txt = document.getElementById('boss-hp-text');
    if (bar) bar.style.width = `${this.bossHp}%`;
    if (txt) txt.textContent = `${this.bossHp} / ${this.maxHp}`;
  }

  onVictory() {
    this.isDefeated = true;
    // 부서진 코어가 무지개 구름으로 변신
    setTimeout(() => {
      const core = document.getElementById('boss-core-element');
      const img = core && core.querySelector('.boss-img');
      if (img) { core.classList.remove('defeated'); img.src = 'assets/images/boss_clear.png'; img.classList.add('cleared'); }
      document.querySelectorAll('.phrase-bubble').forEach(b => b.classList.add('broken'));
    }, 1500);
    const logEl = document.getElementById('boss-log-text');
    if (logEl) {
      logEl.innerHTML = '✨ <b>편견과 고정관념의 코어가 찬란한 빛으로 승화되었습니다! 학교 전체에 완벽한 색채가 돌아옵니다!</b>';
    }

    // Set 100% full color to school
    window.scenarioManager.colorProgress = 100;
    window.scenarioManager.updateColorProgress();

    if (window.soundEngine) {
      window.soundEngine.playColorRestore();
      window.soundEngine.playBGM('victory');
    }

    // Transition to Ending Screen after 2.5 seconds
    setTimeout(() => {
      if (window.endingEngine) {
        window.endingEngine.showEnding();
      }
    }, 2400);
  }
}

// Global Boss Battle Instance
window.bossEngine = new BossBattleEngine();
