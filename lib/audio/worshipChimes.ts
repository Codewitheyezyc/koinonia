"use client";

/**
 * Worship Chimes Generator
 * Uses Web Audio API oscillator synthesis to produce serene, harmonic
 * bell-like chimes and angelic tones with zero external network audio files.
 */
class WorshipChimes {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  /**
   * Plays a celestial harmonic chime when worship emojis are pressed
   */
  public playChime(type: "glory" | "amen" | "spirit" | "rejoice" = "glory") {
    try {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Frequencies for divine harmonic pentatonic chords
      const chordMap: Record<string, number[]> = {
        glory: [523.25, 659.25, 783.99, 1046.5], // C Major Heavenly
        amen: [440.0, 554.37, 659.25, 880.0],   // A Major Peaceful
        spirit: [587.33, 739.99, 880.0, 1174.66], // D Major Ethereal
        rejoice: [659.25, 830.61, 987.77, 1318.51], // E Major Joyous
      };

      const freqs = chordMap[type] || chordMap.glory;

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        // Soft bell envelope with warm decay
        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.05 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.95);
      });
    } catch (e) {
      // Audio playback silently suppressed if browser policy blocks autoplay
    }
  }
}

export const worshipChimes = new WorshipChimes();
