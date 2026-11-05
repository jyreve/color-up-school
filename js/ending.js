/**
 * COLOR UP SCHOOL - Ending, Analytics & Pledge Certificate Engine
 * Evaluates 4 multi-endings, renders visual school aftermath, and generates the printable Pledge Card!
 */

class EndingEngine {
  constructor() {
    this.endings = {
      'colorful': {
        type: 'ENDING TYPE A',
        title: '🌈 COLORFUL SCHOOL : 찬란하게 꽃피는 다양성의 학교',
        summary: '당신의 용기 있는 선택들이 모여, 학교는 서로를 존중하고 성별에 얽매이지 않고 자유롭게 꿈꿀 수 있는 따뜻하고 다채로운 공간으로 완전히 변모했습니다!',
        badgeClass: 'badge-colorful'
      },
      'beginning': {
        type: 'ENDING TYPE B',
        title: '🌱 변화가 시작된 학교 : 서로의 목소리에 귀 기울이는 첫걸음',
        summary: '아직 모든 문제가 완전히 해결된 것은 아니지만, 학생들은 서로의 고민을 솔직하게 나누고 차별에 대해 대화하기 시작했습니다. 희망의 싹이 트고 있습니다.',
        badgeClass: 'badge-beginning'
      },
      'superficial': {
        type: 'ENDING TYPE C',
        title: '⚖️ 겉으로만 평등한 학교 : 규칙의 변화와 남아있는 마음의 거리',
        summary: '학교의 제도와 규칙은 공정하게 개선되었지만, 학생들의 일상적인 고정관념과 편견 어린 시선은 아직 완전히 허물어지지 않았습니다. 지속적인 공감과 성찰이 필요합니다.',
        badgeClass: 'badge-superficial'
      },
      'silent': {
        type: 'ENDING TYPE D',
        title: '🌫️ 침묵의 학교 : 무관심 속에 흩어지는 목소리들',
        summary: '불편한 차별과 고정관념을 보면서도 대부분의 학생이 방관하거나 침묵했습니다. 학교는 여전히 잿빛 그늘에 머물러 있습니다. 작은 용기가 다시 필요합니다.',
        badgeClass: 'badge-silent'
      }
    };
  }

  showEnding() {
    // 하교 전 마음 체크를 먼저
    const sm0 = window.scenarioManager;
    if (sm0.mindPre && !sm0.mindPost && window.gameApp && window.gameApp.showMindCheck) {
      window.gameApp.showMindCheck('post', () => this.showEnding());
      return;
    }
    // Hide other screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const endingScreen = document.getElementById('ending-screen');
    endingScreen.classList.remove('hidden');
    endingScreen.classList.add('active');

    const stats = window.scenarioManager.playerStats;
    const avgScore = (stats.courage + stats.empathy + stats.respect + stats.opportunity + stats.freedom) / 5;

    // Determine Ending Type
    let endingKey = 'colorful';
    if (avgScore >= 65 && stats.courage >= 50 && stats.respect >= 50) {
      endingKey = 'colorful';
    } else if (avgScore >= 45) {
      if (stats.opportunity >= 60 && stats.empathy < 40) {
        endingKey = 'superficial';
      } else {
        endingKey = 'beginning';
      }
    } else {
      endingKey = 'silent';
    }

    const endingData = this.endings[endingKey];
    const art = { colorful: 'ending_colorful', beginning: 'ending_beginning', superficial: 'ending_beginning', silent: 'ending_silent' }[endingKey];
    const head = document.querySelector('.ending-header-card');
    if (head) {
      let banner = head.querySelector('.ending-banner');
      if (!banner) { banner = document.createElement('img'); banner.className = 'ending-banner'; head.insertBefore(banner, head.firstChild); }
      banner.src = `assets/images/${art}.jpg`;
      head.dataset.ending = endingKey;
    }
    if (window.gameApp) window.gameApp.swapStatIcons(document.getElementById('ending-screen'));

    // Populate DOM
    document.getElementById('ending-type-badge').textContent = endingData.type;
    document.getElementById('ending-title-text').textContent = endingData.title;
    document.getElementById('ending-summary-text').textContent = endingData.summary;

    // Display Stats
    document.getElementById('end-val-courage').textContent = stats.courage;
    document.getElementById('end-val-empathy').textContent = stats.empathy;
    document.getElementById('end-val-respect').textContent = stats.respect;
    document.getElementById('end-val-opportunity').textContent = stats.opportunity;
    document.getElementById('end-val-freedom').textContent = stats.freedom;

    // Generate Personalized Feedback Report
    this.generateFeedbackReport(stats, avgScore);

    // Draw Visual Canvas
    this.drawEndingVisualCanvas(endingKey);

    // Bind Pledge Card events
    this.bindPledgeEvents();
  }

  generateFeedbackReport(stats, avgScore) {
    const feedbackEl = document.getElementById('ending-feedback-text');
    if (!feedbackEl) return;

    let strengths = [];
    let improvements = [];

    if (stats.courage >= 60) strengths.push('부당한 상황과 편견에 침묵하지 않고 당당하게 목소리를 내는 <b>실천적 용기</b>');
    else improvements.push('차별적 언행을 마주했을 때 회피하지 않고 단호히 의사를 밝히는 <b>행동하는 용기</b>');

    if (stats.empathy >= 60) strengths.push('친구들이 겪는 고민과 상처를 자기 일처럼 헤아리는 <b>따뜻한 공감 능력</b>');
    else improvements.push('겉으로 드러나지 않는 친구들의 내면적 아픔에 더 세심하게 다가가는 <b>정서적 공감</b>');

    if (stats.respect >= 60) strengths.push('성별의 잣대 없이 상대방의 고유한 개성과 존엄을 있는 그대로 인정하는 <b>포용과 존중</b>');
    if (stats.opportunity >= 60) strengths.push('누구에게나 공평한 참여의 기회와 자율성을 열어주려는 <b>민주적 리더십</b>');
    if (stats.freedom >= 60) strengths.push('성별 고정관념의 틀을 깨고 각자의 꿈을 마음껏 펼칠 수 있도록 지지하는 <b>자유의 정신</b>');

    let reportHtml = `
      <p><b>[총평]</b> 전반적인 양성평등 실천 역량 점수는 <b>${Math.round(avgScore)}점</b>입니다.</p>
      <p style="margin-top: 6px;">✨ <b>돋보인 강점:</b> ${strengths.length > 0 ? strengths.join(', ') : '성장 잠재력'}에서 뛰어난 모습을 보여주었습니다.</p>
    `;

    if (improvements.length > 0) {
      reportHtml += `<p style="margin-top: 6px;">💡 <b>더 발전시킬 점:</b> ${improvements.join(', ')}를 일상생활에서 조금 더 연습한다면 더욱 훌륭한 양성평등 리더가 될 수 있습니다.</p>`;
    }

    // 💬 내가 한 말 돌아보기: 어떤 말이 친구를 웃게 했고, 어떤 말이 상처를 줬는지
    const sm = window.scenarioManager;
    const log = (sm && sm.choiceLog) || [];
    if (log.length) {
      const good = log.filter(l => l.grade !== 'bad' && !l.rebuilt).length;
      const fixedN = log.filter(l => l.rebuilt).length;
      const bad = log.filter(l => l.grade === 'bad');
      reportHtml += `<div class="talk-review">
        <h4>💬 내가 한 말 돌아보기</h4>
        <p>처음부터 힘이 된 말 <b class="ok">${good}번</b> · 상처를 준 말 <b class="ng">${bad.length}번</b> · 스스로 고쳐 말한 말 <b class="fx">${fixedN}번</b></p>
        <p class="talk-sub">이유 카드: 정답 ${sm.reasonRight || 0}번 · 아쉬움 ${sm.reasonWrong || 0}번</p>
        ${bad.length ? `<p class="talk-sub">아래 말들에는 고정관념이 숨어 있었어요. 실제 학교생활에서는 어떻게 바꿔 말할 수 있을까요?</p>
        <ul>${bad.map(l => `<li><span class="who">${l.who}</span> <s>“${l.text}”</s>${l.fixed ? `<br><span class="fixed-line">✏️ 고쳐 말한 말: “${l.fixed}”</span>` : ''}${l.lesson ? `<br><small>💡 ${l.lesson}</small>` : ''}</li>`).join('')}</ul>`
        : '<p class="talk-sub">한 번도 친구에게 상처를 주지 않았어요! 내 말 한마디가 친구와 학교를 바꿀 수 있다는 걸 보여 줬어요.</p>'}
      </div>`;
    }

    // 📊 마음 체크 비교 그래프
    if (sm && sm.mindPre && sm.mindPost && typeof MIND_ITEMS !== 'undefined') {
      const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
      const pre = avg(sm.mindPre), post = avg(sm.mindPost);
      const diff = pre - post;
      const msg = diff > 0.3 ? `성별 고정관념에 동의하는 정도가 <b>${pre.toFixed(1)} → ${post.toFixed(1)}</b>로 줄었어요! 생각이 조금 넓어졌네요. 🌱`
        : diff < -0.3 ? `동의하는 정도가 <b>${pre.toFixed(1)} → ${post.toFixed(1)}</b>로 오히려 늘었어요. 어떤 문장에서 그랬는지 다시 살펴볼까요?`
        : `동의하는 정도가 <b>${pre.toFixed(1)} → ${post.toFixed(1)}</b>로 비슷해요. 처음부터 생각이 분명했거나, 아직 고민 중일 수 있어요.`;
      reportHtml += `<div class="mind-review"><h4>📊 내 생각은 어떻게 달라졌을까?</h4><p class="talk-sub">${msg}<br><small>1 = 전혀 아니야 · 5 = 정말 그래 (낮을수록 고정관념에서 자유로워요)</small></p>
        ${MIND_ITEMS.map((q, i) => `<div class="mr-row"><div class="mr-q">${q}</div>
          <div class="mr-bars"><div class="mr-bar pre" style="width:${sm.mindPre[i] * 20}%"><span>처음 ${sm.mindPre[i]}</span></div>
          <div class="mr-bar post" style="width:${sm.mindPost[i] * 20}%"><span>지금 ${sm.mindPost[i]}</span></div></div></div>`).join('')}</div>`;
    }
    // 🗳️ 학급 회의 · 💬 대화한 친구
    if (sm && ((sm.meetingChoices && sm.meetingChoices.length) || sm.sideTalksDone)) {
      reportHtml += `<div class="mind-review"><h4>🗳️ 정답 없는 문제에서 나의 생각</h4>
        ${(sm.meetingChoices || []).map(m => `<p>• <b>${m.title}</b>: ${m.pick}</p>`).join('')}
        <p>• 편견 섞인 말을 한 친구와 <b>${sm.sideTalksDone || 0}명</b> 대화해서 생각을 나눴어요.</p>
        <p class="talk-sub">정답이 없는 문제일수록 "누구에게 공정한가?"를 함께 따져 보는 게 중요해요.</p></div>`;
    }

    feedbackEl.innerHTML = reportHtml;
  }

  drawEndingVisualCanvas(endingKey) {
    const canvas = document.getElementById('ending-school-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (endingKey === 'colorful') {
      // Lush rainbow sky & vibrant school building
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#74b9ff');
      skyGrad.addColorStop(0.7, '#ffbe76');
      skyGrad.addColorStop(1, '#ff7675');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Sun / Rainbow Arc
      ctx.strokeStyle = 'rgba(255, 234, 167, 0.4)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(w / 2, h + 40, 160, Math.PI, 0);
      ctx.stroke();

      // School Building
      ctx.fillStyle = '#ff7979';
      ctx.fillRect(140, 70, 320, 140);
      // Roof
      ctx.fillStyle = '#eb4d4b';
      ctx.beginPath();
      ctx.moveTo(120, 70); ctx.lineTo(300, 20); ctx.lineTo(480, 70); ctx.closePath();
      ctx.fill();

      // Clock Tower
      ctx.fillStyle = '#f9ca24';
      ctx.beginPath();
      ctx.arc(300, 48, 12, 0, Math.PI * 2);
      ctx.fill();

      // Windows
      ctx.fillStyle = '#7ed6df';
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.fillRect(170 + c * 56, 90 + r * 50, 32, 28);
        }
      }

      // Ground & Flower Blossom
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(0, 210, w, 50);

      // Student silhouettes celebrating
      for (let i = 0; i < 7; i++) {
        const sx = 180 + i * 40;
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(sx, 205, 5, 0, Math.PI * 2);
        ctx.fillRect(sx - 3, 210, 6, 12);
        ctx.fill();
      }
    } else {
      // Monochrome / Cloudy tone
      ctx.fillStyle = '#57606f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(140, 80, 320, 130);
      ctx.fillStyle = '#747d8c';
      ctx.fillRect(0, 210, w, 50);
    }
  }

  bindPledgeEvents() {
    const btnGenerate = document.getElementById('btn-generate-card');
    const pledgeWrapper = document.getElementById('pledge-card-container');
    const playerName = window.entityManager.player.name || '루다';

    btnGenerate.onclick = () => {
      const q4Input = document.getElementById('pledge-one-line').value.trim();
      const finalPledge = q4Input || '성별의 틀을 넘어 서로의 꿈과 개성을 끝까지 응원하는 친구가 되겠습니다!';

      const stats = window.scenarioManager.playerStats;

      document.getElementById('cert-player-name').textContent = playerName;
      document.getElementById('cert-pledge-text').textContent = `“${finalPledge}”`;
      document.getElementById('cert-s-courage').textContent = stats.courage;
      document.getElementById('cert-s-empathy').textContent = stats.empathy;
      document.getElementById('cert-s-respect').textContent = stats.respect;
      document.getElementById('cert-s-opportunity').textContent = stats.opportunity;
      document.getElementById('cert-s-freedom').textContent = stats.freedom;

      const today = new Date();
      const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}`;
      document.getElementById('cert-date-text').textContent = dateStr;

      pledgeWrapper.classList.remove('hidden');
      pledgeWrapper.scrollIntoView({ behavior: 'smooth' });

      if (window.soundEngine) {
        window.soundEngine.playBadgeUnlock();
      }
    };

    // Print / Save Button
    const btnPrint = document.getElementById('btn-print-pledge');
    btnPrint.onclick = () => {
      window.print();
    };

    // Restart Game Button
    const btnRestart = document.getElementById('btn-restart-game');
    btnRestart.onclick = () => {
      window.location.reload();
    };
  }
}

// Global Ending Engine
window.endingEngine = new EndingEngine();
