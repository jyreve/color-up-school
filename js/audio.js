/**
 * COLOR UP SCHOOL - Audio Engine (Web Audio API Synthesizer)
 * Generates retro 8/16-bit RPG BGM and Sound Effects dynamically without external MP3 dependencies!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.currentTrack = null;
    this.bgmInterval = null;
    this.tempo = 115;
    this.step = 0;
    this.activeOscillators = [];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    this.ctx = new AudioContext();
    
    // Master Volume Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // BGM Sub-gain
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    // SFX Sub-gain
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.fileAudio) this.fileAudio.muted = this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --------------------------------------------------------------------------
  // Note Frequencies Table (C3 to B5)
  // --------------------------------------------------------------------------
  getNote(name) {
    const notes = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'REST': 0
    };
    return notes[name] || 0;
  }

  // --------------------------------------------------------------------------
  // Sound Effects (SFX)
  // --------------------------------------------------------------------------
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playDialogueBlip() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const pitch = 380 + Math.random() * 80;
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  playStatUp() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  playColorRestore() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + i * 0.06);
      osc.stop(this.ctx.currentTime + i * 0.06 + 0.45);
    });
  }

  playBadgeUnlock() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const melody = [
      { f: 523.25, t: 0.1 }, { f: 659.25, t: 0.1 }, { f: 783.99, t: 0.1 },
      { f: 1046.50, t: 0.3 }
    ];
    let start = 0;
    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + start);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + start + n.t);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + start);
      osc.stop(this.ctx.currentTime + start + n.t);
      start += n.t;
    });
  }

  playBossHit() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playPurifyLaser() {
    if (this.isMuted || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1400, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // --------------------------------------------------------------------------
  // Dynamic Background Music (BGM)
  // --------------------------------------------------------------------------
  // 🎵 직접 만든 음악 파일 재생 (assets/audio/bgm_*.mp3 또는 .m4a)
  //    파일이 없으면 예전처럼 기계음 음악으로 자동 대체됩니다.
  playBGM(trackName = 'exploration') {
    const fileKey = { title: 'title', monochrome: 'school', exploration: 'school', boss: 'boss', victory: 'ending' }[trackName] || 'school';
    if (this.currentFile === fileKey && this.fileAudio && !this.fileAudio.paused) return;
    this.init(); this.resume();
    const vol = { title: 0.6, school: 0.38, boss: 0.5, ending: 0.6 }[fileKey];
    const tryPlay = (exts) => {
      if (!exts.length) { this.currentFile = null; this.playSynthBGM(trackName); return; }
      const a = new Audio(`assets/audio/bgm_${fileKey}.${exts[0]}`);
      a.loop = fileKey !== 'ending' ? true : true;
      a.volume = vol; a.muted = this.isMuted;
      a.addEventListener('error', () => tryPlay(exts.slice(1)), { once: true });
      a.play().then(() => {
        this.stopBGM();
        if (this.fileAudio && this.fileAudio !== a) this.fadeOut(this.fileAudio);
        this.fileAudio = a; this.currentFile = fileKey; this.currentTrack = trackName;
      }).catch(err => { if (err && err.name === 'NotAllowedError') this.pendingTrack = trackName; });
    };
    tryPlay(['mp3', 'm4a']);
  }

  fadeOut(a) {
    const t = setInterval(() => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume <= 0.01) { a.pause(); clearInterval(t); } }, 60);
  }

  // 음악 파일이 없을 때: 기계음 음악은 끄고 조용히 둠
  playSynthBGM(trackName = 'exploration') {
    if (this.fileAudio) { this.fadeOut(this.fileAudio); this.fileAudio = null; }
    this.stopBGM();
    return;
    if (this.currentTrack === trackName) return;
    this.stopBGM();
    this.init();
    this.resume();
    this.currentTrack = trackName;
    this.step = 0;

    let leadSequence = [];
    let bassSequence = [];
    let stepDuration = 0.2; // 16th or 8th notes

    if (trackName === 'monochrome') {
      // Act 1: Slower, reflective minor/modal chords
      leadSequence = ['A4', 'REST', 'C5', 'REST', 'E5', 'D5', 'C5', 'B4', 'A4', 'REST', 'E4', 'REST', 'G4', 'F4', 'E4', 'REST'];
      bassSequence = ['A3', 'REST', 'A3', 'REST', 'F3', 'REST', 'F3', 'REST', 'D3', 'REST', 'D3', 'REST', 'E3', 'REST', 'E3', 'REST'];
      stepDuration = 0.32;
    } else if (trackName === 'boss') {
      // Act 6: Energetic, driving boss fight tempo
      leadSequence = ['D4', 'D4', 'F4', 'G4', 'A4', 'G4', 'F4', 'D4', 'C4', 'C4', 'E4', 'F4', 'G4', 'F4', 'E4', 'C4',
                      'D4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'A4', 'G4', 'A4', 'F4', 'G4', 'E4', 'F4', 'D4', 'REST'];
      bassSequence = ['D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'D3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3',
                      'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'Bb3', 'A3', 'A3', 'A3', 'A3', 'A3', 'A3', 'A3', 'A3'];
      stepDuration = 0.14;
    } else if (trackName === 'victory') {
      // Happy ending anthem
      leadSequence = ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6', 'D5', 'F5', 'A5', 'D6', 'C6', 'B5', 'A5', 'G5',
                      'F5', 'A5', 'C6', 'F6', 'E5', 'G5', 'C6', 'E6', 'D5', 'G5', 'B5', 'D6', 'C6', 'REST', 'C6', 'REST'];
      bassSequence = ['C3', 'C3', 'E3', 'G3', 'C3', 'C3', 'E3', 'G3', 'D3', 'D3', 'F3', 'A3', 'G3', 'G3', 'B3', 'D4',
                      'F3', 'F3', 'A3', 'C4', 'C3', 'C3', 'E3', 'G3', 'G3', 'G3', 'B3', 'D4', 'C3', 'G3', 'C4', 'REST'];
      stepDuration = 0.18;
    } else {
      // Default exploration: Uplifting school RPG melody
      leadSequence = ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'D4', 'E4', 'G4', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4',
                      'F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'REST', 'C5', 'REST'];
      bassSequence = ['C3', 'G3', 'C3', 'G3', 'C3', 'G3', 'C3', 'G3', 'A3', 'E4', 'A3', 'E4', 'G3', 'D4', 'G3', 'D4',
                      'F3', 'C4', 'F3', 'C4', 'F3', 'C4', 'F3', 'C4', 'G3', 'D4', 'G3', 'D4', 'C3', 'G3', 'C4', 'REST'];
      stepDuration = 0.2;
    }

    const seqLength = leadSequence.length;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      this.resume();

      const leadNote = leadSequence[this.step % seqLength];
      const bassNote = bassSequence[this.step % seqLength];

      // Play Lead Melody Note
      if (leadNote !== 'REST') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = trackName === 'boss' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(this.getNote(leadNote), this.ctx.currentTime);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + stepDuration * 0.9);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start();
        osc.stop(this.ctx.currentTime + stepDuration * 0.9);
      }

      // Play Bass Note
      if (bassNote !== 'REST') {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(this.getNote(bassNote), this.ctx.currentTime);
        gainB.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gainB.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + stepDuration * 0.95);
        oscB.connect(gainB);
        gainB.connect(this.bgmGain);
        oscB.start();
        oscB.stop(this.ctx.currentTime + stepDuration * 0.95);
      }

      this.step++;
    }, stepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentTrack = null;
  }
}

// Global Sound Instance
window.soundEngine = new SoundEngine();
