/**
 * COLOR UP SCHOOL - Story Scenarios, Dialogue Trees & Education Core
 * Contains all deep branching choices, NPC memory states, bias detection missions, and strict 1-time mission limits.
 */

class ScenarioManager {
  constructor() {
    this.playerStats = {
      courage: 10,
      empathy: 10,
      respect: 10,
      opportunity: 10,
      freedom: 10
    };

    this.currentAct = 1; // ACT 1 to 6
    this.colorProgress = 0; // 0% to 100%
    this.totalNPCMissions = 10; // 친구 10명
    this.totalBiases = 5;

    this.npcTrust = {
      sua: 20,
      minwoo: 20,
      jinhyeuk: 20,
      haeun: 20,
      taeo: 20,
      yuna: 20,
      hyunseo: 20,
      jimin: 20,
      doyun: 20,
      seoyeon: 20
    };
    this.choiceLog = [];      // 내가 한 말 기록 (엔딩에서 돌아보기)
    this.hurtCount = 0;       // 친구에게 상처 준 횟수
    this.snsMissionDone = false;

    this.npcMemory = {}; // Remembers past choices
    this.badges = []; // Collected badges
    this.completedBiases = [];
    this.resolvedScenarios = []; // List of completed NPC keys (1-time only!)

    this.scenarios = this.initScenarios();
    this.biasMissions = this.initBiasMissions();
    this.snsMission = this.initSnsMission();
  }

  // --------------------------------------------------------------------------
  // 친구 10명의 고민 대화 (생각하는 게임 버전)
  //   grade: 'best'(정답) · 'good'(괜찮은 답) · 'bad'(편견이 섞인 말)
  //   why     : 좋은 말을 골랐을 때 "왜 좋은 말일까?" 이유 카드 (options[0]이 정답)
  //   parts   : 나쁜 말을 조각으로 나눈 것 (hurt: true 가 친구를 아프게 한 부분)
  //   rebuild : 다시 말해 보기 — 칸마다 [좋은 조각, 편견 조각]
  //   선택지·이유·조각 순서는 매번 섞여서 나옵니다.
  // --------------------------------------------------------------------------
  initScenarios() {
    const P = (t, hurt) => ({ t, hurt: !!hurt });
    const S = (o) => {
      o.choices.forEach(c => { if (c.parts) c.text = c.parts.map(p => p.t).join(' '); });
      return {
        name: o.name, role: o.role, location: o.location, portrait: o.key, intro: '',
        focus: o.focus, why: o.why, rebuild: o.rebuild,
        dialogues: {
          initial: { text: o.text, expression: 'sad', choices: o.choices },
          retry: { text: o.retry, expression: 'sad', choices: o.choices },
          revisit_supported: { text: o.revisit, expression: 'happy', choices: [] }
        }
      };
    };
    return {
      sua: S({
        key: 'sua', name: '수아', role: '축구를 사랑하는 학생', location: 'playground',
        focus: ['courage', 'opportunity', 'freedom'],
        text: '하아... 나 이번에 학교 축구부 들어가고 싶다고 지원서 냈거든? 그런데 몇몇 애들이 "여자가 무슨 축구야? 피구나 해"라고 수군거려... 정말 내가 이상한 걸까?',
        retry: '...아까 네 말 듣고 좀 서운했어. 그래도 한 번만 더 물어볼게. 나, 축구부 들어가도 될까?',
        revisit: '루다야! 저번에 네가 용기를 준 덕분에 축구부 테스트를 당당히 통과했어! 공격수 자리까지 맡았다고! 정말 고마워!',
        why: { q: '이 말이 수아에게 힘이 된 이유는 뭘까?',
          options: ['수아를 "여자"가 아니라 축구를 좋아하는 한 사람으로 봐 줬기 때문', '수아 기분이 좋아지도록 듣기 좋은 말을 해 줬기 때문', '여자도 남자만큼 잘할 수 있다고 비교해 줬기 때문'],
          explain: '힘이 되는 말은 듣기 좋은 말이 아니라, 친구를 성별이 아닌 한 사람으로 봐 주는 말이에요.' },
        rebuild: { slots: [['네가 좋아하는 축구니까', '여자애가 하기엔 힘들어도'], ['남들 말 신경 쓰지 말고', '남자애들 눈치 보면서'], ['당당하게 지원해 봐!', '조용히 연습만 해 봐.']],
          response: '...응, 다시 들으니까 힘이 난다. 당당하게 지원할게! 고마워.' },
        choices: [
          { grade: 'best', text: '네가 좋아하고 잘하는 거잖아. 테스트 날 나도 운동장에 응원하러 갈게!',
            response: '고마워...! 네 말을 들으니 가슴이 쿵쾅거려. 남들 시선에 지지 않고 실력으로 보여줄래!', snsTrigger: 'sua_soccer_cheer' },
          { grade: 'good', text: '축구부 규칙부터 같이 확인해 보자. 성별 제한이 없으면 당당하게 지원해!',
            response: '맞아, 규칙에 성별 제한은 없더라! 정식 테스트로 실력을 인정받을게!', snsTrigger: 'sua_soccer_rules' },
          { grade: 'bad', parts: [P('남자애들은 거칠어서'), P('여자는 다칠 수 있으니까,', true), P('여자 축구부 생길 때까지 기다려 봐.', true)],
            response: '...너도 내가 여자라서 약하다고 생각하는구나. 다치는 건 남자애들도 똑같은데.',
            lesson: '걱정하는 말처럼 들려도, "여자라서 위험해"는 기회를 빼앗는 고정관념이에요.', snsTrigger: 'sua_soccer_sad' },
          { grade: 'bad', parts: [P('애들 말은 장난이니까 신경 쓰지 마.', true), P('대신 우리랑 피구 하자,', true), P('피구도 진짜 재밌어!')],
            response: '피구가 싫다는 게 아니야... 난 축구가 하고 싶은 건데. 내 마음은 안 들어주는구나.',
            lesson: '친구가 원하는 것을 다른 것으로 바꾸라고 하면, 결국 편견을 따르라는 말이 돼요.', snsTrigger: 'sua_soccer_sad' }
        ]
      }),

      minwoo: S({
        key: 'minwoo', name: '민우', role: '아이들을 좋아하는 꿈나무', location: 'counseling',
        focus: ['freedom', 'empathy', 'respect'],
        text: '루다야... 나 어릴 때부터 유치원 교사가 꿈이었거든. 아이들 돌보고 가르치는 게 정말 행복한데, 친구들이 "남자가 무슨 유치원 선생이냐, 돈 많이 버는 직업이나 적어라"라며 비웃었어...',
        retry: '진로 조사서 아직 못 냈어... 루다야, 너는 정말 어떻게 생각해?',
        revisit: '선생님께 진로 계획서를 냈더니 엄청 칭찬해주셨어! 유아교육 봉사 동아리도 직접 만들어볼 생각이야!',
        why: { q: '이 말이 민우에게 힘이 된 이유는 뭘까?',
          options: ['민우의 꿈을 성별이 아니라 민우의 장점(다정함)과 연결해 줬기 때문', '유치원 교사도 돈을 꽤 번다고 알려 줬기 때문', '남자 유치원 교사는 드물어서 특별하다고 해 줬기 때문'],
          explain: '"남자라서 특별해"도 성별로 보는 말이에요. 그 사람이 가진 장점을 봐 주는 게 진짜 응원이에요.' },
        rebuild: { slots: [['아이들을 좋아하는 너라면', '남자가 하기엔 좀 그래도'], ['누구보다 다정한', '돈은 적게 벌어도 괜찮은'], ['선생님이 될 거야!', '선생님이 되겠지 뭐.']],
          response: '...그렇게 말해 주니까 다시 용기가 나. 진로 조사서에 당당하게 적을게!' },
        choices: [
          { grade: 'best', text: '아이들이 너만 보면 웃잖아. 너 같은 선생님 있으면 나도 다니고 싶겠다!',
            response: '진짜...? 그렇게 말해줘서 눈물 날 것 같아. 내 꿈을 당당하게 적을게!', snsTrigger: 'minwoo_dream' },
          { grade: 'good', text: '진로 선생님께 같이 가서 유아교육과 정보부터 알아보자. 길이 많을 거야.',
            response: '맞아. 남들 고정관념 때문에 내 꿈을 버릴 순 없지! 상담 같이 가 줘서 고마워.', snsTrigger: 'minwoo_dream' },
          { grade: 'bad', parts: [P('남자는 나중에 가족을 책임져야 하니까,', true), P('월급 많은 직업도'), P('같이 생각해 보는 게 어때?')],
            response: '...가족을 책임지는 건 남자만의 일이 아니잖아. 너까지 그렇게 말하니까 힘 빠진다.',
            lesson: '"남자는 돈을 많이 벌어야 해"도 성별 고정관념이에요. 진로는 적성과 흥미로 정해요.', snsTrigger: 'minwoo_sad' },
          { grade: 'bad', parts: [P('오, 멋지다!'), P('남자 선생님이니까', true), P('체육이랑 힘쓰는 일 맡으면 딱이겠다!', true)],
            response: '난 아이들이랑 그림책 읽고 이야기하는 게 좋은 건데... 결국 남자라서 정해진 일만 하라는 거야?',
            lesson: '칭찬처럼 들려도, 성별에 따라 역할을 정해 주는 건 고정관념이에요.', snsTrigger: 'minwoo_sad' }
        ]
      }),

      jinhyeuk: S({
        key: 'jinhyeuk', name: '진혁', role: '농구부 에이스', location: 'nurse',
        focus: ['empathy', 'courage', 'freedom'],
        text: '윽... 아, 루다구나. 별거 아니야. 농구하다 삔 것뿐인데... "남자는 이 정도 아픔쯤은 참고 이겨내야 한다"잖아. 아프다고 징징대면 약해 보이니까...',
        retry: '발목이 계속 욱신거려... 근데 아프다고 하면 약해 보일까 봐. 넌 어떻게 생각해?',
        revisit: '루다야, 발목 치료받고 푹 쉬었더니 금방 나았어! 이제 힘든 일 있으면 친구들에게 솔직하게 털어놓고 있어.',
        why: { q: '이 말이 진혁이에게 힘이 된 이유는 뭘까?',
          options: ['아픔을 말하는 걸 약함이 아니라 용기로 바꿔 생각하게 해 줬기 때문', '에이스니까 빨리 나아서 경기를 뛰어야 한다고 응원했기 때문', '남자도 가끔은 울어도 된다고 허락해 줬기 때문'],
          explain: '"남자도 가끔은 괜찮아"는 여전히 예외로 보는 말이에요. 아픔과 감정은 누구에게나 당연한 거예요.' },
        rebuild: { slots: [['아프면 아프다고', '남자라도 가끔은'], ['말하는 게', '꾹 참는 게'], ['당연한 거야.', '멋있는 거야.']],
          response: '...그래, 사실 엄청 아팠어. 보건 선생님께 솔직하게 말할게.' },
        choices: [
          { grade: 'best', text: '아픈 걸 말하는 것도 용기야. 오늘은 푹 쉬고 다음 경기 때 제대로 뛰자.',
            response: '...사실 엄청 아팠어. 솔직하게 말하니까 오히려 마음이 가벼워진다. 고마워.', snsTrigger: 'jinhyeuk_heal' },
          { grade: 'good', text: '보건 선생님께 아픈 곳을 정확히 말씀드리자. 참으면 더 오래 못 뛸 수도 있어.',
            response: '그래, 그냥 참기만 하면 더 다칠 수도 있겠다. 치료 제대로 받아볼게.', snsTrigger: 'jinhyeuk_heal' },
          { grade: 'bad', parts: [P('역시 에이스는 다르네!'), P('이 정도는 참고 뛰는 게', true), P('진짜 멋있는 거지!', true)],
            response: '...그래, 다들 그렇게 생각하지. 아파도 웃으면서 뛰어야 멋있는 거겠지. (발목을 꽉 쥔다)',
            lesson: '"참는 게 멋있다"는 말은 아픔을 숨기게 만들어요. 몸과 마음의 신호는 성별과 상관없이 소중해요.', snsTrigger: 'jinhyeuk_sad' },
          { grade: 'bad', parts: [P('걱정 마,'), P('남자가 보건실에서 울었다는 거', true), P('내가 비밀로 해 줄게.', true)],
            response: '...우는 게 비밀로 해야 할 만큼 창피한 일이야? 더 숨고 싶어졌어.',
            lesson: '도와주려는 마음이어도, "남자가 울면 창피하다"는 생각을 더 굳게 만들 수 있어요.', snsTrigger: 'jinhyeuk_sad' }
        ]
      }),

      haeun: S({
        key: 'haeun', name: '하은', role: '외모 고민이 있는 학생', location: 'cafeteria',
        focus: ['respect', 'empathy', 'freedom'],
        text: '오늘 단체 사진 찍는 날인데... 아까 어떤 애가 "여자는 외모가 곧 스펙이고 예뻐야 대접받는다"고 말하는 걸 들었어. 나 살도 찐 것 같고 너무 못나 보이지 않아...?',
        retry: '거울만 계속 보게 돼... 루다야, 나 진짜 괜찮은 걸까?',
        revisit: '루다야! 요즘 맛있는 급식도 든든하게 먹고, 친구들과 활짝 웃으며 사진 찍었어! 내 모습 그대로가 참 좋아.',
        why: { q: '이 말이 하은이에게 힘이 된 이유는 뭘까?',
          options: ['외모가 아니라 하은이라는 사람 자체의 가치를 말해 줬기 때문', '하은이가 충분히 예쁘다고 칭찬해 줬기 때문', '살이 하나도 안 쪘다고 안심시켜 줬기 때문'],
          explain: '"너 예뻐", "안 쪘어"도 결국 외모가 중요하다는 말이 돼요. 외모 기준 자체가 잘못됐다고 말해 주는 게 힘이 돼요.' },
        rebuild: { slots: [['외모로 사람을 평가하는', '살찐 걸 지적하는'], ['그 말이 잘못된 거야.', '그 말도 틀린 건 아니지만'], ['넌 지금 그대로 소중해.', '조금만 관리하면 돼.']],
          response: '...맞아, 그 말이 이상한 거였어. 밥 든든히 먹고 웃으면서 찍을래!' },
        choices: [
          { grade: 'best', text: '그 말이 이상한 거야. 사람 가치는 외모로 안 정해져. 밥 먹고 같이 찍자!',
            response: '...그렇게 말해주는 친구가 있어서 다행이야. 오늘은 그냥 나답게 웃으면서 사진 찍을래!', snsTrigger: 'haeun_confidence' },
          { grade: 'good', text: '남의 외모 평가하는 말은 그냥 흘려들어. 맛있게 먹고 사진 찍으러 가자!',
            response: '맞아, 그 말에 휘둘릴 필요 없지. 배고팠는데 같이 먹으러 가자!', snsTrigger: 'haeun_confidence' },
          { grade: 'bad', parts: [P('걱정 마, 너 하나도 안 쪘어!', true), P('사진 예쁘게 나오게', true), P('내가 각도 잡아 줄게.')],
            response: '고마워... 근데 결국 예쁘게 나와야 한다는 거네. 안 예쁘게 나오면 어떡하지...',
            lesson: '"너 예뻐"도 결국 외모가 중요하다는 말이 될 수 있어요. 외모가 아닌 사람 자체를 존중해 주세요.', snsTrigger: 'haeun_sad' },
          { grade: 'bad', parts: [P('오늘은 사진만 잘 나오면 되니까,'), P('점심은 조금만 먹고', true), P('다이어트는 내일부터 같이 하자!', true)],
            response: '...역시 내가 살을 빼야 하는 거구나. 밥 먹고 싶은 생각이 싹 사라졌어.',
            lesson: '외모 압박에 맞춰 주는 말은 친구를 더 힘들게 해요. 건강과 마음이 먼저예요.', snsTrigger: 'haeun_sad' }
        ]
      }),

      taeo: S({
        key: 'taeo', name: '태오', role: '학생회 부회장', location: 'student_council',
        focus: ['opportunity', 'respect', 'courage'],
        text: '루다야, 축제 준비 시간이 너무 촉박해. 효율을 위해서 남학생들은 무거운 천막이랑 무대 짐을 옮기고, 여학생들은 포스터 꾸미기랑 안내를 맡는 게 정석 아냐? 넌 어떻게 생각해?',
        retry: '역할 배정표를 오늘 안에 올려야 하거든. 다시 한번 의견 줄래?',
        revisit: '자율 신청제로 바꿨더니 남녀 모두가 무대 기획과 설치에 적극 참여해서 역대 최고로 멋진 축제가 준비되고 있어!',
        why: { q: '이 의견이 좋은 이유는 뭘까?',
          options: ['일을 성별이 아니라 각자의 희망과 능력으로 나누자고 했기 때문', '여학생들에게 힘든 일을 안 시키는 배려라서', '남학생과 여학생 일을 똑같은 양으로 나눴기 때문'],
          explain: '양을 똑같이 나누는 것보다, 성별로 미리 정하지 않고 각자 선택하게 하는 게 공정해요.' },
        rebuild: { slots: [['성별 말고', '남녀 특성에 맞게'], ['각자 하고 싶은 일로', '잘 어울리는 일로'], ['자유롭게 신청받자!', '미리 정해 주자!']],
          response: '자유 신청이라... 나도 사실 포스터 그리는 게 더 좋거든. 그렇게 바꿔 볼게!' },
        choices: [
          { grade: 'best', text: '하고 싶은 일을 각자 신청받아 보자. 무거운 짐은 다 같이 나르면 금방이야.',
            response: '그렇네... 나도 사실 포스터 그리는 게 더 좋거든. 자율 신청제로 바꿔볼게!', snsTrigger: 'council_reform' },
          { grade: 'good', text: '모든 팀을 남녀 섞어서 짜 보면 어때? 서로 도우면서 하면 될 것 같아.',
            response: '혼합 팀이라... 서로 도우면서 하면 더 빨리 끝나겠다. 좋아!', snsTrigger: 'council_reform' },
          { grade: 'bad', parts: [P('효율적인 건 맞지!', true), P('대신 여학생들 일도'), P('힘들다고 꼭 칭찬해 주자.')],
            response: '그치? 역시 이게 정석이야. (옆에서 지켜보던 여학생들 표정이 어두워진다...)',
            lesson: '칭찬을 덧붙여도, 성별로 역할을 미리 정하는 건 그대로 고정관념이에요.', snsTrigger: 'council_sad' },
          { grade: 'bad', parts: [P('여학생도 원하면 짐 옮겨도 되지만,'), P('그래도 기본은', true), P('남자가 하는 걸로 하자.', true)],
            response: '그래, 원하는 사람만 예외로 하면 되겠다. (결국 아무도 손을 들지 않았다...)',
            lesson: '"기본은 남자" 같은 규칙이 있으면 예외를 신청하기 어려워요. 처음부터 모두에게 열려 있어야 해요.', snsTrigger: 'council_sad' }
        ]
      }),

      yuna: S({
        key: 'yuna', name: '유나', role: '방송부원', location: 'broadcast',
        focus: ['courage', 'respect', 'empathy'],
        text: '루다야, 어쩌지... 반 단톡방에서 몇몇 애들이 여선생님과 여학생들을 성적으로 대상화하고 비하하는 밈을 올리며 낄낄거리고 있어. 말리고 싶은데 "분위기 망친다"며 내가 따돌림당할까 봐 너무 무서워...',
        retry: '단톡방에 또 그런 사진이 올라왔어... 나 어떻게 해야 할까?',
        revisit: '단톡방에서 당당히 문제 제기를 했더니 다른 친구들도 하나둘 동의해주었어! 부적절한 대화방이 자정되었어!',
        why: { q: '이 말이 유나에게 힘이 된 이유는 뭘까?',
          options: ['성적 대상화를 장난이 아닌 폭력으로 짚고, 유나를 혼자 두지 않겠다고 했기 때문', '단톡방 분위기를 망치지 않는 방법을 알려 줬기 때문', '유나가 상처받지 않게 피하는 방법을 알려 줬기 때문'],
          explain: '피하는 것보다 "그건 잘못이야"라고 함께 말해 주는 친구가 있을 때 용기를 낼 수 있어요.' },
        rebuild: { slots: [['그건 장난이 아니라', '그냥 장난이긴 하지만'], ['누군가를 아프게 하는 거야.', '좀 심하긴 하네.'], ['같이 그만하자고 말하자.', '못 본 척하자.']],
          response: '같이 말해 준다니까 덜 무서워. 우리가 먼저 용기 내 보자!' },
        choices: [
          { grade: 'best', text: '그건 장난이 아니라 폭력이야. 내가 옆에서 같이 "그만하자"고 말할게.',
            response: '같이 해 준다니까 하나도 안 무서워. 우리가 먼저 용기 내 보자!', snsTrigger: 'cyber_respect_campaign' },
          { grade: 'good', text: '일단 화면을 캡처해 두자. 그리고 같이 상담 선생님께 알리러 가자.',
            response: '맞아, 증거를 남기고 어른들께 도움을 요청하는 것도 방법이지. 같이 가 줘!', snsTrigger: 'cyber_respect_campaign' },
          { grade: 'bad', parts: [P('괜히 끼어들면 너만 이상해져.', true), P('그냥 단톡방에서'), P('조용히 나와 버려.')],
            response: '나만 나가면... 그 사진 속 친구들은 계속 상처받잖아. 모른 척하는 게 맞는 걸까?',
            lesson: '피하는 것도 이해되지만, 모두가 침묵하면 피해가 계속돼요. 함께 목소리를 내거나 도움을 요청해요.', snsTrigger: 'yuna_sad' },
          { grade: 'bad', parts: [P('그냥 웃자고 올린 밈인데,', true), P('너무 예민하게', true), P('받아들이는 거 아니야?')],
            response: '...예민한 게 아니야. 누군가를 성적으로 놀리는 건 장난이 될 수 없어. 너한테 말한 게 후회돼.',
            lesson: '"예민하다"는 말은 피해를 말하는 사람을 입 다물게 해요. 성적 대상화는 장난이 아니에요.', snsTrigger: 'yuna_sad' }
        ]
      }),

      hyunseo: S({
        key: 'hyunseo', name: '현서', role: '과학 동아리장', location: 'club',
        focus: ['opportunity', 'freedom', 'courage'],
        text: '안녕 루다야. 난 로봇 공학과 의료 공학을 융합해서 사람을 돕는 간호 로봇을 연구하고 싶거든? 그런데 "여자가 공학은 어렵다", "남학생들이나 하는 분야다"라는 선입견 때문에 지원을 망설이고 있어...',
        retry: '공학 캠프 신청 마감이 내일이야. 그냥 포기할까 고민 중이야...',
        revisit: '동아리에서 만든 간호 보조 로봇 시제품이 과학전람회 본선에 진출했어! 다 루다 네 덕분이야!',
        why: { q: '이 말이 현서에게 힘이 된 이유는 뭘까?',
          options: ['현서를 "여자 공학자"가 아니라 아이디어를 가진 한 사람으로 응원했기 때문', '여자인데 공학을 하다니 대단하다고 칭찬했기 때문', '공학이 생각보다 쉽다고 안심시켜 줬기 때문'],
          explain: '"여자인데 대단해"는 여자는 원래 못한다는 생각에서 나와요. 그 사람의 생각과 능력을 봐 주세요.' },
        rebuild: { slots: [['네 아이디어라면', '여자로서는 힘들어도'], ['어떤 분야든', '간호 쪽이 더'], ['도전할 만해!', '안전할 거야.']],
          response: '고마워! 내 아이디어를 믿어 주니까 자신감이 생겨. 캠프 신청할게!' },
        choices: [
          { grade: 'best', text: '사람을 돕는 간호 로봇이라니 진짜 멋진 생각이야. 캠프 신청서 같이 쓰자!',
            response: '고마워! 내 아이디어를 믿어 주니까 자신감이 생겨. 캠프 바로 신청할게!', snsTrigger: 'stem_equality' },
          { grade: 'good', text: '여성 공학자랑 남성 간호사 롤모델을 같이 찾아보자. 생각보다 많을 거야.',
            response: '오, 찾아보니 진짜 많다! 나도 누군가의 롤모델이 될 수 있겠지?', snsTrigger: 'stem_equality' },
          { grade: 'bad', parts: [P('여자가 공학 하면', true), P('특이해서 오히려 눈에 띌걸?', true), P('그걸 장점으로 써 봐!')],
            response: '...나는 특이해서가 아니라, 그냥 이게 좋아서 하는 건데. 계속 "여자 공학자"로만 보이겠구나.',
            lesson: '"여자인데 대단하다"처럼 성별을 특별하게 보는 것도 고정관념이에요. 그냥 그 사람의 능력으로 봐요.', snsTrigger: 'hyunseo_sad' },
          { grade: 'bad', parts: [P('공학은 너무 어려우니까,'), P('여자한테 더 잘 맞는', true), P('간호 쪽으로 가는 건 어때?')],
            response: '...역시 다들 내가 공학은 못 할 거라고 생각하는구나. 신청서 그냥 버릴까 봐.',
            lesson: '친구의 가능성을 미리 줄여 버리는 말이에요. 어려운 길도 응원받으면 도전할 수 있어요.', snsTrigger: 'hyunseo_sad' }
        ]
      }),

      jimin: S({
        key: 'jimin', name: '지민', role: '반장 선거 후보', location: 'classroom',
        focus: ['courage', 'opportunity', 'respect'],
        text: '루다야, 나 이번 반장 선거에 나가고 싶어. 그런데 애들이 "반장은 남자가 해야 카리스마 있지, 여자는 부반장이 어울려"라고 하더라... 나 나가도 될까?',
        retry: '후보 등록이 내일까지래. 아직도 고민 중이야...',
        revisit: '루다야! 나 반장 됐어! 공약대로 "모두가 발표하는 학급회의"를 시작했는데 반응이 정말 좋아!',
        why: { q: '이 말이 지민이에게 힘이 된 이유는 뭘까?',
          options: ['리더십을 성별이 아니라 지민이의 장점(잘 들어 주는 것)으로 봐 줬기 때문', '반장 선거에서 이기는 방법을 알려 줬기 때문', '여자 반장도 남자 반장만큼 잘할 수 있다고 해 줬기 때문'],
          explain: '"남자만큼 잘할 수 있어"는 여전히 남자를 기준으로 삼는 말이에요. 지민이 그대로의 장점을 봐 주세요.' },
        rebuild: { slots: [['리더십은 성별이 아니라', '반장은 원래 남자가 낫지만'], ['너의 생각과 책임감이야.', '너도 노력하면 돼.'], ['반장 선거 나가 봐!', '부반장부터 해 봐.']],
          response: '고마워! 네 말 듣고 결심했어. 반장 후보로 나갈게!' },
        choices: [
          { grade: 'best', text: '넌 친구들 말을 잘 들어 주잖아. 그게 반장한테 제일 필요한 거야. 나가 봐!',
            response: '고마워! 네 말 듣고 결심했어. 당당하게 반장 후보로 나갈게!', snsTrigger: 'jimin_vote' },
          { grade: 'good', text: '공약부터 같이 짜 보자. 반 애들이 진짜 원하는 걸 담으면 될 거야.',
            response: '좋아! 공약으로 진짜 실력을 보여주면 되지. 같이 써 보자!', snsTrigger: 'jimin_vote' },
          { grade: 'bad', parts: [P('부반장도 중요한 자리니까,'), P('괜히 상처받지 말고', true), P('부반장으로 나가는 게 어때?', true)],
            response: '...나는 반장이 하고 싶다고 말한 건데. 결국 너도 내가 반장은 안 어울린다고 생각하는구나.',
            lesson: '친구를 보호하려는 말이어도, 성별 때문에 꿈을 낮추라고 하면 고정관념을 따르게 돼요.', snsTrigger: 'jimin_sad' },
          { grade: 'bad', parts: [P('여자 반장이면 애들이 말 안 들을 수 있으니까,', true), P('목소리를 남자처럼', true), P('세게 연습해 봐.')],
            response: '내 모습 그대로는 리더가 될 수 없다는 거야? 왜 남자처럼 해야 하는데...?',
            lesson: '리더십에 정해진 "남자다운 모습"은 없어요. 자기 방식대로 이끄는 리더도 멋져요.', snsTrigger: 'jimin_sad' }
        ]
      }),

      doyun: S({
        key: 'doyun', name: '도윤', role: '춤을 좋아하는 학생', location: 'gym',
        focus: ['freedom', 'courage', 'respect'],
        text: '루다야, 나 방송댄스부 들어가고 싶어. 근데 애들이 "남자가 무슨 걸그룹 춤이냐, 차라리 농구부 들어가"라면서 놀려... 춤출 때가 제일 행복한데.',
        retry: '댄스부 오디션 영상 찍어 놨는데... 올릴까 말까 계속 고민돼.',
        revisit: '루다야! 댄스부 오디션 붙었어! 축제 무대에서 센터 맡았으니까 꼭 보러 와!',
        why: { q: '이 말이 도윤이에게 힘이 된 이유는 뭘까?',
          options: ['좋아하는 것을 성별 기준이 아니라 도윤이의 즐거움으로 봐 줬기 때문', '댄스부가 농구부보다 더 인기가 많다고 알려 줬기 때문', '남자가 춤을 춰도 멋있을 수 있다고 해 줬기 때문'],
          explain: '"남자가 춰도 멋있어"는 여전히 성별을 따지는 말이에요. 좋아하는 마음 자체를 응원해 주세요.' },
        rebuild: { slots: [['춤은 좋아하는 사람이', '춤은 원래 여자애들이'], ['누구나 출 수 있는 거야.', '더 잘 추긴 하지만'], ['오디션 꼭 봐!', '몰래 연습만 해.']],
          response: '진짜? 그렇게 말해 주니까 힘이 난다! 오디션 영상 올릴게!' },
        choices: [
          { grade: 'best', text: '네가 춤출 때 진짜 즐거워 보이잖아. 오디션 영상 올리면 첫 댓글은 내가 달게!',
            response: '진짜? 그렇게 말해 주니까 힘이 난다! 오디션 영상 지금 바로 올릴게!', snsTrigger: 'doyun_dance' },
          { grade: 'good', text: '요즘 무대에 남자 댄서들 엄청 많아. 같이 영상 찾아보고 오디션 준비하자.',
            response: '맞아, 나도 그 댄서들 보면서 연습했어. 같이 준비해 줘서 고마워!', snsTrigger: 'doyun_dance' },
          { grade: 'bad', parts: [P('농구부 들어가고,'), P('춤은 들키지 않게', true), P('취미로 몰래 춰.', true)],
            response: '좋아하는 걸 몰래 해야 한다니... 내가 잘못하는 것도 아닌데 왜 숨어야 해?',
            lesson: '"숨기면 괜찮아"는 친구가 자기 모습을 부끄러워하게 만들어요.', snsTrigger: 'doyun_sad' },
          { grade: 'bad', parts: [P('춤추는 건 괜찮은데,'), P('걸그룹 춤 말고', true), P('남자다운 힙합으로 바꿔 봐.', true)],
            response: '난 그 춤이 좋은 건데... 춤에도 남자다운 춤이 따로 있는 거야?',
            lesson: '좋아하는 활동 안에서도 "남자다운 것"을 정해 주면 여전히 고정관념이에요.', snsTrigger: 'doyun_sad' }
        ]
      }),

      seoyeon: S({
        key: 'seoyeon', name: '서연', role: '집안일이 고민인 학생', location: 'hallway',
        focus: ['respect', 'empathy', 'opportunity'],
        text: '루다야, 우리 엄마도 회사 다니시는데 집안일은 늘 엄마랑 나만 해. 오빠는 "남자는 집안일 안 해도 돼"라면서 게임만 해... 나 이번 주에 시험인데 공부할 시간이 없어.',
        retry: '어제도 설거지하느라 공부를 못 했어... 어떻게 말을 꺼내야 할지 모르겠어.',
        revisit: '가족회의 했어! 이제 오빠는 빨래, 아빠는 요리, 나는 청소 당번이야. 공부할 시간도 생겼어!',
        why: { q: '이 말이 서연이에게 힘이 된 이유는 뭘까?',
          options: ['집안일을 엄마와 딸이 아닌 가족 모두의 일로 바라보게 했기 때문', '서연이가 엄마를 돕는 착한 딸이라고 칭찬해 줬기 때문', '오빠가 바쁜 걸 이해하라고 알려 줬기 때문'],
          explain: '"착한 딸"이라는 칭찬도 딸에게만 집안일을 기대하는 말이 될 수 있어요.' },
        rebuild: { slots: [['집안일은 가족 모두의', '집안일은 원래 엄마와 딸의'], ['일이니까', '일이지만'], ['같이 나눠서 하자고 말해 봐.', '네가 조금 더 참아 봐.']],
          response: '맞아, 나 혼자 참을 일이 아니었어. 오늘 저녁에 가족회의 하자고 할게!' },
        choices: [
          { grade: 'best', text: '집안일은 같이 사는 사람 모두의 일이야. 가족회의에서 당번 정하자고 해 봐.',
            response: '맞아, 이건 나 혼자 참을 일이 아니었어. 오늘 저녁에 가족회의 하자고 할게!', snsTrigger: 'seoyeon_family' },
          { grade: 'good', text: '네가 일주일 동안 한 집안일을 적어서 가족들한테 보여 주는 건 어때?',
            response: '좋은 생각이다! 적어 보니까 진짜 많네. 이걸 보면 가족들도 알아주겠지?', snsTrigger: 'seoyeon_family' },
          { grade: 'bad', parts: [P('엄마를 돕는 건'), P('역시 착한 딸이라서 그런 거야.', true), P('그것도 멋진 일이야!')],
            response: '...오빠도 아들인데 왜 나만 착해야 해? 칭찬받아도 하나도 안 기뻐.',
            lesson: '"착한 딸"이라는 칭찬도 딸에게만 집안일을 기대하는 고정관념일 수 있어요.', snsTrigger: 'seoyeon_sad' },
          { grade: 'bad', parts: [P('오빠는 고3이라 바쁘니까'), P('어쩔 수 없지.', true), P('넌 시험 끝나고 공부하면 돼.', true)],
            response: '나도 시험인데... 내 공부는 덜 중요한 거야? 너무 속상해.',
            lesson: '누구의 시간과 공부가 더 중요한지를 성별로 정하면 불평등이 생겨요.', snsTrigger: 'seoyeon_sad' }
        ]
      })
    };
  }

  // --------------------------------------------------------------------------
  // 편견 탐지 포스터 5개 (선택지 4개, 정답 1개 · 그럴듯한 오답 3개)
  // --------------------------------------------------------------------------
  initBiasMissions() {
    return {
      'bias_hallway_1': {
        quote: '“남자는 원래 감정표현을 못하고, 눈물을 보이면 안 된다.”',
        location: '복도 게시판',
        options: [
          { text: '감정을 느끼고 표현하는 것은 누구에게나 자연스러운 일이다. 성별과 상관없다.', correct: true,
            stats: { empathy: 10, freedom: 8 }, badge: 'badge_emotion',
            explanation: '정답! "남자는 울면 안 돼"는 마음의 건강을 해치는 고정관념이에요.' },
          { text: '남자는 이성적이고 여자는 감성적인 게 타고난 차이라서 어쩔 수 없다.', correct: false,
            explanation: '감정 표현 방식은 타고나는 것보다 "남자는 이래야 해"라는 교육과 시선의 영향이 커요.' },
          { text: '남자가 울어도 되지만, 친구들 앞에서는 참는 게 예의다.', correct: false,
            explanation: '"남들 앞에선 참아라"도 결국 감정을 숨기라는 말이에요.' },
          { text: '요즘은 남자도 우니까 굳이 고칠 필요가 없는 문장이다.', correct: false,
            explanation: '아직도 이 말 때문에 감정을 숨기는 친구들이 있어요. 그냥 넘기면 편견이 남아요.' }
        ]
      },
      'bias_class_1': {
        quote: '“여학생은 수학과 공학에 약하고, 남학생은 언어와 미술에 서툴다.”',
        location: '교실 벽보',
        options: [
          { text: '잘하는 과목은 흥미, 노력, 환경에 따라 달라지며 성별로 정할 수 없다.', correct: true,
            stats: { opportunity: 10, respect: 8 }, badge: 'badge_potential',
            explanation: '정답! 과목별 실력 차이는 성별이 아니라 경험과 기회의 차이에서 생겨요.' },
          { text: '평균적으로 그런 경향이 있으니 진로를 정할 때 참고하면 좋다.', correct: false,
            explanation: '"평균"을 개인에게 적용하면 한 사람의 가능성을 미리 막게 돼요.' },
          { text: '수학 잘하는 여학생은 특별히 대단한 거니 더 칭찬해야 한다.', correct: false,
            explanation: '"여자인데 대단해"도 여자는 원래 못한다는 생각에서 나온 말이에요.' },
          { text: '뇌 구조가 달라서 잘하는 과목이 정해져 있다.', correct: false,
            explanation: '과목 능력이 성별 뇌 구조로 정해진다는 근거는 없어요.' }
        ]
      },
      'bias_gym_1': {
        quote: '“격렬한 스포츠는 남학생의 것이며, 여학생은 다치기 쉬우니 피구나 해야 한다.”',
        location: '운동장 안내문',
        options: [
          { text: '모든 학생은 성별과 상관없이 원하는 운동을 배우고 즐길 권리가 있다.', correct: true,
            stats: { courage: 10, opportunity: 8 }, badge: 'badge_sports',
            explanation: '정답! 운동은 실력과 규칙의 영역이에요. 성별로 참여를 막는 건 차별이에요.' },
          { text: '여학생 안전을 생각하는 배려이므로 괜찮은 안내문이다.', correct: false,
            explanation: '"배려"라는 이름으로 기회를 빼앗는 것도 차별이에요. 안전은 모두에게 필요해요.' },
          { text: '여학생이 원하면 하게 하되, 남학생과 같은 팀은 안 된다.', correct: false,
            explanation: '조건을 달아 일부만 허락하는 건 여전히 동등한 기회가 아니에요.' },
          { text: '남학생 근력이 더 강하니 나누는 것이 자연스럽다.', correct: false,
            explanation: '근력은 사람마다 달라요. 실력에 따라 팀을 나누면 돼요.' }
        ]
      },
      'bias_counsel_1': {
        quote: '“간호사나 유치원 교사는 여성의 직업, 엔지니어와 CEO는 남성의 직업이다.”',
        location: '진로상담실 차트',
        options: [
          { text: '직업은 적성과 전문성으로 고르는 것이며, 성별 꼬리표를 붙이면 안 된다.', correct: true,
            stats: { freedom: 10, opportunity: 8 }, badge: 'badge_career',
            explanation: '정답! 직업에 성별을 붙이면 학생들의 진로 선택 폭이 좁아져요.' },
          { text: '실제로 그 직업에 그 성별이 더 많으니 틀린 말은 아니다.', correct: false,
            explanation: '지금 숫자가 많은 이유는 바로 이런 고정관념 때문일 수 있어요.' },
          { text: '남자 간호사, 여자 CEO는 예외적으로 특별한 경우다.', correct: false,
            explanation: '"예외"라고 부르면 그 길을 가려는 사람이 계속 특별 취급을 받아요.' },
          { text: '어떤 직업이든 상관없지만 돈은 남자가 더 많이 벌어야 한다.', correct: false,
            explanation: '경제적 책임을 성별로 정하는 것도 고정관념이에요.' }
        ]
      },
      'bias_nurse_1': {
        quote: '“여성은 외모와 조신함이 생명이고, 남성은 돈과 지위가 생명이다.”',
        location: '보건실 건강 상식지',
        options: [
          { text: '사람의 가치는 외모나 성별 역할이 아니라 그 사람의 인격과 삶에 있다.', correct: true,
            stats: { respect: 10, freedom: 8 }, badge: 'badge_dignity',
            explanation: '정답! 성별에 따라 다른 잣대를 대면 모두가 불행해져요.' },
          { text: '외모 관리와 경제력은 둘 다 중요하니 맞는 말이다.', correct: false,
            explanation: '누구에게나 중요할 수 있지만, 성별에 따라 다르게 요구하는 게 문제예요.' },
          { text: '사회의 기대에 맞추는 것이 사회생활을 잘하는 방법이다.', correct: false,
            explanation: '기대에 맞추려다 나다움을 잃을 수 있어요. 잘못된 기대는 바꿔야 해요.' },
          { text: '요즘은 반대로 남자 외모, 여자 경제력도 중요하니 공평하다.', correct: false,
            explanation: '모두에게 압박을 주는 건 공평한 게 아니라, 모두가 힘들어지는 거예요.' }
        ]
      }
    };
  }

  // --------------------------------------------------------------------------
  // 📱 스쿨그램 댓글 미션 (SNS)
  // --------------------------------------------------------------------------
  initSnsMission() {
    return {
      author: '체육대회_사진봇',
      post: '📸 오늘 체육대회 응원단장 사진! 머리를 짧게 자르고 우렁차게 응원한 2학년 응원단장 🎉',
      badComments: [
        { who: '익명1', text: '여자가 머리 왜 저래 ㅋㅋㅋ 남자인 줄' },
        { who: '익명2', text: '응원단장은 원래 남자가 해야 멋있지 않나?' }
      ],
      choices: [
        { grade: 'best', text: '머리 길이는 본인 마음! 응원단장 목소리 진짜 최고였어 👏 외모 평가 댓글은 그만하자.',
          result: '다른 친구들도 하나둘 "맞아, 단장 멋있었어!" 댓글을 달기 시작했어요. 악플이 쏙 들어갔어요!' },
        { grade: 'good', text: '외모 비하 댓글은 신고하고, 단장님께 응원 메시지를 보낼게요!',
          result: '악플이 신고로 가려지고, 응원단장이 고맙다는 답장을 보냈어요.' },
        { grade: 'bad', text: 'ㅋㅋ 머리는 좀 웃기긴 한데 단장은 잘하더라',
          result: '"ㅋㅋ" 댓글에 좋아요가 몰리면서 놀림이 더 커졌어요. 응원단장이 사진을 내려 달라고 했대요...',
          lesson: '칭찬을 섞어도 외모를 놀리는 말이 들어가면 상처가 돼요.' },
        { grade: 'bad', text: '(아무 댓글도 달지 않고 좋아요만 누르고 지나간다)',
          result: '아무도 말리지 않자 악플이 계속 늘어났어요. 응원단장은 "아무도 내 편이 없었다"고 말했대요...',
          lesson: '침묵도 선택이에요. 악플을 그냥 지나치면 모두가 동의하는 것처럼 보여요.' }
      ]
    };
  }

  // 선택 등급별 점수: focus 능력치 3개에 차례로 적용
  gradeStats(npcKey, grade) {
    const sc = this.scenarios[npcKey];
    const focus = (sc && sc.focus) || ['courage', 'empathy', 'respect'];
    const table = { best: [10, 8, 6], good: [6, 4, 2], bad: [-8, -6, -4] };
    const vals = table[grade] || table.best;
    const out = {};
    focus.forEach((k, i) => { out[k] = vals[i]; });
    return out;
  }

  addStats(stats) {
    for (const [k, v] of Object.entries(stats || {})) {
      this.playerStats[k] = Math.max(0, Math.min(100, (this.playerStats[k] || 0) + v));
    }
    this.updateColorProgress();
  }

  // 편견이 섞인 말을 골랐을 때: 점수·신뢰도 감소, 기록, 친구는 다시 고민 상태
  applyBadChoice(npcKey, choice) {
    const stats = this.gradeStats(npcKey, 'bad');
    this.addStats(stats);
    if (this.npcTrust[npcKey] !== undefined) this.npcTrust[npcKey] = Math.max(0, this.npcTrust[npcKey] - 15);
    this.hurtCount = (this.hurtCount || 0) + 1;
    this.choiceLog.push({ who: this.scenarios[npcKey] ? this.scenarios[npcKey].name : npcKey, text: choice.text, grade: 'bad', lesson: choice.lesson || '' });
    if (window.entityManager) {
      window.entityManager.npcs.filter(n => n.scenarioKey === npcKey).forEach(n => { n.emoteType = 'sad'; });
    }
    if (choice.snsTrigger && window.snsEngine) window.snsEngine.addPost(choice.snsTrigger);
    return stats;
  }

  // 스쿨그램 댓글 미션 결과
  applySnsChoice(choice) {
    if (this.snsMissionDone) return null;
    const focus = ['courage', 'respect', 'empathy'];
    const table = { best: [10, 8, 6], good: [6, 4, 2], bad: [-8, -6, -4] };
    const stats = {};
    focus.forEach((k, i) => { stats[k] = table[choice.grade][i]; });
    this.addStats(stats);
    this.choiceLog.push({ who: '스쿨그램 댓글', text: choice.text, grade: choice.grade, lesson: choice.lesson || '' });
    if (choice.grade === 'bad') {
      this.hurtCount = (this.hurtCount || 0) + 1;
    } else {
      this.snsMissionDone = true;
      this.updateColorProgress();
      this.checkActProgression();
    }
    return stats;
  }

  // --------------------------------------------------------------------------
  // Apply Choice Results (STRICT 1-TIME ONLY!)
  // --------------------------------------------------------------------------
  applyChoice(npcKey, choice) {
    // If already resolved, prevent duplicate reward & progress gain!
    if (this.resolvedScenarios.includes(npcKey)) {
      return false;
    }

    // 1. Mark scenario resolved first
    this.resolvedScenarios.push(npcKey);

    // 2. Update NPC hasQuest in EntityManager
    if (window.entityManager) {
      window.entityManager.npcs.filter(n => n.scenarioKey === npcKey).forEach(npc => {
        npc.hasQuest = false;
        npc.emoteType = 'cleared';
      });
    }

    // 3. Update stats (등급별 자동 점수)
    choice.stats = choice.stats || this.gradeStats(npcKey, choice.grade || 'best');
    for (const [stat, val] of Object.entries(choice.stats)) {
      this.playerStats[stat] = Math.max(0, Math.min(100, (this.playerStats[stat] || 0) + val));
    }
    this.choiceLog.push({ who: this.scenarios[npcKey] ? this.scenarios[npcKey].name : npcKey, text: choice.text, grade: choice.grade || 'best', rebuilt: !!choice.rebuilt });

    // 4. Update NPC Trust
    const trustGain = choice.trust || (choice.grade === 'good' ? 25 : 40);
    if (this.npcTrust[npcKey] !== undefined) {
      this.npcTrust[npcKey] = Math.max(0, Math.min(100, this.npcTrust[npcKey] + trustGain));
    }

    // 5. Store Memory
    if (choice.memoryKey) {
      this.npcMemory[npcKey] = choice.memoryKey;
    }

    // 6. Trigger SNS post
    if (choice.snsTrigger && window.snsEngine) {
      window.snsEngine.addPost(choice.snsTrigger);
    }

    // 7. Recalculate School Color Progress
    this.updateColorProgress();

    // 8. Check Act Progression
    this.checkActProgression();

    return true;
  }

  // --------------------------------------------------------------------------
  // School Color Recovery Calculator (70% from 7 NPCs + 30% from 5 Biases = 100%)
  // --------------------------------------------------------------------------
  updateColorProgress() {
    const resolvedNPCs = this.resolvedScenarios.length; // Max 7
    const clearedBiases = this.completedBiases.length;  // Max 5

    // NPC Contribution: 10% per NPC (Total 70%)
    const npcProgress = Math.min(60, resolvedNPCs * 6) + (this.snsMissionDone ? 10 : 0);
    // Bias Contribution: 6% per Bias (Total 30%)
    const biasProgress = Math.min(30, clearedBiases * 6);

    const totalProgress = Math.min(100, npcProgress + biasProgress);
    this.colorProgress = totalProgress;

    // Apply CSS Variables to DOM & Canvas Filters
    const root = document.documentElement;
    const saturation = 0.15 + (totalProgress / 100) * 1.05; // 0.15 to 1.2
    const brightness = 0.88 + (totalProgress / 100) * 0.22; // 0.88 to 1.1

    root.style.setProperty('--school-saturation', saturation);
    root.style.setProperty('--school-brightness', brightness);

    const barEl = document.getElementById('color-progress-bar');
    const txtEl = document.getElementById('color-percent-text');
    if (barEl) barEl.style.width = `${totalProgress}%`;
    if (txtEl) txtEl.textContent = `${totalProgress}%`;

    // Update Mini Stat Floater
    for (const [stat, val] of Object.entries(this.playerStats)) {
      const el = document.getElementById(`val-${stat}`);
      if (el) el.textContent = val;
    }
  }

  // --------------------------------------------------------------------------
  // Act Progression Logic (Requires ALL 7 NPCs & 5 Biases for 100% Core Unlock!)
  // --------------------------------------------------------------------------
  checkActProgression() {
    const resolvedCount = this.resolvedScenarios.length;
    const biasCount = this.completedBiases.length;

    const snsTxt = this.snsMissionDone ? '완료' : '미완료';
    let newAct = 1;
    let actTitle = '색을 잃은 학교';
    let questDesc = `학교 곳곳의 친구들을 만나 고민을 해결해주세요. [도운 친구: ${resolvedCount}/${this.totalNPCMissions} · 편견 탐지: ${biasCount}/${this.totalBiases} · 📱댓글 미션: ${snsTxt}]`;

    if (resolvedCount >= this.totalNPCMissions && biasCount >= 4 && this.snsMissionDone) {
      newAct = 6;
      actTitle = '편견의 코어 정화 (최종장)';
      questDesc = `모든 친구들의 마음을 모았습니다! [로비 왼쪽 아래 계단]의 지하 특별실로 이동하여 편견의 핵을 정화하세요!`;
    } else if (resolvedCount >= 7) {
      newAct = 5;
      actTitle = '학생회와 학교 문화 개혁';
      questDesc = `학교에 따뜻한 변화가 일고 있습니다! 남은 친구들을 모두 찾아 대화하세요. [도운 친구: ${resolvedCount}/${this.totalNPCMissions} · 편견 탐지: ${biasCount}/${this.totalBiases} · 📱댓글 미션: ${snsTxt}]`;
    } else if (resolvedCount >= 4) {
      newAct = 4;
      actTitle = '피어나는 변화의 색채';
      questDesc = `학교가 생기를 되찾고 있습니다. [도운 친구: ${resolvedCount}/${this.totalNPCMissions} · 편견 탐지: ${biasCount}/${this.totalBiases} · 📱댓글 미션: ${snsTxt}]`;
    } else if (resolvedCount >= 1 || biasCount >= 1) {
      newAct = 2;
      actTitle = '이상한 말들과 고정관념';
      questDesc = `교내 곳곳의 편견 게시물을 조사하고 친구들과 대화하세요. [도운 친구: ${resolvedCount}/${this.totalNPCMissions} · 편견 탐지: ${biasCount}/${this.totalBiases} · 📱댓글 미션: ${snsTxt}]`;
    }

    this.currentAct = newAct;

    const actTagEl = document.getElementById('current-act-display');
    if (actTagEl) {
      actTagEl.innerHTML = `<span class="act-tag">ACT ${newAct}</span><span class="act-title">${actTitle}</span>`;
    }

    const questEl = document.getElementById('quest-desc-text');
    if (questEl) {
      questEl.textContent = questDesc;
    }
  }
}

// Global Scenario Instance
window.scenarioManager = new ScenarioManager();
