// Astra Wing player page: light ambient "space" music, generated live with the Web Audio API.
// - Off by default: browsers block audio until the visitor interacts, so it starts from the ♪ button.
// - If the visitor turned it on before (localStorage), it resumes on their first tap/click/key press.
// - Ducks out while the trailer video plays and pauses when the tab is hidden.
// No external files or libraries; the button label is set with textContent only.
(function () {
  "use strict";

  var AC = window.AudioContext || window.webkitAudioContext;
  var btn = document.getElementById("music-toggle");
  var label = document.getElementById("music-label");
  if (!AC || !btn) { if (btn) btn.hidden = true; return; }

  var PREF_KEY = "aw-music";
  var MASTER_LEVEL = 0.85;
  var CHORD_SEC = 9;          // each pad chord lasts this long (with long cross-fades)
  var LOOKAHEAD_SEC = 1.2;

  // Dreamy D-major / lydian colours: Dmaj9 → Bm9 → Gmaj7(#11) → Asus2/6. MIDI note numbers.
  var CHORDS = [
    [50, 57, 61, 64, 69],
    [47, 54, 57, 61, 66],
    [43, 50, 54, 61, 62],
    [45, 52, 57, 59, 66]
  ];
  // High pentatonic notes for the twinkling "stars".
  var BELLS = [74, 76, 78, 81, 83, 86, 88, 90, 93];

  var ctx = null, master = null, reverb = null, padBus = null, bellBus = null, padFilter = null;
  var running = false, wanted = false, ducked = false, timer = null;
  var nextChordAt = 0, chordIndex = 0, nextBellAt = 0;

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeImpulse(seconds) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
    }
    return buf;
  }

  function build() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    var glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -20; glue.ratio.value = 3; glue.attack.value = 0.05; glue.release.value = 0.6;
    var lowCut = ctx.createBiquadFilter(); lowCut.type = "highpass"; lowCut.frequency.value = 90; lowCut.Q.value = 0.5;
    master.connect(lowCut); lowCut.connect(glue); glue.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(5.5);
    var wet = ctx.createGain(); wet.gain.value = 0.55;
    reverb.connect(wet); wet.connect(master);

    // Pad bus: warm low-pass with a very slow "breathing" sweep.
    padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass"; padFilter.frequency.value = 900; padFilter.Q.value = 0.4;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.035;
    var lfoAmt = ctx.createGain(); lfoAmt.gain.value = 450;
    lfo.connect(lfoAmt); lfoAmt.connect(padFilter.frequency); lfo.start();
    padBus = ctx.createGain(); padBus.gain.value = 0.9;
    padBus.connect(padFilter);
    padFilter.connect(master);
    var padSend = ctx.createGain(); padSend.gain.value = 0.7;
    padFilter.connect(padSend); padSend.connect(reverb);

    // Bell bus: soft echo + big reverb.
    bellBus = ctx.createGain(); bellBus.gain.value = 1.1;
    var delay = ctx.createDelay(2); delay.delayTime.value = 0.48;
    var fb = ctx.createGain(); fb.gain.value = 0.38;
    var tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 3200;
    bellBus.connect(master);
    bellBus.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay);
    tone.connect(master); tone.connect(reverb);
    var bellSend = ctx.createGain(); bellSend.gain.value = 0.9;
    bellBus.connect(bellSend); bellSend.connect(reverb);

    // Soft, airy drone on D (kept above the low-cut so it never gets muddy).
    var drone = ctx.createOscillator(); drone.type = "sine"; drone.frequency.value = hz(50);
    var droneGain = ctx.createGain(); droneGain.gain.value = 0.025;
    drone.connect(droneGain); droneGain.connect(master); drone.start();
  }

  function padNote(midi, t0, dur) {
    var attack = 3.2, release = 4.5;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.045, t0 + attack);
    g.gain.setValueAtTime(0.045, t0 + dur);
    g.gain.linearRampToValueAtTime(0, t0 + dur + release);
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = rand(-0.6, 0.6); g.connect(pan); pan.connect(padBus); } else { g.connect(padBus); }
    [["triangle", -6], ["sine", 5], ["sine", 1200]].forEach(function (spec, k) {
      var o = ctx.createOscillator();
      o.type = spec[0];
      o.frequency.value = hz(midi);
      o.detune.value = spec[1] + rand(-3, 3);
      var og = ctx.createGain(); og.gain.value = k === 2 ? 0.18 : 0.5;   // faint octave shimmer
      o.connect(og); og.connect(g);
      o.start(t0); o.stop(t0 + dur + release + 0.1);
    });
  }

  function bell(t0) {
    var midi = BELLS[Math.floor(Math.random() * BELLS.length)];
    var f = hz(midi), dur = rand(2.2, 3.6), peak = rand(0.05, 0.11);
    var carrier = ctx.createOscillator(); carrier.type = "sine"; carrier.frequency.value = f;
    var mod = ctx.createOscillator(); mod.type = "sine"; mod.frequency.value = f * 2.01;
    var modAmt = ctx.createGain();
    modAmt.gain.setValueAtTime(f * 0.9, t0);
    modAmt.gain.exponentialRampToValueAtTime(1, t0 + dur * 0.6);
    mod.connect(modAmt); modAmt.connect(carrier.frequency);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    carrier.connect(g);
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = rand(-0.85, 0.85); g.connect(pan); pan.connect(bellBus); } else { g.connect(bellBus); }
    carrier.start(t0); mod.start(t0);
    carrier.stop(t0 + dur + 0.05); mod.stop(t0 + dur + 0.05);
  }

  function schedule() {
    var horizon = ctx.currentTime + LOOKAHEAD_SEC;
    while (nextChordAt < horizon) {
      CHORDS[chordIndex].forEach(function (m) { padNote(m, nextChordAt + rand(0, 0.8), CHORD_SEC); });
      chordIndex = (chordIndex + 1) % CHORDS.length;
      nextChordAt += CHORD_SEC;
    }
    while (nextBellAt < horizon) {
      if (Math.random() < 0.72) bell(nextBellAt);
      // Occasionally a quick two-note glint.
      if (Math.random() < 0.18) bell(nextBellAt + 0.24);
      nextBellAt += rand(0.9, 2.6);
    }
  }

  function fadeTo(level, seconds) {
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(level, now + seconds);
  }

  function start() {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    if (!running) {
      running = true;
      nextChordAt = ctx.currentTime + 0.1;
      nextBellAt = ctx.currentTime + 2.5;
      schedule();
      timer = setInterval(schedule, 300);
    }
    fadeTo(ducked ? 0 : MASTER_LEVEL, 2.5);
  }

  function stop() {
    if (!ctx || !running) return;
    fadeTo(0, 1.2);
    var c = ctx;
    setTimeout(function () {
      if (wanted) return;                 // turned back on during the fade
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      c.suspend();
    }, 1300);
  }

  function isZh() { return (document.documentElement.getAttribute("lang") || "").indexOf("zh") === 0; }

  function render() {
    var on = wanted;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    var text = isZh() ? (on ? "音乐：开" : "音乐：关") : (on ? "Music on" : "Music off");
    if (label) label.textContent = text;
    btn.setAttribute("aria-label", isZh() ? (on ? "关闭背景音乐" : "开启背景音乐") : (on ? "Turn music off" : "Turn music on"));
  }

  function savePref() {
    try { window.localStorage.setItem(PREF_KEY, wanted ? "on" : "off"); } catch (e) { /* ignore */ }
  }

  btn.addEventListener("click", function () {
    wanted = !wanted;
    if (wanted) { start(); } else { stop(); }
    savePref();
    render();
  });

  // Resume on first interaction if the visitor enabled music on a previous visit.
  var pref = null;
  try { pref = window.localStorage.getItem(PREF_KEY); } catch (e) { /* ignore */ }
  if (pref === "on") {
    var firstGesture = function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("#music-toggle")) return;  // button handles itself
      window.removeEventListener("pointerdown", firstGesture, true);
      window.removeEventListener("keydown", firstGesture, true);
      if (!wanted) { wanted = true; start(); render(); }
    };
    window.addEventListener("pointerdown", firstGesture, true);
    window.addEventListener("keydown", firstGesture, true);
  }

  // Duck under the trailer.
  var video = document.getElementById("trailer-video");
  if (video) {
    video.addEventListener("play", function () { ducked = true; if (running) fadeTo(0, 0.8); });
    var unduck = function () { ducked = false; if (running && wanted) fadeTo(MASTER_LEVEL, 2.5); };
    video.addEventListener("pause", unduck);
    video.addEventListener("ended", unduck);
  }

  document.addEventListener("visibilitychange", function () {
    if (!ctx || !running) return;
    if (document.hidden) { ctx.suspend(); } else if (wanted) { ctx.resume(); }
  });

  // Keep the label in sync with the EN / 中文 toggle.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  render();
})();
