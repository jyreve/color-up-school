/**
 * COLOR UP SCHOOL - Sprites & Pixel Art Renderer
 * High-definition 2D pixel characters (featuring Ruda), expressive animations, and vibrant themed props!
 */

class SpriteManager {
  constructor() {
    this.cache = {};
  }

  // --------------------------------------------------------------------------
  // Draw Character Sprite on Map (Player - Ruda & NPCs)
  // --------------------------------------------------------------------------
  drawCharacter(ctx, x, y, charData, direction = 'down', frame = 0, isInteracting = false) {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));

    const isWalk = (frame % 2 === 1);
    const bob = isWalk ? -2 : 0;
    const legOffset = isWalk ? 3 : 0;

    // Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(16, 30, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const skinColor = charData.skinColor || '#f6d8b8';
    const hairColor = charData.hairColor || '#3d2314'; // Ruda: Rich warm brown
    const jacketColor = charData.jacketColor || '#1c2e4a'; // Navy blazer
    const trimGold = '#d4af37'; // Gold edge trim
    const skirtColor = charData.skirtColor || '#1c2e4a'; // Navy pleated skirt
    const tieColor = charData.tieColor || '#e58e26'; // Gold/Navy tie
    const hairType = charData.hairType || 'ruda_bob'; // Default: Ruda hair

    // 1. Legs, Tights & Shoes
    if (charData.isRuda || hairType === 'ruda_bob') {
      // Dark Tights / Stockings (from player_standing.png)
      ctx.fillStyle = '#22272e';
      if (direction === 'down' || direction === 'up') {
        ctx.fillRect(10, 23 + bob, 4, 6 + (isWalk ? -legOffset : 0));
        ctx.fillRect(18, 23 + bob, 4, 6 + (isWalk ? legOffset : 0));
      } else if (direction === 'left' || direction === 'right') {
        ctx.fillRect(11 - (isWalk ? 2 : 0), 23 + bob, 5, 6);
        ctx.fillRect(16 + (isWalk ? 2 : 0), 23 + bob, 5, 6);
      }
      // Dark Loafer Shoes
      ctx.fillStyle = '#111418';
      ctx.fillRect(9, 28 + bob, 6, 3);
      ctx.fillRect(17, 28 + bob, 6, 3);

      // Pleated Skirt with gold trim accent
      ctx.fillStyle = skirtColor;
      ctx.beginPath();
      ctx.moveTo(8, 19 + bob);
      ctx.lineTo(24, 19 + bob);
      ctx.lineTo(26, 24 + bob);
      ctx.lineTo(6, 24 + bob);
      ctx.closePath();
      ctx.fill();
      // Skirt pleat lines
      ctx.strokeStyle = '#121f33';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(11, 19 + bob); ctx.lineTo(10, 24 + bob);
      ctx.moveTo(16, 19 + bob); ctx.lineTo(16, 24 + bob);
      ctx.moveTo(21, 19 + bob); ctx.lineTo(22, 24 + bob);
      ctx.stroke();
    } else {
      // General NPC / Pants or Skirt
      ctx.fillStyle = charData.pantsColor || '#2d3436';
      if (direction === 'down' || direction === 'up') {
        ctx.fillRect(9, 22 + bob, 5, 7 + (isWalk ? -legOffset : 0));
        ctx.fillRect(18, 22 + bob, 5, 7 + (isWalk ? legOffset : 0));
      } else {
        ctx.fillRect(12 - (isWalk ? 2 : 0), 22 + bob, 6, 7);
        ctx.fillRect(15 + (isWalk ? 2 : 0), 22 + bob, 6, 7);
      }
      // Shoes
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(8, 28 + bob, 6, 3);
      ctx.fillRect(18, 28 + bob, 6, 3);
    }

    // 2. Body / School Blazer Uniform
    ctx.fillStyle = jacketColor;
    ctx.fillRect(9, 13 + bob, 14, 8);

    // Gold Trim & Collar (from player_standing.png)
    ctx.fillStyle = trimGold;
    ctx.fillRect(8, 13 + bob, 1, 8); // Left gold line
    ctx.fillRect(23, 13 + bob, 1, 8); // Right gold line
    ctx.fillRect(9, 13 + bob, 14, 1); // Collar trim

    // White Shirt Inner V-Neck
    if (direction !== 'up') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(13, 13 + bob);
      ctx.lineTo(16, 17 + bob);
      ctx.lineTo(19, 13 + bob);
      ctx.closePath();
      ctx.fill();

      // Striped Tie
      ctx.fillStyle = tieColor;
      ctx.fillRect(15, 14 + bob, 2, 5);
      ctx.fillStyle = '#1c2e4a';
      ctx.fillRect(15, 15 + bob, 2, 1);
      ctx.fillRect(15, 17 + bob, 2, 1);

      // Gold School Emblem on Left Chest
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(10, 15 + bob, 2, 2);

      // Backpack Strap (Ruda detail)
      if (charData.isRuda || hairType === 'ruda_bob') {
        ctx.fillStyle = '#6d4c41'; // Leather brown strap
        ctx.fillRect(9, 13 + bob, 2, 7);
      }
    } else {
      // Back of Jacket
      ctx.fillStyle = jacketColor;
      ctx.fillRect(9, 13 + bob, 14, 8);
      // Backpack on back
      if (charData.isRuda || hairType === 'ruda_bob') {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(10, 14 + bob, 12, 7);
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(12, 16 + bob, 8, 4);
      }
    }

    // 3. Head & Face
    ctx.fillStyle = skinColor;
    ctx.fillRect(9, 3 + bob, 14, 10);

    // Expressive Eyes (Amber/Brown eyes for Ruda)
    if (direction === 'down') {
      // Eye White / Shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 7 + bob, 4, 4);
      ctx.fillRect(17, 7 + bob, 4, 4);
      // Iris (Warm Amber / Brown)
      ctx.fillStyle = (charData.isRuda || hairType === 'ruda_bob') ? '#b3541e' : '#2f3542';
      ctx.fillRect(12, 7 + bob, 2, 3);
      ctx.fillRect(18, 7 + bob, 2, 3);
      // Pupil highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 7 + bob, 1, 1);
      ctx.fillRect(18, 7 + bob, 1, 1);
      // Soft Blush
      ctx.fillStyle = 'rgba(255, 121, 121, 0.6)';
      ctx.fillRect(10, 10 + bob, 3, 2);
      ctx.fillRect(19, 10 + bob, 3, 2);
      // Smile
      ctx.fillStyle = '#d63031';
      ctx.fillRect(15, 11 + bob, 2, 1);
    } else if (direction === 'left') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 7 + bob, 4, 4);
      ctx.fillStyle = (charData.isRuda || hairType === 'ruda_bob') ? '#b3541e' : '#2f3542';
      ctx.fillRect(9, 7 + bob, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 7 + bob, 1, 1);
      ctx.fillStyle = 'rgba(255, 121, 121, 0.6)';
      ctx.fillRect(9, 10 + bob, 2, 2);
    } else if (direction === 'right') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 7 + bob, 4, 4);
      ctx.fillStyle = (charData.isRuda || hairType === 'ruda_bob') ? '#b3541e' : '#2f3542';
      ctx.fillRect(21, 7 + bob, 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(21, 7 + bob, 1, 1);
      ctx.fillStyle = 'rgba(255, 121, 121, 0.6)';
      ctx.fillRect(21, 10 + bob, 2, 2);
    }

    // 4. Hair Rendering (Accurate to player_standing.png)
    ctx.fillStyle = hairColor;
    if (hairType === 'ruda_bob' || charData.isRuda) {
      // Top volume
      ctx.fillRect(7, 0 + bob, 18, 5);
      // Hair shine highlight
      ctx.fillStyle = '#5c3822';
      ctx.fillRect(9, 1 + bob, 14, 1);
      ctx.fillStyle = hairColor;

      if (direction === 'up') {
        // Back of head - wavy bob
        ctx.fillRect(6, 2 + bob, 20, 12);
        ctx.fillRect(7, 13 + bob, 18, 3);
      } else {
        // Left & Right Side Wavy Curled Locks (framing face)
        ctx.fillRect(6, 2 + bob, 4, 12);
        ctx.fillRect(22, 2 + bob, 4, 12);
        ctx.fillRect(5, 7 + bob, 2, 7); // Outer wave left
        ctx.fillRect(25, 7 + bob, 2, 7); // Outer wave right

        // Front Bangs (Side-swept natural fringe)
        ctx.fillRect(8, 3 + bob, 16, 3);
        ctx.fillRect(9, 5 + bob, 5, 2);
        ctx.fillRect(17, 5 + bob, 6, 2);

        // Cute gold earring sparkle
        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(6, 9 + bob, 1, 2);
        ctx.fillRect(25, 9 + bob, 1, 2);
      }
    } else if (hairType === 'ponytail') {
      ctx.fillRect(7, 1 + bob, 18, 5);
      ctx.fillRect(6, 3 + bob, 3, 7);
      ctx.fillRect(23, 3 + bob, 3, 7);
      ctx.fillRect(9, 4 + bob, 14, 3);
      // Ponytail puff
      ctx.fillRect(23, 0 + bob, 7, 7);
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(22, 2 + bob, 2, 4); // Hair tie
    } else if (hairType === 'twintail') {
      ctx.fillRect(7, 1 + bob, 18, 5);
      ctx.fillRect(4, 5 + bob, 4, 10);
      ctx.fillRect(24, 5 + bob, 4, 10);
      ctx.fillRect(9, 4 + bob, 14, 3);
    } else if (hairType === 'glasses') {
      ctx.fillRect(8, 1 + bob, 16, 5);
      ctx.fillRect(7, 3 + bob, 3, 6);
      ctx.fillRect(22, 3 + bob, 3, 6);
      ctx.fillRect(9, 4 + bob, 14, 2);
      // Glasses frame
      if (direction !== 'up') {
        ctx.strokeStyle = '#ffd32a';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 7 + bob, 5, 4);
        ctx.strokeRect(17, 7 + bob, 5, 4);
      }
    } else if (hairType === 'sporty') {
      ctx.fillRect(8, 0 + bob, 16, 6);
      ctx.fillRect(7, 3 + bob, 3, 5);
      ctx.fillRect(22, 3 + bob, 3, 5);
      // Headband / sweatband
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(8, 3 + bob, 16, 2);
    } else {
      // Short neat
      ctx.fillRect(8, 1 + bob, 16, 5);
      ctx.fillRect(7, 3 + bob, 3, 6);
      ctx.fillRect(22, 3 + bob, 3, 6);
      ctx.fillRect(9, 4 + bob, 14, 2);
    }

    // Nameplate under character (Arpia Style)
    if (charData.name) {
      ctx.font = 'bold 10px Galmuri11, sans-serif';
      const nameWidth = ctx.measureText(charData.name).width;
      ctx.fillStyle = 'rgba(12, 24, 48, 0.88)';
      ctx.strokeStyle = '#ffd32a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(16 - (nameWidth / 2) - 4, 34 + bob, nameWidth + 8, 14, 4);
      } else {
        ctx.rect(16 - (nameWidth / 2) - 4, 34 + bob, nameWidth + 8, 14);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charData.name, 16, 41 + bob);
    }

    // Interactive Emote / Quest Icon over NPC
    if (charData.isNPC) {
      const isCleared = window.scenarioManager && window.scenarioManager.resolvedScenarios.includes(charData.scenarioKey || charData.name);
      if (isCleared) {
        this.drawEmoteBubble(ctx, 16, -10, 'cleared');
      } else {
        this.drawEmoteBubble(ctx, 16, -10, charData.emoteType || 'quest');
      }
    }

    ctx.restore();
  }

  // Draw Animated Emote Bubble above head
  drawEmoteBubble(ctx, x, y, type = 'quest') {
    const time = Date.now() / 200;
    const floatY = y + Math.sin(time) * 3;

    // Bubble Background
    ctx.fillStyle = (type === 'cleared') ? '#e8f8f5' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, floatY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = (type === 'cleared') ? '#2ecc71' : '#f39c12';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Bubble Pointer
    ctx.fillStyle = (type === 'cleared') ? '#e8f8f5' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 3, floatY + 7);
    ctx.lineTo(x, floatY + 12);
    ctx.lineTo(x + 3, floatY + 7);
    ctx.fill();

    // Icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px Galmuri11, sans-serif';
    
    if (type === 'cleared') {
      ctx.fillStyle = '#27ae60';
      ctx.fillText('✔', x, floatY + 1);
    } else if (type === 'quest' || type === '!') {
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('!', x, floatY + 1);
    } else if (type === 'heart') {
      ctx.fillStyle = '#ff4757';
      ctx.fillText('♥', x, floatY + 1);
    } else {
      ctx.fillStyle = '#f39c12';
      ctx.fillText('?', x, floatY + 1);
    }
  }

  // --------------------------------------------------------------------------
  // Themed Room Props & Animated Background Objects
  // --------------------------------------------------------------------------
  drawProp(ctx, x, y, type, biasId = null) {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));
    const time = Date.now() / 300;

    switch (type) {
      // 🍱 1. CAFETERIA PROPS (급식실)
      case 'cafeteria_serving_counter': {
        // Large Stainless Steel Food Serving Counter
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(0, 0, 96, 32);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(2, 2, 92, 28);

        // Food Compartments (Warm rice, soup, side dishes)
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(6, 6, 22, 20); // Warm Rice
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(32, 6, 26, 20); // Spicy Stew
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(62, 6, 28, 9);  // Fresh Greens
        ctx.fillStyle = '#d35400';
        ctx.fillRect(62, 17, 28, 9); // Meat dish

        // Steam particle effect from hot soup
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 2) * 0.3})`;
        ctx.beginPath();
        ctx.arc(45, 2 + Math.sin(time * 3) * 3, 5, 0, Math.PI * 2);
        ctx.arc(17, 2 + Math.cos(time * 3) * 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label Plaque
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 8px Galmuri11';
        ctx.fillText('🍚 맛있는 급식 배식대', 12, -4);
        break;
      }

      case 'cafeteria_lunch_table': {
        // Modern Cafeteria Table with Meal Trays and Utensils
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(0, 8, 64, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 10, 60, 16);

        // Meal Trays (식판)
        [8, 36].forEach(tx => {
          ctx.fillStyle = '#bdc3c7';
          ctx.fillRect(tx, 12, 20, 12);
          ctx.fillStyle = '#ffffff'; // rice
          ctx.fillRect(tx + 2, 18, 6, 4);
          ctx.fillStyle = '#e74c3c'; // soup
          ctx.fillRect(tx + 10, 18, 8, 4);
          ctx.fillStyle = '#2ecc71'; // side
          ctx.fillRect(tx + 2, 13, 5, 3);
          ctx.fillStyle = '#f39c12'; // side
          ctx.fillRect(tx + 9, 13, 5, 3);
        });

        // Stools / Chairs
        ctx.fillStyle = '#34495e';
        ctx.fillRect(6, 2, 12, 6);
        ctx.fillRect(46, 2, 12, 6);
        ctx.fillRect(6, 28, 12, 6);
        ctx.fillRect(46, 28, 12, 6);
        break;
      }

      case 'cafeteria_eating_students': {
        // Animated Students chatting & enjoying lunch together
        const talkBob = Math.sin(time * 3) * 1.5;

        // Student A (Left)
        ctx.fillStyle = '#1c2e4a';
        ctx.fillRect(2, 4 + talkBob, 12, 10);
        ctx.fillStyle = '#fed7b2';
        ctx.fillRect(4, -4 + talkBob, 8, 8);
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(3, -6 + talkBob, 10, 4);

        // Student B (Right)
        ctx.fillStyle = '#e84393';
        ctx.fillRect(22, 4 - talkBob, 12, 10);
        ctx.fillStyle = '#f6d8b8';
        ctx.fillRect(24, -4 - talkBob, 8, 8);
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(23, -6 - talkBob, 10, 4);

        // Speech Sparkle
        ctx.fillStyle = '#ffd32a';
        ctx.font = 'bold 9px Galmuri11';
        ctx.fillText('♪', 16, -8 + talkBob);
        break;
      }

      case 'cafeteria_water_station': {
        // Water Cooler & Sanitizer
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(4, 8, 24, 24);
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(6, 12, 20, 18);
        // Water Bottle
        ctx.fillStyle = '#3498db';
        ctx.fillRect(9, 0, 14, 10);
        // Cup dispenser
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(24, 6, 4, 18);
        break;
      }

      // ⚽ 2. PLAYGROUND PROPS (운동장)
      case 'soccer_goal': {
        // 3D-effect Soccer Goal with dynamic net
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 64, 36);

        // Netting
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        for (let i = 6; i < 64; i += 6) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 36); ctx.stroke();
        }
        for (let j = 6; j < 36; j += 6) {
          ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(64, j); ctx.stroke();
        }

        // Soccer Ball near goal
        const ballX = 32 + Math.sin(time) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ballX, 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(ballX, 30, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'sports_bench': {
        // Wooden Athletic Bench & Water Bottles
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, 10, 48, 12);
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(4, 22, 6, 8);
        ctx.fillRect(38, 22, 6, 8);

        // Sports Bags & Towel
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(8, 4, 12, 8);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(24, 6, 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(34, 7, 8, 4); // Towel
        break;
      }

      case 'running_students': {
        // Animated Students Training & Jogging
        const jog = (Math.floor(Date.now() / 150) % 2 === 0) ? -2 : 2;
        ctx.fillStyle = '#00cec9';
        ctx.fillRect(4, 10 + jog, 10, 12);
        ctx.fillStyle = '#f6d8b8';
        ctx.fillRect(5, 2 + jog, 8, 8);
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(4, 0 + jog, 10, 4);

        // Sweat drops
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(15, 2 + jog, 2, 2);
        break;
      }

      // 🩺 3. NURSE OFFICE PROPS (보건실)
      case 'nurse_bed': {
        // Comfortable Clinic Bed with Curtain
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 4, 30, 46);
        // Blanket
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(0, 16, 30, 34);
        // Pillow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 6, 22, 8);
        // Red Cross Mark
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(13, 26, 4, 12);
        ctx.fillRect(9, 30, 12, 4);

        // Privacy Curtain Rail
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(34, 0); ctx.lineTo(34, 48);
        ctx.stroke();
        break;
      }

      case 'medicine_cabinet': {
        // First Aid Pharmacy Glass Cabinet
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, 32, 44);
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(2, 2, 28, 40);

        // Shelves with bottles and bandages
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(5, 6, 6, 8); // Red bottle
        ctx.fillStyle = '#3498db';
        ctx.fillRect(14, 6, 5, 8); // Blue bottle
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(21, 6, 6, 8); // Green box

        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(5, 18, 10, 6); // First aid kit
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(18, 18, 9, 6); // Bandages

        // Large Medical Cross Emblem
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(13, 28, 6, 12);
        ctx.fillRect(10, 31, 12, 6);
        break;
      }

      case 'height_scale': {
        // Height & Weight Scale (신장 체중계)
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(8, 22, 16, 8); // Scale base
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(14, 0, 4, 24); // Measuring bar
        ctx.fillStyle = '#34495e';
        ctx.fillRect(10, 2, 12, 4); // Height head
        break;
      }

      // 💬 4. CAREER COUNSELING PROPS (진로상담실)
      case 'counseling_board': {
        // Large Career Exploration Vision Board
        ctx.fillStyle = '#4a235a';
        ctx.fillRect(0, 0, 64, 30);
        ctx.fillStyle = '#f9ebea';
        ctx.fillRect(2, 2, 60, 26);

        // Career Sticky Notes (Doctor, Engineer, Artist, Teacher)
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(6, 6, 14, 10);
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(24, 6, 14, 10);
        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(42, 6, 14, 10);

        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 7px Galmuri11';
        ctx.fillText('꿈의 지도', 18, 24);
        break;
      }

      case 'counseling_table': {
        // Warm Cozy Consultation Table with Tea & Reports
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();

        // Teacups
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 12, 5, 5);
        ctx.fillRect(19, 12, 5, 5);
        // Steam
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(10, 8 + Math.sin(time * 4), 2, 3);
        ctx.fillRect(21, 8 + Math.cos(time * 4), 2, 3);
        break;
      }

      // 🔮 5. CORE CHAMBER / BASEMENT PROPS (지하 특별실 - 편견의 핵)
      case 'core_crystal': {
        // Pulsing Giant Floating Core of Prejudice with Mystical Aura
        const pulse = Math.sin(time * 2) * 4;
        const glow = 0.5 + Math.sin(time * 3) * 0.4;

        // Dark Runed Altar Base
        ctx.fillStyle = '#1e0c24';
        ctx.beginPath();
        ctx.ellipse(24, 36, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Magic Aura Ring
        ctx.strokeStyle = `rgba(165, 94, 234, ${glow})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(24, 18 + pulse, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Floating Crystal Diamond
        ctx.fillStyle = '#6c5ce7';
        ctx.beginPath();
        ctx.moveTo(24, 4 + pulse);
        ctx.lineTo(34, 18 + pulse);
        ctx.lineTo(24, 32 + pulse);
        ctx.lineTo(14, 18 + pulse);
        ctx.closePath();
        ctx.fill();

        // Inner Core Glow
        ctx.fillStyle = '#fd79a8';
        ctx.beginPath();
        ctx.moveTo(24, 8 + pulse);
        ctx.lineTo(30, 18 + pulse);
        ctx.lineTo(24, 28 + pulse);
        ctx.lineTo(18, 18 + pulse);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'steam_pipes': {
        // Industrial Basement Steam Pipes
        ctx.fillStyle = '#4b6584';
        ctx.fillRect(0, 0, 64, 8);
        ctx.fillStyle = '#778ca3';
        ctx.fillRect(0, 2, 64, 4);

        // Pipe Joint Rings
        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(16, -1, 4, 10);
        ctx.fillRect(44, -1, 4, 10);
        break;
      }

      // 🏛️ 6. STUDENT COUNCIL PROPS (학생회실)
      case 'council_board': {
        // Festival Project Board
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(0, 0, 64, 28);
        ctx.fillStyle = '#00d2d3';
        ctx.fillRect(2, 2, 60, 24);
        ctx.fillStyle = '#1e272e';
        ctx.font = 'bold 8px Galmuri11';
        ctx.fillText('🌈 모두가 함께 만드는 축제', 6, 16);
        break;
      }

      // 🎙️ 7. BROADCAST ROOM PROPS (방송실)
      case 'broadcast_console': {
        // Studio Audio Mixer & Microphone
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, 6, 48, 22);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(2, 8, 44, 18);

        // Equalizer LED Lights (Animated)
        const eqH1 = 4 + Math.abs(Math.sin(time * 5)) * 8;
        const eqH2 = 4 + Math.abs(Math.cos(time * 6)) * 8;
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(6, 22 - eqH1, 4, eqH1);
        ctx.fillRect(14, 22 - eqH2, 4, eqH2);

        // ON AIR Sign (Pulsing Red)
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#ff4757' : '#57606f';
        ctx.fillRect(28, 10, 16, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6px Galmuri11';
        ctx.fillText('ON AIR', 29, 16);
        break;
      }

      // 🎨 8. GENERAL SCHOOL PROPS
      case 'desk': {
        ctx.fillStyle = '#b77b42';
        ctx.fillRect(2, 6, 28, 18);
        ctx.fillStyle = '#dca067';
        ctx.fillRect(4, 8, 24, 14);
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(3, 22, 3, 8);
        ctx.fillRect(26, 22, 3, 8);
        ctx.fillStyle = '#834c24';
        ctx.fillRect(8, 26, 16, 6);
        break;
      }

      case 'blackboard': {
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, 0, 96, 28);
        ctx.fillStyle = '#218c74';
        ctx.fillRect(3, 3, 90, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Galmuri11';
        ctx.fillText('양성평등 = 우리 모두의 행복', 8, 16);
        break;
      }

      case 'plant': {
        ctx.fillStyle = '#b33939';
        ctx.fillRect(8, 18, 16, 12);
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.arc(16, 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#26af5f';
        ctx.beginPath();
        ctx.arc(14, 9, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'lockers': {
        ctx.fillStyle = '#4b6584';
        ctx.fillRect(0, 0, 48, 30);
        ctx.fillStyle = '#747d8c';
        ctx.fillRect(2, 2, 20, 26);
        ctx.fillRect(26, 2, 20, 26);
        ctx.fillStyle = '#ffd32a';
        ctx.fillRect(18, 14, 2, 4);
        ctx.fillRect(42, 14, 2, 4);
        break;
      }

      case 'bias_poster': {
        // Bias Detection Poster (Glows!)
        const isCompleted = window.scenarioManager && window.scenarioManager.completedBiases.includes(biasId);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 2, 24, 28);
        ctx.fillStyle = isCompleted ? '#2ecc71' : '#eb4d4b';
        ctx.fillRect(6, 4, 20, 6);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(6, 12, 20, 2);
        ctx.fillRect(6, 16, 16, 2);
        ctx.fillRect(6, 20, 18, 2);

        // Glowing sparkle ring if active
        if (!isCompleted) {
          ctx.fillStyle = `rgba(255, 211, 42, ${0.4 + Math.sin(time) * 0.4})`;
          ctx.beginPath();
          ctx.arc(16, 16, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }
}

// Global Sprites Instance
window.spriteManager = new SpriteManager();
