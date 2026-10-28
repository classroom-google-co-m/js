(() => {
  "use strict";

  const CONFIG = {
    title: "Lunara",
    subtitle: " ",
    openingMenu: {
      eyebrow: " ",
      heading: " ",
      text: "",
      buttonText: " "
    },
    labels: {
      brand: "Lunara Launcher",
      openLibraryButton: "launch",
      navGames: "Games",
      navFriends: "Friends",
      navStock: "Stock",
      navSuggestGame: "Suggest a Game",
      navReportBug: "Report a Bug",
      gamesHeading: "Games",
      launchButton: "Launch game",
      emptyMessage: "No games have been added yet.",
      countSingular: "game",
      countPlural: "games",
      redirectLoading: "downloading... (this may take a bit, if you are sure this isnt loading check console)",
      redirectError: "error loading"
    },
    layout: {
      maxWidth: "1100px",
      pagePadding: "30px 0 56px",
      cardMinWidth: "235px",
      cardGap: "14px",
      cardRadius: "19px",
      heroRadius: "26px",
      fontFamily: "'Noto Sans Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
      showGameCount: true
    },
    sounds: {
      enabled: true
    },
    playFab: {
      titleId: "15C474",
      sessionDays: 5,
      inactivityMonths: 2
    },
    colors: {
      background: "#080b16",
      cardBackground: "#0c1023c9",
      text: "#f7f7ff",
      mutedText: "#aeb2c9",
      accent: "#9c8cff",
      border: "#ffffff1c",
      buttonText: "#071019"
    },
    background: {
      enabled: true,
      color: "#080b16",
      dotColor: "#9c8cff",
      accentColor: "#ff9ffc",
      gradientFrom: "#5227FF",
      gradientTo: "#FF9FFC",
      glowColor: "#ffffff",
      gradientAngle: 135,
      dotSpacing: 9,
      dotRadius: 1.5,
      cursorRadius: 240,
      bulgeStrength: 0.6,
      twist: 0,
      glowRadius: 220,
      glowIntensity: 0.72,
      baseOpacity: 0.58,
      waveAmplitude: 12,
      sparkle: false,
      speed: 0.65
    },
    customCSS: "",
    gameDatabase: {
      url: "https://raw.githubusercontent.com/classroom-google-co-m/js/main/games.json",
      refreshMs: 60000
    },
    games: []
  };

  const state = CONFIG;
  const USER_SETTINGS_KEY = "lunara-user-settings-v1";
  const DEFAULT_USER_SETTINGS = {
    uiSounds: Boolean(CONFIG.sounds.enabled),
    animatedBackground: Boolean(CONFIG.background.enabled),
    reduceMotion: false
  };
  function loadUserSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object" && Object.prototype.hasOwnProperty.call(saved, "layoutTheme")) {
        delete saved.layoutTheme;
        try { localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(saved)); } catch {}
      }
      return {
        uiSounds: typeof saved?.uiSounds === "boolean" ? saved.uiSounds : DEFAULT_USER_SETTINGS.uiSounds,
        animatedBackground: typeof saved?.animatedBackground === "boolean" ? saved.animatedBackground : DEFAULT_USER_SETTINGS.animatedBackground,
        reduceMotion: typeof saved?.reduceMotion === "boolean" ? saved.reduceMotion : DEFAULT_USER_SETTINGS.reduceMotion
      };
    } catch { return { ...DEFAULT_USER_SETTINGS }; }
  }
  const userSettings = loadUserSettings();
  state.sounds.enabled = userSettings.uiSounds;
  state.background.enabled = userSettings.animatedBackground;
  const STOCK_CURRENCY_CODE = "MM";
  const STOCK_REFRESH_MS = 4500;
  const STOCK_TICK_MS = 30000;
  let root;
  let introRoot;
  let authRoot;
  let currentUser = null;
  let launchStarted = false;
  let stopBackground;
  let uiAudioContext;
  let gameCardSoundTimers=[];
  let authExpiryTimer;
  let broadcastPollTimer=null,broadcastState=null,broadcastCanPost=false,broadcastCheckInFlight=false,lastBroadcastSoundId="",broadcastPermissionCheckedAt=0,broadcastSoundStep=0,broadcastPermissionError="",broadcastCountdownTimer=null,broadcastSafeAreaTimer=null,broadcastTypingTimers=[];
  let gameDatabaseTimer=null,gameDatabaseInFlight=false,gameDatabaseLoaded=false,gameDatabaseError="";
  let moderationCanUse=false,moderationStatus=null,moderationPollTimer=null,moderationBanTimer=null,moderationBanGate=null,moderationWarningGate=null,moderationPanel=null;
  let socialRefreshTimer;
  let socialPollTimer;
  let socialTitleTimer;
  let socialPollInFlight = false;
  let socialPollBaselineReady = false;
  let lastSocialPollAt = 0;
  let temporarySocialTitle = "";
  let currentMainPage = "games";
  let stockRefreshTimer = null;
  let stockFetchInFlight = false;
  let stockTradeInFlight = false;
  let stockMarketData = null;
  let stockCardSymbols = "";
  let stockNextUpdateAt = 0;
  let knownFriendRequestKeys = null;
  let lastSocialPollErrorAt = 0;
  let currentActivity = "Browsing Lunara";
  let friendsRoot;
  let chatFetchInFlight = false;
  let chatRefreshTimer = null;
  let socialSnapshot = { online: 0, unread: 0, requests: 0, totalFriends: 0 };
  const presenceCache = new Map();
  const chatGroupCache = new Map();
  const knownMessageKeysByFriend = new Map();
  const lastViewedDmAt = new Map();

  const log = (...args) => console.log("[Library]", ...args);
  const warn = (...args) => console.warn("[Library]", ...args);
  const error = (...args) => console.error("[Library]", ...args);

  function playUiSound(kind, unlock = false, variation = 0) {
    if (!state.sounds?.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!uiAudioContext && unlock) uiAudioContext = new AudioContextClass();
      if (!uiAudioContext) return;
      if (uiAudioContext.state === "suspended") void uiAudioContext.resume();
      const now = uiAudioContext.currentTime;
      if (kind === "library-launch") {
        [659.25, 783.99, 987.77, 1318.51].forEach((frequency, index) => {
          const noteStart = now + index * 0.105;
          const noteEnd = noteStart + 0.2;
          const chime = uiAudioContext.createOscillator();
          const chimeGain = uiAudioContext.createGain();
          chime.type = "sine";
          chime.frequency.setValueAtTime(frequency, noteStart);
          chimeGain.gain.setValueAtTime(0.0001, noteStart);
          chimeGain.gain.exponentialRampToValueAtTime(0.075, noteStart + 0.008);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
          chime.connect(chimeGain);
          chimeGain.connect(uiAudioContext.destination);
          chime.start(noteStart);
          chime.stop(noteEnd + 0.01);
          chime.onended = () => { chime.disconnect(); chimeGain.disconnect(); };
        });
        return;
      }
      const oscillator = uiAudioContext.createOscillator();
      const gain = uiAudioContext.createGain();
      const isHover = kind === "hover";
      const isMessage = kind === "message";
      const isNotification = kind === "notification";
      const isBroadcastLetter = kind === "broadcast-letter";
      const isGameCard = kind === "game-card";
      const letterPitch = [520, 620, 740, 880, 660, 990][(broadcastSoundStep++) % 6];
      const cardPitch = 1260 + (Math.max(0, Number(variation) || 0) % 6) * 48;
      oscillator.type = isGameCard ? "square" : "sine";
      if (isGameCard) {
        oscillator.frequency.setValueAtTime(cardPitch, now);
        oscillator.frequency.exponentialRampToValueAtTime(cardPitch * 0.72, now + 0.028);
      } else {
        oscillator.frequency.setValueAtTime(isBroadcastLetter ? letterPitch : isHover ? 660 : isMessage ? 740 : isNotification ? 880 : 520, now);
        oscillator.frequency.exponentialRampToValueAtTime(isBroadcastLetter ? letterPitch * 1.22 : isHover ? 820 : isMessage ? 1040 : isNotification ? 660 : 390, now + (isBroadcastLetter ? 0.035 : isHover ? 0.045 : isMessage ? 0.11 : isNotification ? 0.14 : 0.075));
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.18 * (isGameCard ? 0.24 : isBroadcastLetter ? 0.22 : isHover ? 0.38 : isMessage ? 0.5 : isNotification ? 0.52 : 0.58)), now + (isGameCard ? 0.002 : 0.008));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isGameCard ? 0.04 : isBroadcastLetter ? 0.055 : isHover ? 0.075 : isMessage ? 0.2 : isNotification ? 0.25 : 0.14));
      oscillator.connect(gain);
      gain.connect(uiAudioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + (isGameCard ? 0.045 : isBroadcastLetter ? 0.06 : isHover ? 0.08 : isMessage ? 0.21 : isNotification ? 0.26 : 0.15));
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (err) {
      warn("UI sound could not be played:", err);
    }
  }

  function queueGameCardSounds() {
    gameCardSoundTimers.forEach(timer => clearTimeout(timer));
    gameCardSoundTimers = [];
    if (!state.sounds?.enabled || !state.games.length) return;
    state.games.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        if (root?.isConnected && currentMainPage === "games") playUiSound("game-card", false, index);
      }, 90 + index * 105);
      gameCardSoundTimers.push(timer);
    });
  }

  function showTabNotification(message) {
    temporarySocialTitle = `${message} — ${state.title}`;
    document.title = temporarySocialTitle;
    if (socialTitleTimer) clearTimeout(socialTitleTimer);
    socialTitleTimer = window.setTimeout(() => {
      temporarySocialTitle = "";
      document.title = state.title;
      socialTitleTimer = null;
    }, 3000);
  }

  if (window.__LIBRARY_RUNNING__) {
    warn("Replacing the previous Library instance.");
    try {
      if (typeof window.__LIBRARY_CLEANUP__ === "function") window.__LIBRARY_CLEANUP__();
      else {
        document.getElementById("library-root")?.remove();
        document.getElementById("library-launch-screen")?.remove();
        document.getElementById("library-style")?.remove();
        document.getElementById("library-favicon")?.remove();
      }
    } catch (err) { warn("Could not fully clean up the previous instance:", err); }
  }
  window.__LIBRARY_RUNNING__ = true;

  function loadLunaraFont(){
    if(document.getElementById("lunara-noto-sans-mono-font"))return;
    const link=document.createElement("link");
    link.id="lunara-noto-sans-mono-font";
    link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap";
    document.head.appendChild(link);
  }

  function addStyles() {
    loadLunaraFont();
    if (document.getElementById("library-style")) return;
    const style = document.createElement("style");
    style.id = "library-style";
    style.textContent = `
      #library-root, #library-root * { box-sizing: border-box; }
      #library-root, #library-launch-screen, #library-auth-screen, #gd-broadcast-banner, #gd-chat-dock { font-family: ${state.layout.fontFamily}; }
      #library-root {
        --gd-bg: ${state.background.color};
        --gd-dot: ${state.background.dotColor};
        --gd-accent: ${state.background.accentColor};
        position: fixed; inset: 0; z-index: 2147483000; overflow: auto;
        color: ${state.colors.text}; font: 15px/1.5 ${state.layout.fontFamily};
        background: var(--gd-bg); isolation: isolate; color: ${state.colors.text};
        animation: gd-root-in .55s ease-out both;
      }
      #library-root button, #library-root input, #library-root textarea,
      #library-root select { font: inherit; }
      #gd-bg-canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
      .gd-shell { position: relative; z-index: 1; width: min(${state.layout.maxWidth}, calc(100% - 36px)); margin: 0 auto; padding: ${state.layout.pagePadding}; }
      .gd-top { position:relative; z-index:30; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:34px; animation: gd-rise .65s .04s cubic-bezier(.2,.8,.2,1) both; }
      .gd-top-left { display:flex; align-items:center; gap:16px; min-width:0; flex-wrap:wrap; }
      .gd-brand { display:flex; align-items:center; gap:9px; font-size:12px; font-weight:800; letter-spacing:.16em; color:var(--gd-accent); text-transform:uppercase; }
      .gd-brand-mark { width:23px; height:23px; flex:none; filter:drop-shadow(0 0 9px color-mix(in srgb,var(--gd-accent) 48%,transparent)); }
      .gd-brand-mark path { fill:var(--gd-accent); }
      .gd-brand-mark .gd-mark-star { fill:#fff; }
      .gd-inline-lunara-mark { display:inline-block; width:1.05em; height:1.05em; margin:0 .08em; vertical-align:-.16em; overflow:visible; color:var(--gd-accent,#bda8ff); filter:drop-shadow(0 0 5px color-mix(in srgb,var(--gd-accent,#bda8ff) 55%,transparent)); }
      .gd-inline-lunara-mark .gd-inline-mark-moon { fill:currentColor; }
      .gd-inline-lunara-mark .gd-inline-mark-star { fill:#fff; }
      .gd-actions { display:flex; flex-wrap:wrap; gap:9px; }
      .gd-menu-wrap { position:relative; z-index:40; }
      .gd-menu-toggle { position:relative; display:grid; place-items:center; width:46px; height:46px; border-radius:15px; border:1px solid #ffffff24; color:#fff; background:linear-gradient(145deg,#ffffff16,#ffffff05); box-shadow:0 8px 26px #0004; cursor:pointer; transition:transform .35s cubic-bezier(.2,.9,.2,1.4),box-shadow .3s,border-color .3s; }
      .gd-menu-toggle::after { content:""; position:absolute; inset:-5px; border:1px solid color-mix(in srgb,var(--gd-accent) 60%,transparent); border-radius:19px; opacity:0; transform:scale(.7) rotate(-20deg); transition:opacity .28s,transform .5s cubic-bezier(.2,.9,.2,1.4); pointer-events:none; }
      .gd-menu-toggle:hover { transform:translateY(-3px) rotate(-5deg) scale(1.06); border-color:#ffffff70; box-shadow:0 12px 32px #0006,0 0 20px color-mix(in srgb,var(--gd-accent) 35%,transparent); }
      .gd-menu-wrap.is-open .gd-menu-toggle { transform:rotate(180deg) scale(1.08); box-shadow:0 0 25px color-mix(in srgb,var(--gd-accent) 40%,transparent); }
      .gd-menu-wrap.is-open .gd-menu-toggle::after { opacity:.8; transform:scale(1) rotate(0); }
      .gd-menu-toggle:active { transform:scale(.91) rotate(5deg); }
      .gd-burger-lines { width:20px; height:16px; position:relative; }
      .gd-burger-lines i { position:absolute; left:0; width:20px; height:2px; border-radius:3px; background:currentColor; transition:top .38s cubic-bezier(.2,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1),width .25s,opacity .2s; }
      .gd-burger-lines i:nth-child(1) { top:1px; } .gd-burger-lines i:nth-child(2) { top:7px; width:14px; } .gd-burger-lines i:nth-child(3) { top:13px; }
      .gd-menu-toggle[aria-expanded="true"] .gd-burger-lines i:nth-child(1) { top:7px; transform:rotate(45deg); }
      .gd-menu-toggle[aria-expanded="true"] .gd-burger-lines i:nth-child(2) { opacity:0; width:0; }
      .gd-menu-toggle[aria-expanded="true"] .gd-burger-lines i:nth-child(3) { top:7px; transform:rotate(-45deg); }
      .gd-menu-badge { position:absolute; top:-6px; right:-7px; min-width:18px; height:18px; padding:0 5px; display:grid; place-items:center; border:2px solid #0a0b18; border-radius:99px; background:#ff5c92; color:#fff; font:800 10px/1 system-ui; box-shadow:0 0 12px #ff5c9277; }
      .gd-menu-pop { position:absolute; z-index:50; top:calc(100% + 10px); right:0; width:230px; padding:8px; display:grid; gap:5px; border:1px solid #ffffff24; border-radius:17px; background:#101225f2; backdrop-filter:blur(18px); box-shadow:0 20px 65px #0009; transform-origin:top right; opacity:0; transform:translateY(-8px) scale(.88) rotateX(-12deg); pointer-events:none; transition:opacity .22s,transform .35s cubic-bezier(.2,.9,.25,1.25); }
      .gd-social-menu-summary { padding:8px 10px; color:#b9b3d1; font-size:11px; letter-spacing:.02em; }
      .gd-menu-wrap.is-open .gd-menu-pop { opacity:1; transform:translateY(0) scale(1) rotateX(0); pointer-events:auto; }
      .gd-menu-pop .gd-nav-btn { width:100%; justify-content:flex-start; animation:gd-rise .36s both; }
      .gd-menu-pop .gd-nav-btn:nth-child(2) { animation-delay:.025s; } .gd-menu-pop .gd-nav-btn:nth-child(3) { animation-delay:.05s; } .gd-menu-pop .gd-nav-btn:nth-child(4) { animation-delay:.075s; } .gd-menu-pop .gd-nav-btn:nth-child(5) { animation-delay:.1s; } .gd-menu-pop .gd-nav-btn:nth-child(6) { animation-delay:.125s; }
      .gd-settings-overlay { position:fixed; z-index:2147483012; inset:0; display:grid; place-items:center; padding:20px; background:#050611c9; backdrop-filter:blur(12px); animation:gd-root-in .18s ease-out both; }
      .gd-settings-overlay[hidden] { display:none; }
      .gd-settings-card { width:min(480px,100%); max-height:min(82vh,720px); overflow:auto; padding:22px; border:1px solid #ffffff28; border-radius:22px; color:#f7f7ff; background:linear-gradient(145deg,#17152bf5,#0b1022fa); box-shadow:0 28px 100px #000a,0 0 45px #9c8cff22; animation:gd-gate-content-in .28s cubic-bezier(.2,.8,.2,1) both; }
      .gd-settings-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
      .gd-settings-head h2 { margin:0; font-size:22px; letter-spacing:-.035em; }
      .gd-settings-head p { margin:5px 0 0; color:#aeb2c9; font-size:12px; }
      .gd-settings-close { width:36px; height:36px; flex:none; display:grid; place-items:center; border:1px solid #ffffff20; border-radius:11px; color:#fff; background:#ffffff0b; cursor:pointer; transition:transform .2s,background .2s,border-color .2s; }
      .gd-settings-close:hover { transform:rotate(90deg); border-color:#ffffff50; background:#ffffff15; }
      .gd-settings-list { display:grid; gap:9px; }
      .gd-setting-row { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:13px 14px; border:1px solid #ffffff18; border-radius:14px; background:linear-gradient(145deg,#ffffff0c,#ffffff05); cursor:pointer; transition:transform .2s,border-color .2s,background .2s; }
      .gd-setting-row:hover { transform:translateY(-1px); border-color:#b69bff66; background:#ffffff0e; }
      .gd-setting-copy { min-width:0; display:grid; gap:3px; }
      .gd-setting-copy strong { color:#f2efff; font-size:12px; }
      .gd-setting-copy small { color:#aeb2c9; font-size:10px; line-height:1.45; }
      .gd-setting-switch { position:relative; width:42px; height:24px; flex:none; }
      .gd-setting-switch input { position:absolute; width:1px; height:1px; opacity:0; }
      .gd-setting-switch i { position:absolute; inset:0; border:1px solid #ffffff2a; border-radius:99px; background:#ffffff13; transition:background .22s,border-color .22s,box-shadow .22s; }
      .gd-setting-switch i::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#d8d5e8; box-shadow:0 2px 6px #0007; transition:transform .22s cubic-bezier(.2,.9,.25,1.2),background .22s; }
      .gd-setting-switch input:checked + i { border-color:#c5b3ff99; background:#9c8cff78; box-shadow:0 0 14px #9c8cff24; }
      .gd-setting-switch input:checked + i::after { transform:translateX(18px); background:#fff; }
      .gd-setting-switch input:focus-visible + i { outline:2px solid #fff; outline-offset:3px; }
      .gd-settings-status { min-height:16px; margin:12px 2px 0; color:#aeb2c9; font-size:10px; }
      #library-root.gd-reduced-motion *,#library-root.gd-reduced-motion *::before,#library-root.gd-reduced-motion *::after { animation-duration:.01ms!important; animation-iteration-count:1!important; scroll-behavior:auto!important; transition-duration:.01ms!important; }
      .gd-user-profile { display:flex; align-items:center; gap:8px; max-width:100%; padding:7px 11px; border:1px solid #ffffff20; border-radius:999px; background:#ffffff09; box-shadow:inset 0 1px #ffffff09; color:#f1edff; font-size:11px; line-height:1.2; }
      .gd-user-profile[hidden] { display:none; }
      .gd-social-panel { position:fixed; z-index:2147483003; inset:0; display:grid; place-items:center; padding:20px; background:#050611b8; backdrop-filter:blur(12px); animation:gd-root-in .2s ease-out both; }
      .gd-social-card { width:min(620px,100%); max-height:min(78vh,760px); overflow:auto; padding:22px; border:1px solid #ffffff25; border-radius:22px; color:#f7f7ff; background:linear-gradient(145deg,#17152bea,#0b1022f5); box-shadow:0 28px 100px #0009,0 0 45px #9c8cff18; }
      .gd-social-head { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-bottom:16px; }
      .gd-social-head h2 { margin:0; font-size:22px; }
      .gd-social-tools { display:flex; gap:8px; margin:0 0 14px; }
      .gd-social-tools input,.gd-social-compose input { flex:1; min-width:0; border:1px solid #ffffff22; border-radius:12px; padding:10px 12px; outline:none; color:#fff; background:#ffffff0a; }
      .gd-social-tools input:focus,.gd-social-compose input:focus { border-color:var(--gd-accent,#9c8cff); }
      .gd-social-status { min-height:20px; margin:8px 0; color:#bcb8d2; font-size:12px; }
      .gd-social-list { display:grid; gap:9px; }
      .gd-social-list[hidden],.gd-chat-view[hidden] { display:none !important; }
      .gd-chat-view { display:block; }
      .gd-friend-row { display:flex; align-items:center; gap:10px; padding:12px; border:1px solid #ffffff14; border-radius:14px; background:#ffffff07; }
      .gd-friend-info { flex:1; min-width:0; }
      .gd-friend-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700; }
      .gd-friend-activity { color:#aaa7c2; font-size:11px; }
      .gd-online-dot { width:8px; height:8px; flex:none; border-radius:50%; background:#77798b; }
      .gd-online-dot.online { background:#74e6ad; box-shadow:0 0 10px #74e6ad99; }
      .gd-chat-log { display:grid; align-content:start; gap:8px; min-height:160px; max-height:38vh; overflow:auto; padding:12px; border:1px solid #ffffff16; border-radius:14px; background:#05071180; }
      .gd-chat-message { max-width:85%; padding:8px 11px; border-radius:12px; background:#ffffff10; overflow-wrap:anywhere; }
      .gd-chat-message.mine { justify-self:end; background:#9c8cff30; }
      .gd-chat-meta { display:block; color:#aaa7c2; font-size:10px; margin-bottom:2px; }
      .gd-social-compose { display:flex; gap:8px; margin-top:10px; }
      .gd-social-back { margin:0 0 12px; }
      .gd-social-empty { padding:20px 10px; text-align:center; color:#aaa7c2; font-size:13px; }
      .gd-toast { position:fixed; z-index:2147483004; top:20px; left:50%; width:min(520px,calc(100% - 32px)); padding:14px 18px; border:1px solid #ffffff28; border-radius:16px; color:#fff; background:#14152bed; box-shadow:0 15px 55px #0008,0 0 28px #9c8cff33; transform:translate(-50%,-20px) scale(.95); opacity:0; transition:opacity .3s,transform .4s cubic-bezier(.2,.9,.25,1.25); pointer-events:none; }
      .gd-toast.visible { opacity:1; transform:translate(-50%,0) scale(1); }
      .gd-chat-dock { position:fixed; z-index:2147483006; right:18px; bottom:18px; width:min(320px,calc(100vw - 36px)); display:grid; gap:9px; pointer-events:none; }
      .gd-chat-dock[hidden] { display:none; }
      .gd-chat-dock-item { display:grid; grid-template-columns:1fr auto; gap:2px 12px; align-items:center; width:100%; padding:12px 14px; border:1px solid #ffffff28; border-radius:16px; color:#fff; text-align:left; background:linear-gradient(145deg,#1c1b31f5,#0b1022f5); backdrop-filter:blur(16px); box-shadow:0 12px 40px #0008,0 0 22px #9c8cff20; cursor:pointer; pointer-events:auto; animation:gd-rise .28s cubic-bezier(.2,.8,.2,1) both; }
      .gd-chat-dock-item:hover { transform:translateY(-3px); border-color:#ffffff60; }
      .gd-chat-dock-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; font-weight:800; }
      .gd-chat-dock-preview { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#aaa7c2; font-size:11px; }
      .gd-chat-dock-badge { display:grid; place-items:center; min-width:20px; height:20px; padding:0 6px; border-radius:99px; color:#fff; background:#ff5c92; font:800 10px/1 system-ui; box-shadow:0 0 12px #ff5c9266; }
      .gd-user-profile::before { content:""; width:7px; height:7px; flex:none; border-radius:50%; background:#75e6b0; box-shadow:0 0 10px #75e6b0a0; }
      .gd-user-display { max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:750; }
      .gd-user-name { max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#aaa7c2; }
      .gd-nav-btn[hidden] { display:none !important; }
      .gd-nav-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 13px; font-size:12px; white-space:nowrap; }
      .gd-nav-btn span,.gd-nav-btn svg { position:relative; z-index:1; }
      .gd-nav-icon { width:16px; height:16px; flex:none; color:var(--gd-accent); }
      .gd-nav-icon .fill { fill:currentColor; stroke:none; }
      .gd-nav-icon .line { fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .gd-btn { position:relative; overflow:hidden; border:1px solid #ffffff34; border-radius:999px; padding:10px 17px; color:#fff;
        background:#ffffff18; cursor:pointer; transition:transform .24s cubic-bezier(.18,.85,.25,1.25), background .22s, border-color .22s, box-shadow .24s; }
      .gd-btn::after { content:""; position:absolute; inset:-40% auto -40% -55%; width:38%; transform:skewX(-22deg); background:linear-gradient(90deg,transparent,#ffffff26,transparent); transition:left .48s cubic-bezier(.2,.7,.2,1); pointer-events:none; }
      .gd-btn:hover::after { left:125%; }
      .gd-btn:hover { transform:translateY(-3px) scale(1.025); background:#ffffff28; border-color:#ffffff78; box-shadow:0 10px 28px #0004,0 0 18px color-mix(in srgb,var(--gd-accent) 22%,transparent); }
      .gd-btn:active { transform:translateY(0) scale(.96); }
      .gd-btn:focus-visible { outline:2px solid var(--gd-accent); outline-offset:3px; }
      .gd-btn.primary { background:linear-gradient(120deg,color-mix(in srgb,var(--gd-accent) 76%,#ffffff),#eadfff); border-color:#ffffff55; color:${state.colors.buttonText}; font-weight:850; box-shadow:0 6px 24px color-mix(in srgb,var(--gd-accent) 38%,transparent),inset 0 1px #ffffffa8; }
      .gd-btn.primary:hover { background:linear-gradient(120deg,color-mix(in srgb,var(--gd-accent) 60%,#ffffff),#f1eaff); box-shadow:0 10px 34px color-mix(in srgb,var(--gd-accent) 52%,transparent),inset 0 1px #ffffffc9; }
      .gd-section-head { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:38px 0 15px; animation:gd-rise .65s .22s cubic-bezier(.2,.8,.2,1) both; }
      .gd-section-head h2 { margin:0; font-size:22px; letter-spacing:-.035em; }
      .gd-section-head span { color:#a7abc3; font-size:12px; padding:5px 10px; border:1px solid #ffffff18; border-radius:999px; background:#ffffff08; }
      .gd-games { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,${state.layout.cardMinWidth}),1fr)); gap:${state.layout.cardGap}; }
      .gd-game { position:relative; overflow:hidden; border:1px solid ${state.colors.border}; border-radius:${state.layout.cardRadius}; padding:20px; min-height:190px;
        background:linear-gradient(145deg,#ffffff0c,${state.colors.cardBackground}); box-shadow:0 12px 35px #0002; backdrop-filter:blur(14px);
        display:flex; flex-direction:column; align-items:flex-start; transform-origin:center; transition:transform .32s cubic-bezier(.18,.85,.25,1.2),border-color .28s,box-shadow .32s,background .28s;
        animation:gd-rise .62s calc(.28s + var(--gd-index,0)*.075s) cubic-bezier(.2,.8,.2,1) both; }
      .gd-game::before { content:""; position:absolute; inset:0; border-radius:inherit; opacity:0; background:radial-gradient(circle at var(--hover-x,50%) var(--hover-y,50%),color-mix(in srgb,var(--gd-accent) 20%,transparent),transparent 58%); transition:opacity .28s; pointer-events:none; }
      .gd-game::after { content:""; position:absolute; inset:-30% auto -30% -70%; width:42%; transform:skewX(-20deg); opacity:0; background:linear-gradient(90deg,transparent,#ffffff12,transparent); transition:left .65s cubic-bezier(.2,.7,.2,1),opacity .2s; pointer-events:none; }
      .gd-game:hover { transform:translateY(-7px) scale(1.018); border-color:#ffffff55; background:linear-gradient(145deg,#ffffff14,${state.colors.cardBackground}); box-shadow:0 24px 55px #0005,0 0 32px color-mix(in srgb,var(--gd-accent) 13%,transparent); }
      .gd-game:hover::before { opacity:1; }
      .gd-game:hover::after { left:135%; opacity:1; }
      .gd-game > * { position:relative; z-index:1; }
      .gd-game h3 { margin:0 0 5px; font-size:18px; }
      .gd-game p { margin:0 0 16px; color:#aeb2c9; font-size:13px; flex:1; }
      .gd-tag { color:var(--gd-accent); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; margin-bottom:9px; }
      .gd-empty { color:#b9bdd2; padding:24px; border:1px dashed #ffffff35; border-radius:16px; animation:gd-rise .6s .28s ease both; }
      #gd-games.gd-stock-page { display:block; animation:gd-rise .45s cubic-bezier(.2,.8,.2,1) both; }
      #gd-games.gd-stock-page .gd-empty { border-style:solid; border-color:#ffffff24; background:linear-gradient(145deg,#ffffff10,#101225e8); box-shadow:0 15px 42px #0004; }
      #library-root.gd-stock-active .gd-section-head { padding:14px 18px; border:1px solid #ffffff20; border-radius:16px; background:linear-gradient(145deg,#ffffff12,#101225d9); box-shadow:0 12px 34px #0003; backdrop-filter:blur(14px); }
      #library-root.gd-stock-active .gd-section-head h2 { color:#fff; }
      .gd-stock-hero { display:block; margin-bottom:14px; }
      .gd-stock-cash-card,.gd-stock-summary-card,.gd-stock-card { border:1px solid #ffffff24; border-radius:20px; background:linear-gradient(145deg,#ffffff12,#101225e8); box-shadow:0 15px 42px #0004; backdrop-filter:blur(14px); }
      .gd-stock-cash-card { padding:18px 22px; display:grid; grid-template-columns:1fr auto; align-items:center; border-color:color-mix(in srgb,var(--gd-accent) 42%,#ffffff26); background:radial-gradient(circle at 100% 0%,color-mix(in srgb,var(--gd-accent) 22%,transparent),transparent 60%),linear-gradient(145deg,#ffffff12,#101225ef); }
      .gd-stock-cash-card span,.gd-stock-summary-card span { color:#aaaec5; font-size:11px; }
      .gd-stock-cash-card span,.gd-stock-cash-card strong { grid-column:1; }
      .gd-stock-cash-card strong { margin:4px 0 0; font-size:34px; line-height:1.15; letter-spacing:-.04em; }
      .gd-stock-cash-card small { grid-column:2; grid-row:1/3; padding:9px 12px; border:1px solid #ffffff17; border-radius:12px; color:#b6bad0; background:#ffffff08; font-size:10px; }
      .gd-stock-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:20px; }
      .gd-stock-summary-card { padding:14px 16px; }
      .gd-stock-summary-card strong { display:block; margin-top:4px; font-size:17px; }
      .gd-stock-leaderboard { margin:0 0 14px; padding:15px 17px; border:1px solid #ffffff22; border-radius:18px; background:linear-gradient(145deg,#ffffff10,#101225e8); box-shadow:0 12px 34px #0003; backdrop-filter:blur(14px); }
      .gd-stock-leaderboard-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:10px; }
      .gd-stock-leaderboard-head strong { font-size:14px; }
      .gd-stock-leaderboard-head span { color:#aeb2c9; font-size:10px; }
      .gd-stock-leaderboard-list { display:grid; gap:6px; margin:0; padding:0; list-style:none; }
      .gd-stock-leaderboard-row { display:grid; grid-template-columns:34px minmax(0,1fr) auto; align-items:center; gap:10px; min-height:38px; padding:5px 10px; border:1px solid #ffffff0d; border-radius:11px; background:#ffffff07; }
      .gd-stock-leaderboard-rank { display:grid; width:25px; height:25px; place-items:center; border-radius:8px; color:#c7c2ff; background:#9c8cff20; font-size:11px; font-weight:900; }
      .gd-stock-leaderboard-name { overflow:hidden; color:#ececff; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
      .gd-stock-leaderboard-value { color:#91edbc; font-size:12px; font-variant-numeric:tabular-nums; }
      .gd-stock-leaderboard-empty { padding:8px 10px; color:#aeb2c9; font-size:11px; }
      .gd-broadcast-banner { position:fixed; z-index:2147483010; top:12px; left:50%; width:min(720px,calc(100% - 24px)); height:112px; box-sizing:border-box; display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:12px; padding:12px 16px; border:1px solid #cdbbff88; border-radius:16px; color:#fff; background:linear-gradient(110deg,#21194bf5,#11152af5); box-shadow:0 14px 42px #0008,0 0 32px #a47bff44,inset 0 1px #ffffff22; backdrop-filter:blur(12px); transform:translate(-50%,-150%); opacity:0; pointer-events:none; transition:transform .48s cubic-bezier(.2,.9,.2,1.2),opacity .32s; }
      .gd-broadcast-banner.visible { transform:translate(-50%,0); opacity:1; } .gd-broadcast-signal { width:10px; height:10px; border-radius:50%; background:#d1baff; box-shadow:0 0 15px 4px #a875ff; animation:gd-broadcast-pulse 1.5s ease-in-out infinite; }
      .gd-broadcast-copy { min-width:0; width:100%; height:100%; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr) auto; } .gd-broadcast-meta { display:flex; align-items:baseline; gap:8px; min-width:0; } .gd-broadcast-label { flex:none; color:#cdbbff; font-size:9px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; } .gd-broadcast-sender { min-width:0; overflow:hidden; color:#fff; font-size:10px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; } .gd-broadcast-message { min-height:0; max-height:52px; margin-top:3px; overflow:auto; overflow-wrap:anywhere; font-size:13px; line-height:1.4; scrollbar-width:thin; } .gd-broadcast-remaining { margin-top:3px; color:#bcb5da; font-size:10px; font-variant-numeric:tabular-nums; }
      .gd-broadcast-char { display:inline-block; white-space:pre; opacity:0; transform:translateY(5px); } .gd-broadcast-char.typed { animation:gd-broadcast-type .34s cubic-bezier(.12,.9,.28,1.4) both; } @keyframes gd-broadcast-pulse { 50% { transform:scale(.72); opacity:.65; } } @keyframes gd-broadcast-type { from { opacity:0; transform:translateY(5px); } 65% { opacity:1; transform:translateY(-1px); } to { opacity:1; transform:translateY(0); } }
      body.gd-broadcast-active #library-root { padding-top:132px; }
      body.gd-broadcast-active #library-launch-screen,body.gd-broadcast-active #library-auth-screen { padding-top:132px; }
      body.gd-broadcast-active .gd-social-panel,body.gd-broadcast-active .gd-feedback-overlay,body.gd-broadcast-active .gd-settings-overlay { padding-top:132px; }
      body.gd-broadcast-active .gd-toast { top:132px; }
      .gd-broadcast-panel { padding:12px; margin:4px 0; display:grid; gap:9px; border:1px solid #b69bff38; border-radius:13px; background:linear-gradient(145deg,#9c8cff12,#ffffff06); } .gd-broadcast-panel[hidden] { display:none; } .gd-broadcast-panel strong { color:#e8deff; font-size:11px; }
      .gd-broadcast-panel textarea,.gd-broadcast-panel input { width:100%; box-sizing:border-box; padding:9px 10px; border:1px solid #ffffff22; border-radius:10px; outline:0; color:#fff; background:#070a16c9; font:inherit; font-size:11px; } .gd-broadcast-panel textarea { min-height:72px; resize:vertical; } .gd-broadcast-panel textarea:focus,.gd-broadcast-panel input:focus { border-color:#b69bff; box-shadow:0 0 0 3px #9c8cff22; } .gd-broadcast-panel small { color:#aeb2c9; font-size:9px; } .gd-broadcast-panel .gd-btn { padding:8px 10px; font-size:10px; }
      .gd-feedback-overlay { position:fixed; inset:0; z-index:2147483007; display:grid; place-items:center; padding:18px; background:#050713d9; backdrop-filter:blur(12px); animation:gd-root-in .2s ease both; }
      .gd-feedback-card { width:min(100%,520px); max-height:min(88vh,760px); overflow:auto; padding:23px; border:1px solid #ffffff25; border-radius:22px; background:linear-gradient(145deg,#171a31f5,#090c19f5); box-shadow:0 28px 90px #0009,0 0 35px color-mix(in srgb,var(--gd-accent) 16%,transparent); animation:gd-rise .28s cubic-bezier(.2,.8,.2,1) both; }
      .gd-feedback-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:17px; }
      .gd-feedback-head h2 { margin:0; font-size:21px; letter-spacing:-.03em; }
      .gd-feedback-head p { margin:5px 0 0; color:#aeb2c9; font-size:12px; }
      .gd-moderation-overlay,.gd-ban-gate,.gd-warning-gate { position:fixed; inset:0; z-index:2147483020; display:grid; place-items:center; padding:18px; color:#f7f7ff; font-family:${state.layout.fontFamily}; background:#050713ed; backdrop-filter:blur(16px); }
      .gd-moderation-card,.gd-gate-notice-card { width:min(900px,100%); max-height:min(92vh,900px); overflow:auto; padding:22px; border:1px solid #a99bff55; border-radius:20px; background:linear-gradient(145deg,#19172bf5,#090c19f7); box-shadow:0 25px 90px #000b,0 0 40px #9c8cff24; animation:gd-rise .3s cubic-bezier(.2,.8,.2,1) both; }
      .gd-mod-head,.gd-mod-toolbar,.gd-mod-pagination,.gd-mod-row,.gd-mod-actions { display:flex; align-items:center; gap:10px; }
      .gd-mod-head { justify-content:space-between; margin-bottom:14px; } .gd-mod-head h2,.gd-gate-notice-card h2 { margin:0; font-size:22px; } .gd-mod-copy { margin:5px 0 14px; color:#b8bad0; font-size:12px; }
      .gd-mod-toolbar { flex-wrap:wrap; margin-bottom:12px; } .gd-mod-search { display:flex; flex:1 1 360px; gap:8px; } .gd-mod-input,.gd-mod-reason,.gd-mod-hours { min-width:0; width:100%; padding:10px 12px; border:1px solid #ffffff25; border-radius:11px; outline:none; color:#fff; background:#080b17; font:inherit; } .gd-mod-reason { min-height:78px; resize:vertical; } .gd-mod-input:focus,.gd-mod-reason:focus,.gd-mod-hours:focus { border-color:#b69bff; box-shadow:0 0 0 3px #9c8cff22; }
      .gd-mod-status { min-height:18px; margin:7px 0; color:#c8c5dc; font-size:11px; } .gd-mod-users,.gd-mod-friends { display:grid; gap:7px; margin:10px 0; } .gd-mod-user,.gd-mod-friend { display:flex; justify-content:space-between; align-items:center; gap:10px; width:100%; padding:10px 12px; border:1px solid #ffffff16; border-radius:11px; color:#f4f2ff; text-align:left; background:#ffffff08; }
      .gd-mod-user { cursor:pointer; } .gd-mod-user:hover { border-color:#aa98ff77; background:#9c8cff16; } .gd-mod-muted { color:#aeb2c9; font-size:10px; } .gd-mod-pagination { justify-content:center; margin:12px 0; } .gd-mod-pagination span { color:#c3c1d5; font-size:11px; }
      .gd-mod-detail { margin-top:14px; padding:15px; border:1px solid #ffffff20; border-radius:15px; background:#ffffff07; } .gd-mod-detail h3 { margin:0 0 5px; font-size:17px; } .gd-mod-detail p { margin:5px 0; color:#c0bfd0; font-size:11px; } .gd-mod-detail h4 { margin:14px 0 6px; font-size:12px; }
      .gd-mod-form { display:grid; gap:9px; margin-top:14px; } .gd-mod-form label { display:grid; gap:6px; color:#d9d9ea; font-size:11px; } .gd-mod-actions { flex-wrap:wrap; } .gd-mod-ban { border-color:#ff829955!important; color:#ffd2dc!important; } .gd-mod-unban { border-color:#65dcb555!important; color:#b8ffe7!important; }
      .gd-ban-gate,.gd-warning-gate { z-index:2147483025; } .gd-gate-notice-card { width:min(520px,100%); text-align:center; } .gd-gate-notice-card p { color:#dedbed; font-size:13px; line-height:1.7; } .gd-gate-notice-reason { margin:14px 0; padding:12px; border:1px solid #ffffff20; border-radius:12px; color:#fff!important; background:#ffffff09; overflow-wrap:anywhere; } .gd-gate-notice-meta { color:#b8bad0!important; font-size:11px!important; } .gd-warning-gate { z-index:2147483024; }
      .gd-warning-gate [data-warning-ack],.gd-mod-search button[type="submit"],.gd-mod-actions [data-mod-action="warn"] { color:#fff!important; text-shadow:0 1px 3px #160e36cc; background:linear-gradient(120deg,#5741c5,#8540b3)!important; border:1px solid #ffffff75!important; box-shadow:0 5px 18px #744ed955,inset 0 1px #ffffff55; }
      .gd-warning-gate [data-warning-ack]:hover,.gd-mod-search button[type="submit"]:hover,.gd-mod-actions [data-mod-action="warn"]:hover { color:#fff!important; background:linear-gradient(120deg,#6a53d9,#9952c8)!important; }
      @media(max-width:620px) { .gd-moderation-card { padding:15px; } .gd-mod-search { flex-basis:100%; } .gd-mod-user { align-items:flex-start; flex-direction:column; } }
      .gd-feedback-form { display:grid; gap:12px; }
      .gd-feedback-form label { display:grid; gap:6px; color:#d9d9ea; font-size:11px; font-weight:700; }
      .gd-feedback-form input,.gd-feedback-form textarea { width:100%; box-sizing:border-box; border:1px solid #ffffff20; border-radius:12px; padding:11px 12px; outline:none; color:#fff; background:#ffffff0b; font:inherit; font-weight:400; }
      .gd-feedback-form textarea { min-height:125px; resize:vertical; line-height:1.5; }
      .gd-feedback-form input:focus,.gd-feedback-form textarea:focus { border-color:var(--gd-accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--gd-accent) 16%,transparent); }
      .gd-feedback-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:4px; }
      .gd-feedback-actions .gd-btn.primary { color:#fff; text-shadow:0 1px 3px #29135c88; background:linear-gradient(120deg,#7558f2,#a65bea); border-color:#ffffff65; box-shadow:0 6px 22px #8f61ff55,inset 0 1px #ffffff65; }
      .gd-feedback-actions .gd-btn.primary:hover { color:#fff; background:linear-gradient(120deg,#886ffb,#b875f2); box-shadow:0 10px 30px #9a6cff80,inset 0 1px #ffffff8a; }
      .gd-feedback-status { min-height:18px; color:#aeb2c9; font-size:11px; }
      .gd-feedback-status.success { color:#83e7b1; }
      .gd-feedback-status.error { color:#ff91a6; }
      .gd-feedback-actions button:disabled { opacity:.55; cursor:wait; }
      .gd-stock-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr)); gap:13px; }
      .gd-stock-card { min-width:0; padding:17px; transition:transform .25s,border-color .25s,box-shadow .25s; animation:gd-rise .4s both; }
      .gd-stock-card:hover { transform:translateY(-3px); border-color:#ffffff50; box-shadow:0 20px 48px #0005,0 0 24px color-mix(in srgb,var(--gd-accent) 12%,transparent); }
      .gd-stock-card-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .gd-stock-identity { min-width:0; display:flex; align-items:center; gap:10px; }
      .gd-stock-monogram { width:39px; height:39px; flex:none; display:grid; place-items:center; border:1px solid #ffffff20; border-radius:13px; color:var(--gd-accent); background:#ffffff0d; font-size:11px; font-weight:900; }
      .gd-stock-name { min-width:0; }
      .gd-stock-name strong,.gd-stock-name span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .gd-stock-name strong { font-size:14px; }
      .gd-stock-name span { color:#9296ae; font-size:10px; }
      .gd-stock-price { text-align:right; }
      .gd-stock-price strong { display:block; font-size:20px; letter-spacing:-.03em; }
      .gd-stock-change { font-size:10px; font-weight:800; }
      .gd-stock-change.positive { color:#74e6ad; }
      .gd-stock-change.negative { color:#ff829e; }
      .gd-stock-chart-key { display:flex; align-items:center; gap:14px; margin:13px 2px 0; color:#aeb2c9; font-size:10px; }
      .gd-stock-chart-key span { display:inline-flex; align-items:center; gap:6px; }
      .gd-stock-chart-key i { display:inline-block; width:9px; height:9px; border-radius:3px; background:var(--gd-accent); box-shadow:0 0 10px color-mix(in srgb,var(--gd-accent) 45%,transparent); }
      .gd-stock-chart-key i.up { background:#59e6a8; box-shadow:0 0 10px #59e6a855; }
      .gd-stock-chart-key i.down { background:#ff6e8d; box-shadow:0 0 10px #ff6e8d55; }
      .gd-stock-chart { display:block; width:100%; height:clamp(190px,24vw,250px); margin:4px 0 8px; overflow:visible; border:1px solid #ffffff12; border-radius:15px; background:linear-gradient(180deg,#090d1cbb,#0b1020aa); }
      .gd-stock-chart .grid { stroke:#ffffff10; stroke-width:1; }
      .gd-stock-chart .baseline { stroke:#ffffff35; stroke-width:1.2; stroke-dasharray:4 5; }
      .gd-stock-chart .line { fill:none; stroke:var(--gd-accent); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 0 5px color-mix(in srgb,var(--gd-accent) 55%,transparent)); }
      .gd-stock-chart .area { fill:color-mix(in srgb,var(--gd-accent) 12%,transparent); }
      .gd-stock-chart .bar { opacity:.82; rx:2; transition:opacity .2s; }
      .gd-stock-chart .bar:hover { opacity:1; }
      .gd-stock-chart .bar.positive { fill:#59e6a8; }
      .gd-stock-chart .bar.negative { fill:#ff6e8d; }
      .gd-stock-chart .bar.flat { fill:#aeb2c9; opacity:.4; }
      .gd-stock-position { display:flex; justify-content:space-between; gap:12px; padding:9px 0 12px; border-top:1px solid #ffffff12; color:#aeb2c9; font-size:11px; }
      .gd-stock-position strong { color:#f7f7ff; }
      .gd-stock-order { display:flex; gap:8px; }
      .gd-stock-qty { width:75px; flex:none; border:1px solid #ffffff20; border-radius:12px; padding:8px 9px; outline:none; color:#fff; background:#ffffff0c; }
      .gd-stock-qty:focus { border-color:var(--gd-accent); }
      .gd-stock-order .gd-btn { flex:1; padding:8px 12px; font-size:11px; }
      .gd-stock-order .gd-btn:disabled { opacity:.55; cursor:wait; transform:none; }
      .gd-stock-info-panel { margin-top:14px; padding:12px 15px; border:1px solid #ffffff1e; border-radius:15px; background:linear-gradient(145deg,#ffffff0d,#101225d9); box-shadow:0 10px 30px #0003; }
      .gd-stock-status { min-height:20px; color:#d0cce2; font-size:11px; }
      .gd-stock-status.error { color:#ff91a6; }
      .gd-stock-status.success { color:#8be7b7; }
      .gd-stock-footnote { margin:6px 0 0; color:#a0a4bb; font-size:10px; }
      @keyframes gd-root-in { from { opacity:0; } to { opacity:1; } }
      @keyframes gd-rise { from { opacity:0; transform:translateY(16px) scale(.99); filter:blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
      #library-launch-screen { position:fixed; inset:0; z-index:2147483001; display:grid; place-items:center; overflow:hidden; color:${state.colors.text}; font:15px/1.5 ${state.layout.fontFamily}; background:rgba(8,8,22,.28); backdrop-filter:blur(2px); isolation:isolate; animation:gd-gate-arrive .9s cubic-bezier(.2,.8,.2,1) both; }
      .gd-gate-aurora { position:absolute; inset:-30%; z-index:-1; opacity:.75; filter:blur(48px); background:conic-gradient(from 25deg at 50% 50%,#4931aa26,#ee72d426,#3d8df226,#4a2ca530); animation:gd-aurora-turn 26s linear infinite; }
      .gd-gate-stars { position:absolute; inset:0; opacity:.65; background-image:radial-gradient(1px 1px at 12% 19%,#fff9 50%,transparent 100%),radial-gradient(2px 2px at 77% 22%,#d7caffb0 50%,transparent 100%),radial-gradient(1px 1px at 84% 72%,#fff8 50%,transparent 100%),radial-gradient(1.5px 1.5px at 22% 78%,#efaaff99 50%,transparent 100%),radial-gradient(1px 1px at 48% 12%,#fff8 50%,transparent 100%),radial-gradient(1px 1px at 65% 86%,#d9e5ff99 50%,transparent 100%); animation:gd-stars 7s ease-in-out infinite alternate; }
      .gd-gate-content { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; text-align:center; padding:28px; animation:gd-gate-content-in 1s .12s cubic-bezier(.2,.8,.2,1) both; }
      .gd-gate-mark { width:52px; height:52px; margin-bottom:15px; filter:drop-shadow(0 0 18px #b295ff99); animation:gd-mark-float 4s ease-in-out infinite; }
      .gd-gate-eyebrow { color:#cabaff; font-size:10px; font-weight:800; letter-spacing:.26em; text-transform:uppercase; }
      .gd-gate-title { margin:6px 0 0; font-size:clamp(38px,8vw,70px); line-height:1; letter-spacing:-.06em; text-shadow:0 0 38px #b67cff50; }
      .gd-gate-caption { margin:13px 0 0; color:#b6b4cc; font-size:14px; }
      .gd-gate-user { margin:8px 0 0; color:#ded8f5; font-size:12px; }
      .gd-gate-user strong { color:#fff; }
      .gd-gate-social-summary { margin:6px 0 0; min-height:16px; color:#c7c0e1; font-size:12px; }
      .gd-gate-stage { position:relative; display:grid; place-items:center; width:250px; height:250px; margin:14px 0 0; }
      .gd-gate-ring { position:absolute; inset:21px; border:1px solid #cab7ff4d; border-radius:50%; box-shadow:inset 0 0 25px #a988ff12,0 0 28px #a988ff12; animation:gd-ring-spin 12s linear infinite; }
      .gd-gate-ring::before,.gd-gate-ring::after { content:""; position:absolute; top:50%; left:-5px; width:9px; height:9px; border-radius:50%; background:#e2caff; box-shadow:0 0 16px 4px #c193ff; }
      .gd-gate-ring::after { top:auto; bottom:13%; left:auto; right:8%; width:5px; height:5px; background:#ffb5ed; box-shadow:0 0 12px 3px #ff91db; }
      .gd-gate-ring.ring-two { inset:7px; border-color:#f19cf033; animation-duration:19s; animation-direction:reverse; transform:rotate(32deg); }
      .gd-gate-ring.ring-three { inset:0; border-style:dashed; border-color:#8d9aff29; animation-duration:34s; }
      .gd-gate-button { position:relative; z-index:2; display:grid; place-items:center; width:142px; height:142px; border:1px solid #f8edffb8; border-radius:50%; color:white; background:radial-gradient(circle at 32% 24%,#ffffff50,transparent 34%),radial-gradient(circle at 50% 68%,#863dcbb3,#261f5878 72%); backdrop-filter:blur(9px); box-shadow:inset 0 0 25px #ffffff24,0 0 35px #b768ff91,0 0 95px #934bff70,0 0 170px #c65cff38; cursor:pointer; animation:gd-core-pulse 2.8s ease-in-out infinite; transition:transform .25s cubic-bezier(.2,.9,.25,1.4),box-shadow .25s,filter .25s; }
      .gd-gate-button:hover { transform:scale(1.12); filter:brightness(1.3); box-shadow:inset 0 0 35px #ffffff38,0 0 48px #c87dffdb,0 0 120px #934bff9c,0 0 200px #c65cff6b; }
      .gd-gate-button:active { transform:scale(.94); }
      .gd-gate-button:focus-visible { outline:2px solid white; outline-offset:8px; }
      .gd-gate-button span { font-size:12px; font-weight:750; letter-spacing:.05em; text-transform:none; }
      .gd-gate-foot { color:#8f8ea9; font-size:11px; letter-spacing:.06em; }
      #library-auth-screen { position:fixed; inset:0; z-index:2147483002; display:grid; place-items:center; overflow:auto; padding:24px; color:${state.colors.text}; font:15px/1.5 ${state.layout.fontFamily}; background:rgba(8,8,22,.68); backdrop-filter:blur(14px); }
      .gd-auth-card { width:min(440px,100%); padding:clamp(22px,5vw,34px); border:1px solid #ffffff28; border-radius:24px; background:linear-gradient(145deg,#17152bd9,#0d1020ed); box-shadow:0 25px 90px #0009,0 0 60px #9c8cff20; animation:gd-gate-content-in .55s cubic-bezier(.2,.8,.2,1) both; }
      .gd-auth-brand { display:flex; align-items:center; gap:9px; margin-bottom:22px; color:var(--gd-accent); font-size:11px; font-weight:850; letter-spacing:.16em; text-transform:uppercase; }
      .gd-auth-brand svg { width:23px; height:23px; }
      .gd-auth-card h1 { margin:0; font-size:29px; letter-spacing:-.045em; }
      .gd-auth-copy { margin:7px 0 20px; color:#b7b8cc; font-size:13px; }
      .gd-auth-tabs { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:17px; padding:4px; border:1px solid #ffffff16; border-radius:13px; background:#0003; }
      .gd-auth-tab { border:0; border-radius:9px; padding:9px; color:#b9bad0; background:transparent; cursor:pointer; }
      .gd-auth-tab.active { color:white; background:#ffffff15; box-shadow:0 2px 10px #0003; }
      .gd-auth-form { display:grid; gap:12px; }
      .gd-auth-form[hidden] { display:none; }
      .gd-auth-form label { display:grid; gap:6px; color:#d1d2e1; font-size:12px; font-weight:650; }
      .gd-auth-form input { width:100%; min-height:43px; padding:10px 12px; border:1px solid #ffffff20; border-radius:11px; outline:0; color:white; background:#070a16c9; font:inherit; }
      .gd-auth-form input:focus { border-color:var(--gd-accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--gd-accent) 20%,transparent); }
      .gd-auth-form button { width:100%; margin-top:3px; }
      .gd-auth-form button:disabled { cursor:wait; opacity:.55; }
      .gd-auth-message { min-height:18px; color:#ffb3c0; font-size:12px; }
      .gd-auth-message.setup { color:#ffd99c; }
      .gd-auth-policy { margin:15px 0 0; padding:11px 12px; border:1px solid #e0b46b35; border-radius:11px; background:#e0b46b0c; color:#c7c1b2; font-size:11px; line-height:1.5; }
      .gd-auth-note { margin:12px 0 0; color:#858ba4; font-size:10px; line-height:1.5; }
      #library-launch-screen.launching { animation:gd-gate-exit .95s cubic-bezier(.55,0,.9,.4) both; pointer-events:none; }
      #library-launch-screen.launching .gd-gate-content { animation:gd-content-exit .72s cubic-bezier(.4,0,.8,.2) both; }
      #library-launch-screen.launching .gd-gate-ring { animation:gd-ring-burst .8s cubic-bezier(.1,.7,.2,1) both; }
      #library-launch-screen.launching .gd-gate-ring.ring-two { animation-delay:.06s; }
      #library-launch-screen.launching .gd-gate-ring.ring-three { animation-delay:.12s; }
      #library-launch-screen.launching .gd-gate-button { animation:gd-core-burst .72s cubic-bezier(.1,.7,.2,1) both; }
      @keyframes gd-gate-arrive { from { opacity:0; } to { opacity:1; } }
      @keyframes gd-gate-content-in { from { opacity:0; transform:translateY(25px) scale(.96); filter:blur(8px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
      @keyframes gd-aurora-turn { to { transform:rotate(360deg) scale(1.08); } }
      @keyframes gd-stars { from { opacity:.36; transform:scale(1); } to { opacity:.8; transform:scale(1.04); } }
      @keyframes gd-mark-float { 50% { transform:translateY(-7px) rotate(-5deg); } }
      @keyframes gd-ring-spin { to { transform:rotate(360deg); } }
      @keyframes gd-core-pulse { 0%,100% { box-shadow:inset 0 0 25px #ffffff18,0 0 35px #b768ff70,0 0 95px #934bff3b; } 50% { box-shadow:inset 0 0 35px #ffffff30,0 0 52px #c87dffb0,0 0 125px #934bff68; } }
      @keyframes gd-ring-burst { to { transform:scale(5.8) rotate(160deg); opacity:0; filter:blur(7px); } }
      @keyframes gd-core-burst { to { transform:scale(2.4); opacity:0; filter:brightness(2) blur(8px); } }
      @keyframes gd-content-exit { to { opacity:0; transform:scale(.72); filter:blur(14px); } }
      @keyframes gd-gate-exit { 60% { opacity:1; background:rgba(19,13,39,.44); } 100% { opacity:0; background:rgba(8,8,22,.2); } }
      @media(prefers-reduced-motion:reduce) { #library-launch-screen *,#library-launch-screen *::before,#library-launch-screen *::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; } }
      @media(max-width:560px) { .gd-gate-stage { width:215px; height:215px; } .gd-gate-button { width:126px; height:126px; } }
      @media(prefers-reduced-motion:reduce) { #library-root *,#library-root *::before,#library-root *::after { animation-duration:.01ms!important; animation-iteration-count:1!important; scroll-behavior:auto!important; transition-duration:.01ms!important; } }
      @media(max-width:560px) { .gd-top { align-items:flex-start; flex-direction:column; margin-bottom:25px; } .gd-top-left { gap:10px; } .gd-user-profile { padding:6px 9px; } .gd-user-display,.gd-user-name { max-width:130px; } .gd-form-grid { grid-template-columns:1fr; } .gd-field.full { grid-column:auto; } .gd-stock-summary { grid-template-columns:1fr 1fr; } .gd-stock-summary-card:last-child { grid-column:1/-1; } .gd-stock-cash-card { padding:15px; } .gd-stock-cash-card strong { font-size:28px; } .gd-stock-cash-card small { max-width:125px; text-align:center; } }

    `;
    style.textContent += "\n" + (state.customCSS || "");
    document.head.appendChild(style);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[ch]));
  }

  function publicText(value) {
    return String(value ?? "").replace(/playfab/gi, "service");
  }

  const LUNARA_NAME_TOKEN = "<lu- nar>";
  const LUNARA_NAME_LOGO = '<svg class="gd-inline-lunara-mark" viewBox="0 0 32 32" role="img" aria-label="Lunara logo" focusable="false"><path class="gd-inline-mark-moon" d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path class="gd-inline-mark-star" d="m23.8 5.2 1.1 3 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3-1.1 3-1.1 1.1-3Z"/></svg>';

  function renderPlayFabName(value) {
    return String(value ?? "").split(LUNARA_NAME_TOKEN).map(esc).join(LUNARA_NAME_LOGO);
  }

  function setFavicon() {
    document.getElementById("library-favicon")?.remove();
    const accent = esc(state.colors.accent || state.background.accentColor || "#9c8cff");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="${accent}" d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path fill="#fff" d="m23.8 5.2 1.1 3 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3-1.1 3-1.1 1.1-3Z"/></svg>`;
    const link = document.createElement("link");
    link.id = "library-favicon";
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    (document.head || document.documentElement).appendChild(link);
  }

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aDot;
uniform vec2 uSize;
uniform float uPixel;
uniform float uRadius;
uniform float uCell;
uniform vec4 uLens;
uniform vec2 uWarp;
uniform vec3 uGlow;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform vec4 uGlowColor;
uniform vec3 uGradient;
uniform float uTime;
uniform float uWave;
uniform float uSparkle;
uniform float uFocus;
uniform float uBase;
uniform float uLight;
out vec2 vLocal;
out float vRadius;
out float vBlur;
out float vHalo;
out float vHaloWidth;
out vec3 vColor;
out float vAlpha;

vec3 toRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.291485548 * lab.z;
  vec3 lms = vec3(l * l * l, m * m * m, s * s * s);
  vec3 lin = clamp(vec3(
    4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z,
    -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z,
    -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.707614701 * lms.z
  ), 0.0, 1.0);
  return mix(lin * 12.92, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}

vec3 blend(vec3 a, vec3 b, float t) {
  vec2 ab = mix(a.yz, b.yz, t);
  float chroma = mix(length(a.yz), length(b.yz), t);
  float len = length(ab);
  return vec3(mix(a.x, b.x, t), len > 1e-5 ? ab * (chroma / len) : ab);
}

vec3 wave(vec2 p, float t) {
  float ay = p.x * 0.018 + t + 1.1 * sin(p.y * 0.016 - t * 0.4);
  float ax = p.y * 0.021 + t * 0.7 + 1.3 * sin(p.x * 0.013 + t * 0.3);
  float spread = cos(ay) * 0.0176 * cos(p.y * 0.016 - t * 0.4) + 0.5 * cos(ax) * 0.0169 * cos(p.x * 0.013 + t * 0.3);
  return uWave * vec3(0.5 * sin(ax), sin(ay), spread);
}

void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 center = uSize * 0.5;
  vec3 swell = wave(aDot.xy, uTime);
  vec2 source = center + (aDot.xy - center) * mix(1.12, 1.0, uFocus) + swell.xy;

  vec2 rel = source - uLens.xy;
  float x = length(rel) / uLens.z;
  float y = clamp(1.0 - x * x, 0.0, 1.0);
  float w = y * y * y;
  float k = uWarp.x * uLens.w;
  float grow = 1.0 + k * w;
  float spread = 1.0 + k * (w - 6.0 * x * x * y * y);
  float theta = uWarp.y * uLens.w * w;
  vec2 turn = vec2(cos(theta), sin(theta));
  vec2 display = uLens.xy + vec2(turn.x * rel.x - turn.y * rel.y, turn.y * rel.x + turn.x * rel.y) * grow;
  float scale = sqrt(max(grow * spread, 0.02));

  float spark = 0.0;
  if (uSparkle > 0.0) {
    float phase = 0.5 + 0.5 * sin(uTime * (0.55 + aDot.w * 0.9) + aDot.z * 6.2831853);
    spark = pow(phase, 48.0) * step(0.72, fract(aDot.z * 7.31 + aDot.w * 3.17)) * uSparkle;
  }

  float pool = 0.0;
  if (uGlow.x > 0.0) {
    float g = length(display - uLens.xy) / uGlow.x;
    float q = clamp(1.0 - g * g, 0.0, 1.0);
    pool = q * q * uGlow.y * uLens.w;
  }

  float radius = uRadius * (1.0 + 0.7 * spark);
  float device = radius * scale * uPixel;
  float fade = 1.0;
  if (device < 0.75) {
    fade = device * device / 0.5625;
    radius = 0.75 / (scale * uPixel);
  }
  float blur = (1.0 - uFocus) * uCell * 0.42;
  float energy = pow(radius / (radius + blur), 1.15);
  float halo = pool * uGlow.z;
  float haloWidth = 2.0 + radius * 1.5;
  float pad = radius + blur * 1.2 + 1.5 / (scale * uPixel) + (halo > 0.0 ? haloWidth * 2.5 : 0.0);

  float t = clamp(dot(aDot.xy - center, uGradient.xy) / uGradient.z + 0.5, 0.0, 1.0);
  vec3 tone = blend(uFrom, uTo, t);
  vec3 deep = vec3(tone.x * 0.72, tone.yz * 1.3);
  vec3 base = toRgb(tone);
  float hueWave = aDot.x * 0.00135 + aDot.y * 0.00055 + uTime * 0.075 + sin(aDot.y * 0.0022 - uTime * 0.11) * 0.16;
  vec3 rgbWave = 0.5 + 0.5 * cos(6.2831853 * (hueWave + vec3(0.0, 0.333, 0.667)));
  rgbWave = mix(rgbWave, vec3(dot(rgbWave, vec3(0.299, 0.587, 0.114))), 0.18);
  vec3 lit = toRgb(mix(deep, uGlowColor.xyz, uGlowColor.w));
  vec3 color = mix(base, rgbWave, 0.78);
  color = mix(color, lit, clamp(pool, 0.0, 1.0) * 0.8);
  color = mix(color, uLight > 0.5 ? color * 0.6 : vec3(1.0), spark * 0.55);

  vLocal = corner * pad;
  vRadius = radius + blur;
  vBlur = blur * 0.7;
  vHalo = halo;
  vHaloWidth = haloWidth;
  vColor = color;
  float shade = clamp(1.0 - swell.z * 2.5, 0.4, 1.6);
  vAlpha = mix(min(uBase * shade, 1.0), 1.0, clamp(max(pool, spark), 0.0, 1.0)) * fade * energy * smoothstep(0.0, 0.25, uFocus + 0.08);
  vec2 point = display + corner * pad * scale;
  gl_Position = vec4(point.x / uSize.x * 2.0 - 1.0, 1.0 - point.y / uSize.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uOpacity;
in vec2 vLocal;
in float vRadius;
in float vBlur;
in float vHalo;
in float vHaloWidth;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
  float dist = length(vLocal);
  float d = dist - vRadius;
  float edge = max(fwidth(dist), 1e-4) + vBlur;
  float cover = 1.0 - smoothstep(-0.5 * edge, 0.5 * edge, d);
  float glow = vHalo * exp(-max(d, 0.0) / vHaloWidth) * 0.5;
  float alpha = min(cover + glow, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  fragColor = vec4(vColor * alpha, alpha);
}`;

const PATTERNS = Object.freeze({
  grid: "grid",
  hex: "hex",
  scatter: "scatter",
  spiral: "spiral"
});
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseColor = value => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return null;
};

const toLinear = channel => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));

const toOklab = color => {
  const [r, g, b] = color.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const toInk = (value, fallback, light) => {
  const lab = toOklab(parseColor(value) || fallback);
  if (!light) return lab;
  const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
  const ceiling = 0.6 + 0.16 * warmth * warmth * (3 - 2 * warmth);
  if (lab[0] <= ceiling) return lab;
  const boost = 1 + (lab[0] - ceiling) * 1.6;
  return [ceiling, lab[1] * boost, lab[2] * boost];
};

const chroma = value => {
  const lab = toOklab(parseColor(value) || [1, 1, 1]);
  return Math.hypot(lab[1], lab[2]);
};

const hash = (a, b, c) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const lensReach = (radius, strength, twist) => {
  let peak = 0;
  for (let index = 1; index < 48; index++) {
    const x = index / 48;
    const w = (1 - x * x) ** 3;
    const sigma = x * radius;
    const grow = 1 + strength * w;
    const theta = twist * w;
    peak = Math.max(peak, Math.hypot(sigma * (grow * Math.cos(theta) - 1), sigma * grow * Math.sin(theta)));
  }
  return peak;
};

const buildDots = (width, height, step, pattern, margin) => {
  const cx = width / 2;
  const cy = height / 2;
  const minX = -margin;
  const maxX = width + margin;
  const minY = -margin;
  const maxY = height + margin;
  const out = [];
  const push = (x, y, a, b) => {
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) out.push(x, y, a, b);
  };
  if (pattern === PATTERNS.spiral) {
    const spacing = step / Math.sqrt(Math.PI);
    const reach = Math.hypot(width / 2 + margin, height / 2 + margin);
    const count = Math.ceil((reach / spacing) ** 2);
    for (let index = 0; index < count; index++) {
      const r = spacing * Math.sqrt(index + 0.5);
      const angle = index * GOLDEN_ANGLE;
      push(cx + r * Math.cos(angle), cy + r * Math.sin(angle), hash(index, 0, 3), hash(index, 0, 4));
    }
  } else {
    const rowStep = pattern === PATTERNS.hex ? (step * Math.sqrt(3)) / 2 : step;
    const cols = Math.ceil((width / 2 + margin) / step) + 1;
    const rows = Math.ceil((height / 2 + margin) / rowStep) + 1;
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        let x = cx + col * step + (pattern === PATTERNS.hex && row & 1 ? step / 2 : 0);
        let y = cy + row * rowStep;
        if (pattern === PATTERNS.scatter) {
          x += (hash(col, row, 1) - 0.5) * step * 0.8;
          y += (hash(col, row, 2) - 0.5) * step * 0.8;
        }
        push(x, y, hash(col, row, 3), hash(col, row, 4));
      }
    }
  }
  return new Float32Array(out);
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const link = gl => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

  function createBackground(canvas) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
    if (!gl) { warn("WebGL2 unavailable; using the solid CSS background."); return () => {}; }
    const shader = link(gl);
    if (!shader) { warn("DotField shaders could not initialize; using the solid CSS background."); return () => {}; }
    const vao = gl.createVertexArray(), buffer = gl.createBuffer();
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(0, 1); gl.bindVertexArray(null);
    const size = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, inside: false, down: false };
    const lens = { x: 0, y: 0, vx: 0, vy: 0, presence: 0, zoom: 0, ready: false };
    let raf = 0, last = 0, time = Math.random() * 100, count = 0, layoutKey = "", disposed = false;
    const reduced = Boolean(userSettings.reduceMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    const settings = () => {
      const b = state.background;
      const radius = clamp(Number(b.dotRadius) || 1.5, .25, 12);
      const step = radius * 2 + clamp(Number(b.dotSpacing) || 14, 1, 200);
      const fromColor = parseColor(b.gradientFrom || b.dotColor || "#5227FF") || [0.32, .15, 1];
      const toColor = parseColor(b.gradientTo || b.accentColor || "#FF9FFC") || [1, .62, .99];
      const glow = parseColor(b.glowColor || "#ffffff") || [1,1,1];
      const angle = ((Number(b.gradientAngle) || 135) * Math.PI) / 180;
      return { radius, step, from: toInk(b.gradientFrom || b.dotColor || "#5227FF", [.32,.15,1], false), to: toInk(b.gradientTo || b.accentColor || "#FF9FFC",[1,.62,.99],false), glowColor: toInk(b.glowColor || "#ffffff",[1,1,1],false), glowWeight: 1,
        direction: [Math.sin(angle),-Math.cos(angle)], lensRadius: clamp(Number(b.cursorRadius)||240,20,2000), strength: clamp(Number(b.bulgeStrength ?? .6),-1,1), twist: (Number(b.twist)||0)*Math.PI/180,
        glowRadius: Math.max(0, Number(b.glowRadius)||160), glowIntensity: clamp(Number(b.glowIntensity ?? .8),0,2), base: clamp(Number(b.baseOpacity ?? .55),0,1), wave: clamp(Number(b.waveAmplitude)||0,0,60), sparkle: b.sparkle ? 1:0, speed: Math.max(0,Number(b.speed ?? 1)), opacity: 1, maxRatio: 2 };
    };
    const strengthOf = (s, zoom) => clamp((s.strength >= 0 ? s.strength * 1.2 : s.strength * .7) * (1 + zoom * .6), -.85, 1.45);
    const layout = () => {
      const s = settings();
      const reach = lensReach(s.lensRadius, strengthOf(s, 1), s.twist * 1.6);
      const margin = Math.ceil(reach + s.wave + s.step * 2);
      const area = (size.width + margin*2) * (size.height + margin*2);
      const step = Math.max(s.step, Math.sqrt(area / 120000));
      const key = `${size.width}|${size.height}|${step}|${margin}`;
      if (key === layoutKey) return; layoutKey = key;
      const data = buildDots(size.width, size.height, step, PATTERNS.grid, margin); count = data.length / 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(9000000 / Math.max(1, innerWidth * innerHeight)));
      canvas.width = Math.max(1, Math.round(innerWidth * ratio)); canvas.height = Math.max(1, Math.round(innerHeight * ratio));
      canvas.style.width = "100%"; canvas.style.height = "100%";
      size.width = innerWidth; size.height = innerHeight; size.ratio = canvas.width / Math.max(1, size.width); layoutKey = ""; layout(); wake();
    };
    const frame = now => {
      raf = 0; if (disposed) return;
      const s = settings(), dt = clamp((now-last)/1000 || 0, 0, .05); last = Math.max(last,now);
      if (!reduced) time += dt*s.speed;
      const tracking = pointer.inside;
      if (tracking && (!lens.ready || lens.presence < .01)) { lens.x=pointer.x; lens.y=pointer.y; lens.vx=lens.vy=0; lens.ready=true; }
      if (lens.ready) { const omega=18,f=1+2*dt*omega,oo=omega*omega,hoo=dt*oo,hhoo=dt*hoo,inv=1/(f+hhoo); const nx=(f*lens.x+dt*lens.vx+hhoo*pointer.x)*inv, ny=(f*lens.y+dt*lens.vy+hhoo*pointer.y)*inv; lens.vx=(lens.vx+hoo*(pointer.x-lens.x))*inv; lens.vy=(lens.vy+hoo*(pointer.y-lens.y))*inv; lens.x=nx; lens.y=ny; }
      const presenceTarget=tracking?1:0; lens.presence+=(presenceTarget-lens.presence)*(1-Math.exp(-dt/(tracking?.18:.4)));
      const zoomTarget=tracking&&pointer.down?1:0; lens.zoom+=(zoomTarget-lens.zoom)*(1-Math.exp(-dt/.14));
      const extent=Math.abs(size.width*s.direction[0])+Math.abs(size.height*s.direction[1]);
      gl.viewport(0,0,canvas.width,canvas.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(shader.program); gl.bindVertexArray(vao);
      const u=shader.uniforms;
      gl.uniform2f(u.uSize,size.width,size.height); gl.uniform1f(u.uPixel,size.ratio); gl.uniform1f(u.uRadius,s.radius); gl.uniform1f(u.uCell,s.step);
      gl.uniform4f(u.uLens,lens.x,lens.y,s.lensRadius*(1+lens.zoom*.12),presenceTarget ? lens.presence*lens.presence*(3-2*lens.presence) : lens.presence*lens.presence*(3-2*lens.presence));
      gl.uniform2f(u.uWarp,strengthOf(s,lens.zoom),s.twist*(1+lens.zoom*.6)); gl.uniform3f(u.uGlow,s.glowRadius*(1+lens.zoom*.1),s.glowIntensity*(1+lens.zoom*.25),1);
      gl.uniform3f(u.uFrom,...s.from); gl.uniform3f(u.uTo,...s.to); gl.uniform4f(u.uGlowColor,...s.glowColor,s.glowWeight); gl.uniform3f(u.uGradient,s.direction[0],s.direction[1],Math.max(extent,1));
      gl.uniform1f(u.uTime,time); gl.uniform1f(u.uWave,s.wave); gl.uniform1f(u.uSparkle,s.sparkle); gl.uniform1f(u.uFocus,1); gl.uniform1f(u.uBase,s.base); gl.uniform1f(u.uLight,0); gl.uniform1f(u.uOpacity,s.opacity);
      if (count) gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,count);
      const moving=Math.abs(pointer.x-lens.x)+Math.abs(pointer.y-lens.y)>.05 || Math.hypot(lens.vx,lens.vy)>.5;
      const settling=Math.abs((tracking?1:0)-lens.presence)>.002 || Math.abs(zoomTarget-lens.zoom)>.002 || (lens.presence>.002&&moving);
      if (!reduced && s.speed>0 && (s.wave>0||s.sparkle>0) || settling) raf=requestAnimationFrame(frame);
    };
    function wake(){ if (!raf&&!disposed&&document.visibilityState!="hidden") { last=performance.now(); raf=requestAnimationFrame(frame); } }
    const locate = e => { const r=canvas.getBoundingClientRect(); pointer.x=e.clientX-r.left; pointer.y=e.clientY-r.top; pointer.inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; };
    const move=e=>{locate(e);wake();}, down=e=>{locate(e);pointer.down=pointer.inside;wake();}, up=()=>{pointer.down=false;wake();}, leave=()=>{pointer.inside=false;pointer.down=false;wake();};
    addEventListener("resize",resize); addEventListener("pointermove",move,{passive:true}); addEventListener("pointerdown",down,{passive:true}); addEventListener("pointerup",up,{passive:true}); addEventListener("pointercancel",up,{passive:true}); document.documentElement.addEventListener("pointerleave",leave);
    resize(); log("DotField WebGL background initialized.");
    return () => { disposed=true; cancelAnimationFrame(raf); removeEventListener("resize",resize); removeEventListener("pointermove",move); removeEventListener("pointerdown",down); removeEventListener("pointerup",up); removeEventListener("pointercancel",up); document.documentElement.removeEventListener("pointerleave",leave); if(!gl.isContextLost()){gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteProgram(shader.program);} };
  }

  const BROADCAST_CACHE_KEY="lunara-broadcast-cache-v1";
  function ensureBroadcastBanner(){
    let b=document.getElementById("gd-broadcast-banner");
    if(!b){
      b=document.createElement("aside");b.id="gd-broadcast-banner";b.className="gd-broadcast-banner";b.setAttribute("role","status");b.setAttribute("aria-live","polite");
      b.innerHTML=`<span class="gd-broadcast-signal" aria-hidden="true"></span><div class="gd-broadcast-copy"><div class="gd-broadcast-meta"><div class="gd-broadcast-label">Lunara broadcast</div><div class="gd-broadcast-sender" data-broadcast-sender></div></div><div class="gd-broadcast-message" data-broadcast-copy></div><div class="gd-broadcast-remaining" data-broadcast-remaining></div></div>`;
      document.body.appendChild(b);
    }
    return b;
  }
  function stopBroadcastTyping(){for(const timer of broadcastTypingTimers)clearTimeout(timer);broadcastTypingTimers=[];}
  function animateBroadcastText(msg,b){
    stopBroadcastTyping();
    const target=b.querySelector("[data-broadcast-copy]");if(!target)return;
    target.replaceChildren();
    Array.from(msg).forEach((ch,i)=>{
      const el=document.createElement("span");el.className="gd-broadcast-char";el.textContent=ch;el.style.setProperty("--char-tilt",`${((i%5)-2)*9}deg`);target.appendChild(el);
      const timer=window.setTimeout(()=>{if(!el.isConnected)return;el.classList.add("typed");playUiSound("broadcast-letter");},200+i*30);
      broadcastTypingTimers.push(timer);
    });
  }
  function formatBroadcastRemaining(ms){
    const seconds=Math.max(0,Math.ceil(ms/1000));
    if(seconds>=86400)return `${Math.floor(seconds/86400)}d ${Math.floor(seconds%86400/3600)}h remaining`;
    if(seconds>=3600)return `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m remaining`;
    return `${Math.floor(seconds/60)}m ${String(seconds%60).padStart(2,"0")}s remaining`;
  }
  function updateBroadcastCountdown(){
    if(!broadcastState)return;
    const remaining=Number(broadcastState.expiresAt)-Date.now();
    if(remaining<=0){applyBroadcast(null);return;}
    const label=document.querySelector("#gd-broadcast-banner [data-broadcast-remaining]");
    if(label)label.textContent=formatBroadcastRemaining(remaining);
  }
  function applyBroadcast(v,{notify=false}={}){
    const next=v&&typeof v.message==="string"&&Number(v.expiresAt)>Date.now()?v:null;
    const previousId=broadcastState?.id||lastBroadcastSoundId;
    broadcastState=next;
    const banner=ensureBroadcastBanner();
    if(next){
      if(broadcastSafeAreaTimer){clearTimeout(broadcastSafeAreaTimer);broadcastSafeAreaTimer=null;}
      document.body?.classList.add("gd-broadcast-active");
      const changed=Boolean(next.id&&next.id!==previousId);
      banner.classList.add("visible");
      const sender=banner.querySelector("[data-broadcast-sender]");
      if(sender)sender.innerHTML=`by ${renderPlayFabName(String(next.sender||"Lunara staff").slice(0,80))}`;
      if(changed&&notify){
        lastBroadcastSoundId=next.id;
        playUiSound("notification",true);
        animateBroadcastText(next.message,banner);
        showTabNotification("Lunara announcement");
      }else{
        if(!banner.querySelector("[data-broadcast-copy]")?.textContent)banner.querySelector("[data-broadcast-copy]").textContent=next.message;
        if(next.id)lastBroadcastSoundId=next.id;
      }
      try{localStorage.setItem(BROADCAST_CACHE_KEY,JSON.stringify(next));}catch{}
      updateBroadcastCountdown();
      if(!broadcastCountdownTimer)broadcastCountdownTimer=window.setInterval(updateBroadcastCountdown,1000);
    }else{
      stopBroadcastTyping();banner.classList.remove("visible");
      if(broadcastSafeAreaTimer)clearTimeout(broadcastSafeAreaTimer);
      broadcastSafeAreaTimer=window.setTimeout(()=>{if(!broadcastState)document.body?.classList.remove("gd-broadcast-active");broadcastSafeAreaTimer=null;},520);
      if(broadcastCountdownTimer){clearInterval(broadcastCountdownTimer);broadcastCountdownTimer=null;}
      const text=banner.querySelector("[data-broadcast-copy]");if(text)text.replaceChildren();
      const remaining=banner.querySelector("[data-broadcast-remaining]");if(remaining)remaining.textContent="";
      try{localStorage.removeItem(BROADCAST_CACHE_KEY);}catch{}
    }
  }
  function loadCachedBroadcast(){try{applyBroadcast(JSON.parse(localStorage.getItem(BROADCAST_CACHE_KEY)||"null"));}catch{applyBroadcast(null);}}

  function syncBroadcastButton(){
    const button=root?.querySelector('#gd-header-actions [data-nav="broadcast"]');
    if(button)button.hidden=!broadcastCanPost;
  }

  function syncModerationButton(){
    const menu=root?.querySelector('#gd-header-actions [data-menu-pop]');
    if(!menu)return;
    let button=menu.querySelector('[data-nav="moderation"]');
    if(moderationCanUse&&!button){
      button=document.createElement("button");
      button.className="gd-btn gd-nav-btn";
      button.type="button";
      button.dataset.nav="moderation";
      button.innerHTML=`<svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line" d="M10 2.2 16 4v4.8c0 4-2.4 7-6 9-3.6-2-6-5-6-9V4l6-1.8Z"/><path class="line" d="m7.1 9.8 1.9 1.9 4-4.1"/></svg><span>Moderation</span>`;
      const settings=menu.querySelector("[data-settings-open]");
      menu.insertBefore(button,settings||menu.querySelector(".gd-broadcast-panel"));
    }else if(!moderationCanUse&&button)button.remove();
  }

  function ownsBroadcastItem(inventory){
    const items=Array.isArray(inventory?.Inventory)?inventory.Inventory:[];
    return items.some(item=>{
      const itemId=String(item?.ItemId??item?.ItemID??"").trim().toUpperCase();
      const catalog=String(item?.CatalogVersion??"").trim();
      const displayName=String(item?.DisplayName??"").trim();
      return itemId==="BR"&&(!catalog||catalog.toLowerCase()==="lunara")&&(!displayName||displayName==="BR");
    });
  }

  function ownsModeratorItem(inventory){
    const items=Array.isArray(inventory?.Inventory)?inventory.Inventory:[];
    return items.some(item=>{
      const itemId=String(item?.ItemId??item?.ItemID??"").trim().toUpperCase();
      const catalog=String(item?.CatalogVersion??"").trim();
      const displayName=String(item?.DisplayName??"").trim();
      return itemId==="MD"&&(!catalog||catalog.toLowerCase()==="lunara")&&(!displayName||displayName.toUpperCase()==="MD");
    });
  }

  async function refreshBroadcast({notify=true}={}) {
    if (broadcastCheckInFlight) return;
    broadcastCheckInFlight = true;
    const titleId = String(CONFIG.playFab.titleId || "").trim();
    try {
      if (!titleId || titleId === "YOUR_PLAYFAB_TITLE_ID") return;
      if (currentUser?.playFabId && Date.now() - broadcastPermissionCheckedAt > 60000) {
        const wasAllowed = broadcastCanPost;
        const wasModerator = moderationCanUse;
        try {
          const inventory = await socialCall("GetUserInventory");
          broadcastCanPost = ownsBroadcastItem(inventory);
          moderationCanUse = ownsModeratorItem(inventory);
          broadcastPermissionError = broadcastCanPost ? "" : "No matching BR item was found in this account's inventory.";
          broadcastPermissionCheckedAt = Date.now();
          if (!broadcastCanPost) {
            const itemRecords=(Array.isArray(inventory?.Inventory)?inventory.Inventory:[]).map(item=>({
              ItemId:item?.ItemId??item?.ItemID??"(missing)",
              CatalogVersion:item?.CatalogVersion??"(missing)",
              DisplayName:item?.DisplayName??"(missing)"
            }));
            warn("Broadcast entitlement check found no matching Lunara/BR item. Inventory records:", itemRecords);
          }
        } catch (err) {
          broadcastCanPost = false;
          moderationCanUse = false;
          broadcastPermissionError = publicText(err.message || "Could not check your inventory.");
          broadcastPermissionCheckedAt = Date.now() - 45000;
          warn("Could not check broadcast item ownership:", err);
        }
        if (wasAllowed !== broadcastCanPost) syncBroadcastButton();
        if (wasModerator && !moderationCanUse) closeModerationPanel();
        if (wasModerator !== moderationCanUse) syncModerationButton();
      }
      if (currentUser?.playFabId) {
        try {
          const result = await socialCloudScript("GetLunaraBroadcast");
          if (result?.moderation?.success) applyModerationStatus(result.moderation);
          const incoming = result?.broadcast;
          const currentIsActive = broadcastState && Number(broadcastState.expiresAt) > Date.now();
          const incomingIsActive = incoming && Number(incoming.expiresAt) > Date.now();
          if (incomingIsActive) {
            if (!currentIsActive || Number(incoming.sentAt || 0) >= Number(broadcastState.sentAt || 0)) {
              applyBroadcast(incoming, { notify });
            } else updateBroadcastCountdown();
          } else if (!currentIsActive) applyBroadcast(null);
          else updateBroadcastCountdown();
        } catch (err) {
          if (isPlayFabAccountBanned(err)) showAuthGate(playFabBanSignInMessage());
          else warn("Broadcast feed refresh failed:", err);
        }
      }
    } finally { broadcastCheckInFlight = false; }
  }

  function startBroadcastPolling(){loadCachedBroadcast();if(broadcastPollTimer)clearInterval(broadcastPollTimer);void refreshBroadcast({notify:false});broadcastPollTimer=window.setInterval(()=>{if(!document.hidden)void refreshBroadcast();},5000);}
  async function publishBroadcast(btn){const p=btn.closest(".gd-broadcast-panel"),i=p?.querySelector("[data-broadcast-message]"),d=p?.querySelector("[data-broadcast-duration]"),st=p?.querySelector("[data-broadcast-status]"),message=String(i?.value||"").trim(),durationMinutes=Number(d?.value);if(!message){if(st)st.textContent="Enter a message first.";return;}if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>10080){if(st)st.textContent="Choose a duration from 1 to 10,080 minutes.";return;}btn.disabled=true;if(st)st.textContent="Publishing…";try{const r=await socialCloudScript("SendLunaraBroadcast",{message,durationMinutes});if(!r?.success)throw Error(r?.message||"Broadcast was not published.");i.value="";applyBroadcast(r.broadcast,{notify:true});if(st)st.textContent="Broadcast is live for everyone.";showTabNotification("Broadcast published");}catch(e){if(st)st.textContent=publicText(e.message||"Could not publish broadcast.");}finally{btn.disabled=false;}}

  function ensureRoot() {
    document.getElementById("library-root")?.remove();
    const root = document.createElement("div");
    root.id = "library-root";
    root.innerHTML = `<canvas id="gd-bg-canvas" aria-hidden="true"></canvas><div class="gd-shell">
      <header class="gd-top"><div class="gd-top-left"><div class="gd-brand"></div><div class="gd-user-profile" id="gd-user-profile" hidden></div></div><div class="gd-actions" id="gd-header-actions"></div></header>
      <div class="gd-section-head"><h2 id="gd-games-heading"></h2><span id="gd-count"></span></div>
      <section id="gd-games" class="gd-games"></section>
    </div>`;
    document.body.appendChild(root);
    return root;
  }

  async function refreshGameDatabase() {
    if (gameDatabaseInFlight) return;
    gameDatabaseInFlight = true;
    try {
      const source = String(CONFIG.gameDatabase?.url || "").trim();
      if (!/^https:\/\//i.test(source) || /YOUR_USERNAME|YOUR_REPOSITORY/i.test(source)) {
        throw new Error("Set CONFIG.gameDatabase.url to the hosted HTTPS URL of games.json.");
      }
      const response = await fetch(source, { cache: "no-store", credentials: "omit" });
      if (!response.ok) throw new Error(`The game database returned HTTP ${response.status}.`);
      const payload = await response.json();
      const entries = Array.isArray(payload) ? payload : payload?.games;
      if (!Array.isArray(entries)) throw new Error("The JSON file must contain a games array.");
      const games = entries.filter(game => game && typeof game === "object" && !Array.isArray(game)).map(game => ({
        ...game,
        title: String(game.title || "Untitled game"),
        description: String(game.description || ""),
        url: String(game.url || ""),
        category: String(game.category || "games"),
        mode: ["redirect", "iframe", "raw", "raw-html"].includes(game.mode) ? game.mode : "redirect"
      }));
      const changed = JSON.stringify(state.games) !== JSON.stringify(games);
      const shouldRender = changed || !gameDatabaseLoaded || Boolean(gameDatabaseError);
      state.games = games;
      gameDatabaseLoaded = true;
      gameDatabaseError = "";
      if (shouldRender && root && currentMainPage === "games") render();
    } catch (err) {
      const message = err?.message || "Could not load the game database.";
      if (gameDatabaseError !== message) warn("Game database refresh failed:", err);
      gameDatabaseError = message;
      gameDatabaseLoaded = true;
      if (!state.games.length && root && currentMainPage === "games") render();
    } finally {
      gameDatabaseInFlight = false;
    }
  }

  function startGameDatabasePolling() {
    if (gameDatabaseTimer) clearInterval(gameDatabaseTimer);
    void refreshGameDatabase();
    const interval = Math.max(15000, Number(CONFIG.gameDatabase?.refreshMs) || 60000);
    gameDatabaseTimer = window.setInterval(() => {
      if (!document.hidden) void refreshGameDatabase();
    }, interval);
  }

  function render() {
    if (!root || !root.isConnected) return;
    root.style.setProperty("--gd-bg", state.colors.background || state.background.color);
    root.style.setProperty("--gd-dot", state.background.dotColor);
    root.style.setProperty("--gd-accent", state.colors.accent || state.background.accentColor);
    root.querySelector(".gd-brand").innerHTML = `<svg class="gd-brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path class="gd-mark-star" d="m23.8 5.2 1.1 3 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3-1.1 3-1.1 1.1-3Z"/></svg><span>${esc(state.labels.brand)}</span>`;
    const profile = root.querySelector("#gd-user-profile");
    if (currentUser) {
      profile.hidden = false;
      profile.innerHTML = `<span class="gd-user-display">${renderPlayFabName(currentUser.displayName || currentUser.username)}</span><span class="gd-user-name">@${renderPlayFabName(currentUser.username)}</span>`;
      profile.title = currentUser.playFabId ? `Account ID: ${currentUser.playFabId}` : "Signed in";
    } else {
      profile.hidden = true;
      profile.replaceChildren();
      profile.removeAttribute("title");
    }
    document.title = temporarySocialTitle || state.title;
    root.querySelector("#gd-games-heading").textContent = state.labels.gamesHeading;
    root.classList.toggle("gd-reduced-motion", userSettings.reduceMotion);
    const count = root.querySelector("#gd-count");
    count.textContent = `${state.games.length} ${state.games.length === 1 ? state.labels.countSingular : state.labels.countPlural}`;
    count.hidden = !state.layout.showGameCount;
    const actions = root.querySelector("#gd-header-actions");
    actions.innerHTML = `<button class="gd-btn gd-nav-btn" type="button" data-nav="games"><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect class="fill" x="2.5" y="2.5" width="6" height="6" rx="1.5"/><rect class="fill" x="11.5" y="2.5" width="6" height="6" rx="1.5"/><rect class="fill" x="2.5" y="11.5" width="6" height="6" rx="1.5"/><rect class="fill" x="11.5" y="11.5" width="6" height="6" rx="1.5"/></svg><span>${esc(state.labels.navGames)}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="friends"><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true"><circle class="line" cx="7" cy="7" r="3"/><path class="line" d="M1.8 17c.3-3 2.1-4.5 5.2-4.5s4.9 1.5 5.2 4.5m1.2-12.7a3 3 0 0 1 0 5.8m1.2 2.6c2.1.6 3.2 2 3.5 4.3"/></svg><span>${esc(state.labels.navFriends || "Friends")}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="stock"><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line" d="M2.5 16.5h15M4.5 12V8m-2 2h4m4 4V5m-2 5h4m4-4V3m-2 2h4M3 7l4-2 4 3 5-5"/></svg><span>${esc(state.labels.navStock)}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="ai"><svg class="gd-nav-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="fill" d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path class="fill" d="m23.8 4.2 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/><path class="line" d="M19.5 20.5h4v-3h3m-3 3v4m3-7v-3"/><circle class="fill" cx="26.5" cy="17.5" r="1.4"/><circle class="fill" cx="23.5" cy="24.5" r="1.4"/><circle class="fill" cx="26.5" cy="13.5" r="1.4"/></svg><span>${esc(state.labels.navAI)}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="suggest"><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line" d="M6.4 7h7.2a3.6 3.6 0 0 1 3.5 2.8l.8 3.6a2 2 0 0 1-3.2 2l-2.1-1.6H7.4l-2.1 1.6a2 2 0 0 1-3.2-2l.8-3.6A3.6 3.6 0 0 1 6.4 7Z"/><path class="line" d="M6 9.5v3m-1.5-1.5h3m5.5-.5h.01m2 2h.01"/></svg><span>${esc(state.labels.navSuggestGame)}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="report"><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line" d="M7 6.5 5 4m8 2.5L15 4M5.5 9H2.8m11.7 0h2.7M5.5 12H2.8m11.7 0h2.7M7 13.5 5 16m8-2.5 2 2.5"/><path class="line" d="M10 5.2c-2.5 0-4.2 1.7-4.2 4.2v3.1c0 2.4 1.7 4.1 4.2 4.1s4.2-1.7 4.2-4.1V9.4c0-2.5-1.7-4.2-4.2-4.2Z"/><path class="line" d="M10 2.5v2.4m0 3.5v.01"/></svg><span>${esc(state.labels.navReportBug)}</span></button><button class="gd-btn gd-nav-btn" type="button" data-nav="broadcast" ${broadcastCanPost?"":"hidden"}><svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true"><path class="line" d="M3 8v4h3l7 4V4L6 8H3Zm10 1a3 3 0 0 1 0 2m-5 2 1.5 3"/><path class="line" d="M15 6.5a5.5 5.5 0 0 1 0 7"/></svg><span>Broadcast</span></button>`;
    actions.querySelector('[data-nav="ai"]')?.remove();
    const navItems = [...actions.querySelectorAll(".gd-nav-btn")];
    const settingsButton = document.createElement("button");
    settingsButton.className = "gd-btn gd-nav-btn";
    settingsButton.type = "button";
    settingsButton.dataset.settingsOpen = "true";
    settingsButton.innerHTML = `<svg class="gd-nav-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line" d="M8.3 2.5h3.4l.5 2a5.8 5.8 0 0 1 1.2.7l2-.6 1.7 2.9-1.5 1.4a6 6 0 0 1 0 1.4l1.5 1.4-1.7 2.9-2-.6a5.8 5.8 0 0 1-1.2.7l-.5 2H8.3l-.5-2a5.8 5.8 0 0 1-1.2-.7l-2 .6-1.7-2.9 1.5-1.4a6 6 0 0 1 0-1.4L2.9 7.5l1.7-2.9 2 .6a5.8 5.8 0 0 1 1.2-.7l.5-2Z"/><circle class="line" cx="10" cy="10" r="2.3"/></svg><span>Settings</span>`;
    navItems.push(settingsButton);
    actions.innerHTML = `<div class="gd-menu-wrap"><button class="gd-menu-toggle" type="button" data-menu-toggle aria-label="Open navigation" aria-expanded="false"><span class="gd-burger-lines" aria-hidden="true"><i></i><i></i><i></i></span><span class="gd-menu-badge" data-menu-badge hidden></span></button><nav class="gd-menu-pop" data-menu-pop aria-label="Lunara navigation"><div class="gd-social-menu-summary" data-social-menu-summary></div></nav></div>`;
    const menuWrap = actions.querySelector(".gd-menu-wrap");
    const menu = actions.querySelector("[data-menu-pop]");
    const menuSummary = menu.querySelector("[data-social-menu-summary]");
    navItems.forEach(item => menu.appendChild(item));
    const bp=document.createElement("section");bp.className="gd-broadcast-panel";bp.hidden=true;bp.innerHTML=`<strong>Broadcast to everyone</strong><textarea data-broadcast-message maxlength="400" placeholder="Write an announcement…"></textarea><label><small>Show for (minutes)</small><input data-broadcast-duration type="number" min="1" max="10080" value="60"></label><small data-broadcast-status role="status"></small><button class="gd-btn primary" type="button" data-broadcast-send>Publish broadcast</button>`;menu.appendChild(bp);
    menu.prepend(menuSummary);
    syncModerationButton();
    const badge = actions.querySelector("[data-menu-badge]");
    const notificationCount = socialSnapshot.unread + socialSnapshot.requests;
    badge.textContent = notificationCount > 99 ? "99+" : String(notificationCount);
    badge.hidden = notificationCount === 0;
    menuSummary.textContent = `${socialSnapshot.online} online · ${socialSnapshot.unread} missed · ${socialSnapshot.requests} requests`;
    if (!menuWrap) warn("Navigation menu could not be initialized.");

    const games = root.querySelector("#gd-games");
    if (!state.games.length) {
      const emptyText = !gameDatabaseLoaded ? "Loading games…" : (gameDatabaseError ? "Could not load games. Check the game database URL in CONFIG." : state.labels.emptyMessage);
      games.innerHTML = `<div class="gd-empty">${esc(emptyText)}</div>`;
    } else {
      games.innerHTML = state.games.map((game, i) => `
        <article class="gd-game" style="--gd-index:${i}">
          <div class="gd-tag">${esc(game.category || "Game")}</div>
          <h3>${esc(game.title || "Untitled game")}</h3>
          <p>${esc(game.description || "")}</p>
          <button class="gd-btn primary" data-launch="${i}">${esc(game.buttonText || state.labels.launchButton)}</button>
        </article>`).join("");
    }
    queueGameCardSounds();
    if (stopBackground) stopBackground();
    const canvas = root.querySelector("#gd-bg-canvas");
    canvas.hidden = !state.background.enabled;
    stopBackground = state.background.enabled ? createBackground(canvas) : null;
  }

  function showGamesPage() {
    if (!root) return;
    if (stockRefreshTimer) { clearInterval(stockRefreshTimer); stockRefreshTimer = null; }
    currentMainPage = "games";
    root.classList.remove("gd-stock-active");
    const content = root.querySelector("#gd-games");
    if (content) content.className = "gd-games";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showStockStatus(message, kind = "") {
    const status = root?.querySelector("[data-stock-status]");
    if (!status) return;
    status.textContent = publicText(message);
    status.className = `gd-stock-status${kind ? ` ${kind}` : ""}`;
  }

  function showStockPage() {
    if (!root) return;
    currentMainPage = "stock";
    root.classList.add("gd-stock-active");
    if (stockRefreshTimer) clearInterval(stockRefreshTimer);
    const heading = root.querySelector("#gd-games-heading");
    const count = root.querySelector("#gd-count");
    const content = root.querySelector("#gd-games");
    heading.textContent = "Paper Trading";
    count.hidden = true;
    content.className = "gd-stock-page";
    stockCardSymbols = "";
    content.innerHTML = `<div class="gd-stock-hero"><section class="gd-stock-cash-card"><span>Available cash</span><strong data-stock-cash>Loading…</strong><small>Account currency · ${STOCK_CURRENCY_CODE}</small></section></div><div class="gd-stock-summary"><div class="gd-stock-summary-card"><span>Portfolio value</span><strong data-stock-equity>—</strong></div><div class="gd-stock-summary-card"><span>Total account value</span><strong data-stock-total>—</strong></div><div class="gd-stock-summary-card"><span>Next price update</span><strong data-stock-updated>Connecting…</strong></div></div><section class="gd-stock-leaderboard" aria-label="Top five paper traders"><div class="gd-stock-leaderboard-head"><strong>Top 5 Traders</strong><span>Ranked by total account value</span></div><ol class="gd-stock-leaderboard-list" data-stock-leaderboard><li class="gd-stock-leaderboard-empty">Loading leaderboard…</li></ol></section><div class="gd-stock-cards" data-stock-cards><div class="gd-empty">Connecting to the market…</div></div><div class="gd-stock-info-panel"><div class="gd-stock-status" data-stock-status role="status">Loading your paper trading account…</div><p class="gd-stock-footnote">Paper trading only. These simulated prices are not real market data. Orders use whole shares and account currency (${STOCK_CURRENCY_CODE}).</p></div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    void refreshStockData();
    stockRefreshTimer = window.setInterval(() => {
      if (currentMainPage === "stock" && !document.hidden) void refreshStockData();
    }, STOCK_REFRESH_MS);
  }

  function stockMoney(value) {
    const amount = Number(value);
    return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function stockChartPaths(history) {
    const points = (Array.isArray(history) ? history : []).filter(point => point && Number.isFinite(Number(point.price)));
    const values = points.map(point => Number(point.price));
    if (values.length < 2) return { line: "M10 64 L590 64", area: "M10 110 L10 64 L590 64 L590 110 Z", bars: "" };
    const left = 10, width = 580, baseline = 148;
    const min = Math.min(...values), max = Math.max(...values), span = Math.max(0.01, max - min);
    const coords = values.map((value, index) => `${(left + index / (values.length - 1) * width).toFixed(2)},${(104 - ((value - min) / span) * 80).toFixed(2)}`);
    const deltas = values.slice(1).map((value, index) => ((value - values[index]) / Math.max(0.01, values[index])) * 100);
    const maxDelta = Math.max(0.05, ...deltas.map(delta => Math.abs(delta)));
    const barWidth = Math.max(3, Math.min(14, width / (values.length - 1) * 0.58));
    const bars = deltas.map((delta, index) => {
      const height = Math.max(3, Math.abs(delta) / maxDelta * 34);
      const x = left + ((index + 1) / (values.length - 1)) * width - barWidth / 2;
      const y = delta > 0 ? baseline - height : baseline;
      const type = delta > 0 ? "positive" : delta < 0 ? "negative" : "flat";
      return `<rect class="bar ${type}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}"><title>${delta > 0 ? "+" : ""}${delta.toFixed(2)}% change</title></rect>`;
    }).join("");
    return { line: `M${coords.join(" L")}`, area: `M${coords[0]} L${coords.slice(1).join(" L")} L590 110 L10 110 Z`, bars };
  }

  function renderStockLeaderboard(entries) {
    const list = root?.querySelector("[data-stock-leaderboard]");
    if (!list) return;
    if (!Array.isArray(entries)) {
      list.innerHTML = `<li class="gd-stock-leaderboard-empty">Leaderboard unavailable. Update the stock service handlers.</li>`;
      return;
    }
    if (!entries.length) {
      list.innerHTML = `<li class="gd-stock-leaderboard-empty">No traders ranked yet.</li>`;
      return;
    }
    list.innerHTML = entries.slice(0, 5).map((entry, index) => {
      const position = Number(entry.Position);
      const rank = Number.isFinite(position) ? position + 1 : index + 1;
      const name = String(entry.DisplayName || entry.Profile?.DisplayName || "").trim() || "Player";
      const value = Number(entry.StatValue) || 0;
      return `<li class="gd-stock-leaderboard-row"><span class="gd-stock-leaderboard-rank">#${rank}</span><span class="gd-stock-leaderboard-name">${renderPlayFabName(name)}</span><strong class="gd-stock-leaderboard-value">${stockMoney(value)}</strong></li>`;
    }).join("");
  }

  function renderStockCards(data) {
    const market = data?.market;
    const stocks = Array.isArray(market?.stocks) ? market.stocks : [];
    const cards = root?.querySelector("[data-stock-cards]");
    if (!cards) return;
    renderStockLeaderboard(data?.leaderboard);
    if (!stocks.length) {
      cards.innerHTML = `<div class="gd-empty">The market has no listed stocks yet.</div>`;
      stockCardSymbols = "";
      return;
    }
    const symbols = stocks.map(stock => stock.symbol).join("|");
    if (stockCardSymbols !== symbols) {
      stockCardSymbols = symbols;
      cards.innerHTML = stocks.map((stock, index) => `<article class="gd-stock-card" data-stock-card="${esc(stock.symbol)}" style="animation-delay:${Math.min(index * 45, 360)}ms"><div class="gd-stock-card-top"><div class="gd-stock-identity"><div class="gd-stock-monogram">${esc(stock.symbol)}</div><div class="gd-stock-name"><strong>${esc(stock.name)}</strong><span>${esc(stock.company || "Lunara listed company")}</span></div></div><div class="gd-stock-price"><strong data-stock-price>—</strong><span class="gd-stock-change" data-stock-change>—</span></div></div><div class="gd-stock-chart-key"><span><i></i>Price</span><span><i class="up"></i>Up</span><span><i class="down"></i>Down</span></div><svg class="gd-stock-chart" viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="${esc(stock.symbol)} price history and movement bars"><path class="grid" d="M10 24H590 M10 64H590 M10 104H590 M10 148H590"/><path class="area" data-stock-area></path><path class="line" data-stock-line></path><path class="baseline" d="M10 148H590"/><g data-stock-bars></g></svg><div class="gd-stock-position"><span>Owned <strong data-stock-shares>0</strong> shares</span><span>Position <strong data-stock-position>$0.00</strong></span></div><div class="gd-stock-order"><input class="gd-stock-qty" type="number" min="1" max="1000" step="1" value="1" aria-label="Number of ${esc(stock.symbol)} shares" data-stock-qty><button class="gd-btn primary" type="button" data-stock-side="buy" data-stock-symbol="${esc(stock.symbol)}">Buy</button><button class="gd-btn" type="button" data-stock-side="sell" data-stock-symbol="${esc(stock.symbol)}">Sell</button></div></article>`).join("");
    }
    const holdings = data.portfolio?.holdings || {};
    let portfolioValue = 0;
    for (const stock of stocks) {
      const card = cards.querySelector(`[data-stock-card="${CSS.escape(stock.symbol)}"]`);
      if (!card) continue;
      const price = Number(stock.price) || 0;
      const previous = Number(stock.previousPrice) || price;
      const changePercent = previous ? ((price - previous) / previous) * 100 : 0;
      const shares = Math.max(0, Number(holdings[stock.symbol]) || 0);
      const positionValue = shares * price;
      portfolioValue += positionValue;
      card.querySelector("[data-stock-price]").textContent = stockMoney(price);
      const change = card.querySelector("[data-stock-change]");
      change.textContent = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
      change.classList.toggle("positive", changePercent >= 0);
      change.classList.toggle("negative", changePercent < 0);
      card.querySelector("[data-stock-shares]").textContent = String(shares);
      card.querySelector("[data-stock-position]").textContent = stockMoney(positionValue);
      const paths = stockChartPaths(stock.history);
      card.querySelector("[data-stock-line]").setAttribute("d", paths.line);
      card.querySelector("[data-stock-area]").setAttribute("d", paths.area);
      card.querySelector("[data-stock-bars]").innerHTML = paths.bars;
    }
    const balance = Number(data.balance) || 0;
    const cash = root.querySelector("[data-stock-cash]");
    const equity = root.querySelector("[data-stock-equity]");
    const total = root.querySelector("[data-stock-total]");
    if (cash) cash.textContent = stockMoney(balance);
    if (equity) equity.textContent = stockMoney(portfolioValue);
    if (total) total.textContent = stockMoney(balance + portfolioValue);
    stockNextUpdateAt = Number(market.nextUpdateAt) || ((Math.floor(Date.now() / STOCK_TICK_MS) + 1) * STOCK_TICK_MS);
    const nextUpdate = root.querySelector("[data-stock-updated]");
    if (nextUpdate) {
      const localTime = new Date(stockNextUpdateAt);
      nextUpdate.textContent = `${localTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })} local`;
      nextUpdate.title = localTime.toLocaleString();
    }
  }

  async function refreshStockData() {
    if (currentMainPage !== "stock" || stockFetchInFlight || stockTradeInFlight) return;
    stockFetchInFlight = true;
    try {
      const data = await socialCloudScript("GetLunaraStockMarket");
      if (currentMainPage !== "stock" || !root?.isConnected) return;
      stockMarketData = data;
      renderStockCards(data);
      if (!root.querySelector("[data-stock-status]")?.classList.contains("success")) {
        showStockStatus("Connected. Prices and cash sync automatically.");
      }
    } catch (err) {
      if (currentMainPage === "stock") showStockStatus(`Could not load the paper market: ${publicText(err.message || "Market request failed.")} Publish the Lunara market handlers, then retry.`, "error");
    } finally {
      stockFetchInFlight = false;
    }
  }

  async function submitStockTrade(button) {
    if (stockTradeInFlight || currentMainPage !== "stock") return;
    const card = button.closest("[data-stock-card]");
    const quantity = Number(card?.querySelector("[data-stock-qty]")?.value);
    const symbol = button.dataset.stockSymbol;
    const side = button.dataset.stockSide;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      showStockStatus("Choose a whole-share quantity from 1 to 1,000.", "error");
      return;
    }
    stockTradeInFlight = true;
    root.querySelectorAll("[data-stock-side]").forEach(control => { control.disabled = true; });
    showStockStatus(`${side === "buy" ? "Buying" : "Selling"} ${quantity} ${symbol} share${quantity === 1 ? "" : "s"}…`);
    try {
      const result = await socialCloudScript("TradeLunaraStock", { symbol, side, quantity });
      stockMarketData = result;
      renderStockCards(result);
      showStockStatus(`${side === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol} share${quantity === 1 ? "" : "s"} at ${stockMoney(result.tradePrice)} per share.`, "success");
      playUiSound("notification");
    } catch (err) {
      showStockStatus(err.message || "The order could not be completed.", "error");
    } finally {
      stockTradeInFlight = false;
      root?.querySelectorAll("[data-stock-side]").forEach(control => { control.disabled = false; });
    }
  }

  function openAboutBlank(title) {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      alert("The new tab was blocked. Allow pop-ups for this site and try again.");
      return null;
    }
    try {
      tab.document.title = title || "Game";
      tab.document.body.style.margin = "0";
      tab.document.body.style.background = "#000";
    } catch (err) { warn("Could not initialize the new tab:", err); }
    return tab;
  }

  async function launchGame(game) {
    const mode = ["redirect", "iframe", "raw", "raw-html"].includes(game && game.mode) ? game.mode : "redirect";
    if (mode === "raw-html") {
      const html = String(game && game.html || "");
      if (!html.trim()) { warn("This raw-html game has no HTML code.", game && game.title); return; }
      log(`Launching ${game.title || "game"} using mode: ${mode}`);
      const tab = openAboutBlank(game.title || "Game");
      if (!tab) return;
      currentActivity = `Playing ${String(game.title || "a game").slice(0, 80)}`;
      void updatePresence(currentActivity);
      try {
        tab.document.open();
        tab.document.write(html);
        tab.document.close();
        if (!tab.document.title) tab.document.title = game.title || "Game";
      } catch (err) { error("Could not write raw HTML into the new tab:", err); }
      return;
    }

    const url = safeUrl(game && game.url);
    if (!url) { warn("This game has an invalid URL:", game && game.url); return; }
    log(`Launching ${game.title || "game"} using mode: ${mode}`, url);

    if (mode === "raw") {
      const tab = window.open(url, game.openInNewTab === false ? "_self" : "_blank");
      if (!tab) warn("The browser may have blocked the new tab.");
      else { currentActivity = `Playing ${String(game.title || "a game").slice(0, 80)}`; void updatePresence(currentActivity); }
      return;
    }

    const tab = openAboutBlank(game.title || "Game");
    if (!tab) return;
    currentActivity = `Playing ${String(game.title || "a game").slice(0, 80)}`;
    void updatePresence(currentActivity);

    if (mode === "iframe") {
      const iframe = tab.document.createElement("iframe");
      iframe.title = game.iframeTitle || game.title || "Game";
      iframe.src = url;
      iframe.allow = game.iframeAllow || "fullscreen; autoplay; gamepad";
      iframe.referrerPolicy = game.referrerPolicy || "strict-origin-when-cross-origin";
      iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;background:#000";
      if (game.iframeSandbox) iframe.setAttribute("sandbox", game.iframeSandbox);
      tab.document.body.appendChild(iframe);
      return;
    }

    const status = tab.document.createElement("p");
    status.textContent = state.labels.redirectLoading;
    status.style.cssText = "color:#ddd;font:16px system-ui;padding:24px";
    tab.document.body.appendChild(status);
    try {
      const response = await fetch(url, { cache: game.cacheMode || "default", credentials: game.credentials || "omit" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        warn("The redirect target did not advertise an HTML content type:", contentType);
      }
      let html = await response.text();
      const baseTag = `<base href="${esc(url)}">`;
      if (/<head\b[^>]*>/i.test(html)) {
        html = html.replace(/<head\b[^>]*>/i, match => `${match}${baseTag}`);
      } else if (/<html\b[^>]*>/i.test(html)) {
        html = html.replace(/<html\b[^>]*>/i, match => `${match}<head>${baseTag}</head>`);
      } else {
        html = `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`;
      }
      tab.document.open();
      tab.document.write(html);
      tab.document.close();
    } catch (err) {
      error("Could not download game HTML for redirect mode:", err);
      try {
        tab.document.open();
        tab.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(game.title || "Game")}</title></head><body style="margin:0;background:#080b16;color:#f7f7ff;font:16px system-ui;padding:24px"><h1>Could not load game HTML</h1><p>${esc(state.labels.redirectError)}</p><p>${esc(publicText(String(err && err.message || err)))}</p><p>Try iframe mode or raw mode for this URL.</p></body></html>`);
        tab.document.close();
      } catch (_) {}
    }
  }

  const PLAYFAB_SESSION_KEY = "lunara-playfab-session-v1";
  const BROWSER_UUID_KEY = "lunara-browser-uuid-v1";
  const PLAYFAB_SESSION_MS = Math.max(1, Number(CONFIG.playFab.sessionDays) || 5) * 24 * 60 * 60 * 1000;

  function getPersistentBrowserId() {
    try {
      let id = localStorage.getItem(BROWSER_UUID_KEY);
      if (id) return id;
      if (crypto.randomUUID) id = crypto.randomUUID();
      else {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        id = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
      }
      localStorage.setItem(BROWSER_UUID_KEY, id);
      return id;
    } catch (err) {
      warn("Could not create or store the browser ID:", err);
      return "";
    }
  }

  async function playFabClient(endpoint, body = {}, sessionTicket = "") {
    const titleId = String(CONFIG.playFab.titleId || "").trim();
    if (!titleId || titleId === "YOUR_PLAYFAB_TITLE_ID") throw new Error("Account sign-in is not configured yet.");
    const headers = { "Content-Type": "application/json" };
    if (sessionTicket) headers["X-Authorization"] = sessionTicket;
    let response;
    try {
      response = await fetch(`https://${encodeURIComponent(titleId)}.playfabapi.com/Client/${endpoint}`, {
        method: "POST", headers, body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(`Could not reach the account service. Check the connection and browser console. ${err.message || ""}`);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      const failure = new Error(payload.errorMessage || payload.error || `Request failed (${response.status}).`);
      failure.playFabCode = payload.errorCode;
      throw failure;
    }
    return payload.data || {};
  }

  function isPlayFabAccountBanned(err) {
    return Number(err?.playFabCode) === 1002 || /account is currently banned for this title|account banned/i.test(String(err?.message || ""));
  }

  function playFabBanSignInMessage() {
    return "Account Banned. This account has been blocked from using Lunara. Contact Lunara moderation for the ban details.";
  }

  async function bindBrowserId(sessionTicket, browserId) {
    try {
      await playFabClient("LinkCustomID", { CustomId: browserId }, sessionTicket);
    } catch (err) {
      if (Number(err.playFabCode) === 1184) {
        throw new Error("This browser is already linked to a different account. Use that account on this browser.");
      }
      throw err;
    }
  }

  function applyPlayFabProfile(accountInfo, fallbackUsername, fallbackPlayFabId) {
    const account = accountInfo?.AccountInfo || {};
    if (!account.PlayFabId || (fallbackPlayFabId && account.PlayFabId !== fallbackPlayFabId)) {
      throw new Error("We could not verify this account. Please sign in again.");
    }
    if (account.TitleInfo?.isBanned) throw new Error("This account is currently restricted.");
    const title = account.TitleInfo || {};
    currentUser = {
      username: account.Username || fallbackUsername || "Player",
      displayName: title.DisplayName || fallbackUsername || account.Username || "Player",
      playFabId: account.PlayFabId || fallbackPlayFabId || ""
    };
    return currentUser;
  }

  async function savePlayFabSession(loginResult, username) {
    const now = Date.now();
    const profileInfo = await playFabClient("GetAccountInfo", {}, loginResult.SessionTicket);
    const profile = applyPlayFabProfile(profileInfo, username || loginResult.Username, loginResult.PlayFabId);
    const session = {
      ticket: loginResult.SessionTicket,
      playFabId: loginResult.PlayFabId,
      username: profile.username,
      displayName: profile.displayName,
      expiresAt: now + PLAYFAB_SESSION_MS
    };
    if (!session.ticket) throw new Error("Sign-in did not return a valid session.");
    const encodedSession = JSON.stringify(session);
    try { localStorage.setItem(PLAYFAB_SESSION_KEY, encodedSession); }
    catch { throw new Error("Browser storage is unavailable, so Lunara cannot remember this sign-in for five days."); }
    try { sessionStorage.setItem(PLAYFAB_SESSION_KEY, encodedSession); } catch {}
    if (authExpiryTimer) clearTimeout(authExpiryTimer);
    authExpiryTimer = window.setTimeout(() => showAuthGate("Your five-day session ended. Sign in again to continue."), Math.max(0, session.expiresAt - Date.now()));
    if (authRoot) { authRoot.remove(); authRoot = null; }
    showLaunchScreen();
    void refreshBroadcast({ notify: false });
  }

  function showAuthGate(message = "") {
    if (authExpiryTimer) { clearTimeout(authExpiryTimer); authExpiryTimer = null; }
    if (socialRefreshTimer) { clearInterval(socialRefreshTimer); socialRefreshTimer = null; }
    if (socialPollTimer) { clearInterval(socialPollTimer); socialPollTimer = null; }
    if (stockRefreshTimer) { clearInterval(stockRefreshTimer); stockRefreshTimer = null; }
    if (moderationPollTimer) { clearInterval(moderationPollTimer); moderationPollTimer = null; }
    if (moderationBanTimer) { clearInterval(moderationBanTimer); moderationBanTimer = null; }
    if (socialTitleTimer) { clearTimeout(socialTitleTimer); socialTitleTimer = null; }
    temporarySocialTitle = "";
    document.title = state.title;
    currentMainPage = "games";
    stockMarketData = null;
    stockCardSymbols = "";
    socialPollBaselineReady = false;
    lastSocialPollAt = 0;
    knownFriendRequestKeys = null;
    knownMessageKeysByFriend.clear();
    lastViewedDmAt.clear();
    chatGroupCache.clear();
    presenceCache.clear();
    closeFriendsPanel();
    closeModerationPanel();
    moderationBanGate?.remove();moderationBanGate=null;moderationStatus=null;moderationCanUse=false;broadcastCanPost=false;broadcastPermissionCheckedAt=0;
    if (stopBackground) { stopBackground(); stopBackground = null; }
    root?.remove(); root = null;
    introRoot?.remove(); introRoot = null;
    currentUser = null;
    document.getElementById("gd-chat-dock")?.remove();
    try { sessionStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    try { localStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    addStyles();
    setFavicon();
    document.getElementById("library-auth-screen")?.remove();
    authRoot = document.createElement("div");
    authRoot.id = "library-auth-screen";
    const titleIdReady = Boolean(String(CONFIG.playFab.titleId || "").trim() && CONFIG.playFab.titleId !== "YOUR_PLAYFAB_TITLE_ID");
    const policyMonths = Math.max(1, Number(CONFIG.playFab.inactivityMonths) || 2);
    authRoot.innerHTML = `<section class="gd-auth-card" role="dialog" aria-modal="true" aria-labelledby="gd-auth-title"><div class="gd-auth-brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path fill="#fff" d="m23.8 5.2 1.1 3 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3-1.1 3-1.1 1.1-3Z"/></svg><span>${esc(state.title)} account</span></div><h1 id="gd-auth-title">Welcome back</h1><p class="gd-auth-copy">Sign in or create an account to continue to the launcher. Lunara verifies your account each time this script runs.</p><div class="gd-auth-tabs"><button class="gd-auth-tab active" type="button" data-auth-mode="login">Sign in</button><button class="gd-auth-tab" type="button" data-auth-mode="register">Create account</button></div><form class="gd-auth-form" data-auth-form="login"><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="20" required></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" maxlength="100" required></label><div class="gd-auth-message" data-auth-message>${esc(publicText(message))}</div><button class="gd-btn primary" type="submit" ${titleIdReady ? "" : "disabled"}>Sign in</button></form><form class="gd-auth-form" data-auth-form="register" hidden><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="20" required></label><label>Display name (letters and numbers only)<input name="displayName" autocomplete="nickname" maxlength="25" placeholder="How others will see you"></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="6" maxlength="100" required></label><label>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="6" maxlength="100" required></label><div class="gd-auth-message" data-auth-message>${esc(publicText(message))}</div><button class="gd-btn primary" type="submit" ${titleIdReady ? "" : "disabled"}>Create account</button></form><p class="gd-auth-policy">Accounts inactive for more than ${policyMonths} months will be deleted. Sign in regularly to keep your account.</p><p class="gd-auth-note">A persistent browser ID is used to limit one linked account per browser profile. Clearing browser storage or using another profile/device can create a different ID.</p>${titleIdReady ? "" : `<p class="gd-auth-policy">Account sign-in is not configured yet.</p>`}</section>`;
    document.body.appendChild(authRoot);
    ensureBroadcastBanner();
    authRoot.addEventListener("click", event => { if (event.target.closest("button")) playUiSound("click", true); });
    const tabs = [...authRoot.querySelectorAll("[data-auth-mode]")];
    const forms = [...authRoot.querySelectorAll("[data-auth-form]")];
    const setMode = mode => {
      for (const tab of tabs) tab.classList.toggle("active", tab.dataset.authMode === mode);
      for (const form of forms) form.hidden = form.dataset.authForm !== mode;
      authRoot.querySelector("#gd-auth-title").textContent = mode === "register" ? "Create your account" : "Welcome back";
    };
    tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.authMode)));
    forms.forEach(form => form.addEventListener("submit", event => {
      event.preventDefault();
      void submitAuthForm(form);
    }));
    return authRoot;
  }

  function authMessage(form, message, setup = false) {
    const target = form.querySelector("[data-auth-message]");
    if (!target) return;
    target.textContent = publicText(message);
    target.classList.toggle("setup", setup);
  }

  async function submitAuthForm(form) {
    const mode = form.dataset.authForm;
    const submit = form.querySelector('[type="submit"]');
    const username = form.elements.username.value.trim();
    const displayName = form.elements.displayName?.value.trim();
    const password = form.elements.password.value;
    const confirmPassword = form.elements.confirmPassword?.value;
    const browserId = getPersistentBrowserId();
    if (mode === "register" && !/^[A-Za-z0-9]{3,20}$/.test(username)) {
      authMessage(form, "Username must be 3–20 characters and use letters and numbers only.");
      return;
    }
    if (mode === "register" && displayName && !/^[A-Za-z0-9]{3,25}$/.test(displayName)) {
      authMessage(form, "Display name must be 3–25 characters and use letters and numbers only.");
      return;
    }
    if (!browserId) { authMessage(form, "Persistent browser storage is required to sign in."); return; }
    if (confirmPassword !== undefined && confirmPassword !== password) { authMessage(form, "Passwords do not match."); return; }
    if (!CONFIG.playFab.titleId || CONFIG.playFab.titleId === "YOUR_PLAYFAB_TITLE_ID") { authMessage(form, "Account sign-in is not configured yet.", true); return; }
    submit.disabled = true;
    const originalText = submit.textContent;
    submit.textContent = mode === "register" ? "Creating account…" : "Signing in…";
    authMessage(form, "");
    try {
      let result;
      if (mode === "register") {
        try {
          await playFabClient("LoginWithCustomID", { TitleId: CONFIG.playFab.titleId, CustomId: browserId, CreateAccount: false });
          throw new Error("This browser is already linked to an account. Choose Sign in instead.");
        } catch (err) {
          if (Number(err.playFabCode) !== 1001 && !/already linked to an account/.test(err.message)) throw err;
          if (/already linked to an account/.test(err.message)) throw err;
        }
        result = await playFabClient("RegisterPlayFabUser", { TitleId: CONFIG.playFab.titleId, Username: username, DisplayName: displayName || username, Password: password, RequireBothUsernameAndEmail: false });
      } else {
        result = await playFabClient("LoginWithPlayFab", { TitleId: CONFIG.playFab.titleId, Username: username, Password: password });
      }
      await bindBrowserId(result.SessionTicket, browserId);
      await savePlayFabSession(result, username);
    } catch (err) {
      authMessage(form, isPlayFabAccountBanned(err) ? playFabBanSignInMessage() : (err.message || "Sign-in failed. Please try again."));
    } finally {
      if (submit.isConnected) { submit.disabled = false; submit.textContent = originalText; }
    }
  }

  async function beginAuthentication() {
    const browserId = getPersistentBrowserId();
    if (!browserId) { showAuthGate("Enable browser storage to create your persistent browser ID."); return; }
    if (!String(CONFIG.playFab.titleId || "").trim() || CONFIG.playFab.titleId === "YOUR_PLAYFAB_TITLE_ID") { showAuthGate("Account sign-in is not configured yet."); return; }
    let session = null;
    try { session = JSON.parse(localStorage.getItem(PLAYFAB_SESSION_KEY) || sessionStorage.getItem(PLAYFAB_SESSION_KEY) || "null"); } catch {}
    if (session?.ticket && Number(session.expiresAt) > Date.now()) {
      try {
        const accountInfo = await playFabClient("GetAccountInfo", {}, session.ticket);
        currentUser = applyPlayFabProfile(accountInfo, session.username, session.playFabId);
        if (authExpiryTimer) clearTimeout(authExpiryTimer);
        authExpiryTimer = window.setTimeout(() => showAuthGate("Your five-day session ended. Sign in again to continue."), Math.max(0, session.expiresAt - Date.now()));
        log(`Restored verified sign-in for @${currentUser.username}.`);
        showLaunchScreen();
        void refreshBroadcast({ notify: false });
        return;
      } catch (err) {
        warn("Remembered session could not be verified; asking for login:", err);
        if (isPlayFabAccountBanned(err)) {
          try { sessionStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
          try { localStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
          showAuthGate(playFabBanSignInMessage());
          return;
        }
      }
    }
    try { sessionStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    try { localStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    showAuthGate(session?.ticket ? "Your saved sign-in expired or the account could not be verified. Sign in again." : "Sign in to verify your account before opening Lunara.");
  }

  function formatModerationRemaining(ms){
    const seconds=Math.max(0,Math.ceil(ms/1000));
    const days=Math.floor(seconds/86400),hours=Math.floor((seconds%86400)/3600),minutes=Math.floor((seconds%3600)/60),rest=seconds%60;
    return `${days?`${days}d `:""}${hours}h ${minutes}m ${rest}s`;
  }

  function showBanRestriction(ban,{onExpired=null}={}){
    const expiresAt=Number(ban?.expiresAt)||0;
    if(expiresAt<=Date.now()){onExpired?.();return;}
    if(moderationBanGate?.dataset?.banExpires===String(expiresAt)){
      if(typeof onExpired==="function")moderationBanGate.__banOnExpired=onExpired;
      return;
    }
    if(moderationBanTimer){clearInterval(moderationBanTimer);moderationBanTimer=null;}
    moderationBanGate?.remove();
    const gate=document.createElement("div");
    gate.className="gd-ban-gate";
    gate.dataset.banExpires=String(expiresAt);
    gate.__banOnExpired=typeof onExpired==="function"?onExpired:null;
    gate.innerHTML=`<section class="gd-gate-notice-card" role="alertdialog" aria-modal="true" aria-labelledby="gd-ban-title"><div class="gd-gate-notice-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="42" height="42"><path d="M16 3 28 8v8c0 7-4.8 11.5-12 14C8.8 27.5 4 23 4 16V8l12-5Z" fill="none" stroke="#ff8299" stroke-width="2"/><path d="m11 11 10 10m0-10L11 21" stroke="#ffb3c1" stroke-width="2"/></svg></div><h2 id="gd-ban-title">Account Banned</h2><p>Your account has been restricted from using our services.</p><p>You will not be able to access Lunara until the ban expires.</p><p class="gd-gate-notice-reason"><strong>Reason:</strong> <span data-ban-reason></span></p><p class="gd-gate-notice-meta">Moderated by <span data-ban-moderator></span> · Expires <span data-ban-expiry></span></p><p class="gd-gate-notice-meta">Time Remaining <strong data-ban-countdown></strong></p></section>`;
    gate.querySelector("[data-ban-reason]").textContent=String(ban.reason||"No reason was provided.");
    gate.querySelector("[data-ban-moderator]").innerHTML=renderPlayFabName(String(ban.moderator||"Lunara moderation"));
    gate.querySelector("[data-ban-expiry]").textContent=new Date(expiresAt).toLocaleString();
    document.body.appendChild(gate);
    moderationBanGate=gate;
    const tick=()=>{
      if(!gate.isConnected){if(moderationBanTimer){clearInterval(moderationBanTimer);moderationBanTimer=null;}return;}
      const remaining=expiresAt-Date.now();
      gate.querySelector("[data-ban-countdown]").textContent=formatModerationRemaining(remaining);
      if(remaining<=0){
        if(moderationBanTimer){clearInterval(moderationBanTimer);moderationBanTimer=null;}
        gate.remove();moderationBanGate=null;
        if(moderationStatus)moderationStatus.ban=null;
        gate.__banOnExpired?.();
      }
    };
    gate.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();}},true);
    gate.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();},true);
    tick();moderationBanTimer=window.setInterval(tick,1000);
  }

  function showWarningNotice(warnings,onContinue){
    if(moderationWarningGate?.isConnected){
      moderationWarningGate.__warningIds=warnings.map(warning=>warning.id).filter(Boolean);
      if(typeof onContinue==="function")moderationWarningGate.__moderationOnContinue=onContinue;
      moderationWarningGate.querySelector("[data-warning-copy]").textContent=`Your account has received ${warnings.length===1?"a warning":"warnings"}. Please review ${warnings.length===1?"the reason":"the reasons"} before continuing.`;
      moderationWarningGate.querySelector("[data-warning-reasons]").innerHTML=warnings.map(warning=>`<p class="gd-gate-notice-reason"><strong>${renderPlayFabName(warning.moderator||"Moderator")}</strong><br>${esc(warning.reason||"No reason provided.")}</p>`).join("");
      moderationWarningGate.querySelector("[data-warning-ack]").textContent=moderationWarningGate.__moderationOnContinue?"I understand · Continue":"I understand";
      return moderationWarningGate;
    }
    const gate=document.createElement("div");
    gate.className="gd-warning-gate";
    gate.innerHTML=`<section class="gd-gate-notice-card" role="alertdialog" aria-modal="true" aria-labelledby="gd-warning-title"><div aria-hidden="true"><svg viewBox="0 0 24 24" width="40" height="40"><path d="M12 3 22 21H2L12 3Z" fill="none" stroke="#ffd27d" stroke-width="1.8"/><path d="M12 9v5m0 3v.1" stroke="#ffd27d" stroke-width="2" stroke-linecap="round"/></svg></div><h2 id="gd-warning-title">Account warning</h2><p data-warning-copy>Your account has received ${warnings.length===1?"a warning":"warnings"}. Please review ${warnings.length===1?"the reason":"the reasons"} before continuing.</p><div data-warning-reasons></div><p class="gd-mod-status" data-warning-status role="status"></p><button class="gd-btn primary" type="button" data-warning-ack>I understand</button></section>`;
    gate.__warningIds=warnings.map(warning=>warning.id).filter(Boolean);
    gate.__moderationOnContinue=typeof onContinue==="function"?onContinue:null;
    gate.querySelector("[data-warning-ack]").textContent=gate.__moderationOnContinue?"I understand · Continue":"I understand";
    gate.querySelector("[data-warning-reasons]").innerHTML=warnings.map(warning=>`<p class="gd-gate-notice-reason"><strong>${renderPlayFabName(warning.moderator||"Moderator")}</strong><br>${esc(warning.reason||"No reason provided.")}</p>`).join("");
    document.body.appendChild(gate);
    moderationWarningGate=gate;
    gate.addEventListener("click",async event=>{
      const button=event.target.closest("[data-warning-ack]");if(!button)return;
      button.disabled=true;
      const status=gate.querySelector("[data-warning-status]");
      if(status)status.textContent="Saving acknowledgment…";
      try{
        const result=await socialCloudScript("AcknowledgeLunaraWarnings",{ids:gate.__warningIds||[]});
        if(!result?.success)throw new Error(result?.message||"Could not acknowledge the warning.");
        moderationStatus=moderationStatus||{};moderationStatus.warnings=[];
        const continueAfterAck=gate.__moderationOnContinue;
        gate.remove();if(moderationWarningGate===gate)moderationWarningGate=null;
        continueAfterAck?.();
      }catch(err){button.disabled=false;if(status)status.textContent=publicText(err.message||"Acknowledgment failed. Try again.");}
    });
    gate.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();}},true);
  }

  function applyModerationStatus(status){
    moderationStatus=status;
    const activeBan=status?.ban&&Number(status.ban.expiresAt)>Date.now()?status.ban:null;
    if(activeBan){
      moderationWarningGate?.remove();moderationWarningGate=null;
      closeFriendsPanel();closeFeedbackForm();closeModerationPanel();
      showBanRestriction(activeBan);
      return;
    }
    if(moderationBanTimer){clearInterval(moderationBanTimer);moderationBanTimer=null;}
    if(moderationBanGate){moderationBanGate.remove();moderationBanGate=null;}
    const warnings=Array.isArray(status?.warnings)?status.warnings:[];
    if(warnings.length)showWarningNotice(warnings);
    else if(moderationWarningGate){moderationWarningGate.remove();moderationWarningGate=null;}
  }

  function showModerationCheckError(screen,button,errorMessage){
    const gate=document.createElement("div");
    gate.className="gd-warning-gate";
    gate.innerHTML=`<section class="gd-gate-notice-card" role="alertdialog" aria-modal="true"><h2>Could not verify account status</h2><p>Lunara needs to check moderation status before opening.</p><p class="gd-gate-notice-reason" data-mod-check-error></p><button class="gd-btn primary" type="button" data-mod-check-retry>Retry check</button></section>`;
    gate.querySelector("[data-mod-check-error]").textContent=publicText(errorMessage||"Account status check is unavailable.");
    gate.querySelector("[data-mod-check-retry]").addEventListener("click",()=>{gate.remove();launchStarted=false;button.disabled=false;void handleLaunchClick(screen,button);});
    gate.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();}},true);
    document.body.appendChild(gate);
  }

  function animateIntoLauncher(screen,button){
    button.disabled=true;screen.classList.add("launching");
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(()=>{
      screen.remove();introRoot=null;
      try{
        mount();
      }catch(err){
        error("Library failed to load after launch:",err);
        window.__LIBRARY_RUNNING__=false;
        document.getElementById("library-style")?.remove();
        document.getElementById("library-favicon")?.remove();
      }
    },reduced?80:900);
  }

  async function handleLaunchClick(screen,button){
    if(launchStarted)return;
    launchStarted=true;button.disabled=true;playUiSound("library-launch",true);
    let status;
    try{
      status=await socialCloudScript("GetLunaraModerationStatus");
      if(!status?.success)throw new Error(status?.message||"Moderation status check did not succeed.");
    }catch(err){
      launchStarted=false;
      showModerationCheckError(screen,button,err.message||"Account status check is unavailable.");
      return;
    }
    moderationStatus=status;
    if(status.ban&&Number(status.ban.expiresAt)>Date.now()){
      launchStarted=false;
      showBanRestriction(status.ban,{onExpired:()=>{if(button.isConnected){button.disabled=false;screen.querySelector(".gd-gate-foot").textContent="Restriction expired. Click Launch to continue.";}}});
      return;
    }
    const warnings=Array.isArray(status.warnings)?status.warnings:[];
    applyModerationStatus(status);
    if(warnings.length){showWarningNotice(warnings,()=>animateIntoLauncher(screen,button));return;}
    animateIntoLauncher(screen,button);
  }

  function showLaunchScreen() {
    addStyles();
    setFavicon();
    launchStarted = false;
    document.getElementById("library-launch-screen")?.remove();
    const screen = document.createElement("div");
    screen.id = "library-launch-screen";
    screen.innerHTML = `<div class="gd-gate-aurora" aria-hidden="true"></div><div class="gd-gate-stars" aria-hidden="true"></div><div class="gd-gate-content"><svg class="gd-gate-mark" viewBox="0 0 32 32" aria-hidden="true"><path fill="${esc(state.colors.accent)}" d="M21.9 3.6a12.7 12.7 0 1 0 6.5 22.1A13.2 13.2 0 0 1 21.9 3.6Z"/><path fill="#fff" d="m23.8 5.2 1.1 3 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3-1.1 3-1.1 1.1-3Z"/></svg><div class="gd-gate-eyebrow"></div><h1 class="gd-gate-title">${esc(state.title)}</h1><p class="gd-gate-caption"></p><p class="gd-gate-user">Signed in as <strong>${renderPlayFabName(currentUser?.displayName || currentUser?.username || "Player")}</strong> · @${renderPlayFabName(currentUser?.username || "Player")}</p><div class="gd-gate-stage"><div class="gd-gate-ring" aria-hidden="true"></div><div class="gd-gate-ring ring-two" aria-hidden="true"></div><div class="gd-gate-ring ring-three" aria-hidden="true"></div><button class="gd-gate-button" type="button" data-launch-library><span>${esc(state.labels.openLibraryButton || "launch")}</span></button></div><div class="gd-gate-foot"></div></div>`;
    document.body.appendChild(screen);
    ensureBroadcastBanner();
    introRoot = screen;
    const socialLine = document.createElement("p");
    socialLine.className = "gd-gate-social-summary";
    socialLine.textContent = "Checking friends and messages…";
    screen.querySelector(".gd-gate-content")?.insertBefore(socialLine, screen.querySelector(".gd-gate-stage"));
    void refreshSocialSummary().then(snapshot => {
      if (!socialLine.isConnected) return;
      const visibleOnlineNames = snapshot.onlineNames.slice(0, 3);
      const moreOnline = snapshot.onlineNames.length > 3 ? ` +${snapshot.onlineNames.length - 3}` : "";
      const namesText = visibleOnlineNames.length ? ` · ${visibleOnlineNames.join(", ")}${moreOnline}` : "";
      const namesHtml = visibleOnlineNames.length ? ` · ${visibleOnlineNames.map(renderPlayFabName).join(", ")}${moreOnline}` : "";
      socialLine.innerHTML = `${snapshot.online} online · ${snapshot.unread} missed messages · ${snapshot.requests} friend requests${namesHtml}`;
      if (snapshot.unread || snapshot.requests) showSocialToast(`${snapshot.unread} missed messages · ${snapshot.requests} friend requests${namesText}`);
    }).catch(err => { if (socialLine.isConnected) socialLine.textContent = `Social status unavailable · ${publicText(err.message || "Request failed")}`; });
    screen.querySelector("[data-launch-library]").addEventListener("click",event=>{void handleLaunchClick(screen,event.currentTarget);});
    return screen;
  }

  function activeSession() {
    let session = null;
    try { session = JSON.parse(localStorage.getItem(PLAYFAB_SESSION_KEY) || sessionStorage.getItem(PLAYFAB_SESSION_KEY) || "null"); } catch {}
    if (session?.ticket && Number(session.expiresAt) > Date.now()) return session;
    try { sessionStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    try { localStorage.removeItem(PLAYFAB_SESSION_KEY); } catch {}
    if (currentUser) showAuthGate("Your session is missing or expired. Sign in again to continue.");
    throw new Error("Your session is missing or expired. Please sign in again.");
  }

  function activeModerationBan(){
    const ban=moderationStatus?.ban;
    return ban&&Number(ban.expiresAt)>Date.now()?ban:null;
  }

  function moderationRestrictionMessage(){
    const ban=activeModerationBan();
    return ban?`This account is restricted until ${new Date(Number(ban.expiresAt)).toLocaleString()}. Reason: ${ban.reason||"No reason provided."}`:"This action is unavailable while the account is restricted.";
  }

  async function socialCall(name, body = {}) {
    if(activeModerationBan()&&["GetFriendsList","GetUserData","UpdateUserData","CreateSharedGroup","AddSharedGroupMembers","GetSharedGroupData","UpdateSharedGroupData","RemoveSharedGroupMembers","DeleteSharedGroup"].includes(name))throw new Error(moderationRestrictionMessage());
    const session = activeSession();
    return playFabClient(name, body, session.ticket);
  }

  async function socialCloudScript(functionName, args = {}) {
    if(activeModerationBan()&&["SendFriendRequest","RespondFriendRequest","RemoveFriend","SubmitLunaraFeedback","SendLunaraBroadcast"].includes(functionName))throw new Error(moderationRestrictionMessage());
    const result = await socialCall("ExecuteCloudScript", { FunctionName: functionName, FunctionParameter: args, RevisionSelection: "Live", GeneratePlayStreamEvent: false });
    if (result.Error) {
      console.error(`[Lunara] Server action ${functionName} failed:\n${JSON.stringify({ error: result.Error, logs: result.Logs || [] }, null, 2)}`);
      throw new Error(result.Error.Message || result.Error.Error || `Server action ${functionName} failed.`);
    }
    if (result.FunctionResult == null) {
      console.error(`[Lunara] Server action ${functionName} returned no result:`, result);
      throw new Error(`Server action ${functionName} returned no result. Check that the handler is active and returns a value.`);
    }
    return result.FunctionResult;
  }

  function closeModerationPanel(){moderationPanel?.remove();moderationPanel=null;}

  function renderModerationPlayers(panel,players){
    const list=panel.querySelector("[data-mod-users]");
    if(!list)return;
    list.innerHTML=players.length?players.map(player=>`<button class="gd-mod-user" type="button" data-mod-select="${esc(player.playFabId)}"><span>${renderPlayFabName(player.displayName||player.username||"Player")}</span><span class="gd-mod-muted">@${renderPlayFabName(player.username||"Player")}</span></button>`).join(""):`<div class="gd-mod-status">No players found on this page yet. The directory fills as accounts sign in with this revision.</div>`;
  }

  async function loadModerationPage(panel,page=0){
    if(moderationPanel!==panel)return;
    const status=panel.querySelector("[data-mod-status]");
    if(status)status.textContent="Loading player directory…";
    try{
      const result=await socialCloudScript("ListLunaraModerationPlayers",{page});
      if(!result?.success)throw new Error(result?.message||"Could not load the player directory.");
      panel.dataset.page=String(result.page||0);
      panel.dataset.hasMore=String(!!result.hasMore);
      panel.querySelector("[data-mod-page-label]").textContent=`Page ${(result.page||0)+1}`;
      panel.querySelector("[data-mod-prev]").disabled=(result.page||0)===0;
      panel.querySelector("[data-mod-next]").disabled=!result.hasMore;
      renderModerationPlayers(panel,result.players||[]);
      if(status)status.textContent="Player directory · 10 players per page";
    }catch(err){if(status)status.textContent=publicText(err.message||"Could not load players.");}
  }

  async function searchModerationPlayer(panel,query){
    const status=panel.querySelector("[data-mod-status]");
    const name=String(query||"").trim();
    if(!name){if(status)status.textContent="Enter a username or display name.";return;}
      if(status)status.textContent="Searching accounts…";
    try{
      const ticket=activeSession().ticket;
      let response,account,errorFound;
      try{response=await playFabClient("GetAccountInfo",{Username:name},ticket);account=response?.AccountInfo;}catch(err){errorFound=err;}
      if(!account){
        try{response=await playFabClient("GetAccountInfo",{TitleDisplayName:name},ticket);account=response?.AccountInfo;}catch(err){errorFound=err;}
      }
      if(!account?.PlayFabId)throw errorFound||new Error("No account matched that name.");
      panel.querySelector("[data-mod-users]").innerHTML=`<button class="gd-mod-user" type="button" data-mod-select="${esc(account.PlayFabId)}"><span>${renderPlayFabName(account.TitleInfo?.DisplayName||account.Username||"Player")}</span><span class="gd-mod-muted">@${renderPlayFabName(account.Username||"Player")}</span></button>`;
      panel.dataset.hasMore="false";
      panel.querySelector("[data-mod-prev]").disabled=true;
      panel.querySelector("[data-mod-next]").disabled=true;
      panel.querySelector("[data-mod-page-label]").textContent="Search result";
      if(status)status.textContent="One matching account. Select it to inspect the profile.";
    }catch(err){panel.querySelector("[data-mod-users]").innerHTML="";if(status)status.textContent=publicText(err.message||"No account matched that name.");}
  }

  async function loadModerationDetails(panel,playFabId){
    if(moderationPanel!==panel)return;
    const detail=panel.querySelector("[data-mod-detail]");
    detail.hidden=false;
    detail.innerHTML=`<div class="gd-mod-status">Loading account, friends, and balance…</div>`;
    try{
      const result=await socialCloudScript("GetLunaraModerationPlayer",{playFabId});
      if(!result?.success)throw new Error(result?.message||"Could not load this player.");
      const p=result.player||{};
      const friends=(result.friends||[]).map(friend=>`<div class="gd-mod-friend"><span>${renderPlayFabName(friend.displayName||friend.username||"Player")}</span><span class="gd-mod-muted">@${renderPlayFabName(friend.username||"Player")}</span></div>`).join("")||`<div class="gd-mod-muted">No friends listed.</div>`;
      const warnings=(result.warnings||[]).map(warning=>`<div class="gd-mod-friend"><span>${esc(warning.reason||"Warning")}</span><span class="gd-mod-muted">${warning.acknowledgedAt?"Seen":"Pending"} · ${renderPlayFabName(warning.moderator||"Moderator")}</span></div>`).join("")||`<div class="gd-mod-muted">No warning history.</div>`;
      const ban=result.ban?`<p class="gd-mod-active-ban">Active ban${result.ban.playFabBanId?` · ID ${esc(result.ban.playFabBanId)}`:""} until ${esc(new Date(Number(result.ban.expiresAt)).toLocaleString())}: ${esc(result.ban.reason||"No reason provided.")} · Issued by ${renderPlayFabName(result.ban.moderator||"Moderator")}</p>`:`<p>No active restriction.</p>`;
      detail.innerHTML=`<h3>${renderPlayFabName(p.displayName||p.username||"Player")}</h3><p>@${renderPlayFabName(p.username||"Player")} · Account ID ${esc(p.playFabId||playFabId)}</p><p>Account balance: <strong>$${Number(result.money||0).toLocaleString()}</strong> <span class="gd-mod-muted">(${esc(result.currency||"MM")})</span></p>${ban}<h4>Friends (${(result.friends||[]).length})</h4><div class="gd-mod-friends">${friends}</div><h4>Warnings</h4><div class="gd-mod-friends">${warnings}</div><form class="gd-mod-form" data-mod-form><label>Reason<textarea class="gd-mod-reason" data-mod-reason maxlength="140" minlength="3" required placeholder="Explain the moderation action…"></textarea></label><label>Ban duration in hours<input class="gd-mod-hours" data-mod-hours type="number" min="1" max="8760" step="1" value="24"></label><div class="gd-mod-actions"><button class="gd-btn primary" type="button" data-mod-action="warn">Warn</button><button class="gd-btn gd-mod-ban" type="button" data-mod-action="ban">Ban</button>${result.ban?`<button class="gd-btn gd-mod-unban" type="button" data-mod-action="unban" data-ban-id="${esc(result.ban.playFabBanId||"")}">Unban</button>`:""}</div><div class="gd-mod-status" data-mod-action-status role="status"></div></form>`;
      panel.dataset.selectedPlayer=playFabId;
    }catch(err){detail.innerHTML=`<div class="gd-mod-status">${esc(publicText(err.message||"Could not load this player."))}</div>`;}
  }

  async function applyModerationAction(panel,action){
    const playFabId=panel.dataset.selectedPlayer;
    const reason=panel.querySelector("[data-mod-reason]")?.value.trim()||"";
    const status=panel.querySelector("[data-mod-action-status]");
    if(!playFabId){if(status)status.textContent="Select a player first.";return;}
    if(action==="unban"){
      const buttons=[...panel.querySelectorAll("[data-mod-action]")];
      buttons.forEach(button=>button.disabled=true);
      if(status)status.textContent="Revoking ban…";
      try{
        const banId=panel.querySelector('[data-mod-action="unban"]')?.dataset.banId||"";
        const result=await socialCloudScript("UnbanLunaraModerationPlayer",{playFabId,banId});
        if(!result?.success)throw new Error(result?.message||"Could not revoke this ban.");
        await loadModerationDetails(panel,playFabId);
        const actionStatus=panel.querySelector("[data-mod-action-status]");
        if(actionStatus)actionStatus.textContent="Ban revoked and Lunara restriction cleared. Any other active restrictions can still block sign-in.";
      }catch(err){if(status)status.textContent=publicText(err.message||"Could not revoke this ban.");}
      finally{panel.querySelectorAll("[data-mod-action]").forEach(button=>button.disabled=false);}
      return;
    }
    if(reason.length<3||reason.length>140){if(status)status.textContent="Enter a reason between 3 and 140 characters.";return;}
    const durationHours=Number(panel.querySelector("[data-mod-hours]")?.value);
    if(action==="ban"&&(!Number.isInteger(durationHours)||durationHours<1||durationHours>8760)){if(status)status.textContent="Choose a duration from 1 to 8,760 hours.";return;}
    const buttons=[...panel.querySelectorAll("[data-mod-action]")];
    buttons.forEach(button=>button.disabled=true);
    if(status)status.textContent=action==="warn"?"Saving warning…":"Applying ban…";
    try{
      const result=await socialCloudScript("ApplyLunaraModeration",{playFabId,action,reason,durationHours});
      if(!result?.success)throw new Error(result?.message||"Moderation action failed.");
      await loadModerationDetails(panel,playFabId);
      const actionStatus=panel.querySelector("[data-mod-action-status]");
      if(actionStatus)actionStatus.textContent=publicText(result.message||(action==="warn"?"Warning saved. It will appear on the player's next refresh.":`Ban applied for ${durationHours} hour${durationHours===1?"":"s"}.`));
    }catch(err){if(status)status.textContent=publicText(err.message||"Moderation action failed.");}
    finally{panel.querySelectorAll("[data-mod-action]").forEach(button=>button.disabled=false);}
  }

  function openModerationPanel(){
    if(!moderationCanUse){showSocialToast("The MD item from the Lunara catalog is required for moderation.");return;}
    closeModerationPanel();
    const panel=document.createElement("div");
    panel.className="gd-moderation-overlay";
    panel.innerHTML=`<section class="gd-moderation-card" role="dialog" aria-modal="true" aria-label="Lunara moderation"><div class="gd-mod-head"><div><h2>Player moderation</h2><p class="gd-mod-copy">MD access verified · player data is securely loaded</p></div><button class="gd-btn" type="button" data-mod-close>Close</button></div><div class="gd-mod-toolbar"><form class="gd-mod-search" data-mod-search><input class="gd-mod-input" name="query" maxlength="40" placeholder="Search username or display name"><button class="gd-btn primary" type="submit">Search</button></form><button class="gd-btn" type="button" data-mod-all>All players</button></div><div class="gd-mod-status" data-mod-status role="status">Loading player directory…</div><div class="gd-mod-users" data-mod-users></div><div class="gd-mod-pagination"><button class="gd-btn" type="button" data-mod-prev>Previous</button><span data-mod-page-label>Page 1</span><button class="gd-btn" type="button" data-mod-next>Next</button></div><section class="gd-mod-detail" data-mod-detail hidden></section></section>`;
    document.body.appendChild(panel);
    moderationPanel=panel;
    panel.addEventListener("click",event=>{
      if(event.target===panel||event.target.closest("[data-mod-close]")){closeModerationPanel();return;}
      const selected=event.target.closest("[data-mod-select]");if(selected){void loadModerationDetails(panel,selected.dataset.modSelect);return;}
      if(event.target.closest("[data-mod-all]")){panel.querySelector('[data-mod-search]')?.reset();void loadModerationPage(panel,0);return;}
      if(event.target.closest("[data-mod-prev]")){void loadModerationPage(panel,Math.max(0,Number(panel.dataset.page||0)-1));return;}
      if(event.target.closest("[data-mod-next]")){if(panel.dataset.hasMore==="true")void loadModerationPage(panel,Number(panel.dataset.page||0)+1);return;}
      const action=event.target.closest("[data-mod-action]");if(action)void applyModerationAction(panel,action.dataset.modAction);
    });
    panel.addEventListener("submit",event=>{if(event.target.matches("[data-mod-search]")){event.preventDefault();void searchModerationPlayer(panel,event.target.elements.query.value);}});
    panel.addEventListener("keydown",event=>{if(event.key==="Escape")closeModerationPanel();});
    void loadModerationPage(panel,0);
  }

  function closeFeedbackForm() {
    document.getElementById("gd-feedback-overlay")?.remove();
  }

  function openFeedbackForm(kind) {
    if(activeModerationBan()){showSocialToast(moderationRestrictionMessage());return;}
    closeFeedbackForm();
    const isSuggestion = kind === "suggest";
    const overlay = document.createElement("div");
    overlay.id = "gd-feedback-overlay";
    overlay.className = "gd-feedback-overlay";
    overlay.innerHTML = `<section class="gd-feedback-card" role="dialog" aria-modal="true" aria-labelledby="gd-feedback-title"><div class="gd-feedback-head"><div><h2 id="gd-feedback-title">${isSuggestion ? "Suggest a Game" : "Report a Bug"}</h2><p>${isSuggestion ? "Tell us what you would like to see in Lunara." : "Describe the issue and how we can reproduce it."}</p></div><button class="gd-btn" type="button" data-feedback-close aria-label="Close form">Close</button></div><form class="gd-feedback-form" data-feedback-form><label>${isSuggestion ? "Game name" : "Issue summary"}<input name="subject" maxlength="100" required placeholder="${isSuggestion ? "Game title" : "Short description"}"></label>${isSuggestion ? `<label>Game link (optional)<input name="gameUrl" type="url" maxlength="300" placeholder="https://..."></label>` : ""}<label>${isSuggestion ? "Why should we add it?" : "Details and steps to reproduce"}<textarea name="details" maxlength="1200" required placeholder="Add helpful details…"></textarea></label><div class="gd-feedback-status" data-feedback-status role="status"></div><div class="gd-feedback-actions"><button class="gd-btn" type="button" data-feedback-close>Cancel</button><button class="gd-btn primary" type="submit">${isSuggestion ? "Send suggestion" : "Send report"}</button></div></form></section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
      if (event.target === overlay || event.target.closest("[data-feedback-close]")) closeFeedbackForm();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") closeFeedbackForm();
    });
    const form = overlay.querySelector("[data-feedback-form]");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      const status = overlay.querySelector("[data-feedback-status]");
      const subject = form.elements.subject.value.trim();
      const details = form.elements.details.value.trim();
      const gameUrl = form.elements.gameUrl?.value.trim() || "";
      if (!subject || !details) {
        status.textContent = "Please fill in both required fields.";
        status.className = "gd-feedback-status error";
        return;
      }
      submit.disabled = true;
      submit.textContent = "Submitting…";
      status.textContent = "Sending securely…";
      status.className = "gd-feedback-status";
      try {
        const result = await socialCloudScript("SubmitLunaraFeedback", { kind: isSuggestion ? "suggest" : "bug", subject, details, gameUrl });
        if (!result?.success) throw new Error(result?.message || "The server could not submit this form.");
        status.textContent = "Submitted. Thanks for helping improve Lunara!";
        status.className = "gd-feedback-status success";
        form.reset();
      } catch (err) {
        status.textContent = publicText(err.message || "Could not submit this form. Please try again later.");
        status.className = "gd-feedback-status error";
      } finally {
        submit.disabled = false;
        submit.textContent = isSuggestion ? "Send suggestion" : "Send report";
      }
    });
    overlay.querySelector("input")?.focus();
  }

  function openFriendsPanel() {
    if(activeModerationBan()){showSocialToast(moderationRestrictionMessage());return;}
    closeFriendsPanel();
    friendsRoot = document.createElement("div");
    friendsRoot.className = "gd-social-panel";
    friendsRoot.dataset.view = "friends";
    friendsRoot.innerHTML = `<section class="gd-social-card" role="dialog" aria-modal="true" aria-label="Friends"><div class="gd-social-head"><h2>Friends</h2><button class="gd-btn" type="button" data-social-close>Close</button></div><div class="gd-social-tools"><input data-friend-username maxlength="20" placeholder="Username"><button class="gd-btn primary" type="button" data-friend-add>Send request</button></div><div class="gd-social-status" data-social-status></div><div class="gd-social-list" data-friend-list><div class="gd-social-empty">Loading friends…</div></div><div class="gd-chat-view" data-chat-view hidden></div><p class="gd-auth-note">Activity and conversation lookup IDs are visible to the service. Message contents are private to conversation members.</p></section>`;
    document.body.appendChild(friendsRoot);
    friendsRoot.addEventListener("click", event => {
      if (event.target.closest("input,textarea,select,[contenteditable='true']")) {
        event.stopPropagation();
        return;
      }
      const action = event.target.closest("[data-social-close],[data-friend-add],[data-request-action],[data-chat],[data-chat-back],[data-chat-refresh],[data-chat-send]");
      const backdropClick = event.target === friendsRoot;
      if (!action && !backdropClick) return;
      event.preventDefault();
      event.stopPropagation();
      if (backdropClick || action?.matches("[data-social-close]")) { closeFriendsPanel(); return; }
      if (action.matches("[data-friend-add]")) void addFriend();
      const request = action.matches("[data-request-action]") ? action : null;
      if (request) void respondToFriendRequest(request.dataset.requestAction, request.dataset.requestId);
      const chat = action.matches("[data-chat]") ? action : null;
      if (chat) void openChat(chat.dataset.chat);
      if (action.matches("[data-chat-back]")) void loadFriends();
      if (action.matches("[data-chat-refresh]")) void loadChat({ manual: true });
      if (action.matches("[data-chat-send]")) void sendChat();
    });
    friendsRoot.querySelector("[data-friend-username]").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); void addFriend(); } });
    void loadFriends();
  }

  function closeFriendsPanel() {
    if (friendsRoot?.dataset.view === "chat" && friendsRoot.dataset.chat) {
      lastViewedDmAt.set(friendsRoot.dataset.chat, Date.now());
    }
    if (chatRefreshTimer) { clearInterval(chatRefreshTimer); chatRefreshTimer = null; }
    friendsRoot?.remove();
    friendsRoot = null;
    chatFetchInFlight = false;
  }

  function setSocialStatus(text) { const node = friendsRoot?.querySelector("[data-social-status]"); if (node) node.textContent = publicText(text); }

  async function loadFriends(prefetched = null) {
    if (!friendsRoot) return;
    if (friendsRoot.dataset.view === "chat" && friendsRoot.dataset.chat) {
      lastViewedDmAt.set(friendsRoot.dataset.chat, Date.now());
    }
    if (chatRefreshTimer) { clearInterval(chatRefreshTimer); chatRefreshTimer = null; }
    const panelAtRequestStart = friendsRoot;
    panelAtRequestStart.dataset.view = "friends";
    panelAtRequestStart.querySelector("[data-chat-view]").hidden = true;
    panelAtRequestStart.querySelector("[data-friend-list]").hidden = false;
    const viewAtRequestStart = panelAtRequestStart.dataset.view || "friends";
    friendsRoot.dataset.chat = "";
    friendsRoot.dataset.group = "";
    friendsRoot.querySelector(".gd-social-head h2").textContent = "Friends";
    friendsRoot.dataset.chat = "";
    friendsRoot.querySelector(".gd-social-tools").hidden = false;
    const list = friendsRoot.querySelector("[data-friend-list]");
    try {
      const [friendsResult, requestResult] = prefetched ? [prefetched.friendsResult, prefetched.requestResult] : await Promise.all([
        socialCall("GetFriendsList", {}),
        socialCloudScript("GetFriendRequests").catch(err => { console.error("[Lunara] Could not load friend requests:", err); return { Incoming: [], requestError: err.message }; })
      ]);
      if (friendsRoot !== panelAtRequestStart || panelAtRequestStart.dataset.view !== viewAtRequestStart) return;
      const Friends = friendsResult.Friends || [];
      const incoming = requestResult.Incoming || [];
      socialSnapshot.requests = incoming.length;
      const requestRows = incoming.map(request => `<article class="gd-friend-row"><span class="gd-online-dot online"></span><div class="gd-friend-info"><div class="gd-friend-name">${renderPlayFabName(request.displayName || request.username || "Player")}</div><div class="gd-friend-activity">Friend request · ${request.username ? `@${renderPlayFabName(request.username)}` : ""}</div></div><button class="gd-btn primary" type="button" data-request-action="accept" data-request-id="${esc(request.playFabId)}">Accept</button><button class="gd-btn" type="button" data-request-action="reject" data-request-id="${esc(request.playFabId)}">Decline</button></article>`).join("");
      const friendRows = Friends.map(f => {
        const id = f.FriendPlayFabId || f.PlayFabId || "";
        const name = f.TitleDisplayName || f.Username || f.Profile?.DisplayName || "Player";
        const user = f.Username || f.Profile?.Username || name;
        return `<article class="gd-friend-row" data-friend-id="${esc(id)}"><span class="gd-online-dot" data-dot></span><div class="gd-friend-info"><div class="gd-friend-name">${renderPlayFabName(name)} <span style="color:#aaa7c2;font-weight:500">@${renderPlayFabName(user)}</span></div><div class="gd-friend-activity" data-activity>Checking activity…</div></div><button class="gd-btn" type="button" data-chat="${esc(id)}">Message</button></article>`;
      }).join("");
      list.innerHTML = requestRows + friendRows || `<div class="gd-social-empty">No friends or requests yet. Send a request by username.${requestResult.requestError ? ` Could not check requests: ${esc(publicText(requestResult.requestError))}` : ""}</div>`;
      void loadFriendPresenceList(Friends);
      setSocialStatus(`${Friends.length} friend${Friends.length === 1 ? "" : "s"} · ${incoming.length} pending request${incoming.length === 1 ? "" : "s"}${requestResult.requestError ? ` · request check failed: ${publicText(requestResult.requestError)}` : ""}`);
    } catch (err) { console.error("[Lunara] Could not load the friends list:", err); list.innerHTML = `<div class="gd-social-empty">Could not load friends.</div>`; setSocialStatus(err.message); }
  }

  async function addFriend() {
    const input = friendsRoot?.querySelector("[data-friend-username]");
    const username = input?.value.trim();
    if (!username) return setSocialStatus("Enter a username.");
    if (!/^[A-Za-z0-9]{3,20}$/.test(username)) return setSocialStatus("Usernames must use 3–20 letters and numbers only.");
    try {
      const lookup = await socialCall("GetAccountInfo", { Username: username });
      const account = lookup.AccountInfo || {};
      if (!account.PlayFabId) throw new Error(`Could not find username “${username}”.`);
      await socialCloudScript("SendFriendRequest", { playFabId: account.PlayFabId });
      input.value = "";
      setSocialStatus(`Friend request sent to ${account.Username || username}.`);
      await loadFriends();
    }
    catch (err) { console.error("[Lunara] Sending the friend request failed:", err); setSocialStatus(`Could not send friend request: ${err.message || "Unknown error."}`); }
  }

  async function respondToFriendRequest(action, playFabId) {
    if (!playFabId || !["accept", "reject"].includes(action)) return;
    try {
      await socialCloudScript("RespondFriendRequest", { playFabId, accept: action === "accept" });
      setSocialStatus(action === "accept" ? "Friend request accepted." : "Friend request declined.");
      await loadFriends();
    } catch (err) { setSocialStatus(err.message || "Could not update this request."); }
  }

  async function loadPresence(id) {
    const row = friendsRoot?.querySelector(`[data-friend-id="${CSS.escape(id)}"]`);
    if (!row) return;
    try {
      const cached = presenceCache.get(id);
      let p = cached && Date.now() - cached.checkedAt < 20000 ? cached.presence : null;
      if (!cached || Date.now() - cached.checkedAt >= 20000) {
        const data = await socialCall("GetUserData", { PlayFabId: id, Keys: ["lunaraPresence"] });
        try { p = JSON.parse(data.Data?.lunaraPresence?.Value || "null"); } catch { p = null; }
        presenceCache.set(id, { presence: p, checkedAt: Date.now() });
      }
      const online = p && Date.now() - Number(p.updatedAt) < 150000;
      row.querySelector("[data-dot]").classList.toggle("online", !!online);
      row.querySelector("[data-activity]").textContent = online ? p.activity || "Online" : "Offline";
    } catch { const n = row.querySelector("[data-activity]"); if (n) n.textContent = "Activity unavailable"; }
  }

  async function loadFriendPresenceList(friends) {
    for (const friend of friends) {
      if (!friendsRoot) return;
      const id = friend.FriendPlayFabId || friend.PlayFabId;
      if (!id) continue;
      await loadPresence(id);
      await new Promise(resolve => window.setTimeout(resolve, 180));
    }
  }

  const dmKey = id => `lunara_dm_${id}`;
  const localDmGroupKey = (myId, friendId) => `lunara-dm-group-${myId}-${friendId}`;
  async function findChatGroup(friendId) {
    const mine = currentUser?.playFabId;
    if (!mine || !friendId || mine === friendId) throw new Error("Could not identify this friend.");
    const cached = chatGroupCache.get(friendId);
    if (cached && (cached.id || Date.now() - cached.checkedAt < 4500)) return cached.id;
    try {
      const localId = localStorage.getItem(localDmGroupKey(mine, friendId));
      if (localId) {
        chatGroupCache.set(friendId, { id: localId, checkedAt: Date.now() });
        return localId;
      }
    } catch {}
    const own = await socialCall("GetUserData", { Keys: [dmKey(friendId)] });
    let id = own.Data?.[dmKey(friendId)]?.Value;
    if (!id) {
      const other = await socialCall("GetUserData", { PlayFabId: friendId, Keys: [dmKey(mine)] });
      id = other.Data?.[dmKey(mine)]?.Value;
    }
    chatGroupCache.set(friendId, { id: id || null, checkedAt: Date.now() });
    return id || null;
  }

  async function getChatGroup(friendId) {
    const mine = currentUser?.playFabId;
    let id = await findChatGroup(friendId);
    if (!id) {
      const created = await socialCall("CreateSharedGroup", {});
      id = created.SharedGroupId;
      if (!id) throw new Error("Could not create a conversation.");
      await socialCall("AddSharedGroupMembers", { SharedGroupId: id, PlayFabIds: [friendId] });
      await socialCall("UpdateUserData", { Data: { [dmKey(friendId)]: id }, Permission: "Public" });
    }
    const group = await socialCall("GetSharedGroupData", { SharedGroupId: id, GetMembers: true, Keys: [] });
    const members = group.Members || [];
    if (members.length !== 2 || !members.includes(mine) || !members.includes(friendId)) throw new Error("This is not a private two-player conversation.");
    try { localStorage.setItem(localDmGroupKey(mine, friendId), id); } catch {}
    chatGroupCache.set(friendId, { id, checkedAt: Date.now() });
    return id;
  }

  async function openChat(friendId) {
    try {
      const panel = friendsRoot;
      if (!panel) return;
      const rowAtClick = panel.querySelector(`[data-friend-id="${CSS.escape(friendId)}"]`);
      const friendName = rowAtClick?.querySelector(".gd-friend-name")?.textContent || getRecentChat(friendId)?.name || "Messages";
      panel.dataset.view = "chat";
      panel.dataset.openingChat = friendId;
      panel.querySelector("[data-friend-list]").hidden = true;
      const chatView = panel.querySelector("[data-chat-view]");
      chatView.hidden = false;
      chatView.innerHTML = `<div class="gd-social-empty">Opening conversation…</div>`;
      const groupId = await getChatGroup(friendId);
      if (friendsRoot !== panel || panel.dataset.openingChat !== friendId) return;
      friendsRoot.dataset.chat = friendId; friendsRoot.dataset.group = groupId;
      delete friendsRoot.dataset.chatSignature;
      delete friendsRoot.dataset.pendingChatSignature;
      friendsRoot.querySelector(".gd-social-head h2").innerHTML = renderPlayFabName(friendName);
      friendsRoot.querySelector(".gd-social-tools").hidden = true;
      rememberRecentChat({ id: friendId, name: friendName, preview: getRecentChat(friendId)?.preview || "Open conversation", unread: 0 });
      chatView.innerHTML = `<button class="gd-btn gd-social-back" type="button" data-chat-back>← Friends</button><button class="gd-btn gd-social-back" type="button" data-chat-refresh>Refresh messages</button><div class="gd-chat-log" data-chat-log></div><div class="gd-social-compose"><input data-chat-input maxlength="500" placeholder="Write a message…"><button class="gd-btn primary" type="button" data-chat-send>Send</button></div>`;
      const composer = friendsRoot.querySelector("[data-chat-input]");
      composer.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); void sendChat(); } });
      await loadChat({ manual: true });
      if (chatRefreshTimer) clearInterval(chatRefreshTimer);
      const chatPanel = friendsRoot;
      chatRefreshTimer = window.setInterval(() => {
        if (friendsRoot !== chatPanel || chatPanel.dataset.view !== "chat" || !chatPanel.dataset.group || document.hidden) return;
        void loadChat();
      }, 4500);
    } catch (err) {
      if (friendsRoot?.dataset.view === "chat") {
        friendsRoot.querySelector("[data-chat-view]").innerHTML = `<button class="gd-btn gd-social-back" type="button" data-chat-back>← Friends</button><div class="gd-social-empty">Could not open conversation: ${esc(publicText(err.message || "Request failed."))}</div>`;
      }
      setSocialStatus(err.message || "Could not open messages.");
    }
  }

  async function loadChat() {
    if (!friendsRoot?.dataset.group) return false;
    if (chatFetchInFlight) return false;
    chatFetchInFlight = true;
    const panelAtRequestStart = friendsRoot;
    const groupAtRequestStart = panelAtRequestStart.dataset.group;
    try {
      const result = await socialCall("GetSharedGroupData", { SharedGroupId: groupAtRequestStart });
      if (friendsRoot !== panelAtRequestStart || panelAtRequestStart.dataset.group !== groupAtRequestStart) return false;
      const messages = Object.entries(result.Data || {}).filter(([k]) => k.startsWith("m_")).map(([key, rec]) => { try { return { key, ...JSON.parse(rec.Value) }; } catch { return null; } }).filter(Boolean).sort((a,b) => a.sentAt - b.sentAt).slice(-80);
      const log = panelAtRequestStart.querySelector("[data-chat-log]"); if (!log) return false;
      const signature = messages.map(m => `${m.key}:${m.text}`).join("|");
      knownMessageKeysByFriend.set(panelAtRequestStart.dataset.chat, new Set(messages.map(message => message.key)));
      if (signature === friendsRoot.dataset.chatSignature) return false;
      const latest = messages[messages.length - 1];
      if (latest) rememberRecentChat({ id: friendsRoot.dataset.chat, name: friendsRoot.querySelector(".gd-social-head h2")?.textContent || "Player", preview: `${latest.sender === currentUser?.playFabId ? "You: " : ""}${latest.text || ""}`, unread: 0 });
      renderChatMessages(messages, log, signature);
      return true;
    } catch (err) {
      setSocialStatus(err.message || "Could not refresh messages.");
      return null;
    } finally { chatFetchInFlight = false; }
  }

  function renderChatMessages(messages, log, signature) {
    if (!friendsRoot || !log?.isConnected) return;
    const scrollBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
    log.innerHTML = messages.map(m => `<div class="gd-chat-message ${m.sender === currentUser?.playFabId ? "mine" : ""}"><span class="gd-chat-meta">${renderPlayFabName(m.senderName || "Player")}</span>${esc(m.text || "")}</div>`).join("") || `<div class="gd-social-empty">No messages yet.</div>`;
    friendsRoot.dataset.chatSignature = signature;
    delete friendsRoot.dataset.pendingChatSignature;
    if (scrollBottom) log.scrollTop = log.scrollHeight;
    if (messages.length) {
      const last = messages.reduce((latest, item) => Math.max(latest, Number(item.sentAt) || 0), 0);
      try { localStorage.setItem(`lunara-read-${currentUser?.playFabId}-${friendsRoot.dataset.chat}`, String(last)); } catch {}
    }
    setSocialStatus("");
  }

  async function refreshSocialSummary({ notify = false, refreshPanel = false } = {}) {
    const snapshot = { online: 0, onlineNames: [], unread: 0, requests: 0, totalFriends: 0 };
    if(activeModerationBan())return snapshot;
    if (socialPollInFlight || !currentUser?.playFabId) return null;
    socialPollInFlight = true;
    const baselineReadyAtStart = socialPollBaselineReady;
    const previousPollAt = lastSocialPollAt;
    let newFriendRequest = false;
    let newMessage = false;
    try {
      const [friendsResult, requestResult] = await Promise.all([
        socialCall("GetFriendsList", {}),
        socialCloudScript("GetFriendRequests").catch(err => {
          return { Incoming: [], requestError: err.message };
        })
      ]);
      const friends = friendsResult.Friends || [];
      const incoming = requestResult.Incoming || [];
      const requestKeys = new Set(incoming.map(request => String(request.playFabId || request.PlayFabId || request.requestId || request.RequestId || `${request.username || request.Username || "Player"}:${request.createdAt || request.timestamp || ""}`)));
      const requestCheckFailed = Boolean(requestResult.requestError);
      if (!requestCheckFailed && baselineReadyAtStart && knownFriendRequestKeys) {
        newFriendRequest = [...requestKeys].some(key => !knownFriendRequestKeys.has(key));
      }
      if (!requestCheckFailed) knownFriendRequestKeys = requestKeys;
      snapshot.totalFriends = friends.length;
      snapshot.requests = requestCheckFailed ? socialSnapshot.requests : incoming.length;

      for (const friend of friends) {
        const id = friend.FriendPlayFabId || friend.PlayFabId;
        if (!id) continue;
        const username = friend.TitleDisplayName || friend.Username || "Player";
        let presence = null;
        try {
          const cached = presenceCache.get(id);
          if (cached && Date.now() - cached.checkedAt < 20000) {
            presence = cached.presence;
          } else {
            const result = await socialCall("GetUserData", { PlayFabId: id, Keys: ["lunaraPresence"] });
            presence = JSON.parse(result.Data?.lunaraPresence?.Value || "null");
            presenceCache.set(id, { presence, checkedAt: Date.now() });
          }
        } catch {}
        const online = !!presence && Date.now() - Number(presence.updatedAt) < 150000;
        const isActiveConversation = friendsRoot?.dataset.view === "chat" && friendsRoot.dataset.chat === id;
        let unread = 0;
        try {
          const groupId = isActiveConversation ? friendsRoot.dataset.group : await findChatGroup(id);
          if (groupId && !isActiveConversation) {
            const group = await socialCall("GetSharedGroupData", { SharedGroupId: groupId });
            const messages = Object.entries(group.Data || {}).filter(([key]) => key.startsWith("m_")).map(([key, record]) => {
              try { return { key, ...JSON.parse(record.Value) }; } catch { return null; }
            }).filter(Boolean).sort((a, b) => a.sentAt - b.sentAt).slice(-80);
            const messageKeys = new Set(messages.map(message => message.key));
            const knownKeys = knownMessageKeysByFriend.get(id);
            if (baselineReadyAtStart) {
              for (const message of messages) {
                if (message.sender === currentUser?.playFabId) continue;
                const unseenKey = knownKeys ? !knownKeys.has(message.key) : previousPollAt > 0 && Number(message.sentAt) > previousPollAt;
                const arrivedAfterLeavingChat = Number(message.sentAt) > (lastViewedDmAt.get(id) || 0);
                if (unseenKey && arrivedAfterLeavingChat) newMessage = true;
              }
            }
            knownMessageKeysByFriend.set(id, messageKeys);
            let lastRead = 0;
            try { lastRead = Number(localStorage.getItem(`lunara-read-${currentUser?.playFabId}-${id}`)) || 0; } catch {}
            unread = messages.reduce((count, msg) => msg.sender !== currentUser?.playFabId && Number(msg.sentAt) > lastRead ? count + 1 : count, 0);
            const latest = messages[messages.length - 1];
            if (latest) rememberRecentChat({ id, name: friend.TitleDisplayName || friend.Username || "Player", preview: `${latest.sender === currentUser?.playFabId ? "You: " : ""}${latest.text || ""}`, unread, touch: !knownKeys || !knownKeys.has(latest.key) });
          }
        } catch {}
        if (isActiveConversation) unread = 0;
        snapshot.unread += unread;
        if (online) { snapshot.online++; snapshot.onlineNames.push(username); }
        await new Promise(resolve => window.setTimeout(resolve, 180));
      }

      if (!requestCheckFailed && refreshPanel && friendsRoot?.dataset.view === "friends") {
        void loadFriends({ friendsResult, requestResult });
      }
      socialPollBaselineReady = true;
      lastSocialPollAt = Date.now();
      socialSnapshot = snapshot;
      renderChatDock();
      const count = snapshot.unread + snapshot.requests;
      const badge = root?.querySelector("[data-menu-badge]");
      if (badge) { badge.textContent = count > 99 ? "99+" : String(count); badge.hidden = count === 0; }
      const summary = root?.querySelector("[data-social-menu-summary]");
      if (summary) summary.textContent = `${snapshot.online} online · ${snapshot.unread} missed · ${snapshot.requests} requests`;

      if (notify && baselineReadyAtStart && (newFriendRequest || newMessage)) {
        const alerts = [];
        if (newFriendRequest) alerts.push("New friend request");
        if (newMessage) alerts.push("New message");
        if (newFriendRequest) playUiSound("notification");
        if (newMessage) playUiSound("message");
        showTabNotification(alerts.join(" · "));
        showSocialToast(alerts.join(" · "));
      }
      return snapshot;
    } catch (err) {
      socialSnapshot = snapshot;
      if (Date.now() - lastSocialPollErrorAt > 30000) {
        warn("Background messages and friend requests could not be refreshed:", err);
        lastSocialPollErrorAt = Date.now();
      }
      throw err;
    } finally {
      socialPollInFlight = false;
    }
  }

  function showSocialToast(message) {
    document.querySelector(".gd-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "gd-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = renderPlayFabName(message);
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    window.setTimeout(() => { toast.classList.remove("visible"); window.setTimeout(() => toast.remove(), 400); }, 5500);
  }

  function closeSettingsPanel() {
    root?.querySelector(".gd-settings-overlay")?.remove();
  }

  function openSettingsPanel() {
    if (!root) return;
    closeSettingsPanel();
    const overlay = document.createElement("div");
    overlay.className = "gd-settings-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `<section class="gd-settings-card" role="dialog" aria-modal="true" aria-labelledby="gd-settings-title"><header class="gd-settings-head"><div><h2 id="gd-settings-title">Settings</h2><p>Personal options saved in this browser.</p></div><button class="gd-settings-close" type="button" data-settings-close aria-label="Close settings"><svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></header><div class="gd-settings-list"><label class="gd-setting-row"><span class="gd-setting-copy"><strong>Interface sounds</strong><small>Play subtle sounds for clicks, messages, and notifications.</small></span><span class="gd-setting-switch"><input type="checkbox" data-setting="uiSounds" ${userSettings.uiSounds ? "checked" : ""}><i aria-hidden="true"></i></span></label><label class="gd-setting-row"><span class="gd-setting-copy"><strong>Animated background</strong><small>Show the moving WebGL wave behind the launcher.</small></span><span class="gd-setting-switch"><input type="checkbox" data-setting="animatedBackground" ${userSettings.animatedBackground ? "checked" : ""}><i aria-hidden="true"></i></span></label><label class="gd-setting-row"><span class="gd-setting-copy"><strong>Reduce motion</strong><small>Limit interface animations and keep the background still.</small></span><span class="gd-setting-switch"><input type="checkbox" data-setting="reduceMotion" ${userSettings.reduceMotion ? "checked" : ""}><i aria-hidden="true"></i></span></label></div><p class="gd-settings-status" data-settings-status role="status">Changes save automatically.</p></section>`;
    root.appendChild(overlay);
    overlay.querySelector("[data-settings-close]")?.focus();
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); closeSettingsPanel(); }
    });
  }

  function saveUserSettings() {
    try { localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings)); }
    catch (err) { warn("Could not save settings in browser storage:", err); }
  }

  function updateUserSetting(input) {
    const key = input?.dataset.setting;
    if (!Object.prototype.hasOwnProperty.call(userSettings, key)) return;
    userSettings[key] = Boolean(input.checked);
    saveUserSettings();
    state.sounds.enabled = userSettings.uiSounds;
    state.background.enabled = userSettings.animatedBackground;
    root?.classList.toggle("gd-reduced-motion", userSettings.reduceMotion);
    const canvas = root?.querySelector("#gd-bg-canvas");
    if (canvas) canvas.hidden = !userSettings.animatedBackground;
    if (key === "animatedBackground" || key === "reduceMotion") {
      if (stopBackground) { stopBackground(); stopBackground = null; }
      if (userSettings.animatedBackground && canvas) stopBackground = createBackground(canvas);
    }
    const status = root?.querySelector("[data-settings-status]");
    if (status) status.textContent = "Saved to this browser.";
  }

  function recentChatStorageKey() { return `lunara-recent-chats-${currentUser?.playFabId || ""}`; }

  function getRecentChats() {
    try {
      const items = JSON.parse(localStorage.getItem(recentChatStorageKey()) || "[]");
      return Array.isArray(items) ? items.filter(item => item && item.id) : [];
    } catch { return []; }
  }

  function getRecentChat(friendId) { return getRecentChats().find(item => item.id === friendId) || null; }

  function rememberRecentChat({ id, name, preview, unread = 0, touch = true }) {
    if (!id || !currentUser?.playFabId) return;
    const items = getRecentChats();
    const previous = items.find(item => item.id === id) || {};
    const next = {
      id,
      name: String(name || previous.name || "Player").slice(0, 80),
      preview: String(preview ?? previous.preview ?? "Open conversation").slice(0, 110),
      unread: Math.max(0, Number(unread) || 0),
      touchedAt: touch || !previous ? Date.now() : Number(previous.touchedAt) || Date.now()
    };
    const updated = [next, ...items.filter(item => item.id !== id)].sort((a, b) => b.touchedAt - a.touchedAt).slice(0, 4);
    try { localStorage.setItem(recentChatStorageKey(), JSON.stringify(updated)); } catch {}
    renderChatDock();
  }

  function renderChatDock() {
    if (!currentUser?.playFabId) return;
    let dock = document.getElementById("gd-chat-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "gd-chat-dock";
      dock.className = "gd-chat-dock";
      dock.setAttribute("aria-label", "Recent conversations");
      dock.addEventListener("click", event => {
        const button = event.target.closest("[data-dock-chat]");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        openRecentChat(button.dataset.dockChat);
      });
      document.body.appendChild(dock);
    }
    const chats = getRecentChats();
    dock.hidden = chats.length === 0;
    dock.innerHTML = chats.map(chat => `<button class="gd-chat-dock-item" type="button" data-dock-chat="${esc(chat.id)}"><span class="gd-chat-dock-name">${renderPlayFabName(chat.name)}</span><span class="gd-chat-dock-badge" ${chat.unread ? "" : "hidden"}>${chat.unread > 99 ? "99+" : esc(chat.unread)}</span><span class="gd-chat-dock-preview">${esc(chat.preview || "Open conversation")}</span></button>`).join("");
  }

  function openRecentChat(friendId) {
    const recent = getRecentChat(friendId);
    if (!friendsRoot) openFriendsPanel();
    void openChat(friendId, recent?.name || "Messages");
  }

  async function sendChat() {
    const input = friendsRoot?.querySelector("[data-chat-input]"); const text = input?.value.trim();
    if (!text) return;
    const msg = { sender: currentUser?.playFabId, senderName: currentUser?.displayName || currentUser?.username, text, sentAt: Date.now() };
    const key = `m_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    try {
      await socialCall("UpdateSharedGroupData", { SharedGroupId: friendsRoot.dataset.group, Data: { [key]: JSON.stringify(msg) }, Permission: "Private" });
      input.value = "";
      rememberRecentChat({ id: friendsRoot.dataset.chat, name: friendsRoot.querySelector(".gd-social-head h2")?.textContent || "Player", preview: `You: ${text}`, unread: 0 });
      await loadChat({ manual: true });
    }
    catch (err) { setSocialStatus(err.message || "Could not send message."); }
  }

  async function updatePresence(activity = currentActivity) {
    currentActivity = activity;
    try { await socialCall("UpdateUserData", { Data: { lunaraPresence: JSON.stringify({ activity: currentActivity, updatedAt: Date.now() }) }, Permission: "Public" }); }
    catch (err) { warn("Presence update failed:", err); }
  }

  function mount() {
    addStyles();
    setFavicon();
    root = ensureRoot();
    render();
    void updatePresence();
    if (socialRefreshTimer) clearInterval(socialRefreshTimer);
    socialRefreshTimer = setInterval(() => {
      if (!document.hidden) void updatePresence(currentActivity);
    }, 60000);
    if (socialPollTimer) clearInterval(socialPollTimer);
    void refreshSocialSummary({ notify: true, refreshPanel: true }).catch(() => {});
    socialPollTimer = window.setInterval(() => {
      if (!document.hidden && currentUser?.playFabId) {
        void refreshSocialSummary({ notify: true, refreshPanel: true }).catch(() => {});
      }
    }, 4500);
    root.addEventListener("click", event => {
      if (event.target.closest("button")) playUiSound("click", true);
      const menuToggle = event.target.closest("[data-menu-toggle]");
      if (menuToggle) {
        const wrap = menuToggle.closest(".gd-menu-wrap");
        const open = !wrap.classList.contains("is-open");
        wrap.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      } else if (!event.target.closest(".gd-menu-wrap")) {
        const wrap = root.querySelector(".gd-menu-wrap");
        wrap?.classList.remove("is-open");
        wrap?.querySelector("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");
      }
      const action = event.target.closest("[data-action]");
      if (action) {
        const name = action.dataset.action;
        if (name === "close") {
          if (gameDatabaseTimer) { clearInterval(gameDatabaseTimer); gameDatabaseTimer = null; }
          if (socialRefreshTimer) { clearInterval(socialRefreshTimer); socialRefreshTimer = null; }
          if (socialPollTimer) { clearInterval(socialPollTimer); socialPollTimer = null; }
          if (stockRefreshTimer) { clearInterval(stockRefreshTimer); stockRefreshTimer = null; }
          if (moderationPollTimer) { clearInterval(moderationPollTimer); moderationPollTimer = null; }
          if (moderationBanTimer) { clearInterval(moderationBanTimer); moderationBanTimer = null; }
          closeFriendsPanel();
          closeModerationPanel();
          closeFeedbackForm();
          moderationBanGate?.remove();moderationBanGate=null;
          void updatePresence("Offline");
          if (stopBackground) stopBackground();
          root.remove();
          document.getElementById("library-style")?.remove();
          document.getElementById("library-favicon")?.remove();
          window.__LIBRARY_RUNNING__ = false;
          log("Library closed.");
        }
        if (name === "home") window.scrollTo({ top: 0, behavior: "smooth" });
        if (name === "browse") root.querySelector("#gd-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const launch = event.target.closest("[data-launch]");
      if (launch) {
        const game = state.games[Number(launch.dataset.launch)];
        if (game) void launchGame(game);
      }
      const nav = event.target.closest("[data-nav]");
      if (nav && nav.dataset.nav !== "broadcast") {
        const wrap = root.querySelector(".gd-menu-wrap");
        wrap?.classList.remove("is-open");
        wrap?.querySelector("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");
      }
      const settingsOpen = event.target.closest("[data-settings-open]");
      if (settingsOpen) {
        const wrap = root.querySelector(".gd-menu-wrap");
        wrap?.classList.remove("is-open");
        wrap?.querySelector("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");
        openSettingsPanel();
      }
      if (event.target.closest("[data-settings-close]") || event.target.matches(".gd-settings-overlay")) closeSettingsPanel();
      if (event.target.closest('[data-nav="friends"]')) openFriendsPanel();
      if (event.target.closest('[data-nav="moderation"]')) openModerationPanel();
      if (event.target.closest('[data-nav="stock"]')) showStockPage();
      if (event.target.closest('[data-nav="games"]')) showGamesPage();
      if (event.target.closest('[data-nav="suggest"]')) openFeedbackForm("suggest");
      if (event.target.closest('[data-nav="report"]')) openFeedbackForm("bug");
      if(event.target.closest('[data-nav="broadcast"]')) {
        const panel=root.querySelector(".gd-broadcast-panel");
        if (!broadcastCanPost) showSocialToast(broadcastPermissionError || "Broadcast access requires the BR item from the Lunara catalog.");
        else if (panel) { panel.hidden=!panel.hidden; if(!panel.hidden){panel.scrollIntoView({behavior:"smooth",block:"nearest"});panel.querySelector("[data-broadcast-message]")?.focus();} }
      }
      const bs=event.target.closest("[data-broadcast-send]");if(bs)void publishBroadcast(bs);
      const stockOrder = event.target.closest("[data-stock-side]");
      if (stockOrder) void submitStockTrade(stockOrder);
    });
    root.addEventListener("change", event => {
      const setting = event.target.closest("[data-setting]");
      if (setting) updateUserSetting(setting);
    });
    root.addEventListener("pointerover", event => {
      const target = event.target.closest("button, .gd-game");
      if (!target || target.contains(event.relatedTarget)) return;
      if (target.matches(".gd-game") || !target.closest(".gd-game")) playUiSound("hover");
    });
    root.addEventListener("pointermove", event => {
      const card = event.target.closest(".gd-game");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--hover-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--hover-y", `${event.clientY - rect.top}px`);
    }, { passive: true });
    log("Library loaded successfully.");
    log("No on-page editor is included. Edit CONFIG near the top of this script to customize the entire Library.");
  }

  function cleanupLibrary() {
    if (gameDatabaseTimer) { clearInterval(gameDatabaseTimer); gameDatabaseTimer = null; }
    stopBroadcastTyping();
    if(broadcastCountdownTimer){clearInterval(broadcastCountdownTimer);broadcastCountdownTimer=null;}
    if(broadcastPollTimer){clearInterval(broadcastPollTimer);broadcastPollTimer=null;}
    if(broadcastSafeAreaTimer){clearTimeout(broadcastSafeAreaTimer);broadcastSafeAreaTimer=null;}
    document.body?.classList.remove("gd-broadcast-active");
    document.getElementById("gd-broadcast-banner")?.remove();
    if (authExpiryTimer) { clearTimeout(authExpiryTimer); authExpiryTimer = null; }
    if (socialRefreshTimer) { clearInterval(socialRefreshTimer); socialRefreshTimer = null; }
    if (socialPollTimer) { clearInterval(socialPollTimer); socialPollTimer = null; }
    if (stockRefreshTimer) { clearInterval(stockRefreshTimer); stockRefreshTimer = null; }
    if (moderationPollTimer) { clearInterval(moderationPollTimer); moderationPollTimer = null; }
    if (moderationBanTimer) { clearInterval(moderationBanTimer); moderationBanTimer = null; }
    closeFriendsPanel();
    closeModerationPanel();
    closeFeedbackForm();
    moderationBanGate?.remove();moderationBanGate=null;
    document.getElementById("gd-chat-dock")?.remove();
    void updatePresence("Offline");
    if (stopBackground) { stopBackground(); stopBackground = null; }
    root?.remove(); root = null;
    introRoot?.remove(); introRoot = null;
    authRoot?.remove(); authRoot = null;
    document.getElementById("library-style")?.remove();
    document.getElementById("lunara-noto-sans-mono-font")?.remove();
    document.getElementById("library-favicon")?.remove();
    if (uiAudioContext) { void uiAudioContext.close(); uiAudioContext = null; }
    window.__LIBRARY_RUNNING__ = false;
  }
  window.__LIBRARY_CLEANUP__ = cleanupLibrary;

  const libraryAddon = {
    run() {
      if (window.__LIBRARY_RUNNING__) return authRoot || introRoot || root || document.getElementById("library-root");
      window.__LIBRARY_RUNNING__ = true;
      try {
        if (!document.body) throw new Error("document.body is not available yet. Run this add-on after the page loads.");
        startGameDatabasePolling();
        startBroadcastPolling();
        void beginAuthentication();
        return authRoot || introRoot || root;
      } catch (err) {
        error("Library failed to load:", err);
        window.__LIBRARY_RUNNING__ = false;
        return null;
      }
    }
  };
  window.LibraryAddon = libraryAddon;
  if (!window.addon) window.addon = libraryAddon;

  try {
    if (!document.body) throw new Error("document.body is not available yet. Run this script after the page loads.");
    startGameDatabasePolling();
    startBroadcastPolling();
    void beginAuthentication();
  } catch (err) {
    error("Library failed to load:", err);
    window.__LIBRARY_RUNNING__ = false;
  }
})();
