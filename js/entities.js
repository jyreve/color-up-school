/**
 * COLOR UP SCHOOL - Player & NPC Entity Engine
 * Handles player movement physics, collision, proximity auto-dialogue detection, and NPC population.
 */

class Entity {
  constructor(x, y, charData) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.charData = charData;
    this.direction = 'down';
    this.frame = 0;
    this.animTimer = 0;
    this.isMoving = false;
  }

  updateAnim(dt) {
    if (this.isMoving) {
      this.animTimer += dt;
      if (this.animTimer > 0.12) {
        this.frame = (this.frame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.frame = 0;
    }
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    window.spriteManager.drawCharacter(ctx, screenX, screenY, this.charData, this.direction, this.frame, this.isInteracting);
  }
}

// ----------------------------------------------------------------------------
// Player Entity Class (Ruda)
// ----------------------------------------------------------------------------
class Player extends Entity {
  constructor(x, y) {
    super(x, y, {
      name: '루다',
      isRuda: true,
      skinColor: '#f6d8b8',
      hairColor: '#3d2314', // Warm Rich Brown
      hairType: 'ruda_bob',
      jacketColor: '#1c2e4a', // Navy Blazer
      skirtColor: '#1c2e4a',
      tieColor: '#e58e26'
    });
    this.name = '루다';
    this.speed = 175; // pixels per second
    this.targetPos = null; // for touch-to-move / click-to-move
    this.inputVector = { x: 0, y: 0 };
    this.lastNearNPC = null;
    this.autoDialogueCooldown = 0;
  }

  setAvatarStyle(styleId) {
    if (styleId === '1') {
      // Style 1: Official Ruda (from player_standing.png)
      this.charData = {
        name: this.name,
        isRuda: true,
        skinColor: '#f6d8b8',
        hairColor: '#3d2314',
        hairType: 'ruda_bob',
        jacketColor: '#1c2e4a',
        skirtColor: '#1c2e4a',
        tieColor: '#e58e26'
      };
    } else if (styleId === '2') {
      // Style 2: Coral Pink Cardigan
      this.charData = {
        name: this.name,
        isRuda: false,
        skinColor: '#fed7b2',
        hairColor: '#d63031',
        hairType: 'ponytail',
        jacketColor: '#e84393',
        pantsColor: '#2d3436',
        skirtColor: '#2d3436'
      };
    } else {
      // Style 3: Mint Teal Blazer
      this.charData = {
        name: this.name,
        isRuda: false,
        skinColor: '#ffeaa7',
        hairColor: '#2c3e50',
        hairType: 'glasses',
        jacketColor: '#10ac84',
        pantsColor: '#2d3436',
        skirtColor: '#2d3436'
      };
    }
  }

  update(dt, mapEngine) {
    this.isMoving = false;
    let vx = 0;
    let vy = 0;

    if (this.autoDialogueCooldown > 0) {
      this.autoDialogueCooldown -= dt;
    }

    // 1. Joystick / Keyboard Input Vector
    if (Math.abs(this.inputVector.x) > 0.05 || Math.abs(this.inputVector.y) > 0.05) {
      vx = this.inputVector.x * this.speed;
      vy = this.inputVector.y * this.speed;
      this.targetPos = null; // joystick/keys override click-to-move
    } 
    // 2. Click / Touch-to-move target
    else if (this.targetPos) {
      const dx = this.targetPos.x - (this.x + 16);
      const dy = this.targetPos.y - (this.y + 16);
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        vx = (dx / dist) * this.speed;
        vy = (dy / dist) * this.speed;
      } else {
        this.targetPos = null;
      }
    }

    // Determine Direction
    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 5) this.direction = 'right';
      else if (vx < -5) this.direction = 'left';
    } else {
      if (vy > 5) this.direction = 'down';
      else if (vy < -5) this.direction = 'up';
    }

    // Collision & Movement with Map
    if (vx !== 0 || vy !== 0) {
      this.isMoving = true;
      const nextX = this.x + vx * dt;
      const nextY = this.y + vy * dt;

      // X-axis check
      if (!mapEngine.isBlocked(nextX + 8, this.y + 16) && !mapEngine.isBlocked(nextX + 24, this.y + 16) &&
          !mapEngine.isBlocked(nextX + 8, this.y + 28) && !mapEngine.isBlocked(nextX + 24, this.y + 28)) {
        this.x = nextX;
      }

      // Y-axis check
      if (!mapEngine.isBlocked(this.x + 8, nextY + 16) && !mapEngine.isBlocked(this.x + 24, nextY + 16) &&
          !mapEngine.isBlocked(this.x + 8, nextY + 28) && !mapEngine.isBlocked(this.x + 24, nextY + 28)) {
        this.y = nextY;
      }
    }

    this.updateAnim(dt);
  }
}

// ----------------------------------------------------------------------------
// NPC Entity Class
// ----------------------------------------------------------------------------
class NPC extends Entity {
  constructor(key, x, y, roomKey, charData, scenarioKey) {
    super(x, y, charData);
    this.key = key;
    this.roomKey = roomKey;
    this.scenarioKey = scenarioKey;
    this.emoteType = 'quest';
    this.hasQuest = true;
  }

  update(dt, playerPos) {
    // Look at player if player is nearby
    const dx = playerPos.x - this.x;
    const dy = playerPos.y - this.y;
    const dist = Math.hypot(dx, dy);

    // 플레이어가 멀리 있으면 제자리에서 두리번거리며 살짝 서성임
    if (this.home === undefined) this.home = { x: this.x, y: this.y };
    this.idleT = (this.idleT || 0) - dt;
    if (dist >= 80) {
      if (this.idleT <= 0) {
        this.idleT = 2 + Math.random() * 3;
        this.idleTarget = { x: this.home.x + (Math.random() - 0.5) * 36, y: this.home.y + (Math.random() - 0.5) * 16 };
        this.direction = Math.random() < 0.5 ? 'left' : 'right';
      }
      if (this.idleTarget) {
        const tx = this.idleTarget.x - this.x, ty = this.idleTarget.y - this.y, d = Math.hypot(tx, ty);
        if (d > 1.5) {
          this.x += tx / d * 22 * dt; this.y += ty / d * 22 * dt;
          this.isMoving = true; this.direction = tx < 0 ? 'left' : 'right';
        } else this.isMoving = false;
      }
    } else this.isMoving = false;

    if (dist < 80) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.direction = dy > 0 ? 'down' : 'up';
      }
    }

    this.updateAnim(dt);
  }
}

// ----------------------------------------------------------------------------
// Entity Manager
// ----------------------------------------------------------------------------
class EntityManager {
  constructor() {
    this.player = new Player(13.1 * 32, 8.4 * 32);
    this.npcs = this.initNPCs();
  }

  initNPCs() {
    return [
      new NPC('sua', 14 * 32, 8 * 32, 'playground', {
        name: '수아', isNPC: true, hasQuest: true, scenarioKey: 'sua', skinColor: '#fed7b2', hairColor: '#d63031', jacketColor: '#e17055', pantsColor: '#2d3436', hairType: 'ponytail'
      }, 'sua'),

      new NPC('minwoo', 8 * 32, 6 * 32, 'counseling', {
        name: '민우', isNPC: true, hasQuest: true, scenarioKey: 'minwoo', skinColor: '#ffeaa7', hairColor: '#6c5ce7', jacketColor: '#a29bfe', pantsColor: '#2d3436', hairType: 'neat'
      }, 'minwoo'),

      new NPC('jinhyeuk', 4 * 32, 6 * 32, 'nurse', {
        name: '진혁', isNPC: true, hasQuest: true, scenarioKey: 'jinhyeuk', skinColor: '#fab1a0', hairColor: '#2d3436', jacketColor: '#00cec9', pantsColor: '#2d3436', hairType: 'sporty'
      }, 'jinhyeuk'),

      new NPC('haeun', 9 * 32, 6 * 32, 'cafeteria', {
        name: '하은', isNPC: true, hasQuest: true, scenarioKey: 'haeun', skinColor: '#f6d8b8', hairColor: '#fd79a8', jacketColor: '#e84393', pantsColor: '#636e72', hairType: 'twintail'
      }, 'haeun'),

      new NPC('taeo', 7 * 32, 6 * 32, 'student_council', {
        name: '태오', isNPC: true, hasQuest: true, scenarioKey: 'taeo', skinColor: '#ffeaa7', hairColor: '#2c3e50', jacketColor: '#1e272e', pantsColor: '#2d3436', hairType: 'glasses'
      }, 'taeo'),

      // 지민: 태오와 함께 학생회실에 (대화는 '태오 & 지민' 장면)
      new NPC('jimin', 8 * 32, 6 * 32, 'classroom', {
        name: '지민', isNPC: true, hasQuest: true, scenarioKey: 'jimin'
      }, 'jimin'),

      new NPC('doyun', 10 * 32, 8 * 32, 'gym', {
        name: '도윤', isNPC: true, hasQuest: true, scenarioKey: 'doyun', skinColor: '#f6d8b8', hairColor: '#3d2314', jacketColor: '#1c2e4a', pantsColor: '#2d3436', hairType: 'short'
      }, 'doyun'),

      new NPC('seoyeon', 16 * 32, 9 * 32, 'hallway', {
        name: '서연', isNPC: true, hasQuest: true, scenarioKey: 'seoyeon', skinColor: '#fed7b2', hairColor: '#5a3825', jacketColor: '#1c2e4a', pantsColor: '#2d3436', hairType: 'bob'
      }, 'seoyeon'),

      new NPC('yuna', 6 * 32, 6 * 32, 'broadcast', {
        name: '유나', isNPC: true, hasQuest: true, scenarioKey: 'yuna', skinColor: '#fed7b2', hairColor: '#8e44ad', jacketColor: '#9b59b6', pantsColor: '#2d3436', hairType: 'bob'
      }, 'yuna'),

      new NPC('hyunseo', 6 * 32, 6 * 32, 'club', {
        name: '현서', isNPC: true, hasQuest: true, scenarioKey: 'hyunseo', skinColor: '#ffeaa7', hairColor: '#16a085', jacketColor: '#1abc9c', pantsColor: '#2d3436', hairType: 'short'
      }, 'hyunseo')
    ];
  }

  getNPCsInRoom(roomKey) {
    return this.npcs.filter(npc => npc.roomKey === roomKey);
  }

  // Check proximity for Auto-Dialogue when walking near NPC
  checkProximity(currentRoomKey) {
    const roomNPCs = this.getNPCsInRoom(currentRoomKey);
    const pX = this.player.x + 16;
    const pY = this.player.y + 16;

    for (const npc of roomNPCs) {
      const nX = npc.x + 16;
      const nY = npc.y + 16;
      const dist = Math.hypot(pX - nX, pY - nY);

      // Within 46px proximity radius
      if (dist < 46) {
        return npc;
      }
    }
    return null;
  }
}

// ----------------------------------------------------------------------------
// 👥 엑스트라 학생들: 방마다 돌아다니며 혼잣말 (친구를 도우면 말이 바뀜)
//   그림: assets/images/chibi_extra1.png ~ chibi_extra8.png (없으면 안 보임)
// ----------------------------------------------------------------------------
const CROWD_COUNT = { hallway: 6, classroom: 5, student_council: 3, playground: 6, broadcast: 2, cafeteria: 6, nurse: 2, counseling: 2, club: 4, gym: 5 };
const CROWD_LINES = {
  hallway: { before: ['집안일은 엄마 몫이지~', '남자는 집안일 안 해도 돼 ㅋㅋ', '오늘 급식 뭐야?'], after: ['우리 집도 당번표 만들었어!', '오늘 설거지는 내 차례야', '방과후 같이 갈래?'] },
  classroom: { before: ['반장은 남자가 해야지~', '여자는 부반장이 딱이야', '숙제 했어?'], after: ['지민이 공약 진짜 좋더라!', '학급회의 기대된다', '숙제 같이 하자!'] },
  student_council: { before: ['짐은 남자들이 옮겨~', '포스터는 여자애들이 해'], after: ['나 포스터 그리고 싶어!', '같이 무대 설치하자!'] },
  playground: { before: ['여자가 무슨 축구야~', '여자애들은 피구나 해', '공 이리 줘!'], after: ['수아 슛 봤어?!', '다 같이 축구하자!', '패스 패스~!'] },
  broadcast: { before: ['그 밈 봤어? ㅋㅋ', '예민하게 굴지 마~'], after: ['캠페인 방송 멋있었어', '단톡방이 깨끗해졌어'] },
  cafeteria: { before: ['너 살찐 것 같아 ㅋㅋ', '여자는 조금만 먹어야지', '오늘 반찬 별로다'], after: ['오늘 급식 맛있다!', '한 그릇 더 먹어야지', '같이 먹자~'] },
  nurse: { before: ['남자가 그걸로 울어?', '참아, 남자잖아'], after: ['아프면 쉬어야지', '보건 쌤 최고!'] },
  counseling: { before: ['남자가 유치원 선생님?', '돈 되는 직업 해야지'], after: ['민우 꿈 멋지다!', '나도 내 꿈 적어볼래'] },
  club: { before: ['여자가 공학은 어렵지', '간호는 여자 일 아냐?'], after: ['로봇 대박이다!', '나도 동아리 들어갈래'] },
  gym: { before: ['남자가 무슨 걸그룹 춤?', '남자는 농구나 해~', '공 던져!'], after: ['도윤이 춤 짱이야!', '축제 무대 꼭 볼게!', '나이스 슛~!'] }
};

class CrowdManager {
  constructor() { this.byRoom = {}; this.talkT = 2; }

  randomSpot(mapEngine, room) {
    for (let i = 0; i < 60; i++) {
      const x = 32 + Math.random() * (room.width * 32 - 96);
      const y = 32 + Math.random() * (room.height * 32 - 96);
      if (this.free(mapEngine, x, y)) return { x, y };
    }
    return null;
  }

  free(mapEngine, x, y) {
    return !mapEngine.isSolid(x + 8, y + 28) && !mapEngine.isSolid(x + 24, y + 28) && !mapEngine.isSolid(x + 16, y + 20);
  }

  getCrowd(roomKey, mapEngine) {
    if (this.byRoom[roomKey]) return this.byRoom[roomKey];
    const room = mapEngine.rooms[roomKey];
    const list = [];
    const n = CROWD_COUNT[roomKey] || 0;
    for (let i = 0; i < n && room; i++) {
      const sp = this.randomSpot(mapEngine, room);
      if (!sp) continue;
      list.push({ x: sp.x, y: sp.y, skin: 'extra' + (1 + ((i + roomKey.length) % 8)), dir: Math.random() < 0.5 ? 'left' : 'right',
        frame: 0, animT: 0, wait: Math.random() * 3, target: null, say: null, sayT: 0 });
    }
    // 방마다 첫 번째 학생 = 편견을 말한 친구 (💬 말 걸기 가능)
    if (list.length && typeof SIDE_TALKS !== 'undefined' && SIDE_TALKS[roomKey]) {
      list[0].talker = true; list[0].skin = SIDE_TALKS[roomKey].skin;
    }
    this.byRoom[roomKey] = list;
    return list;
  }

  talkerOf(roomKey) { return (this.byRoom[roomKey] || []).find(c => c.talker) || null; }

  update(dt, roomKey, mapEngine) {
    if (mapEngine.currentRoomKey !== roomKey) return;
    const list = this.getCrowd(roomKey, mapEngine);
    const room = mapEngine.getCurrentRoom();
    const pl = window.entityManager && window.entityManager.player;
    list.forEach(c => {
      if (c.sayT > 0) c.sayT -= dt;
      // 말 걸 친구는 플레이어가 다가오면 멈춰서 기다림
      if (c.talker && !c.talked && pl && Math.hypot(pl.x - c.x, pl.y - c.y) < 90) { c.frame = 0; c.dir = pl.x < c.x ? 'left' : 'right'; return; }
      if (c.wait > 0) { c.wait -= dt; c.frame = 0; return; }
      if (!c.target) {
        const sp = this.randomSpot(mapEngine, room);
        if (sp && Math.hypot(sp.x - c.x, sp.y - c.y) < 260) c.target = sp; else { c.wait = 0.5; return; }
      }
      const tx = c.target.x - c.x, ty = c.target.y - c.y, d = Math.hypot(tx, ty);
      if (d < 3) { c.target = null; c.wait = 1.5 + Math.random() * 4; c.frame = 0; return; }
      const sp = 38;
      const nx = c.x + tx / d * sp * dt, ny = c.y + ty / d * sp * dt;
      if (this.free(mapEngine, nx, ny)) { c.x = nx; c.y = ny; } else { c.target = null; c.wait = 0.4; return; }
      c.dir = tx < 0 ? 'left' : 'right';
      c.animT += dt; if (c.animT > 0.18) { c.animT = 0; c.frame = c.frame === 1 ? 2 : 1; }
    });

    // 가끔 한 명이 혼잣말
    this.talkT -= dt;
    if (this.talkT <= 0 && list.length) {
      this.talkT = 3 + Math.random() * 4;
      const lines = CROWD_LINES[roomKey];
      if (lines) {
        const sm = window.scenarioManager;
        const friend = (typeof ROOM_FRIEND !== 'undefined') ? ROOM_FRIEND[roomKey] : null;
        const changed = (friend && sm && sm.resolvedScenarios.includes(friend)) || (sm && sm.changedRooms && sm.changedRooms[roomKey]);
        const pool = changed ? lines.after : lines.before;
        const c = list[Math.floor(Math.random() * list.length)];
        c.say = pool[Math.floor(Math.random() * pool.length)];
        if (c.talker && !c.talked && typeof SIDE_TALKS !== 'undefined') { c.say = SIDE_TALKS[roomKey].line; }
        c.sayGood = !!changed;
        c.sayT = 3;
      }
    }
  }

  // 반환: 그릴 목록 (y 정렬을 위해 main에서 NPC와 섞어 그림)
  drawables(roomKey) {
    const sm = window.spriteManager;
    return (this.byRoom[roomKey] || []).filter(c => sm.chibi[c.skin]).map(c => ({
      y: c.y,
      render: (ctx, cam) => {
        sm.drawChibi(ctx, c.x - cam.x, c.y - cam.y, { chibiKey: c.skin, scale: 0.92 }, c.dir, c.frame);
        if (c.sayT > 0 && c.say) this.drawBubble(ctx, c.x - cam.x + 16, c.y - cam.y - 34, c.say, c.sayGood && !(c.talker && !c.talked), c.sayT);
        else if (c.talker && !c.talked) this.drawTalkMark(ctx, c.x - cam.x + 16, c.y - cam.y - 36);
      }
    }));
  }

  drawTalkMark(ctx, x, y) {
    const b = Math.sin(Date.now() / 220) * 2;
    ctx.save();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#7b6cff'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y + b, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💬', x, y + b + 0.5);
    ctx.restore();
  }

  drawBubble(ctx, x, y, text, good, t) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2, (3 - t) * 4);
    ctx.font = '800 9px Pretendard, sans-serif';
    const w = ctx.measureText(text).width + 14, h = 16;
    ctx.fillStyle = good ? '#fff0f6' : '#f1f1f4';
    ctx.strokeStyle = good ? '#ff6fa5' : '#8a8fa3';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h, w, h, 8); else ctx.rect(x - w / 2, y - h, w, h);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x + 3, y); ctx.fill();
    ctx.fillStyle = good ? '#c2255c' : '#4a4e5e';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - h / 2 + 0.5);
    ctx.restore();
  }
}
window.crowdManager = new CrowdManager();

// Global Entity Manager
window.entityManager = new EntityManager();
