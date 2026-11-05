/**
 * COLOR UP SCHOOL - School SNS (SchoolGram) Engine
 * Simulates real-time social media feed and student anonymous board reflecting player choices.
 */

class SNSEngine {
  constructor() {
    this.posts = [];
    this.unreadCount = 0;
    this.postTemplates = this.initTemplates();
    
    // Initial post at game start
    this.addInitialPosts();
  }

  initTemplates() {
    return {
      'initial_1': {
        author: '익명_2학년',
        avatarColor: '#57606f',
        time: '방금 전',
        body: '전학 온 친구 봤어? 우리 학교는 맨날 남녀 갈라서 편가르기만 하고 분위기 회색빛인데... 적응할 수 있으려나.',
        tags: ['#학교생활', '#전학생', '#무기력'],
        likes: 12
      },
      'initial_2': {
        author: '체육부_고민러',
        avatarColor: '#747d8c',
        time: '10분 전',
        body: '축구하고 싶은 애들이 있어도 분위기 때문에 눈치 보느라 말도 못 꺼내는 현실... 언제쯤 바뀌려나.',
        tags: ['#체육시간', '#눈치'],
        likes: 8
      },

      // Sua Choices
      'sua_soccer_cheer': {
        author: '운동장_직관러',
        avatarColor: '#e17055',
        time: '방금 전',
        body: '대박! 방금 운동장에서 축구부 지원한 여학생 킥 봤음? 슛 진짜 날카롭더라! "여자가 축구를?" 하던 애들 입 싹 닫음 ㅋㅋㅋ 응원해준 친구도 멋있더라!',
        tags: ['#축구부', '#걸크러쉬', '#멋지다', '#양성평등'],
        likes: 45
      },
      'sua_soccer_rules': {
        author: '스포츠_리포터',
        avatarColor: '#0984e3',
        time: '방금 전',
        body: '축구부 공식 규칙에 성별 제한 없다는 거 이번에 처음 알았음! 실력으로 선발하는 공정한 학교 멋지다.',
        tags: ['#공정한기회', '#축구부선발'],
        likes: 38
      },
      'sua_soccer_sad': {
        author: '익명_축구팬',
        avatarColor: '#636e72',
        time: '방금 전',
        body: '결국 축구하고 싶어 하던 친구 포기했나 봐... 좋아하는 것도 맘대로 못하는 분위기 좀 답답하네.',
        tags: ['#아쉬움', '#고정관념'],
        likes: 15
      },

      // Minwoo Choices
      'minwoo_dream': {
        author: '상담실_목격자',
        avatarColor: '#6c5ce7',
        time: '방금 전',
        body: '진로상담실에서 유치원 교사 꿈꾸는 남학생 당당하게 포부 밝히는 거 들었는데 진짜 멋있었음! 다정함이야말로 최고의 리더십이지!',
        tags: ['#유아교육', '#꿈을응원해', '#자유로운선택'],
        likes: 52
      },
      'minwoo_sad': {
        author: '익명_진로고민',
        avatarColor: '#57606f',
        time: '방금 전',
        body: '직업까지 성별로 따지는 세상... 언제쯤 내가 진짜 원하는 꿈을 꿀 수 있을까.',
        tags: ['#진로스트레스'],
        likes: 14
      },

      // Jinhyeuk Choices
      'jinhyeuk_heal': {
        author: '보건부원',
        avatarColor: '#00cec9',
        time: '방금 전',
        body: '농구부 에이스 항상 아파도 억지로 참더니 오늘 보건실 와서 솔직하게 치료받고 웃더라. "남자는 울면 안 돼" 같은 억압 버리니까 훨씬 편해 보여!',
        tags: ['#솔직한감정', '#마음건강', '#존중'],
        likes: 49
      },

      // Haeun Choices
      'haeun_confidence': {
        author: '급식실_친구',
        avatarColor: '#fd79a8',
        time: '방금 전',
        body: '외모 강박 때문에 밥도 굶던 친구가 오늘은 활짝 웃으면서 급식 맛있게 먹음! 있는 그대로의 네가 제일 눈부셔!',
        tags: ['#외모지상주의탈피', '#자존감UP', '#당당함'],
        likes: 61
      },

      // Student Council Choices
      'council_reform': {
        author: '학생회_소식통',
        avatarColor: '#3742fa',
        time: '방금 전',
        body: '속보!! 이번 축제 준비 "남자는 힘쓰고 여자는 꾸미기" 전면 폐지! 원하는 파트에 자유 지원하고 함께 돕는 방식으로 바뀜! 우리 학교 레전드 갱신 중!',
        tags: ['#축제혁신', '#성별무관', '#협동', '#스쿨체인지'],
        likes: 89
      },

      // Yuna Choices
      'cyber_respect_campaign': {
        author: '방송부_알림',
        avatarColor: '#9b59b6',
        time: '방금 전',
        body: '단톡방 성차별적 밈과 외모 비하에 대해 "멈추자"고 용기 내준 친구들 덕분에 오늘부터 사이버 존중 캠페인 방송 시작합니다! 악플 멈춰!',
        tags: ['#사이버존중', '#방관자NO', '#용기있는외침'],
        likes: 95
      },

      // Hyunseo Choices
      'stem_equality': {
        author: '과학부_연구원',
        avatarColor: '#1abc9c',
        time: '방금 전',
        body: '동아리에서 간호 로봇 연구하는 친구 아이디어 대박 터짐! 이과/문과, 공학/보건에 남녀가 어디 있어? 세상을 바꾸는 건 열정이다!',
        tags: ['#미래과학', '#로봇공학', '#편견없는세상'],
        likes: 77
      }
    };
  }

  addInitialPosts() {
    // 댓글 미션 결과 게시글 + 친구들이 상처받았을 때 올라오는 글
    Object.assign(this.postTemplates, {
      sns_mission_best: { author: '응원단장_2학년', avatarColor: '#ff6fa5', body: '사진에 달린 악플 보고 속상했는데, 내 편 들어준 댓글 보고 힘 났어! 다음 체육대회도 내가 단장 할래 📣', tags: ['#응원단장', '#외모평가NO', '#댓글의힘'], likes: 120 },
      sns_mission_good: { author: '스쿨그램_운영진', avatarColor: '#4dabf7', body: '외모 비하 댓글 신고 감사합니다! 스쿨그램은 서로를 존중하는 댓글을 응원해요.', tags: ['#건강한댓글', '#신고정신'], likes: 64 },
      jinhyeuk_sad: { author: '익명_농구부', avatarColor: '#636e72', body: '에이스 발목 또 부었대... 아프다고 말을 못 하니까 계속 무리하는 듯.', tags: ['#참는게능사아님'], likes: 11 },
      haeun_sad: { author: '익명_급식실', avatarColor: '#636e72', body: '오늘 급식 거의 안 먹고 간 친구 있던데... 사진 때문이라고 들음. 좀 걱정된다.', tags: ['#외모압박'], likes: 9 },
      council_sad: { author: '익명_축제준비', avatarColor: '#636e72', body: '축제 역할표 보니까 또 남자 짐, 여자 꾸미기... 무대 기획하고 싶었는데 그냥 포기함.', tags: ['#역할고정'], likes: 17 },
      yuna_sad: { author: '익명_단톡방', avatarColor: '#636e72', body: '단톡방 그 사진들 아직도 올라옴... 아무도 안 말리니까 더 심해지는 듯.', tags: ['#방관도가해'], likes: 13 },
      hyunseo_sad: { author: '익명_과학부', avatarColor: '#636e72', body: '공학 캠프 신청 안 한다는 친구 있던데 아깝다... 아이디어 진짜 좋았는데.', tags: ['#포기한꿈'], likes: 10 },
      jimin_sad: { author: '익명_2학년3반', avatarColor: '#636e72', body: '반장 후보 등록 안 한대. "여자는 부반장"이라는 말 신경 쓰였나 봐.', tags: ['#리더십에성별없음'], likes: 12 },
      jimin_vote: { author: '2학년3반_선관위', avatarColor: '#7b6cff', body: '반장 선거 결과 발표! 새 반장의 첫 공약은 "모두가 한 번씩 발표하는 학급회의" 🎉', tags: ['#반장선거', '#리더십'], likes: 73 },
      doyun_sad: { author: '익명_댄스부', avatarColor: '#636e72', body: '오디션 영상 올린다던 남학생 결국 안 올렸대. 춤 진짜 잘 추던데...', tags: ['#눈치'], likes: 14 },
      doyun_dance: { author: '방송댄스부', avatarColor: '#ff8fbc', body: '이번 오디션 최고 점수는 2학년 남학생! 센터 확정 🕺 춤은 좋아하는 사람이 추는 거지!', tags: ['#댄스부', '#나답게'], likes: 88 },
      seoyeon_sad: { author: '익명_시험기간', avatarColor: '#636e72', body: '시험 기간에도 집안일 하느라 공부 못 한 친구 있음... 왜 걔만 해야 하는지 모르겠다.', tags: ['#가사분담'], likes: 15 },
      seoyeon_family: { author: '가족회의_성공담', avatarColor: '#69db7c', body: '우리 집 가족회의로 집안일 당번표 만들었어요! 오빠는 빨래, 아빠는 요리 담당 🧺🍳', tags: ['#집안일은모두의일', '#가족회의'], likes: 66 }
    });

    this.posts.push({ ...this.postTemplates['initial_1'], id: 'init_1', isLiked: false });
    this.posts.push({ ...this.postTemplates['initial_2'], id: 'init_2', isLiked: false });
    this.unreadCount = 2;
    this.updateBadge();
  }

  addPost(triggerKey) {
    const template = this.postTemplates[triggerKey];
    if (!template) return;

    // Prepend new post
    this.posts.unshift({
      ...template,
      id: 'post_' + Date.now(),
      time: '방금 전',
      isLiked: false
    });

    this.unreadCount++;
    this.updateBadge();

    // Show dynamic toast
    if (window.showGameToast) {
      window.showGameToast('📱 스쿨그램에 새로운 학교 소식이 등록되었습니다!', '#70a1ff');
    }
  }

  // 📱 댓글 미션: 악플 달린 게시글에 어떤 댓글을 달까?
  renderMission(container, containerId) {
    const sm = window.scenarioManager;
    if (!sm || !sm.snsMission) return;
    const m = sm.snsMission;
    const card = document.createElement('div');
    card.className = 'sns-post-card sns-mission' + (sm.snsMissionDone ? ' done' : '');
    const comments = m.badComments.map(c => `<div class="sns-cmt bad"><b>${c.who}</b> ${c.text}</div>`).join('');
    const mine = (this.myComment) ? `<div class="sns-cmt mine ${this.myComment.grade}"><b>나</b> ${this.myComment.text}</div>
        <div class="sns-result ${this.myComment.grade}">${this.myComment.result}${this.myComment.lesson ? `<br><span>💡 ${this.myComment.lesson}</span>` : ''}</div>` : '';
    card.innerHTML = `
      <div class="sns-mission-tag">${sm.snsMissionDone ? '✔ 댓글 미션 완료' : '📢 댓글 미션! 어떤 댓글을 달까요?'}</div>
      <div class="sns-post-header">
        <div class="sns-avatar" style="background-color:#ff6fa5">📸</div>
        <div class="sns-author-info"><div class="sns-author-name">${m.author}</div><div class="sns-post-time">오늘</div></div>
      </div>
      <div class="sns-post-body">${m.post}</div>
      <img class="sns-photo-img" src="assets/images/sns_cheer.jpg" alt="응원단장 사진">
      <div class="sns-comments">${comments}${mine}</div>
      ${sm.snsMissionDone ? '' : '<div class="sns-choice-list"></div>'}`;
    if (!sm.snsMissionDone) {
      const list = card.querySelector('.sns-choice-list');
      m.choices.slice().sort(() => Math.random() - 0.5).forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'sns-choice-btn';
        b.innerHTML = `<span class="choice-num">${i + 1}</span><span>${c.text}</span>`;
        b.onclick = () => {
          const stats = sm.applySnsChoice(c);
          this.myComment = c;
          const names = { courage: '🦁 용기', empathy: '💖 공감', respect: '🤝 존중' };
          const txt = Object.entries(stats || {}).map(([k, v]) => `${names[k]} ${v > 0 ? '+' : ''}${v}`).join(' · ');
          if (c.grade === 'bad') {
            if (window.showGameToast) window.showGameToast(`💔 댓글이 누군가를 아프게 했어요. ${txt} — 다시 댓글을 달아 볼 수 있어요.`, '#ff4d6d');
            setTimeout(() => { this.myComment = null; this.renderFeed(containerId); }, 4500);
          } else {
            if (window.soundEngine && window.soundEngine.playStatUp) window.soundEngine.playStatUp();
            if (window.showGameToast) window.showGameToast(`🌈 댓글 미션 완료! ${txt}`, '#ffd43b');
            this.addPost(c.grade === 'best' ? 'sns_mission_best' : 'sns_mission_good');
          }
          this.renderFeed(containerId);
        };
        list.appendChild(b);
      });
    }
    container.appendChild(card);
  }

  updateBadge() {
    const badgeEl = document.getElementById('sns-badge-dot');
    if (badgeEl) {
      if (this.unreadCount > 0) {
        badgeEl.classList.add('active');
      } else {
        badgeEl.classList.remove('active');
      }
    }
  }

  renderFeed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.unreadCount = 0;
    this.updateBadge();

    container.innerHTML = '';
    this.renderMission(container, containerId);

    this.posts.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'sns-post-card';
      postEl.innerHTML = `
        <div class="sns-post-header">
          <div class="sns-avatar" style="background-color: ${post.avatarColor}">👤</div>
          <div class="sns-author-info">
            <div class="sns-author-name">${post.author}</div>
            <div class="sns-post-time">${post.time}</div>
          </div>
        </div>
        <div class="sns-post-body">${post.body}</div>
        <div class="sns-post-tags">
          ${post.tags.map(t => `<span class="sns-tag">${t}</span>`).join('')}
        </div>
        <div class="sns-post-footer">
          <button class="sns-like-btn" data-post-id="${post.id}">
            <span class="heart-icon">${post.isLiked ? '❤️' : '🤍'}</span>
            <span class="like-count">${post.likes}</span>
          </button>
          <span>💬 댓글 ${Math.floor(post.likes / 3)}</span>
        </div>
      `;

      // Like interaction
      const likeBtn = postEl.querySelector('.sns-like-btn');
      likeBtn.addEventListener('click', () => {
        post.isLiked = !post.isLiked;
        post.likes += post.isLiked ? 1 : -1;
        likeBtn.querySelector('.heart-icon').textContent = post.isLiked ? '❤️' : '🤍';
        likeBtn.querySelector('.like-count').textContent = post.likes;
        if (window.soundEngine) window.soundEngine.playClick();
      });

      container.appendChild(postEl);
    });
  }
}

// Global SNS Instance
window.snsEngine = new SNSEngine();
