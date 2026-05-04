// src/services/core/sessionManager.js
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutos
  WARNING_BEFORE_MS:      2 * 60 * 1000, // aviso 2 min antes
};

class SessionManager {
  #inactivityTimer = null;
  #warningTimer    = null;
  #onExpire        = null;
  #onWarning       = null;
  #onResume        = null;
  #warned          = false;
  #active          = false;
  #boundActivity   = null;

  start({ onExpire, onWarning, onResume } = {}) {
    if (this.#active) return;
    this.#onExpire  = onExpire;
    this.#onWarning = onWarning;
    this.#onResume  = onResume;
    this.#active    = true;
    this.#warned    = false;

    this.#boundActivity = this.#handleActivity.bind(this);
    ['mousedown','mousemove','keydown','scroll','touchstart','click','focus','visibilitychange']
      .forEach(ev => window.addEventListener(ev, this.#boundActivity, { passive: true }));

    this.#resetTimers();
  }

  stop() {
    this.#active = false;
    this.#clearTimers();
    if (this.#boundActivity) {
      ['mousedown','mousemove','keydown','scroll','touchstart','click','focus','visibilitychange']
        .forEach(ev => window.removeEventListener(ev, this.#boundActivity));
      this.#boundActivity = null;
    }
  }

  reset() {
    this.#warned = false;
    this.#resetTimers();
  }

  #handleActivity(event) {
    if (event.type === 'visibilitychange' && document.visibilityState === 'visible') {
      if (this.#warned) {
        this.#onResume?.();
        this.#warned = false;
      }
    }
    this.#resetTimers();
  }

  #resetTimers() {
    this.#clearTimers();
    const total = SESSION_CONFIG.INACTIVITY_TIMEOUT_MS;
    const warn  = total - SESSION_CONFIG.WARNING_BEFORE_MS;

    this.#warningTimer = setTimeout(() => {
      this.#warned = true;
      this.#onWarning?.();
    }, warn);

    this.#inactivityTimer = setTimeout(() => {
      this.#onExpire?.();
    }, total);
  }

  #clearTimers() {
    clearTimeout(this.#inactivityTimer);
    clearTimeout(this.#warningTimer);
    this.#inactivityTimer = null;
    this.#warningTimer    = null;
  }
}

export const sessionManager = new SessionManager();