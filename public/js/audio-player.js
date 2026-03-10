let currentlyPlaying = null;

customElements.define("audio-player", class extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "true";

    const src = this.getAttribute("src") || "";

    this.innerHTML = `
      <audio preload="none">
        <source src="${src}" type="audio/mp4">
      </audio>

      <button type="button" class="action action--small" data-play aria-label="Play">
        <svg width="32" height="32" viewBox="-10 -8 40 40" class="icon-stroke" aria-hidden="true" focusable="false"
          data-icon-play>
          <use href="#icon-play"></use>
        </svg>

        <svg width="32" height="32" viewBox="-8 -8 40 40" class="icon-stroke" aria-hidden="true" focusable="false"
          data-icon-pause hidden>
          <use href="#icon-pause"></use>
        </svg>
      </button>

      <input type="range" class="range" data-seek min="0" max="0" value="0" step="0.01" aria-label="Seek" />

      <p class="time" data-time>
        <span data-current>0:00</span>
        <span>/</span>
        <span data-duration>0:00</span>
      </p>
    `;

    this.audio = this.querySelector("audio");
    this.btn = this.querySelector("[data-play]");
    this.playIcon = this.querySelector("[data-icon-play]");
    this.pauseIcon = this.querySelector("[data-icon-pause]");
    this.seek = this.querySelector("[data-seek]");
    this.currentEl = this.querySelector("[data-current]");
    this.durationEl = this.querySelector("[data-duration]");

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
      const s = Math.floor(seconds);
      const m = Math.floor(s / 60);
      return `${m}:${String(s % 60).padStart(2, "0")}`;
    };

    const syncIcons = () => {
      const paused = this.audio.paused;
      this.btn.setAttribute("aria-label", paused ? "Play" : "Pause");
      this.playIcon.toggleAttribute("hidden", !paused);
      this.pauseIcon.toggleAttribute("hidden", paused);
    };

    const syncSeekAndTime = () => {
      this.seek.value = String(this.audio.currentTime || 0);
      this.currentEl.textContent = formatTime(this.audio.currentTime || 0);
      this.durationEl.textContent = formatTime(this.audio.duration || 0);
    };

    this.btn.addEventListener("click", async () => {
      if (this.audio.paused) {
        if (currentlyPlaying && currentlyPlaying !== this.audio) {
          currentlyPlaying.pause();
        }
        currentlyPlaying = this.audio;

        try { await this.audio.play(); } catch { }
      } else {
        this.audio.pause();
        if (currentlyPlaying === this.audio) currentlyPlaying = null;
      }

      syncIcons();
      syncSeekAndTime();
    });

    this.seek.addEventListener("input", () => {
      this.audio.currentTime = Number(this.seek.value || 0);
      syncSeekAndTime();
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.seek.max = String(this.audio.duration || 0);
      syncSeekAndTime();
    });

    this.audio.addEventListener("timeupdate", syncSeekAndTime);

    this.audio.addEventListener("play", () => {
      if (currentlyPlaying && currentlyPlaying !== this.audio) {
        currentlyPlaying.pause();
      }
      currentlyPlaying = this.audio;
      syncIcons();
    });

    this.audio.addEventListener("pause", () => {
      if (currentlyPlaying === this.audio) currentlyPlaying = null;
      syncIcons();
    });

    this.audio.addEventListener("ended", () => {
      if (currentlyPlaying === this.audio) currentlyPlaying = null;
      this.seek.value = "0";
      syncIcons();
      syncSeekAndTime();
    });

    syncIcons();
    syncSeekAndTime();
  }
});
