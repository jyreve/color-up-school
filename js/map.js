/**
 * COLOR UP SCHOOL - Map & Room Layout Engine
 * 방마다 고유한 색·바닥·벽 장식·분위기 파티클을 가지며,
 * 그 방 친구의 고민을 해결하면 방에 색이 퍼지듯 돌아온다.
 */

// 방에서 고민을 가진 친구 (해결하면 그 방이 컬러로 돌아옴)
const ROOM_FRIEND = {
  playground: 'sua', counseling: 'minwoo', nurse: 'jinhyeuk', cafeteria: 'haeun',
  student_council: 'taeo', broadcast: 'yuna', club: 'hyunseo',
  classroom: 'jimin', gym: 'doyun', hallway: 'seoyeon'
};

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];

// 방별 색과 분위기
const ROOM_STYLE = {
  hallway:         { accent: '#7ec8ff', ambient: 'dust' },
  classroom:       { accent: '#ffd36b', ambient: 'chalk' },
  playground:      { accent: '#6ee7a8', ambient: 'leaf' },
  counseling:      { accent: '#ffb36b', ambient: 'dust' },
  core_chamber:    { accent: '#a55eea', ambient: 'sparkle', floor: '#1b1026', floor2: '#26163a', floorType: 'tiles', wall: '#3b1450' },
  gym:             { accent: '#ff8a3d', ambient: 'dust',    floor: '#d9a066', floor2: '#d29659', floorType: 'planks', wall: '#2f3b57', windows: [3, 14] },
  cafeteria:       { accent: '#ff9f68', ambient: 'steam',   floor: '#f6f0e4', floor2: '#ebe1cd', floorType: 'tiles',  wall: '#f0a96b', windows: [1.5], source: { x: 5, y: 1.6, w: 4 } },
  nurse:           { accent: '#2ec4a5', ambient: 'plus',    floor: '#f2fbf8', floor2: '#e0f3ed', floorType: 'smalltiles', wall: '#8fd3c3', windows: [7] },
  broadcast:       { accent: '#b06bff', ambient: 'note',    floor: '#3a3656', floor2: '#454066', floorType: 'carpet', wall: '#221f38' },
  club:            { accent: '#ff6f61', ambient: 'paint',   floor: '#efcf9f', floor2: '#e8c592', floorType: 'planks', wall: '#f7b2a0', windows: [7.5] },
  student_council: { accent: '#f5c542', ambient: 'sparkle', floor: '#eef2f8', floor2: '#e3e9f3', floorType: 'planks', wall: '#24335e', windows: [] }
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWindow(ctx, x, y, w, h, st) {
  ctx.fillStyle = '#f4efe6'; roundRect(ctx, x, y, w, h, 3); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#8fd0ff'); g.addColorStop(1, '#d8f0ff');
  ctx.fillStyle = g; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h * 0.45, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4efe6'; ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.moveTo(x + 6, y + h - 3); ctx.lineTo(x + 14, y + 3); ctx.lineTo(x + 19, y + 3); ctx.lineTo(x + 11, y + h - 3); ctx.fill();
}

function drawHeart(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx - s, cy - s * 0.3, cx - s * 0.45, cy - s, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.45, cy - s, cx + s, cy - s * 0.3, cx, cy + s * 0.35);
  ctx.fill();
}


// ============================================================================
// 🗺️ 지도 그림(map_*.jpg)에 맞춘 방 배치 — 모든 좌표는 "그림 속 픽셀" 기준
//   walk   : 걸어 다닐 수 있는 바닥 (다각형)
//   blocks : 못 지나가는 가구 [x0, y0, x1, y1]
//   doors  : 문 앞 바닥 위치 [x, y]
//   npcs   : 친구가 서 있는 위치
// ============================================================================
const MAP_LAYOUTS = {
  hallway: {
    name: '1층 중앙 로비', img: 'map_hallway.jpg', w: 1536, h: 1024, tiles: [24, 16],
    walk: [[240, 262], [1300, 262], [1385, 330], [1385, 740], [270, 740], [175, 650], [175, 320]],
    blocks: [],
    doors: [
      { at: [330, 278], to: 'classroom', label: '2학년 3반 교실' },
      { at: [515, 278], to: 'student_council', label: '학생회실' },
      { at: [765, 278], to: 'playground', label: '운동장' },
      { at: [1020, 278], to: 'broadcast', label: '방송실' },
      { at: [200, 390], to: 'gym', label: '체육관' },
      { at: [1360, 375], to: 'cafeteria', label: '급식실' },
      { at: [395, 700], to: 'counseling', label: '진로상담실' },
      { at: [770, 700], to: 'nurse', label: '보건실' },
      { at: [1120, 700], to: 'club', label: '동아리실' },
      { at: [245, 640], to: 'core_chamber', label: '지하 특별실', requiresAct: 6 }
    ],
    posters: [{ at: [1210, 285], biasId: 'bias_hallway_1' }],
    npcs: { seoyeon: [1080, 520] },
    spawn: [765, 520]
  },
  classroom: {
    name: '2학년 3반 교실', img: 'map_classroom.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[150, 330], [1300, 330], [1300, 925], [150, 925]],
    blocks: [[205, 330, 565, 845], [885, 330, 1235, 845], [640, 225, 800, 345]],
    doors: [{ at: [720, 870], to: 'hallway', label: '복도로 나가기' }],
    posters: [{ at: [850, 360], biasId: 'bias_class_1' }],
    npcs: { jimin: [720, 560] },
    spawn: [720, 840]
  },
  student_council: {
    name: '학생자치회실', img: 'map_council.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[120, 300], [1340, 300], [1340, 860], [110, 860]],
    blocks: [[360, 210, 1080, 510], [20, 130, 270, 480], [1050, 150, 1400, 590], [60, 630, 415, 840], [1035, 630, 1400, 840], [0, 500, 135, 690], [1300, 500, 1448, 690]],
    doors: [{ at: [722, 812], to: 'hallway', label: '복도로 나가기' }],
    npcs: { taeo: [720, 600] },
    spawn: [722, 780]
  },
  club: {
    name: '과학 동아리실', img: 'map_club.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[70, 300], [1380, 300], [1380, 1000], [70, 1000]],
    blocks: [[150, 385, 515, 585], [930, 385, 1295, 585], [105, 635, 505, 865], [945, 645, 1305, 865], [150, 190, 525, 305], [920, 185, 1295, 305], [520, 170, 605, 310], [815, 170, 900, 310], [300, 905, 1120, 1086], [0, 890, 175, 1086], [1265, 890, 1448, 1086]],
    doors: [{ at: [735, 315], to: 'hallway', label: '복도로 나가기' }],
    npcs: { hyunseo: [735, 720] },
    spawn: [735, 400]
  },
  broadcast: {
    name: '교내 방송실', img: 'map_broadcast.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[130, 440], [1330, 440], [1330, 965], [130, 965]],
    blocks: [[110, 400, 330, 710], [80, 590, 210, 720], [80, 750, 320, 1010], [1130, 300, 1260, 490], [1170, 440, 1320, 670], [1250, 650, 1370, 790], [1120, 690, 1350, 930]],
    doors: [{ at: [735, 910], to: 'hallway', label: '복도로 나가기' }],
    npcs: { yuna: [735, 610] },
    spawn: [735, 870]
  },
  nurse: {
    name: '보건실', img: 'map_nurse.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[100, 320], [1350, 320], [1350, 1000], [100, 1000]],
    blocks: [[90, 200, 505, 705], [40, 730, 515, 1010], [0, 690, 145, 1010], [940, 140, 1265, 405], [1210, 350, 1345, 490], [950, 555, 1385, 885], [1040, 790, 1150, 910], [1280, 810, 1430, 1010], [470, 190, 555, 325], [865, 190, 955, 325]],
    doors: [{ at: [735, 335], to: 'hallway', label: '복도로 나가기' }],
    posters: [{ at: [585, 340], biasId: 'bias_nurse_1' }],
    npcs: { jinhyeuk: [640, 650] },
    spawn: [735, 430]
  },
  cafeteria: {
    name: '학생 식당 (급식실)', img: 'map_cafeteria.jpg', w: 1536, h: 1024, tiles: [24, 16],
    walk: [[150, 310], [1400, 310], [1420, 880], [150, 880]],
    blocks: [[305, 365, 715, 585], [845, 365, 1245, 585], [305, 605, 705, 825], [845, 605, 1245, 825], [1345, 320, 1445, 625], [125, 435, 215, 565], [0, 655, 145, 870]],
    doors: [{ at: [225, 640], to: 'hallway', label: '복도로 나가기' }],
    npcs: { haeun: [780, 480] },
    spawn: [260, 650]
  },
  gym: {
    name: '실내 체육관', img: 'map_gym.jpg', w: 1536, h: 1024, tiles: [24, 16],
    walk: [[90, 305], [1470, 305], [1470, 880], [90, 880]],
    blocks: [[55, 395, 205, 645], [1255, 395, 1335, 645]],
    doors: [{ at: [1420, 600], to: 'hallway', label: '복도로 나가기' }],
    posters: [],
    npcs: { doyun: [760, 600] },
    spawn: [1360, 640]
  },
  playground: {
    name: '운동장', img: 'map_playground.jpg', w: 1536, h: 1024, tiles: [24, 16],
    walk: [[220, 330], [1320, 330], [1320, 880], [220, 880]],
    blocks: [[40, 510, 225, 770]],
    doors: [{ at: [765, 335], to: 'hallway', label: '본관으로 들어가기' }],
    posters: [{ at: [440, 380], biasId: 'bias_gym_1' }],
    npcs: { sua: [765, 565] },
    spawn: [765, 430]
  },
  counseling: {
    name: '진로상담실', img: 'map_counseling.jpg', w: 1448, h: 1086, tiles: [20, 15],
    walk: [[135, 340], [1320, 340], [1320, 870], [135, 870]],
    blocks: [[500, 280, 810, 395], [880, 250, 1000, 385], [120, 80, 380, 330], [1080, 80, 1340, 335], [410, 190, 505, 335], [100, 430, 405, 735], [30, 290, 235, 470], [30, 610, 135, 770], [545, 395, 905, 705], [1220, 280, 1300, 440], [1225, 380, 1345, 545], [1245, 560, 1400, 800], [95, 795, 305, 945], [1140, 795, 1355, 945]],
    doors: [{ at: [720, 825], to: 'hallway', label: '복도로 나가기' }],
    posters: [{ at: [1180, 560], biasId: 'bias_counsel_1' }],
    npcs: { minwoo: [1010, 560] },
    spawn: [720, 790]
  }
};

function applyMapLayouts(rooms) {
  for (const [key, L] of Object.entries(MAP_LAYOUTS)) {
    const room = rooms[key];
    if (!room) continue;
    const [tw, th] = L.tiles;
    const tx = px => px / L.w * tw - 0.5;   // 문/친구는 32px 칸의 가운데가 그 지점이 되도록
    const ty = py => py / L.h * th - 0.5;
    room.name = L.name;
    room.width = tw; room.height = th;
    room.bgKey = key;
    room.layout = L;
    room.doors = L.doors.map(d => ({ x: tx(d.at[0]), y: ty(d.at[1]), to: d.to, label: d.label, requiresAct: d.requiresAct }));
    room.props = (L.posters || []).map(p => ({ type: 'bias_poster', x: tx(p.at[0]), y: ty(p.at[1]), biasId: p.biasId }));
    room.spawn = { x: tx(L.spawn[0]), y: ty(L.spawn[1]) };
    room.npcSpots = {};
    for (const [k, p] of Object.entries(L.npcs || {})) room.npcSpots[k] = { x: tx(p[0]), y: ty(p[1]) };
  }
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

class MapEngine {
  constructor() {
    this.tileSize = 32;
    this.currentRoomKey = 'hallway';
    this.bgImages = {};
    this.particles = [];
    this.burst = [];
    this.saturation = 0.15;
    this.bloom = null;
    this.loadBackgroundImages();
    this.rooms = this.initSchoolRooms();
    applyMapLayouts(this.rooms);
  }

  // assets/images/<방이름>_bg.jpg 가 있으면 자동으로 일러스트 배경을 사용합니다.
  // (없는 방은 코드로 그린 배경이 나옵니다)
  loadBackgroundImages() {
    const bgList = {};
    for (const [key, L] of Object.entries(MAP_LAYOUTS)) bgList[key] = 'assets/images/' + L.img;

    for (const [key, src] of Object.entries(bgList)) {
      const img = new Image();
      img.onload = () => { this.bgImages[key] = img; };
      img.onerror = () => {};
      img.src = src;
    }
  }

  initSchoolRooms() {
    return {
      // 1. 🏫 1층 중앙 복도 (로비 그림 map_hallway.jpg에 맞춘 위치)
      'hallway': {
        name: '1층 중앙 로비',
        icon: '🏫',
        bgKey: 'hallway',
        width: 27,
        height: 15,
        theme: 'hallway',
        floorColor: '#e0ded3',
        floorStyle: 'checker',
        wallColor: '#57606f',
        // 그림 속 화살표 표시 위치 (baked: 그림에 이름표가 이미 그려져 있음)
        doors: [
          { x: 12.7, y: 6.8, to: 'classroom', label: '교실', baked: true },
          { x: 17.0, y: 7.4, to: 'student_council', label: '학생회실', baked: true },
          { x: 24.5, y: 8.4, to: 'broadcast', label: '방송실', baked: true },
          { x: 4.75, y: 7.6, to: 'gym', label: '체육관', baked: true },
          { x: 21.0, y: 7.1, to: 'cafeteria', label: '급식실', baked: true },
          { x: 3.55, y: 10.5, to: 'counseling', label: '진로상담실', baked: true },
          { x: 9.3, y: 10.3, to: 'nurse', label: '보건실', baked: true },
          { x: 20.1, y: 10.1, to: 'club', label: '동아리실', baked: true },
          { x: 25.2, y: 10.5, to: 'playground', label: '운동장', baked: true },
          { x: 1.3, y: 12.9, to: 'core_chamber', label: '지하 특별실', requiresAct: 6 }
        ],
        // 걸어갈 수 없는 곳 (위쪽 벽·계단, 왼쪽 트로피 진열장) [x0, y0, x1, y1] 타일 단위
        blocked: [[0, 0, 27, 7], [0, 7, 2, 10]],
        props: [
          { type: 'bias_poster', x: 9.6, y: 6.75, biasId: 'bias_hallway_1' }
        ],
        spawn: { x: 13.1, y: 8.4 }
      },

      // 2. 📚 2학년 3반 교실
      'classroom': {
        name: '2학년 3반 교실',
        icon: '📚',
        bgKey: 'classroom',
        width: 16,
        height: 12,
        theme: 'classroom',
        floorColor: '#d2b48c',
        floorStyle: 'wood',
        wallColor: '#2f3542',
        doors: [
          { x: 8, y: 11, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          { type: 'blackboard', x: 4, y: 1 },
          { type: 'desk', x: 3, y: 4 },
          { type: 'desk', x: 6, y: 4 },
          { type: 'desk', x: 9, y: 4 },
          { type: 'desk', x: 12, y: 4 },
          { type: 'desk', x: 3, y: 7 },
          { type: 'desk', x: 6, y: 7 },
          { type: 'desk', x: 9, y: 7 },
          { type: 'desk', x: 12, y: 7 },
          { type: 'plant', x: 1, y: 1 },
          { type: 'bias_poster', x: 14, y: 1, biasId: 'bias_class_1' }
        ],
        spawn: { x: 8, y: 9 }
      },

      // 3. 🍱 학생 식당 (급식실)
      'cafeteria': {
        name: '학생 식당 (급식실)',
        icon: '🍱',
        theme: 'cafeteria',
        width: 20,
        height: 14,
        floorColor: '#f1f2f6',
        floorStyle: 'tile',
        wallColor: '#ff7675',
        doors: [
          { x: 1, y: 7, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          // Large Serving Counter with warm food
          { type: 'cafeteria_serving_counter', x: 5, y: 1 },
          // Water Dispenser & Sanitation
          { type: 'cafeteria_water_station', x: 16, y: 1 },
          // Tables with meal trays
          { type: 'cafeteria_lunch_table', x: 4, y: 5 },
          { type: 'cafeteria_lunch_table', x: 11, y: 5 },
          { type: 'cafeteria_lunch_table', x: 4, y: 9 },
          { type: 'cafeteria_lunch_table', x: 11, y: 9 },
          // Happy Eating Students Animations
          { type: 'cafeteria_eating_students', x: 5, y: 4 },
          { type: 'cafeteria_eating_students', x: 12, y: 8 },
          { type: 'plant', x: 18, y: 11 }
        ],
        spawn: { x: 3, y: 7 }
      },

      // 4. ⚽ 넓은 운동장
      'playground': {
        name: '넓은 야외 운동장 & 체육 트랙',
        icon: '⚽',
        theme: 'playground',
        bgKey: 'playground',
        width: 24,
        height: 16,
        floorColor: '#55efc4',
        floorStyle: 'grass',
        wallColor: '#74b9ff',
        doors: [
          { x: 12, y: 1, to: 'hallway', label: '본관 복도로 들어가기' }
        ],
        props: [
          // Soccer Goals
          { type: 'soccer_goal', x: 2, y: 6 },
          { type: 'soccer_goal', x: 19, y: 6 },
          // Sports Benches & Equipment
          { type: 'sports_bench', x: 8, y: 12 },
          { type: 'sports_bench', x: 14, y: 12 },
          // Running Training Students
          { type: 'running_students', x: 6, y: 3 },
          { type: 'running_students', x: 16, y: 3 },
          { type: 'plant', x: 1, y: 1 },
          { type: 'plant', x: 22, y: 1 },
          { type: 'bias_poster', x: 6, y: 1, biasId: 'bias_gym_1' }
        ],
        spawn: { x: 12, y: 3 }
      },

      // 5. 🩺 보건실
      'nurse': {
        name: '학교 보건실 (치료 & 휴식실)',
        icon: '🩺',
        theme: 'nurse',
        width: 16,
        height: 12,
        floorColor: '#fff9e6',
        floorStyle: 'tile',
        wallColor: '#70a1ff',
        doors: [
          { x: 8, y: 1, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          // Clinic beds with curtains
          { type: 'nurse_bed', x: 2, y: 4 },
          { type: 'nurse_bed', x: 6, y: 4 },
          // Pharmacy medicine cabinet
          { type: 'medicine_cabinet', x: 12, y: 2 },
          // Scale & Measuring device
          { type: 'height_scale', x: 12, y: 7 },
          // Teacher consultation desk
          { type: 'desk', x: 10, y: 9 },
          { type: 'plant', x: 1, y: 1 },
          { type: 'bias_poster', x: 14, y: 1, biasId: 'bias_nurse_1' }
        ],
        spawn: { x: 8, y: 3 }
      },

      // 6. 💬 진로상담실
      'counseling': {
        name: '진로적성 상담실',
        icon: '💬',
        theme: 'counseling',
        bgKey: 'counseling',
        width: 16,
        height: 12,
        floorColor: '#fad390',
        floorStyle: 'wood',
        wallColor: '#38ada9',
        doors: [
          { x: 8, y: 11, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          // Large Career Vision Board
          { type: 'counseling_board', x: 5, y: 1 },
          // Round Consultation Tea Table
          { type: 'counseling_table', x: 7, y: 6 },
          { type: 'lockers', x: 1, y: 3 },
          { type: 'lockers', x: 12, y: 3 },
          { type: 'plant', x: 1, y: 9 },
          { type: 'plant', x: 14, y: 9 },
          { type: 'bias_poster', x: 14, y: 1, biasId: 'bias_counsel_1' }
        ],
        spawn: { x: 8, y: 9 }
      },

      // 7. 🔮 지하 특별실 (편견의 핵)
      'core_chamber': {
        name: '지하 특별실: 편견의 핵 (Core)',
        icon: '🔮',
        theme: 'core_chamber',
        width: 18,
        height: 14,
        floorColor: '#12081c',
        floorStyle: 'dark_rune',
        wallColor: '#4a0e4e',
        doors: [
          { x: 9, y: 13, to: 'hallway', label: '복도로 돌아가기' }
        ],
        props: [
          // Central Pulsing Core Crystal
          { type: 'core_crystal', x: 7, y: 4 },
          // Basement Steam Pipes
          { type: 'steam_pipes', x: 2, y: 1 },
          { type: 'steam_pipes', x: 10, y: 1 }
        ],
        spawn: { x: 9, y: 10 }
      },

      // 8. 🏛️ 학생회실
      'student_council': {
        name: '학생자치회실',
        icon: '🏛️',
        theme: 'student_council',
        width: 16,
        height: 12,
        floorColor: '#dff9fb',
        floorStyle: 'wood',
        wallColor: '#130f40',
        doors: [
          { x: 8, y: 11, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          { type: 'council_board', x: 5, y: 1 },
          { type: 'desk', x: 4, y: 6 },
          { type: 'desk', x: 9, y: 6 },
          { type: 'lockers', x: 1, y: 3 },
          { type: 'plant', x: 14, y: 3 }
        ],
        spawn: { x: 8, y: 9 }
      },

      // 9. 🎙️ 방송실
      'broadcast': {
        name: '교내 방송미디어실',
        icon: '🎙️',
        theme: 'broadcast',
        width: 15,
        height: 11,
        floorColor: '#535c68',
        floorStyle: 'carpet',
        wallColor: '#2c3e50',
        doors: [
          { x: 7, y: 10, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          { type: 'broadcast_console', x: 4, y: 2 },
          { type: 'desk', x: 4, y: 5 },
          { type: 'plant', x: 1, y: 1 }
        ],
        spawn: { x: 7, y: 8 }
      },

      // 10. 🎨 동아리실
      'club': {
        name: '융합 동아리 탐구실',
        icon: '🎨',
        theme: 'club',
        width: 16,
        height: 12,
        floorColor: '#ffeaa7',
        floorStyle: 'wood',
        wallColor: '#e17055',
        doors: [
          { x: 8, y: 1, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          { type: 'blackboard', x: 4, y: 1 },
          { type: 'desk', x: 3, y: 5 },
          { type: 'desk', x: 10, y: 5 },
          { type: 'plant', x: 1, y: 9 }
        ],
        spawn: { x: 8, y: 3 }
      },

      // 11. 🏀 실내 체육관
      'gym': {
        name: '실내 체육관',
        icon: '🏀',
        theme: 'gym',
        width: 20,
        height: 14,
        floorColor: '#e58e26',
        floorStyle: 'gym_board',
        wallColor: '#1e272e',
        doors: [
          { x: 18, y: 7, to: 'hallway', label: '복도로 나가기' }
        ],
        props: [
          { type: 'sports_bench', x: 4, y: 2 },
          { type: 'sports_bench', x: 10, y: 2 },
          { type: 'plant', x: 1, y: 1 },
          { type: 'plant', x: 1, y: 12 }
        ],
        spawn: { x: 16, y: 7 }
      }
    };
  }
  getCurrentRoom() {
    return this.rooms[this.currentRoomKey] || this.rooms['hallway'];
  }

  switchRoom(roomKey, spawnPoint = null) {
    if (!this.rooms[roomKey]) return null;
    this.currentRoomKey = roomKey;
    const room = this.rooms[roomKey];
    // 방에 들어오는 순간 그 방의 현재 색 상태로 맞춤
    this.saturation = this.getTargetSaturation();
    this.bloom = null;
    this.particles = [];
    return spawnPoint || room.spawn;
  }

  // --------------------------------------------------------------------------
  // 방별 색 복원 (해당 방 친구의 고민을 해결하면 그 방이 컬러로 돌아옴)
  // --------------------------------------------------------------------------
  getTargetSaturation() {
    const sm = window.scenarioManager;
    if (!sm) return 0.15;
    const friend = ROOM_FRIEND[this.currentRoomKey];
    if (friend && sm.resolvedScenarios.includes(friend)) return 1;
    return 0.45 + (sm.colorProgress / 100) * 0.55;
  }

  triggerColorBloom(x, y) {
    this.bloom = { x, y, r: 0, from: this.saturation };
    this.saturation = 1;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      this.burst.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 1.4 + Math.random() * 0.6,
        t: 0, c: RAINBOW[i % RAINBOW.length], s: 2 + Math.random() * 3
      });
    }
  }

  // 월드를 그린 뒤 호출: 아직 색을 잃은 부분을 회색으로 덮는다
  applyColorGrade(ctx, camera, view, dt) {
    if (this.bloom) {
      const b = this.bloom;
      b.r += dt * 520;
      const maxR = Math.hypot(view.w, view.h) * 1.2;
      const a = 1 - b.from;
      if (a > 0.01) {
        const cx = b.x - camera.x, cy = b.y - camera.y;
        const g = ctx.createRadialGradient(cx, cy, Math.max(0, b.r - 90), cx, cy, b.r);
        g.addColorStop(0, 'rgba(128,128,128,0)');
        g.addColorStop(1, `rgba(128,128,128,${a})`);
        ctx.save();
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, view.w, view.h);
        ctx.restore();
        // 퍼져나가는 무지개 링
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,240,200,${Math.max(0, 0.5 - b.r / maxR)})`;
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      if (b.r > maxR) this.bloom = null;
      return;
    }

    const target = this.getTargetSaturation();
    this.saturation += (target - this.saturation) * Math.min(1, dt * 1.5);
    const a = 1 - this.saturation;
    if (a > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = `rgba(128,128,128,${a})`;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 월드(배경 + 소품) 렌더링
  // --------------------------------------------------------------------------
  render(ctx, camera) {
    const room = this.getCurrentRoom();
    const ts = this.tileSize;
    const bgImg = this.bgImages[room.bgKey || this.currentRoomKey];

    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    if (bgImg) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bgImg, 0, 0, room.width * ts, room.height * ts);
    } else {
      this.drawProceduralRoom(ctx, room);
    }
    ctx.restore();

    // 일러스트 배경이 있는 방은 배경 위에 네모 소품을 겹쳐 그리지 않는다 (편견 포스터만)
    if (room.props) {
      room.props.forEach(p => {
        if (bgImg) return;
        window.spriteManager.drawProp(ctx, p.x * ts - camera.x, p.y * ts - camera.y, p.type, p.biasId);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 방 분위기 파티클 (먼지, 낙엽, 음표, 김, 반짝이 ...)
  // --------------------------------------------------------------------------
  renderAmbient(ctx, camera, view, dt) {
    const style = ROOM_STYLE[this.currentRoomKey] || ROOM_STYLE.hallway;
    const type = style.ambient;
    const room = this.getCurrentRoom();
    const ts = this.tileSize;
    const t = Date.now() / 1000;
    const maxCount = { dust: 28, leaf: 22, note: 10, steam: 14, plus: 12, paint: 18, sparkle: 16, chalk: 16 }[type] || 16;

    // spawn
    while (this.particles.length < maxCount) {
      const p = { t: Math.random() * 4, life: 4 + Math.random() * 5, s: 0.6 + Math.random() * 0.8, seed: Math.random() * 100 };
      p.x = camera.x + Math.random() * view.w;
      p.y = camera.y + Math.random() * view.h;
      if (type === 'leaf') { p.y = camera.y - 10 - Math.random() * view.h * 0.5; p.life = 99; }
      if (type === 'steam' && style.source) {
        p.x = style.source.x * ts + Math.random() * style.source.w * ts;
        p.y = style.source.y * ts + Math.random() * 10;
      }
      p.c = (type === 'note' || type === 'paint') ? RAINBOW[Math.floor(Math.random() * RAINBOW.length)] : style.accent;
      p.ch = type === 'note' ? (Math.random() < 0.5 ? '♪' : '♫') : '';
      this.particles.push(p);
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    this.particles = this.particles.filter(p => {
      p.t += dt;
      const k = p.t / p.life;
      const fade = Math.sin(Math.min(1, k) * Math.PI);
      switch (type) {
        case 'dust': {
          p.x += Math.sin(t * 0.4 + p.seed) * 6 * dt; p.y -= 4 * dt;
          ctx.fillStyle = `rgba(255,248,225,${0.55 * fade})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 * p.s, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'chalk': {
          p.x += Math.sin(t * 0.5 + p.seed) * 5 * dt; p.y += 3 * dt;
          ctx.fillStyle = `rgba(255,255,255,${0.45 * fade})`;
          ctx.fillRect(p.x, p.y, 1.5 * p.s, 1.5 * p.s);
          break;
        }
        case 'leaf': {
          p.y += (14 + p.s * 10) * dt; p.x += Math.sin(t * 1.3 + p.seed) * 18 * dt;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * 2 + p.seed) * 1.2);
          ctx.fillStyle = p.seed > 50 ? '#ffb7d0' : '#ffd166';
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.ellipse(0, 0, 3.2 * p.s, 1.8 * p.s, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          if (p.y > camera.y + view.h + 10) return false;
          return true;
        }
        case 'note': {
          p.y -= 14 * dt; p.x += Math.sin(t * 2 + p.seed) * 10 * dt;
          ctx.globalAlpha = 0.8 * fade;
          ctx.fillStyle = p.c;
          ctx.font = `bold ${10 + p.s * 6}px Pretendard, sans-serif`;
          ctx.fillText(p.ch, p.x, p.y);
          ctx.globalAlpha = 1;
          break;
        }
        case 'steam': {
          p.y -= 10 * dt; p.x += Math.sin(t + p.seed) * 6 * dt;
          ctx.fillStyle = `rgba(255,255,255,${0.28 * fade})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 + k * 8, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'plus': {
          p.y -= 6 * dt;
          ctx.globalAlpha = 0.55 * fade;
          ctx.fillStyle = p.c;
          const r = 2.5 * p.s;
          ctx.fillRect(p.x - r, p.y - r / 3, r * 2, r * 2 / 3);
          ctx.fillRect(p.x - r / 3, p.y - r, r * 2 / 3, r * 2);
          ctx.globalAlpha = 1;
          break;
        }
        case 'paint':
        case 'sparkle': {
          const tw = 0.5 + 0.5 * Math.sin(t * 4 + p.seed);
          ctx.globalAlpha = fade * tw * 0.9;
          ctx.fillStyle = p.c;
          const r = 2.6 * p.s;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r * 0.3, p.y - r * 0.3); ctx.lineTo(p.x + r, p.y);
          ctx.lineTo(p.x + r * 0.3, p.y + r * 0.3); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r * 0.3, p.y + r * 0.3);
          ctx.lineTo(p.x - r, p.y); ctx.lineTo(p.x - r * 0.3, p.y - r * 0.3); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
      }
      return p.t < p.life;
    });

    // 색 복원 순간 터지는 무지개 조각
    this.burst = this.burst.filter(b => {
      b.t += dt; b.vy += 120 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      ctx.globalAlpha = Math.max(0, 1 - b.t / b.life);
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, b.y, b.s, b.s);
      return b.t < b.life;
    });
    ctx.globalAlpha = 1;

    // 체육관: 통통 튀는 농구공
    if (this.currentRoomKey === 'gym') {
      const bx = 5 * ts, by = 10 * ts;
      const h = Math.abs(Math.sin(t * 2.6)) * 26;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(bx, by + 8, 8 - h * 0.1, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f28c28';
      ctx.beginPath(); ctx.arc(bx, by - h, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7a3b0c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by - h, 7, 0, Math.PI * 2); ctx.moveTo(bx - 7, by - h); ctx.lineTo(bx + 7, by - h);
      ctx.moveTo(bx, by - h - 7); ctx.lineTo(bx, by - h + 7); ctx.stroke();
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 컬러로 보여야 하는 UI 요소 (문 표시, 편견 포스터 알림) - 회색 필터 이후에 그림
  // --------------------------------------------------------------------------
  renderUI(ctx, camera) {
    const room = this.getCurrentRoom();
    const ts = this.tileSize;
    const t = Date.now() / 1000;
    const accent = (ROOM_STYLE[this.currentRoomKey] || ROOM_STYLE.hallway).accent;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    (room.doors || []).forEach(d => {
      if (d.baked && this.bgImages[room.bgKey || this.currentRoomKey]) return;
      const cx = d.x * ts + 16, cy = d.y * ts + 16;
      const locked = d.requiresAct && window.scenarioManager && window.scenarioManager.currentAct < d.requiresAct;
      const col = locked ? '#8a8fa3' : '#5ee6b0';

      // 바닥의 빛나는 원
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      const g = ctx.createRadialGradient(cx, cy + 6, 2, cx, cy + 6, 20);
      g.addColorStop(0, locked ? 'rgba(140,145,165,0.35)' : `rgba(94,230,176,${0.45 + pulse * 0.25})`);
      g.addColorStop(1, 'rgba(94,230,176,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy + 6, 11 + pulse * 3, 5.5 + pulse * 1.5, 0, 0, Math.PI * 2); ctx.stroke();

      // 통통 튀는 화살표
      const ay = cy - 6 + Math.sin(t * 4) * 2;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(cx - 4, ay - 4); ctx.lineTo(cx + 4, ay - 4); ctx.lineTo(cx, ay + 1); ctx.closePath(); ctx.fill();

      // 이름표 (알약 모양)
      const label = (locked ? '🔒 ' : '') + d.label;
      ctx.font = '700 8px Pretendard, sans-serif';
      const w = ctx.measureText(label).width + 12;
      const lx = cx - w / 2, ly = cy - 24;
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
      roundRect(ctx, lx, ly, w, 13, 6.5); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = locked ? '#8a8fa3' : '#14b88a';
      ctx.beginPath(); ctx.arc(lx + 5, ly + 6.5, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d2033';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cx + 2, ly + 7);
    });

    // 아직 탐지하지 않은 편견 포스터에 느낌표 표시
    (room.props || []).forEach(p => {
      if (p.type !== 'bias_poster') return;
      const done = window.scenarioManager && window.scenarioManager.completedBiases.includes(p.biasId);
      if (done) return;
      const cx = p.x * ts + 16, cy = p.y * ts - 4 + Math.sin(t * 4) * 2;
      ctx.fillStyle = '#ff5d73';
      ctx.shadowColor = 'rgba(255,93,115,0.7)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#fff'; ctx.font = '900 9px Pretendard, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', cx, cy + 0.5);
    });
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 일러스트 배경이 없는 방: 방마다 다른 색, 바닥, 벽 장식
  // --------------------------------------------------------------------------
  drawProceduralRoom(ctx, room) {
    const ts = this.tileSize;
    const W = room.width * ts, H = room.height * ts;
    const key = this.currentRoomKey;
    const st = Object.assign({ floor: '#e6e1d6', floor2: '#ddd6c8', floorType: 'tiles', wall: '#57606f' }, ROOM_STYLE[key]);
    const t = Date.now() / 1000;

    // 1) 바닥
    ctx.fillStyle = st.floor;
    ctx.fillRect(0, 0, W, H);
    switch (st.floorType) {
      case 'planks':
        for (let y = ts; y < H; y += 10) {
          ctx.fillStyle = ((y / 10) | 0) % 2 ? st.floor2 : st.floor;
          ctx.fillRect(0, y, W, 10);
          ctx.fillStyle = 'rgba(90,50,20,0.10)';
          ctx.fillRect(0, y + 9, W, 1);
          const off = (((y / 10) | 0) * 37) % 64;
          for (let x = off; x < W; x += 64) ctx.fillRect(x, y, 1, 10);
        }
        break;
      case 'tiles':
      case 'smalltiles': {
        const s = st.floorType === 'tiles' ? ts : ts / 2;
        for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
          ctx.fillStyle = (((x + y) / s) | 0) % 2 ? st.floor2 : st.floor;
          ctx.fillRect(x, y, s, s);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        break;
      }
      case 'carpet':
        ctx.fillStyle = st.floor2;
        for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) ctx.fillRect(x, y, 3, 3);
        break;
    }

    // 2) 방별 바닥 장식
    this.drawFloorDecor(ctx, key, room, W, H, st, t);

    // 3) 창문 빛줄기
    if (st.windows) {
      st.windows.forEach(wx => {
        const x = wx * ts;
        const g = ctx.createLinearGradient(0, ts, 0, ts * 6);
        g.addColorStop(0, 'rgba(255,246,214,0.22)'); g.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x + 4, ts); ctx.lineTo(x + 2 * ts - 4, ts);
        ctx.lineTo(x + 2 * ts + 40, ts * 6); ctx.lineTo(x + 30, ts * 6); ctx.closePath(); ctx.fill();
      });
    }

    // 4) 벽 (위쪽 벽면 + 좌/우/아래 벽 윗면)
    const wg = ctx.createLinearGradient(0, -100, 0, ts);
    wg.addColorStop(0, shade(st.wall, -0.25)); wg.addColorStop(0.75, shade(st.wall, 0.1)); wg.addColorStop(1, st.wall);
    ctx.fillStyle = wg; ctx.fillRect(0, -100, W, ts + 100);
    ctx.fillStyle = shade(st.wall, -0.35); ctx.fillRect(0, ts - 4, W, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, ts, W, 5);

    ctx.fillStyle = shade(st.wall, -0.3);
    ctx.fillRect(0, ts, 12, H - ts);
    ctx.fillRect(W - 12, ts, 12, H - ts);
    ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(12, ts, 2, H - ts - 12); ctx.fillRect(W - 14, ts, 2, H - ts - 12); ctx.fillRect(12, H - 14, W - 24, 2);

    // 벽에 난 문 구멍
    (room.doors || []).forEach(d => {
      const onEdge = d.x === 0 || d.y === 0 || d.x === room.width - 1 || d.y === room.height - 1;
      if (!onEdge) return;
      ctx.fillStyle = shade(st.floor, -0.15);
      if (d.y === room.height - 1) ctx.fillRect(d.x * ts - 4, H - 12, ts + 8, 12);
      else if (d.x === 0) ctx.fillRect(0, d.y * ts - 4, 12, ts + 8);
      else if (d.x === room.width - 1) ctx.fillRect(W - 12, d.y * ts - 4, 12, ts + 8);
    });

    // 창문
    if (st.windows) st.windows.forEach(wx => drawWindow(ctx, wx * ts, 3, 2 * ts, ts - 9, st));

    // 5) 방별 벽 장식
    this.drawWallDecor(ctx, key, room, W, H, st, t);

    // 6) 은은한 비네팅
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  drawFloorDecor(ctx, key, room, W, H, st, t) {
    const ts = this.tileSize;
    if (key === 'gym') {
      // 농구 코트 라인
      const x0 = 2 * ts, y0 = 2.2 * ts, x1 = W - 3 * ts, y1 = H - 1.8 * ts;
      const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2;
      ctx.fillStyle = 'rgba(255,138,61,0.28)';
      ctx.fillRect(x0, midY - 1.5 * ts, 3.5 * ts, 3 * ts);
      ctx.fillRect(x1 - 3.5 * ts, midY - 1.5 * ts, 3.5 * ts, 3 * ts);
      ctx.beginPath(); ctx.arc(midX, midY, 1.6 * ts, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      ctx.beginPath(); ctx.moveTo(midX, y0); ctx.lineTo(midX, y1); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 1.6 * ts, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(x0, midY - 1.5 * ts, 3.5 * ts, 3 * ts);
      ctx.strokeRect(x1 - 3.5 * ts, midY - 1.5 * ts, 3.5 * ts, 3 * ts);
      ctx.beginPath(); ctx.arc(x0, midY, 4.5 * ts, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x1, midY, 4.5 * ts, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
      // 왼쪽 골대
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 - 8, midY - 22, 6, 44);
      ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x0 + 10, midY, 9, 0, Math.PI * 2); ctx.stroke();
      // 공 바구니
      const bx = W - 4 * ts, by = H - 3 * ts;
      ctx.fillStyle = '#5b6474'; ctx.fillRect(bx, by, 40, 22);
      ['#f28c28', '#f39c34', '#e67e22', '#f28c28'].forEach((c, i) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + 7 + i * 9, by + 2, 6, 0, Math.PI * 2); ctx.fill();
      });
    } else if (key === 'cafeteria') {
      // 배식대 앞 노란 대기선 + 발자국
      ctx.fillStyle = 'rgba(255,193,7,0.55)';
      ctx.fillRect(4 * ts, 3.2 * ts, 6 * ts, 4);
      ctx.fillStyle = 'rgba(255,152,104,0.35)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(5 * ts + i * 40, 3.8 * ts, 6, 9, 0, 0, Math.PI * 2); ctx.fill(); }
      // 테이블 아래 러그
      ctx.fillStyle = 'rgba(255,159,104,0.14)';
      roundRect(ctx, 2.5 * ts, 4.2 * ts, 13.5 * ts, 7.4 * ts, 20); ctx.fill();
    } else if (key === 'nurse') {
      // 침대 구역 커튼 레일 그림자 + 부드러운 매트
      ctx.fillStyle = 'rgba(46,196,165,0.12)';
      roundRect(ctx, 1.4 * ts, 3.3 * ts, 7.4 * ts, 3.8 * ts, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(46,196,165,0.35)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      roundRect(ctx, 1.4 * ts, 3.3 * ts, 7.4 * ts, 3.8 * ts, 14); ctx.stroke();
      ctx.setLineDash([]);
      // 하트 러그
      ctx.fillStyle = 'rgba(255,140,160,0.25)';
      drawHeart(ctx, 8 * ts, 8.6 * ts, 30);
    } else if (key === 'broadcast') {
      // 동그란 러그 + 레드 카펫 테이프
      ctx.fillStyle = 'rgba(176,107,255,0.22)';
      ctx.beginPath(); ctx.ellipse(7.5 * ts, 6.5 * ts, 3.5 * ts, 2.2 * ts, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(176,107,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(7.5 * ts, 6.5 * ts, 3.1 * ts, 1.9 * ts, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (key === 'club') {
      // 물감 자국
      const splats = [[3, 3, '#ff6f61'], [12, 3.5, '#4ecdc4'], [6, 9, '#ffd166'], [12.5, 9, '#7b6cff'], [9, 7, '#ff8fb1'], [2.5, 8, '#06d6a0']];
      splats.forEach(([x, y, c]) => {
        ctx.fillStyle = c; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(x * ts, y * ts, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x * ts + 14, y * ts + 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x * ts - 10, y * ts + 10, 3.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // 무지개 러그
      const cx = 8 * ts, cy = 7.6 * ts;
      RAINBOW.forEach((c, i) => {
        ctx.fillStyle = c; ctx.globalAlpha = 0.28;
        ctx.beginPath(); ctx.ellipse(cx, cy, 2.6 * ts - i * 9, 1.4 * ts - i * 5, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (key === 'student_council') {
      // 문에서 단상까지 이어지는 카펫
      ctx.fillStyle = '#2f4a8a';
      ctx.fillRect(7 * ts, 2 * ts, 2 * ts, H - 2 * ts);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(7 * ts, 2 * ts, 3, H - 2 * ts); ctx.fillRect(9 * ts - 3, 2 * ts, 3, H - 2 * ts);
    }
  }

  drawWallDecor(ctx, key, room, W, H, st, t) {
    const ts = this.tileSize;
    if (key === 'gym') {
      // 전광판
      const x = W / 2 - 46;
      ctx.fillStyle = '#121620'; roundRect(ctx, x, 3, 92, 24, 4); ctx.fill();
      ctx.font = '800 7px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#9aa4b8'; ctx.fillText('HOME', x + 18, 10); ctx.fillText('AWAY', x + 74, 10);
      ctx.fillStyle = '#ff4d4d'; ctx.font = '900 10px monospace';
      ctx.fillText('24', x + 18, 20); ctx.fillText('22', x + 74, 20);
      ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ffd166' : '#806a2e'; ctx.fillText('4Q', x + 46, 15);
      // 깃발 장식
      for (let i = 0; i < room.width * 2; i++) {
        if (Math.abs(i * 16 + 8 - W / 2) < 56) continue;
        ctx.fillStyle = RAINBOW[i % RAINBOW.length];
        ctx.beginPath(); ctx.moveTo(i * 16, 4); ctx.lineTo(i * 16 + 14, 4); ctx.lineTo(i * 16 + 7, 15); ctx.closePath(); ctx.fill();
      }
    } else if (key === 'cafeteria') {
      // 오늘의 메뉴 칠판
      const x = 10.5 * ts;
      ctx.fillStyle = '#6b4a2b'; roundRect(ctx, x, 2, 4.2 * ts, ts - 6, 4); ctx.fill();
      ctx.fillStyle = '#2f5d50'; roundRect(ctx, x + 3, 5, 4.2 * ts - 6, ts - 12, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 6.5px Pretendard, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('🍚 오늘의 급식', x + 8, 11);
      ctx.fillStyle = '#ffe9a8'; ctx.font = '600 6px Pretendard, sans-serif';
      ctx.fillText('잡곡밥 · 미역국 · 불고기 · 깍두기', x + 8, 21);
    } else if (key === 'nurse') {
      // 보건실 사인 + 건강 포스터
      ctx.fillStyle = '#ffffff'; roundRect(ctx, 2.2 * ts, 4, 2.6 * ts, ts - 10, 5); ctx.fill();
      ctx.fillStyle = '#2ec4a5';
      ctx.fillRect(2.2 * ts + 8, 9, 12, 4); ctx.fillRect(2.2 * ts + 12, 5, 4, 12);
      ctx.fillStyle = '#245b52'; ctx.font = '800 8px Pretendard, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('보건실', 2.2 * ts + 26, 12);
      ctx.fillStyle = '#6c8f88'; ctx.font = '600 5px Pretendard, sans-serif';
      ctx.fillText('마음이 아플 때도 오세요', 2.2 * ts + 8, 22);
      const posters = [[5.4, '#ffe08a', '손 씻기 30초 🫧'], [10, '#ffc4d0', '바른 자세 체크 ✔']];
      posters.forEach(([px, c, txt]) => {
        ctx.fillStyle = c; roundRect(ctx, px * ts, 5, 1.9 * ts, ts - 12, 3); ctx.fill();
        ctx.fillStyle = '#4a4a4a'; ctx.font = '700 5px Pretendard, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(txt, px * ts + 0.95 * ts, 14);
      });
    } else if (key === 'broadcast') {
      // 흡음판
      for (let x = 14; x < W - 14; x += 14) for (let y = 3; y < ts - 6; y += 11) {
        if (x > W / 2 - 40 && x < W / 2 + 30) continue;
        ctx.fillStyle = ((x / 14 + y / 11) | 0) % 2 ? '#3a345e' : '#2e2950';
        ctx.fillRect(x, y, 12, 9);
      }
      // ON AIR 사인
      const on = 0.6 + 0.4 * Math.sin(t * 3);
      const x = W / 2 - 34;
      ctx.fillStyle = '#1a1626'; roundRect(ctx, x, 5, 62, 19, 4); ctx.fill();
      ctx.shadowColor = `rgba(255,60,80,${on})`; ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(255,70,90,${0.55 + on * 0.45})`;
      ctx.font = '900 10px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ON AIR', x + 31, 15);
      ctx.shadowColor = 'transparent';
    } else if (key === 'club') {
      // 코르크 게시판 + 그림들
      const x = 10.5 * ts;
      ctx.fillStyle = '#c8935a'; roundRect(ctx, x, 3, 4 * ts, ts - 7, 3); ctx.fill();
      ['#ff6f61', '#4ecdc4', '#ffd166', '#7b6cff', '#ff8fb1'].forEach((c, i) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 6 + i * 23, 6 + (i % 2) * 3, 18, 15);
        ctx.fillStyle = c; ctx.fillRect(x + 8 + i * 23, 8 + (i % 2) * 3, 14, 9);
        ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(x + 15 + i * 23, 6 + (i % 2) * 3, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      // 반짝이는 전구 줄
      ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 3);
      for (let x2 = 0; x2 <= W; x2 += 24) ctx.quadraticCurveTo(x2 + 12, 10, x2 + 24, 3);
      ctx.stroke();
      for (let x2 = 12, i = 0; x2 < W; x2 += 24, i++) {
        const on = Math.sin(t * 3 + i) > 0;
        ctx.fillStyle = RAINBOW[i % RAINBOW.length];
        ctx.globalAlpha = on ? 1 : 0.4;
        if (on) { ctx.shadowColor = RAINBOW[i % RAINBOW.length]; ctx.shadowBlur = 8; }
        ctx.beginPath(); ctx.arc(x2, 7.5, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1;
      }
    } else if (key === 'student_council') {
      // 세로 배너들
      [[2.5, '#e63946'], [4, '#f5c542'], [11.5, '#2a9d8f'], [13, '#7b6cff']].forEach(([bx, c]) => {
        const sway = Math.sin(t * 1.5 + bx) * 1.5;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(bx * ts, 3); ctx.lineTo(bx * ts + 16, 3);
        ctx.lineTo(bx * ts + 16 + sway, ts + 6); ctx.lineTo(bx * ts + 8 + sway, ts + 1); ctx.lineTo(bx * ts + sway, ts + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(bx * ts + 8 + sway / 2, 14, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#f5c542'; roundRect(ctx, 6.2 * ts, 4, 3.6 * ts, 13, 6); ctx.fill();
      ctx.fillStyle = '#24335e'; ctx.font = '900 7.5px Pretendard, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('학생자치회 · 모두의 목소리', 8 * ts, 11);
    }
  }

  // Check if player is on or very close to a door
  checkDoor(px, py) {
    const room = this.getCurrentRoom();
    if (!room.doors) return null;

    for (const d of room.doors) {
      const doorCenterX = d.x * this.tileSize + 16;
      const doorCenterY = d.y * this.tileSize + 16;
      const dist = Math.hypot(px - doorCenterX, py - doorCenterY);
      if (dist < 28) {
        return d;
      }
    }
    return null;
  }

  // Check if player is near a door to show portal badge
  checkNearDoor(px, py) {
    const room = this.getCurrentRoom();
    if (!room.doors) return null;

    for (const d of room.doors) {
      const doorCenterX = d.x * this.tileSize + 16;
      const doorCenterY = d.y * this.tileSize + 16;
      const dist = Math.hypot(px - doorCenterX, py - doorCenterY);
      if (dist < 56) {
        return d;
      }
    }
    return null;
  }

  // Check if player is near a Bias Poster
  checkBiasPoster(px, py) {
    const room = this.getCurrentRoom();
    if (!room.props) return null;

    for (const p of room.props) {
      if (p.type === 'bias_poster') {
        const posterCenterX = p.x * this.tileSize + 16;
        const posterCenterY = p.y * this.tileSize + 16;
        const dist = Math.hypot(px - posterCenterX, py - posterCenterY);
        if (dist < 36) {
          return p;
        }
      }
    }
    return null;
  }

  // Check collision bounds
  isSolid(x, y) {
    const room = this.getCurrentRoom();
    // 지도 그림이 있는 방: 그림 속 바닥/가구 기준으로 판정
    if (room.layout && this.bgImages[room.bgKey]) {
      const L = room.layout;
      const ix = x / (room.width * this.tileSize) * L.w;
      const iy = y / (room.height * this.tileSize) * L.h;
      if (!pointInPoly(ix, iy, L.walk)) return true;
      for (const [x0, y0, x1, y1] of L.blocks) if (ix >= x0 && ix <= x1 && iy >= y0 && iy <= y1) return true;
      return false;
    }
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    // Wall collision on map edges
    if (tileX <= 0 || tileX >= room.width - 1 || tileY <= 0 || tileY >= room.height - 1) {
      if (room.doors) {
        for (const d of room.doors) {
          if (d.x === tileX && d.y === tileY) return false;
        }
      }
      return true;
    }

    // 그림 속 벽·가구 등 걸어갈 수 없는 구역
    if (room.blocked) {
      for (const [x0, y0, x1, y1] of room.blocked) {
        if (tileX >= x0 && tileX < x1 && tileY >= y0 && tileY < y1) return true;
      }
    }

    // Props collision
    if (room.props) {
      for (const p of room.props) {
        if (p.type !== 'bias_poster' && p.type !== 'running_students' && p.type !== 'cafeteria_eating_students') {
          if (p.x === tileX && p.y === tileY) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isBlocked(x, y) {
    return this.isSolid(x, y);
  }
}

window.MapEngine = MapEngine;
window.mapEngine = new MapEngine();
