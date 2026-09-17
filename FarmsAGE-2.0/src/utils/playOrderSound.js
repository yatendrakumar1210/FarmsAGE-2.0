/**
 * Synthesizes a Zomato/Swiggy-style signature order success chime using Web Audio API.
 * Ensures zero asset latency, crisp audio quality, and guaranteed browser compatibility.
 */
export const playOrderSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // 🎵 Joyful 4-note upward success chime (G5, C6, E6, G6)
    const notes = [
      { freq: 783.99, time: 0.0, duration: 0.12, volume: 0.25 },  // G5
      { freq: 1046.50, time: 0.10, duration: 0.15, volume: 0.35 }, // C6
      { freq: 1318.51, time: 0.22, duration: 0.20, volume: 0.40 }, // E6
      { freq: 1567.98, time: 0.35, duration: 0.60, volume: 0.45 }, // G6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave with subtle harmonic warmth
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      // Envelope: Fast attack, smooth decay
      const startTime = ctx.currentTime + n.time;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(n.volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + n.duration + 0.05);
    });
  } catch (err) {
    console.warn("Could not play order success sound:", err);
  }
};
