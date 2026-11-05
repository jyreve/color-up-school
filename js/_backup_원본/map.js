/**
 * COLOR UP SCHOOL - Map & Room Layout Engine
 * Defines unique school zones with distinctive aesthetics, rich props, and dynamic tile atmospheres.
 */

class MapEngine {
  constructor() {
    this.tileSize = 32;
    this.currentRoomKey = 'hallway';
    this.bgImages = {};
    this.loadBackgroundImages();
    this.rooms = this.initSchoolRooms();
  }

  loadBackgroundImages() {
    const bgList = {
      'hallway': 'assets/images/school_hall_bg.jpg',
      'classroom': 'assets/images/classroom_bg.jpg',
      'playground': 'assets/images/playground_bg.jpg',
      'counseling': 'assets/images/counseling_bg.jpg'
    };

    for (const [key, src] of Object.entries(bgList)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.bgImages[key] = img;
      };
    }
  }

  initSchoolRooms() {
    return {
      // 1. 🏫 1층 중앙 복도
      'hallway': {
        name: '1층 중앙 복도 & 로비',
        icon: '🏫',
        bgKey: 'hallway',
        width: 22,
        height: 15,
        theme: 'hallway',
        floorColor: '#e0ded3',
        floorStyle: 'checker',
        wallColor: '#57606f',
        doors: [
          { x: 4, y: 1, to: 'classroom', label: '2학년 3반 교실' },
          { x: 10, y: 1, to: 'student_council', label: '학생회실' },
          { x: 16, y: 1, to: 'broadcast', label: '방송실' },
          { x: 1, y: 7, to: 'gym', label: '체육관' },
          { x: 20, y: 7, to: 'cafeteria', label: '급식실' },
          { x: 4, y: 13, to: 'counseling', label: '진로상담실' },
          { x: 10, y: 13, to: 'nurse', label: '보건실' },
          { x: 16, y: 13, to: 'club', label: '동아리실' },
          { x: 10, y: 7, to: 'playground', label: '운동장 입구' },
          { x: 1, y: 13, to: 'core_chamber', label: '지하 특별실 (코어)', requiresAct: 6 }
        ],
        props: [
          { type: 'lockers', x: 2, y: 2 },
          { type: 'lockers', x: 7, y: 2 },
          { type: 'lockers', x: 13, y: 2 },
          { type: 'plant', x: 1, y: 2 },
          { type: 'plant', x: 20, y: 2 },
          { type: 'plant', x: 1, y: 11 },
          { type: 'plant', x: 20, y: 11 },
          { type: 'bias_poster', x: 8, y: 1, biasId: 'bias_hallway_1' }
        ],
        spawn: { x: 10, y: 8 }
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
    return spawnPoint || room.spawn;
  }

  // --------------------------------------------------------------------------
  // Dynamic Map & Themed Room Rendering
  // --------------------------------------------------------------------------
  render(ctx, camera) {
    const room = this.getCurrentRoom();
    const ts = this.tileSize;
    const roomPxWidth = room.width * ts;
    const roomPxHeight = room.height * ts;

    // 1. Draw Themed Background & Atmosphere
    this.renderThemedAtmosphere(ctx, room, camera, roomPxWidth, roomPxHeight);

    // 2. Draw Doors / Portals with glowing rings & plaques
    if (room.doors) {
      const time = Date.now() / 300;
      room.doors.forEach(d => {
        const dx = d.x * ts - camera.x;
        const dy = d.y * ts - camera.y;

        // Glowing portal tile
        ctx.fillStyle = 'rgba(46, 213, 115, 0.28)';
        ctx.fillRect(dx, dy, ts, ts);

        // Pulsing portal ring
        ctx.strokeStyle = '#2ed573';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx + 16, dy + 16, 12 + Math.sin(time) * 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Portal Door Label Plaque
        ctx.save();
        ctx.font = 'bold 11px Galmuri11, sans-serif';
        const txtWidth = ctx.measureText(d.label).width;
        
        ctx.fillStyle = 'rgba(15, 25, 45, 0.88)';
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(dx + 16 - (txtWidth / 2) - 6, dy - 14, txtWidth + 12, 16, 6);
        } else {
          ctx.rect(dx + 16 - (txtWidth / 2) - 6, dy - 14, txtWidth + 12, 16);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label, dx + 16, dy - 6);
        ctx.restore();
      });
    }

    // 3. Draw Room Props
    if (room.props) {
      room.props.forEach(p => {
        const px = p.x * ts - camera.x;
        const py = p.y * ts - camera.y;
        window.spriteManager.drawProp(ctx, px, py, p.type, p.biasId);
      });
    }
  }

  // --------------------------------------------------------------------------
  // Rich Themed Atmosphere Generator (Distinct visuals per room!)
  // --------------------------------------------------------------------------
  renderThemedAtmosphere(ctx, room, camera, roomPxWidth, roomPxHeight) {
    const ts = this.tileSize;
    const theme = room.theme || 'hallway';
    const bgImg = this.bgImages[room.bgKey];

    // Check if high-res BG exists
    if (bgImg && bgImg.complete) {
      ctx.save();
      const sat = window.scenarioManager ? (0.35 + (window.scenarioManager.colorProgress / 100) * 0.75) : 0.6;
      ctx.filter = `saturate(${sat}) brightness(0.95)`;
      ctx.drawImage(bgImg, -camera.x, -camera.y, roomPxWidth, roomPxHeight);
      ctx.restore();
    } else {
      // Procedural Themed Room Art!
      for (let y = 0; y < room.height; y++) {
        for (let x = 0; x < room.width; x++) {
          const screenX = x * ts - camera.x;
          const screenY = y * ts - camera.y;

          if (screenX < -ts || screenX > ctx.canvas.width || screenY < -ts || screenY > ctx.canvas.height) {
            continue;
          }

          // Wall Tiles (Top / Sides)
          if (x === 0 || x === room.width - 1 || y === 0 || y === room.height - 1) {
            ctx.fillStyle = room.wallColor;
            ctx.fillRect(screenX, screenY, ts, ts);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(screenX, screenY + ts - 4, ts, 4);

            // Wall Trim Detail
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(screenX, screenY, ts, 2);
          } else {
            // Floor Tiles
            ctx.fillStyle = room.floorColor;
            ctx.fillRect(screenX, screenY, ts, ts);

            // Special Theme Patterns
            if (theme === 'cafeteria') {
              // Clean White/Grey Checker Kitchen Tiles
              if ((x + y) % 2 === 0) {
                ctx.fillStyle = 'rgba(223, 230, 233, 0.7)';
                ctx.fillRect(screenX, screenY, ts, ts);
              }
              // Grout line
              ctx.strokeStyle = 'rgba(178, 190, 195, 0.35)';
              ctx.lineWidth = 1;
              ctx.strokeRect(screenX, screenY, ts, ts);
            } else if (theme === 'playground') {
              // Lush Outdoor Grass Texture & Track
              if ((x + y) % 3 === 0) {
                ctx.fillStyle = '#00b894';
                ctx.fillRect(screenX, screenY, ts, ts);
              }
              // Running track on borders
              if (y === 1 || y === room.height - 2 || x === 1 || x === room.width - 2) {
                ctx.fillStyle = '#d63031'; // Red Track
                ctx.fillRect(screenX, screenY, ts, ts);
                ctx.strokeStyle = '#ffffff'; // White lane line
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, ts, ts);
              }
            } else if (theme === 'nurse') {
              // Warm soothing pastel clinical floor
              if ((x + y) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 234, 167, 0.3)';
                ctx.fillRect(screenX, screenY, ts, ts);
              }
            } else if (theme === 'core_chamber') {
              // Mysterious Dark Rune Floor with glowing runes
              ctx.fillStyle = '#1e0c24';
              ctx.fillRect(screenX, screenY, ts, ts);
              if ((x + y) % 4 === 0) {
                ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                ctx.fillRect(screenX + 4, screenY + 4, ts - 8, ts - 8);
              }
            } else if (room.floorStyle === 'wood') {
              // Wooden Parquet Floor
              ctx.strokeStyle = 'rgba(139, 69, 19, 0.15)';
              ctx.lineWidth = 1;
              ctx.strokeRect(screenX, screenY, ts, ts);
            }
          }
        }
      }
    }

    // Grid Navigation Assist
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= room.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * ts - camera.x, -camera.y);
      ctx.lineTo(x * ts - camera.x, roomPxHeight - camera.y);
      ctx.stroke();
    }
    for (let y = 0; y <= room.height; y++) {
      ctx.beginPath();
      ctx.moveTo(-camera.x, y * ts - camera.y);
      ctx.lineTo(roomPxWidth - camera.x, y * ts - camera.y);
      ctx.stroke();
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
