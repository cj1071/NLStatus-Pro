// ==UserScript==
// @name         NodeLoc Enhance
// @namespace    https://www.nodeloc.com/
// @version      1.0.0
// @author       NL Enhance Team
// @description  信任级别追踪 · 阅读统计 · 能量值显示 · 排行榜 · 我的活动 · 关注粉丝
// @license      MIT
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAGnklEQVR42u3UWaxfVRXH8c/a5/c29sW6eAtgsWpICpx1jgQlaBRE4MShSAGKCp1eHAIGuMYNQSNGsU45CZGGwdUHBExgKBxxgNGgVk8jIJaou1t/Xe+/+fyduSJPNK+KS+u5HfOWesP67vXOtn+b/8L69zHttGBLbqFHYaqZbOxyVLzYSxzKqxV3b7jM+BlC6e2+FQlZuToKKvuVqLI1aRe7n7e4S+DfUq3Th8dudFkZZNq0dBxO650bzagRhJz9tdAhwFlKGvzHrZwpht27HSrzta2cSF7uXKroTm9Nk8V5fH21b8ZTNeo0/ZtrDalNu7p9jiQFSJRA9iwR9EW1U52I6kCrjETSMwGH8IH8alka6Xu1QmehDfjffhAYiqEkw8GYIzvFHl95bLDTa8eEiP6trjcZItu4Wyvd+doIIV8exWPK/JO7A5xHmyzAl9r4+ckLwnOWdJ17UC+7Yo4GEDF83AucWFwPvmVKXrKC91sVvV585HAWqwUbu3FT4M1fxJe5w7BNcTP8abg3BXFalMDd0CAYIKLcUjI0ydifsBtrYcnDeV0m/3D9Xofc10CFos8tmfQNv5tsv46A7cZw1xyczBbGbdIvw4P0OcBAaZmhPxHijuTCzs56vnqkHcdhis9fPJPnfNszYKmroqbBhzSYJ8SDD5uv5v/s8+k8r0i70iOf7IrHNPS7xMOCDCwPExxeMgnEDPBoyonFnnbXvWtvbts0I9fa3dNJNeFfGzliCIvSnbtxoqAPnh2sBZ3XOw5LnJXA3bQFhRsDu6u/AoPDk6atv4O5Fkj9ambTFfOtXnUIanBXOXSYHuw5XbFclNqB2A+ORaLY2lGljwYQGUlOLKK73TyecmTg/MLM734xZCPbJTe4q7lIhUOq+KLQybNb8Y8zOqRs8kPsQvPvN7Qr4yn5WAAnWyn8ePmH9oSbir8vPK+wq+TC4KjpvIT59pS16kqo5DHTVqC5p+CpZfbb95EME22BZtR1qo2NDkYwETZFzy38srCHypXd3xiyskD+bCeizv56sNMnnO7oWRLcESKWzp2VuJI8+42hIpDUwuwP9BWHBwghWA1uYl8eHDKF91yTsewF28MvpycU7joS44xYDFZxheSdwczjzGxRpVisXBjFUcFTnepM1yaB4MYAGZo/ZRX4bhTbG2B/sUhbsDJVXyX/PVJrm3/Rl6W4ndD9UVT8f32PTzVsj06IecRze/EBVd7lrH0M3PB3VMUEuB6nIZDBpgqsrUAp3by+ZV3Ftasiku6BjoRMwO5WDnmUmOH6GGY3Eg0+euqMr9X5xGW44AVCCR9yL8SP9FO0ZJY9BnP8DLJC6fivDl1jKUU54fc1zMMnpEszquOtuxW491F7XqeGjQYj65cvqQrv1g4vj7RHlSan9pYkjoYyBF+E/w96bA2sNnL7dLNPNDkkok4o+mTY/UrobeWQA05P1uGXbcxvzCnyz1Xcv5PvwXYc0argRH+e2e3QyaI11pkaGteROilS6VnFQ5InYVdwbWUMv/fZyaow4eTC1l58GC9IXlrkJLki2AUJDDFqQEshb0yOntO73aalVoWVobqCJhNyC6IEkMEfcRyuTbr1qiudUI80HR2qGsgXVRZG8pvJX6p4f8egsq0ggcSDZtQnNtjlTr52Vj2rJX9HbfODBbwzeQt+gHadAxO8MmmtcE2yJqSzHeEWg9WxHDd9c9hO9S/lyvbequS05OnYFwhgGVk5I/hW5UOd7Cbi+gZ1QfOXF5aSVml3oR80UoNWjqQrPDf5fbDaYb+wVjUrV0am0Suvm4qnrYj1a+UgObzQpdQBf8IjCz9q81bXyY+tKKes1/+xVWHDetN/9Rw7ENtxfLKudLIAZvA47BjwzwZln2KbVXfrTBpfCoUTgo8m29HhqAkKghuS5cqrijy7QXwvaFe8nZ38dC8uCTZ06ldTnNBxQ6lUvLcFvh6yld9PDtVrstXEB3Z8XYPRSt+3agxn5T/a99OSnYXtyVkbVZeZi0ts+m4nT2uJXlP4E8e20r9homxr8aOriOBEbayyeaq1IAWy/Rjc0w5/09mgt19J3HPN0sYmU9HWxFXkVYF7FG1O7jdQxV7tIIE9ipG02aprzaw+yMRIbbIEiIL2MK60uECBvUaKBJ/bcaEZqcOsOl3TwKeMQw7eZrYsi/ywTb7hmRpgdLL0lPVaMmmPQTzUarQ7IIJIolUmxqbpAQtn2rBwlvULr7C5+cMWtptt7zNNLe4+s+G9xNJ/y+7DZP8GZubrxKBU9lMAAAAASUVORK5CYII=
// @match        https://www.nodeloc.com/*
// @match        https://nodeloc.com/*
// @match        https://nodeloc.cc/*
// @connect      www.nodeloc.com
// @connect      nodeloc.com
// @connect      nodeloc.cc
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(e=>{if(typeof GM_addStyle=="function"){GM_addStyle(e);return}const n=document.createElement("style");n.textContent=e,document.head.append(n)})(" :root{--nle-bg: rgba(18, 19, 26, .97);--nle-bg-card: rgba(30, 32, 42, .85);--nle-txt: #e4e6f0;--nle-txt-mut: #8b8fa8;--nle-accent: #6366f1;--nle-accent-2: #8b5cf6;--nle-border: rgba(255, 255, 255, .06);--nle-glow: rgba(99, 102, 241, .15);--nle-ok: #34d399;--nle-err: #f87171;--nle-warn: #fbbf24;--nle-shadow: 0 8px 32px rgba(0, 0, 0, .4)}:root.nle-theme-light{--nle-bg: rgba(250, 251, 254, .97);--nle-bg-card: rgba(240, 241, 246, .85);--nle-txt: #1a1c2e;--nle-txt-mut: #6b6f88;--nle-border: rgba(0, 0, 0, .06);--nle-glow: rgba(99, 102, 241, .08);--nle-shadow: 0 8px 32px rgba(0, 0, 0, .1)}#nle-panel{position:fixed;top:80px;right:16px;z-index:99999;width:300px;max-height:calc(100vh - 100px);background:var(--nle-bg);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid var(--nle-border);border-radius:16px;box-shadow:var(--nle-shadow),0 0 0 1px var(--nle-border);color:var(--nle-txt);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;font-size:13px;display:flex;flex-direction:column;overflow:hidden;transition:opacity .3s,transform .3s;-webkit-user-select:none;user-select:none}#nle-panel.nle-collapsed{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;max-height:48px!important;border-radius:50%;cursor:pointer;touch-action:none;background:linear-gradient(135deg,var(--nle-accent),var(--nle-accent-2));border:none;box-shadow:var(--nle-shadow),0 0 20px var(--nle-glow)}#nle-panel.nle-collapsed .nle-hdr{padding:0;justify-content:center;align-items:center;height:100%;background:transparent;min-height:0}#nle-panel.nle-collapsed .nle-hdr-info{opacity:0;visibility:hidden;pointer-events:none;position:absolute}#nle-panel.nle-collapsed .nle-body{max-height:0!important;opacity:0;pointer-events:none;overflow:hidden}#nle-panel.nle-collapsed .nle-tab-nav{display:none}#nle-panel.nle-collapsed .nle-hdr-btns>button:not(.nle-toggle){opacity:0;visibility:hidden;pointer-events:none;transform:scale(.8);position:absolute}#nle-panel.nle-collapsed .nle-hdr-btns{justify-content:center;width:100%;height:100%;margin-left:0}#nle-panel.nle-collapsed,#nle-panel.nle-collapsed *{cursor:pointer!important}#nle-panel.nle-collapsed .nle-toggle{width:100%;height:100%;font-size:18px;background:transparent;display:flex;align-items:center;justify-content:center;color:#fff;position:absolute;top:0;right:0;bottom:0;left:0;margin:0;padding:0;box-sizing:border-box}#nle-panel.nle-collapsed .nle-toggle .nle-toggle-arrow{display:none}#nle-panel.nle-collapsed .nle-toggle .nle-toggle-logo{display:block;width:24px;height:24px;filter:brightness(1.05) drop-shadow(0 0 2px rgba(140,180,255,.2));transition:filter .2s ease,transform .2s ease;transform-origin:center center;will-change:transform,filter;pointer-events:none;-webkit-user-select:none;user-select:none;backface-visibility:hidden;-webkit-backface-visibility:hidden}#nle-panel:not(.nle-collapsed) .nle-toggle .nle-toggle-logo{display:none}@media(hover:hover){#nle-panel.nle-collapsed:hover{transform:scale(1.08);box-shadow:var(--nle-shadow),0 0 35px #6366f199}#nle-panel.nle-collapsed:hover .nle-toggle-logo{filter:brightness(1.6) drop-shadow(0 0 12px rgba(160,200,255,1)) drop-shadow(0 0 20px rgba(140,180,255,.8));transform:scale(1.15) rotate(360deg);transition:filter .3s ease,transform .6s ease}}#nle-panel.nle-collapsed:active .nle-toggle-logo{filter:brightness(2) drop-shadow(0 0 16px rgba(200,230,255,1)) drop-shadow(0 0 30px rgba(160,200,255,1));transform:scale(.92)}#nle-panel.nle-collapsed.no-hover-effect{transform:none!important}#nle-panel.nle-collapsed.no-hover-effect .nle-toggle-logo{filter:brightness(1.05) drop-shadow(0 0 2px rgba(140,180,255,.2))!important;transform:none!important}#nle-panel.no-trans,#nle-panel.no-trans *{transition:none!important}.nle-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;gap:8px;cursor:grab;flex-shrink:0;border-bottom:1px solid var(--nle-border);background:linear-gradient(135deg,var(--nle-glow),transparent)}.nle-hdr:active{cursor:grabbing}.nle-hdr-info{display:flex;align-items:center;gap:8px;overflow:hidden}.nle-hdr-logo{width:22px;height:22px;border-radius:6px;flex-shrink:0;transition:all .3s}.nle-hdr-title{font-weight:700;font-size:14px;color:var(--nle-txt);white-space:nowrap}.nle-hdr-ver{font-size:10px;color:var(--nle-txt-mut)}.nle-hdr-btns{display:flex;gap:4px;flex-shrink:0}.nle-hdr-btns button{width:28px;height:28px;border:none;border-radius:8px;background:#ffffff0d;color:var(--nle-txt-mut);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .2s}.nle-hdr-btns button:hover{background:#ffffff1a;color:var(--nle-txt)}.nle-tab-nav{display:flex;flex-shrink:0;border-bottom:1px solid var(--nle-border);padding:0 8px}.nle-tab{flex:1;padding:8px 4px;border:none;background:none;color:var(--nle-txt-mut);cursor:pointer;font-size:12px;text-align:center;transition:all .2s;border-bottom:2px solid transparent;white-space:nowrap}.nle-tab:hover{color:var(--nle-txt)}.nle-tab.active{color:var(--nle-accent);border-bottom-color:var(--nle-accent);font-weight:600}.nle-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}.nle-body::-webkit-scrollbar{width:4px}.nle-body::-webkit-scrollbar-thumb{background:#ffffff1a;border-radius:2px}.nle-section{display:none}.nle-section.active{display:block}.nle-trust-ring-wrap{display:flex;flex-direction:column;align-items:center;padding:8px 0}.nle-ring-bg{fill:none;stroke:#ffffff14}.nle-ring-fg{fill:none;stroke:var(--nle-accent);stroke-linecap:round;transform:rotate(-90deg);transform-box:fill-box;transform-origin:center;transition:stroke-dashoffset .6s ease}.nle-ring-text{font-size:22px;font-weight:700;fill:var(--nle-txt);text-anchor:middle;dominant-baseline:central}.nle-ring-label{font-size:10px;fill:var(--nle-txt-mut);text-anchor:middle}.nle-trust-level-badge{margin-top:4px;padding:2px 12px;border-radius:20px;background:linear-gradient(135deg,var(--nle-accent),var(--nle-accent-2));color:#fff;font-size:12px;font-weight:600}.nle-trust-user{margin-top:6px;font-size:13px;color:var(--nle-txt-mut)}.nle-req-list{margin-top:10px}.nle-req-item{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;margin-bottom:4px;border-radius:8px;background:var(--nle-bg-card);font-size:12px}.nle-req-item.met{opacity:.5}.nle-req-item.met .nle-req-check{color:var(--nle-ok)}.nle-req-name{flex:1}.nle-req-values{color:var(--nle-txt-mut);font-variant-numeric:tabular-nums;margin-right:6px}.nle-req-check{width:16px;text-align:center}.nle-req-bar-wrap{width:50px;height:3px;background:#ffffff14;border-radius:2px;overflow:hidden}.nle-req-bar{height:100%;background:var(--nle-accent);border-radius:2px;transition:width .4s ease}.nle-req-item.met .nle-req-bar{background:var(--nle-ok)}.nle-lb-subtabs{display:flex;gap:4px;margin-bottom:10px}.nle-lb-subtab{flex:1;padding:5px;border:1px solid var(--nle-border);border-radius:8px;background:none;color:var(--nle-txt-mut);cursor:pointer;font-size:12px;transition:all .2s}.nle-lb-subtab.active{border-color:var(--nle-accent);color:var(--nle-accent);background:var(--nle-glow)}.nle-lb-item{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;border-radius:8px;background:var(--nle-bg-card)}.nle-lb-rank{width:24px;text-align:center;font-weight:700;font-size:12px}.nle-lb-rank.gold{color:#fbbf24}.nle-lb-rank.silver{color:#94a3b8}.nle-lb-rank.bronze{color:#d97706}.nle-lb-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover}.nle-lb-name{flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nle-lb-score{font-weight:600;font-size:12px;color:var(--nle-accent)}.nle-lb-personal{padding:8px 10px;margin-bottom:8px;border-radius:10px;background:linear-gradient(135deg,var(--nle-glow),transparent);border:1px solid var(--nle-accent);display:flex;align-items:center;gap:8px;font-size:13px}.nle-lb-personal-rank{font-weight:700;color:var(--nle-accent)}.nle-activity-item{padding:8px 10px;margin-bottom:4px;border-radius:8px;background:var(--nle-bg-card);font-size:12px;cursor:pointer;transition:background .15s}.nle-activity-item:hover{background:#ffffff0d}.nle-activity-title{font-weight:500;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nle-activity-meta{color:var(--nle-txt-mut);font-size:11px}.nle-follow-stats{display:flex;gap:8px;margin-bottom:10px}.nle-follow-stat{flex:1;text-align:center;padding:8px;border-radius:8px;background:var(--nle-bg-card);cursor:pointer;transition:all .15s}.nle-follow-stat:hover{background:#ffffff0d}.nle-follow-stat.active{border:1px solid var(--nle-accent)}.nle-follow-num{font-size:20px;font-weight:700}.nle-follow-label{font-size:11px;color:var(--nle-txt-mut);margin-top:2px}.nle-follow-item{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;border-radius:8px;background:var(--nle-bg-card)}.nle-follow-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover}.nle-follow-name{flex:1;font-size:13px}.nle-reading-card{text-align:center;padding:14px;margin-bottom:10px;border-radius:12px;background:linear-gradient(135deg,var(--nle-glow),var(--nle-bg-card))}.nle-reading-today{font-size:28px;font-weight:700}.nle-reading-level{font-size:12px;color:var(--nle-txt-mut);margin-top:2px}.nle-reading-active{font-size:10px;margin-top:4px}.nle-reading-active.on{color:var(--nle-ok)}.nle-reading-active.off{color:var(--nle-txt-mut)}.nle-heatmap{display:flex;gap:3px;justify-content:center;margin-top:10px}.nle-heatmap-cell{width:12px;height:12px;border-radius:2px;background:#ffffff0d;transition:background .2s}.nle-heatmap-cell.h0{background:#ffffff08}.nle-heatmap-cell.h1{background:#6366f140}.nle-heatmap-cell.h2{background:#6366f180}.nle-heatmap-cell.h3{background:#6366f1b3}.nle-heatmap-cell.h4{background:#6366f1e6}.nle-heatmap-labels{display:flex;justify-content:space-between;font-size:9px;color:var(--nle-txt-mut);margin-top:3px}.nle-heatmap-bar{margin-top:6px;display:flex;align-items:center;gap:8px}.nle-heatmap-bar-fill{flex:1;height:3px;background:#ffffff14;border-radius:2px;overflow:hidden}.nle-heatmap-bar-inner{height:100%;background:var(--nle-accent);border-radius:2px;transition:width .3s}.nle-heatmap-bar-label{font-size:10px;color:var(--nle-txt-mut);white-space:nowrap}#nle-nav-energy{display:flex;align-items:center;gap:4px;padding:0 8px;cursor:pointer;position:relative}#nle-nav-energy svg{width:18px;height:18px}#nle-nav-energy svg path{stroke:var(--header_primary-low-mid, #9b9b9b)}.nle-nav-energy-value{font-size:13px;font-weight:700;color:var(--header_primary-low-mid, #9b9b9b);font-variant-numeric:tabular-nums}.nle-toast{position:fixed;bottom:24px;left:50%;transform:translate(-50%);padding:8px 20px;border-radius:20px;z-index:999999;background:var(--nle-bg);border:1px solid var(--nle-border);color:var(--nle-txt);font-size:13px;box-shadow:var(--nle-shadow);animation:nle-toast-in .3s ease,nle-toast-out .3s ease 2.2s forwards;pointer-events:none}@keyframes nle-toast-in{0%{opacity:0;transform:translate(-50%) translateY(8px)}to{opacity:1;transform:translate(-50%) translateY(0)}}@keyframes nle-toast-out{0%{opacity:1}to{opacity:0}}.nle-loading{text-align:center;padding:30px 0;color:var(--nle-txt-mut)}.nle-spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,.1);border-top-color:var(--nle-accent);border-radius:50%;animation:nle-spin .7s linear infinite;margin:0 auto 8px}@keyframes nle-spin{to{transform:rotate(360deg)}}.nle-empty{text-align:center;padding:30px 0;color:var(--nle-txt-mut);font-size:13px}@media(max-width:768px){#nle-panel{width:280px;right:6px;top:60px;font-size:12px}}@media(max-width:480px){#nle-panel{width:260px;right:2px;top:52px;border-radius:12px}.nle-tab{font-size:11px;padding:6px 2px}} ");

(function () {
  'use strict';

  const SITE_CONFIG = {
    domain: "www.nodeloc.com",
    name: "NodeLoc",
    icon: "https://www.nodeloc.com/uploads/default/optimized/2X/4/462daf57742c4efd87015ab0e11fb29b95915e56_2_32x32.png",
    origin: "https://www.nodeloc.com"
  };
  function detectSite() {
    const hostname = window.location.hostname;
    if (hostname === "www.nodeloc.com" || hostname === "nodeloc.com" || hostname === "nodeloc.cc") {
      return { ...SITE_CONFIG, origin: `https://${hostname}` };
    }
    return null;
  }
  const CURRENT_SITE = detectSite();
  const _prefix = "[NLE]";
  const Logger = {
    enable() {
    },
    disable() {
    },
    log(...args) {
    },
    warn(...args) {
      console.warn(_prefix, ...args);
    },
    error(...args) {
      console.error(_prefix, ...args);
    }
  };
  const _listeners = {};
  const EventBus = {
    on(event, fn) {
      (_listeners[event] = _listeners[event] || []).push(fn);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      const list = _listeners[event];
      if (list) {
        const i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
      }
    },
    emit(event, ...args) {
      const list = _listeners[event];
      if (list) {
        list.slice().forEach((fn) => {
          try {
            fn(...args);
          } catch (e) {
            console.warn("[NLE] EventBus error:", e);
          }
        });
      }
    },
    clear() {
      for (const k of Object.keys(_listeners)) delete _listeners[k];
    }
  };
  const _id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const _key = "nle_tab_leader";
  let _isLeader = false;
  let _heartbeatId = null;
  function tryBecomeLeader() {
    const now = Date.now();
    let current = {};
    try {
      const raw = localStorage.getItem(_key);
      if (raw) current = JSON.parse(raw);
    } catch {
    }
    const isExpired = !current.id || now - (current.heartbeat || 0) > 15e3;
    const isSelf = current.id === _id;
    if (isExpired || isSelf) {
      const wasLeader = _isLeader;
      _isLeader = true;
      localStorage.setItem(_key, JSON.stringify({ id: _id, heartbeat: now }));
      if (!wasLeader) {
        EventBus.emit("leader:changed", true);
      }
    } else if (_isLeader) {
      _isLeader = false;
      EventBus.emit("leader:changed", false);
    }
  }
  function heartbeat() {
    if (_isLeader) {
      localStorage.setItem(_key, JSON.stringify({ id: _id, heartbeat: Date.now() }));
    }
  }
  function onUnload() {
    if (_isLeader) localStorage.removeItem(_key);
    if (_heartbeatId !== null) clearInterval(_heartbeatId);
  }
  const TabLeader = {
    init() {
      tryBecomeLeader();
      _heartbeatId = setInterval(heartbeat, 5e3);
      window.addEventListener("beforeunload", onUnload);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) tryBecomeLeader();
      });
      window.addEventListener("storage", (e) => {
        if (e.key === _key) tryBecomeLeader();
      });
      return this;
    },
    isLeader() {
      return _isLeader;
    }
  };
  const CONFIG = {
    INTERVALS: {
      REFRESH: 3e5,
      READING_TRACK: 1e4,
      READING_SAVE: 3e4,
      READING_IDLE: 6e4,
      READING_UPDATE: 2e3,
      ENERGY_REFRESH: 3e4
    },
    CACHE: {
      MAX_HISTORY_DAYS: 365,
      LRU_SIZE: 50,
      VALUE_TTL: 5e3,
      LEADERBOARD_TTL: 6e5
    },
    NETWORK: {
      RETRY_COUNT: 3,
      RETRY_DELAY: 1e3,
      TIMEOUT: 15e3,
      MIN_REQUEST_INTERVAL: 300
    },
    TRUST_LEVEL_NAMES: ["青铜", "白银", "黄金", "钻石", "王者"],
    TRUST_LEVEL_COLORS: ["#94a3b8", "#60a5fa", "#34d399", "#fbbf24", "#ef4444"],
    TRUST_LEVEL_REQUIREMENTS: {
      1: {
        not_silenced: 1,
        not_suspended: 1,
        topics_entered: 10,
        posts_read_count: 100,
        time_read: 600 * 60
      },
      2: {
        not_silenced: 1,
        not_suspended: 1,
        topics_entered: 50,
        posts_read_count: 500,
        time_read: 3e3 * 60,
        days_visited: 30,
        post_count: 10,
        likes_given: 10,
        likes_received: 10
      },
      3: {
        not_silenced: 1,
        not_suspended: 1,
        days_visited: 60,
        topic_count: 100,
        topics_entered: 500,
        posts_read_count: 2e4,
        likes_given: 30,
        likes_received: 20
      },
      4: null
    },
    READING_LEVELS: [
      { min: 0, label: "初来乍到", icon: "🌱", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
      { min: 30, label: "渐入佳境", icon: "📖", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
      { min: 90, label: "乐在其中", icon: "📚", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
      { min: 180, label: "沉浸阅读", icon: "🔥", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
      { min: 300, label: "深度学习", icon: "⚡", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
      { min: 450, label: "NL达人", icon: "🏆", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
      { min: 600, label: "超级水怪", icon: "👑", color: "#ec4899", bg: "rgba(236,72,153,0.15)" }
    ],
    WEEKDAYS: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  };
  const PATTERNS = {
    USERNAME: /\/u\/([^/]+)/,
    AVATAR_SIZE: /\{size\}/g,
    NUMBER: /(\d+)/,
    TRUST_LEVEL_HDR: /信任级别|Trust Level/i
  };
  const _htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;"
  };
  const Utils = {
    escapeHtml(str) {
      if (!str) return "";
      return str.replace(/[&<>"']/g, (c) => _htmlEntities[c] || c);
    },
    sanitize(str, maxLen = 100) {
      if (!str) return "";
      return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").substring(0, maxLen).trim();
    },
    toSafeNumber(val, defaultVal = 0) {
      const num = Number(val);
      return Number.isFinite(num) ? num : defaultVal;
    },
    toSafeInt(val, defaultVal = 0) {
      const num = parseInt(String(val), 10);
      return Number.isFinite(num) ? num : defaultVal;
    },
    getTodayKey() {
      return (/* @__PURE__ */ new Date()).toDateString();
    },
    formatDate(ts, format = "short") {
      const d = new Date(ts);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      if (format === "short") return `${m}/${day}`;
      return `${m}月${day}日`;
    },
    formatReadingTime(minutes) {
      if (minutes < 1) return "< 1分钟";
      if (minutes < 60) return `${Math.round(minutes)}分钟`;
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return m > 0 ? `${h}小时${m}分` : `${h}小时`;
    },
    getReadingLevel(minutes) {
      const levels = CONFIG.READING_LEVELS;
      for (let i = levels.length - 1; i >= 0; i--) {
        if (minutes >= levels[i].min) return levels[i];
      }
      return levels[0];
    },
    getHeatmapLevel(minutes) {
      if (minutes < 1) return 0;
      if (minutes < 60) return 1;
      if (minutes < 180) return 2;
      if (minutes < 300) return 3;
      return 4;
    },
    throttle(fn, limit) {
      let lastTime = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastTime >= limit) {
          lastTime = now;
          fn.apply(this, args);
        }
      };
    },
    debounce(fn, wait) {
      let timer = null;
      const debounced = function(...args) {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          fn.apply(this, args);
        }, wait);
      };
      debounced.cancel = () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };
      return debounced;
    },
    safeCall(fn, fallback) {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
    formatRelativeTime(utcStr) {
      if (!utcStr) return "";
      const d = new Date(utcStr);
      const now = /* @__PURE__ */ new Date();
      const diff = (now.getTime() - d.getTime()) / 1e3;
      if (diff < 60) return "刚刚";
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      if (diff < 2592e3) return `${Math.floor(diff / 86400)}天前`;
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    },
    formatNumber(n) {
      if (!Number.isFinite(n)) return "--";
      return n.toLocaleString("zh-CN");
    },
    buildLetterAvatar(seed, size = 40) {
      const text = Utils.sanitize(String(seed || ""), 100) || "?";
      const char = (Array.from(text)[0] || "?").toUpperCase();
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
      }
      const hue = Math.abs(hash) % 360;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="hsl(${hue} 55% 50%)"/><text x="50" y="50" dy="0.02em" text-anchor="middle" dominant-baseline="middle" font-size="46" font-weight="700" fill="#fff">${char}</text></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  };
  const _getValue = typeof GM_getValue === "function" ? (k, d = null) => GM_getValue(k, d) : (k, d = null) => localStorage.getItem(k) ?? d;
  const _setValue = typeof GM_setValue === "function" ? (k, v) => {
    GM_setValue(k, v);
  } : (k, v) => {
    localStorage.setItem(k, v);
  };
  class Storage {
    constructor() {
      this._user = null;
      this._userResolved = false;
      this._keyCache = /* @__PURE__ */ new Map();
      this._writeQueue = /* @__PURE__ */ new Map();
      this._flushTimer = null;
    }
    _globalKey(key) {
      return `nle_${key}`;
    }
    _userKey(key) {
      const user = this.getUser();
      return user ? `nle_u_${user}_${key}` : this._globalKey(key);
    }
    get(key, defaultVal = null) {
      const k = this._userKey(key);
      if (this._keyCache.has(k) && Date.now() - this._keyCache.get(k)._t < CONFIG.CACHE.VALUE_TTL) {
        return this._keyCache.get(k).v;
      }
      const raw = _getValue(k, null);
      if (raw === null) return defaultVal;
      try {
        const parsed = JSON.parse(raw);
        this._keyCache.set(k, { v: parsed, _t: Date.now() });
        return parsed;
      } catch {
        return raw;
      }
    }
    set(key, value) {
      const k = this._userKey(key);
      this._keyCache.set(k, { v: value, _t: Date.now() });
      this._writeQueue.set(k, value);
      this._scheduleFlush();
    }
    setNow(key, value) {
      this.set(key, value);
      this._flushNow();
    }
    _scheduleFlush() {
      if (this._flushTimer) return;
      this._flushTimer = setTimeout(() => this._flushNow(), 1e3);
    }
    _flushNow() {
      if (this._flushTimer) {
        clearTimeout(this._flushTimer);
        this._flushTimer = null;
      }
      this._writeQueue.forEach((value, key) => {
        try {
          _setValue(key, typeof value === "string" ? value : JSON.stringify(value));
        } catch (e) {
          console.warn("[NLE] Storage flush error:", e);
        }
      });
      this._writeQueue.clear();
    }
    flush() {
      this._flushNow();
    }
    _normalizeUsername(username) {
      if (typeof username !== "string") return null;
      const cleaned = username.trim();
      if (!cleaned || cleaned.length > 60) return null;
      if (/[<>"'&]/.test(cleaned)) return null;
      return cleaned;
    }
    _getUserFromDiscourse() {
      return this._normalizeUsername(
        Utils.safeCall(() => {
          var _a, _b, _c, _d;
          return (_d = (_c = (_b = (_a = window.Discourse) == null ? void 0 : _a.User) == null ? void 0 : _b.current) == null ? void 0 : _c.call(_b)) == null ? void 0 : _d.username;
        }, null)
      );
    }
    _getUserFromDom() {
      const headerSelectors = [
        '.d-header .current-user a[href^="/u/"]',
        '.d-header .header-dropdown-toggle.current-user[href^="/u/"]',
        ".d-header .user-menu button[data-user-card]",
        '.d-header .user-menu-wrapper a[href^="/u/"]',
        '.d-header .h-user-wrapper a[href^="/u/"]'
      ];
      for (const sel of headerSelectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const card = el.getAttribute("data-user-card");
        const name = this._normalizeUsername(card);
        if (name) return name;
        const href = el.getAttribute("href") || "";
        const match = href.match(PATTERNS.USERNAME);
        const fromHref = this._normalizeUsername((match == null ? void 0 : match[1]) || "");
        if (fromHref) return fromHref;
      }
      return null;
    }
    _isAnon() {
      const cls = document.documentElement.classList;
      return (cls == null ? void 0 : cls.contains("anon")) ?? false;
    }
    getUser() {
      if (this._userResolved) return this._user;
      this._userResolved = true;
      const live = this._getUserFromDiscourse() || this._getUserFromDom();
      if (live) {
        this._user = live;
        return live;
      }
      if (this._isAnon()) {
        this._user = null;
        return null;
      }
      const cached = this._normalizeUsername(_getValue(this._globalKey("currentUser"), null));
      if (cached) {
        this._user = cached;
        return cached;
      }
      this._user = null;
      return null;
    }
    setUser(username) {
      const name = this._normalizeUsername(username);
      this._user = name;
      this._userResolved = true;
      if (name) _setValue(this._globalKey("currentUser"), name);
    }
  }
  const _Network = class _Network {
    constructor() {
      this._apiCache = /* @__PURE__ */ new Map();
      this._apiCacheTime = /* @__PURE__ */ new Map();
    }
    static queueRequest(requestFn) {
      return new Promise((resolve, reject) => {
        _Network._requestQueue.push({ requestFn, resolve, reject });
        _Network._processQueue();
      });
    }
    static async _processQueue() {
      if (_Network._isProcessing || _Network._requestQueue.length === 0) return;
      _Network._isProcessing = true;
      while (_Network._requestQueue.length > 0) {
        const { requestFn, resolve, reject } = _Network._requestQueue.shift();
        const elapsed = Date.now() - _Network._lastRequestTime;
        if (elapsed < CONFIG.NETWORK.MIN_REQUEST_INTERVAL) {
          await new Promise((r) => setTimeout(r, CONFIG.NETWORK.MIN_REQUEST_INTERVAL - elapsed));
        }
        _Network._lastRequestTime = Date.now();
        try {
          resolve(await requestFn());
        } catch (e) {
          reject(e);
        }
      }
      _Network._isProcessing = false;
    }
    static isRateLimited() {
      if (!_Network._rateLimitedAt) return false;
      if (Date.now() - _Network._rateLimitedAt >= 12e4) {
        _Network._rateLimitedAt = 0;
        return false;
      }
      return true;
    }
    static recordRateLimit() {
      _Network._rateLimitedAt = Date.now();
    }
    static buildAuthHeaders(url) {
      var _a;
      const headers = {};
      try {
        const u = new URL(url, location.href);
        if (u.hostname.includes("nodeloc")) {
          headers["X-Requested-With"] = "XMLHttpRequest";
          headers["Discourse-Logged-In"] = "true";
          headers["Discourse-Present"] = "true";
          const csrf = (_a = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : _a.content;
          if (csrf) headers["X-CSRF-Token"] = csrf;
        }
      } catch {
      }
      return headers;
    }
    async fetchJSON(url, options = {}) {
      const { timeout = CONFIG.NETWORK.TIMEOUT, headers: extraHeaders = {}, cacheTtl = 0 } = options;
      const cacheKey = `${url}`;
      if (cacheTtl > 0 && this._apiCache.has(cacheKey)) {
        if (Date.now() - (this._apiCacheTime.get(cacheKey) || 0) < cacheTtl) {
          return this._apiCache.get(cacheKey);
        }
      }
      if (_Network.isRateLimited()) {
        throw new Error("请求过于频繁，请稍后重试");
      }
      return _Network.queueRequest(async () => {
        const headers = {
          "Accept": "application/json",
          ..._Network.buildAuthHeaders(url),
          ...extraHeaders
        };
        if (!CURRENT_SITE) throw new Error("站点未识别");
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), timeout);
          const resp = await fetch(url, {
            headers,
            credentials: "include",
            signal: controller.signal
          });
          clearTimeout(t);
          if (resp.status === 429) {
            _Network.recordRateLimit();
            throw new Error("请求过于频繁");
          }
          if (resp.status === 403) throw new Error("需要登录后查看");
          if (!resp.ok) throw new Error(`请求失败 (${resp.status})`);
          const data = await resp.json();
          if (cacheTtl > 0) {
            this._apiCache.set(cacheKey, data);
            this._apiCacheTime.set(cacheKey, Date.now());
          }
          return data;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") throw new Error("请求超时");
          throw e;
        }
      });
    }
    clearCache() {
      this._apiCache.clear();
      this._apiCacheTime.clear();
    }
  };
  _Network._requestQueue = [];
  _Network._isProcessing = false;
  _Network._lastRequestTime = 0;
  _Network._rateLimitedAt = 0;
  let Network = _Network;
  class NetworkError extends Error {
    constructor(message, code = "UNKNOWN", status = 0) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }
  const ErrorFormatter = {
    format(e) {
      if (e instanceof NetworkError) return e.message;
      if (e instanceof Error) return e.message;
      return "未知错误";
    },
    withIcon(e) {
      const msg = this.format(e);
      if (msg.includes("登录")) return "🔒 " + msg;
      if (msg.includes("频繁")) return "⏳ " + msg;
      if (msg.includes("超时")) return "⏰ " + msg;
      return "⚠️ " + msg;
    }
  };
  const labelMap = {
    not_silenced: "未被禁言",
    not_suspended: "未被封禁",
    topics_entered: "浏览话题",
    posts_read_count: "阅读帖子",
    time_read: "阅读时长",
    days_visited: "访问天数",
    post_count: "回复帖子",
    topic_count: "回复话题",
    likes_given: "送出点赞",
    likes_received: "收到点赞"
  };
  class TrustLevelParser {
    constructor(_network) {
      this._network = _network;
    }
    _isRestricted(user, keys) {
      return keys.some((key) => {
        const val = user[key];
        if (typeof val === "boolean") return val;
        if (typeof val === "number") return val > 0;
        if (typeof val === "string") return val.length > 0;
        return val != null;
      });
    }
    async fetchCurrentStats(username) {
      if (!CURRENT_SITE) return null;
      try {
        const [summaryData, profileData] = await Promise.all([
          this._network.fetchJSON(`${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/summary.json`, { cacheTtl: 3e5 }),
          this._network.fetchJSON(`${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}.json`, { cacheTtl: 3e5 })
        ]);
        const summary = summaryData == null ? void 0 : summaryData.user_summary;
        if (!summary) throw new Error("无法获取用户统计");
        const user = (profileData == null ? void 0 : profileData.user) || {};
        const isSilenced = this._isRestricted(user, ["silenced", "silenced_till", "silence_reason"]);
        const isSuspended = this._isRestricted(user, ["suspended", "suspended_till", "suspended_at", "suspend_reason"]);
        return {
          topics_entered: Utils.toSafeInt(summary.topics_entered),
          posts_read_count: Utils.toSafeInt(summary.posts_read_count),
          days_visited: Utils.toSafeInt(summary.days_visited),
          time_read: Utils.toSafeInt(summary.time_read),
          likes_given: Utils.toSafeInt(summary.likes_given),
          likes_received: Utils.toSafeInt(summary.likes_received),
          topic_count: Utils.toSafeInt(summary.topic_count),
          post_count: Utils.toSafeInt(summary.post_count),
          recent_time_read: Utils.toSafeInt(summary.recent_time_read),
          not_silenced: isSilenced ? 0 : 1,
          not_suspended: isSuspended ? 0 : 1
        };
      } catch (e) {
        console.warn("[NLE] Failed to fetch summary stats:", e.message);
        return null;
      }
    }
    async fetchUserProfile(username) {
      var _a;
      if (!CURRENT_SITE) return null;
      try {
        const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}.json`;
        const data = await this._network.fetchJSON(url, { cacheTtl: 3e5 });
        const user = data == null ? void 0 : data.user;
        if (!user) throw new Error("无法获取用户信息");
        return {
          trust_level: Utils.toSafeInt(user.trust_level),
          gamification_score: Utils.toSafeInt(user.gamification_score),
          avatar: ((_a = user.avatar_template) == null ? void 0 : _a.replace(PATTERNS.AVATAR_SIZE, "/120/")) || "",
          title: user.title || "",
          name: user.name || "",
          username: user.username || username
        };
      } catch (e) {
        console.warn("[NLE] Failed to fetch user profile:", e.message);
        return null;
      }
    }
    getRequirements(currentLevel) {
      if (currentLevel >= 4) return null;
      return CONFIG.TRUST_LEVEL_REQUIREMENTS[currentLevel + 1] || null;
    }
    buildRequirementItems(currentStats, currentLevel) {
      const reqs = this.getRequirements(currentLevel);
      if (!reqs) return [];
      if (!currentStats) return [];
      return Object.entries(reqs).map(([key, required]) => {
        const current = currentStats[key] || 0;
        const isStatus = key === "not_silenced" || key === "not_suspended";
        let display = current;
        if (key === "time_read") display = Math.floor(current / 60);
        else if (isStatus) display = current >= required ? 1 : 0;
        const requirementDisplay = key === "time_read" ? Math.floor(required / 60) : required;
        return {
          key,
          name: labelMap[key] || key,
          current: display,
          required: requirementDisplay,
          isSuccess: current >= required,
          progress: Math.min(1, required > 0 ? current / required : 0)
        };
      });
    }
    getCompletionPercent(items) {
      if (!items.length) return 100;
      const totalProgress = items.reduce((sum, item) => sum + Math.max(0, Math.min(1, item.progress)), 0);
      return Math.round(totalProgress / items.length * 1e3) / 10;
    }
  }
  class LeaderboardFetcher {
    constructor(_network) {
      this._network = _network;
    }
    async fetchEnergyLeaderboard() {
      var _a;
      if (!CURRENT_SITE) return { personal: null, users: [] };
      try {
        const url = `${CURRENT_SITE.origin}/leaderboard/2.json`;
        const data = await this._network.fetchJSON(url, { cacheTtl: CONFIG.CACHE.LEADERBOARD_TTL });
        return {
          personal: ((_a = data == null ? void 0 : data.personal) == null ? void 0 : _a.user) || (data == null ? void 0 : data.personal) || null,
          users: ((data == null ? void 0 : data.users) || []).slice(0, 50)
        };
      } catch {
        return { personal: null, users: [] };
      }
    }
    async fetchPostingLeaderboard() {
      var _a;
      if (!CURRENT_SITE) return { personal: null, users: [] };
      try {
        const url = `${CURRENT_SITE.origin}/leaderboard/3.json`;
        const data = await this._network.fetchJSON(url, { cacheTtl: CONFIG.CACHE.LEADERBOARD_TTL });
        return {
          personal: ((_a = data == null ? void 0 : data.personal) == null ? void 0 : _a.user) || (data == null ? void 0 : data.personal) || null,
          users: ((data == null ? void 0 : data.users) || []).slice(0, 50)
        };
      } catch {
        return { personal: null, users: [] };
      }
    }
  }
  class ActivityFetcher {
    constructor(_network) {
      this._network = _network;
    }
    async fetchBookmarks(username, page = 0) {
      var _a, _b;
      if (!CURRENT_SITE) return { bookmarks: [], more: false };
      try {
        const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/bookmarks.json?page=${page}`;
        const data = await this._network.fetchJSON(url);
        return {
          bookmarks: ((_a = data == null ? void 0 : data.user_bookmark_list) == null ? void 0 : _a.bookmarks) || [],
          more: ((_b = data == null ? void 0 : data.user_bookmark_list) == null ? void 0 : _b.more_bookmarks_url) != null
        };
      } catch {
        return { bookmarks: [], more: false };
      }
    }
    async fetchNotifications(_username) {
      if (!CURRENT_SITE) return [];
      try {
        const url = `${CURRENT_SITE.origin}/notifications.json?recent=true&limit=30`;
        const data = await this._network.fetchJSON(url);
        return (data == null ? void 0 : data.notifications) || [];
      } catch {
        return [];
      }
    }
    async fetchActivity(username, offset = 0) {
      if (!CURRENT_SITE) return { actions: [], more: false };
      try {
        const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/activity.json?offset=${offset}&limit=30`;
        const data = await this._network.fetchJSON(url);
        return {
          actions: (data == null ? void 0 : data.user_actions) || [],
          more: ((data == null ? void 0 : data.user_actions) || []).length >= 30
        };
      } catch {
        return { actions: [], more: false };
      }
    }
  }
  class FollowFetcher {
    constructor(_network) {
      this._network = _network;
    }
    async fetchFollowing(username) {
      if (!CURRENT_SITE) return [];
      try {
        const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/follow/following`;
        const data = await this._network.fetchJSON(url);
        return (data == null ? void 0 : data.users) || [];
      } catch {
        return [];
      }
    }
    async fetchFollowers(username) {
      if (!CURRENT_SITE) return [];
      try {
        const url = `${CURRENT_SITE.origin}/u/${encodeURIComponent(username)}/follow/followers`;
        const data = await this._network.fetchJSON(url);
        return (data == null ? void 0 : data.users) || [];
      } catch {
        return [];
      }
    }
  }
  class ReadingTracker {
    constructor(_storage) {
      this._storage = _storage;
      this.isActive = true;
      this._lastActivity = Date.now();
      this._lastSave = Date.now();
      this._intervals = [];
      this._tracking = false;
      this._initialized = false;
      this._yearCache = null;
      this._yearCacheTime = 0;
    }
    init(username) {
      if (this._initialized) return;
      this._bindEvents();
      this._startTracking();
      this._initialized = true;
      console.log("[NLE] ReadingTracker initialized for:", username || "anonymous");
    }
    _bindEvents() {
      this._activityHandler = Utils.throttle(() => this._onActivity(), 1e3);
      this._highFreqHandler = Utils.throttle(() => this._onActivity(), 3e3);
      for (const e of ["mousedown", "keydown", "click", "touchstart", "pointerdown"]) {
        document.addEventListener(e, this._activityHandler, { passive: true, capture: true });
      }
      for (const e of ["mousemove", "scroll", "wheel", "touchmove", "pointermove"]) {
        document.addEventListener(e, this._highFreqHandler, { passive: true, capture: true });
      }
      this._visibilityHandler = () => {
        if (document.hidden) {
          this.save();
          this.isActive = false;
        } else {
          this._lastActivity = Date.now();
          this.isActive = true;
        }
      };
      document.addEventListener("visibilitychange", this._visibilityHandler);
      this._pageShowHandler = () => {
        this._lastActivity = Date.now();
        this.isActive = true;
      };
      this._pageHideHandler = () => {
        this.save();
        this.isActive = false;
      };
      window.addEventListener("pageshow", this._pageShowHandler);
      window.addEventListener("pagehide", this._pageHideHandler);
      this._focusHandler = () => {
        this._lastActivity = Date.now();
        this.isActive = true;
      };
      this._blurHandler = () => {
        this.save();
      };
      window.addEventListener("focus", this._focusHandler);
      window.addEventListener("blur", this._blurHandler);
      document.addEventListener("focus", this._focusHandler);
      this._beforeUnloadHandler = () => this.save();
      window.addEventListener("beforeunload", this._beforeUnloadHandler);
    }
    _onActivity() {
      if (!this.isActive) this.isActive = true;
      this._lastActivity = Date.now();
    }
    _startTracking() {
      if (this._tracking) return;
      this._tracking = true;
      let lastCheck = Date.now();
      this._intervals.push(
        setInterval(() => {
          const now = Date.now();
          const gap = now - lastCheck;
          if (gap > CONFIG.INTERVALS.READING_TRACK * 3) {
            this.isActive = false;
            this._lastActivity = now;
            this._lastSave = now;
            lastCheck = now;
            return;
          }
          lastCheck = now;
          const idle = now - this._lastActivity;
          if (this.isActive && idle > CONFIG.INTERVALS.READING_IDLE) {
            this.isActive = false;
          }
        }, CONFIG.INTERVALS.READING_TRACK),
        setInterval(() => this.save(), CONFIG.INTERVALS.READING_SAVE)
      );
    }
    save() {
      if (!this._storage.getUser()) return;
      const todayKey = Utils.getTodayKey();
      const now = Date.now();
      const elapsed = (now - this._lastSave) / 1e3;
      const idle = now - this._lastActivity;
      if (elapsed < 0 || elapsed > 120 || idle < 0) {
        this._lastSave = now;
        this._lastActivity = now;
        this.isActive = false;
        return;
      }
      let toAdd = 0;
      if (elapsed > 0) {
        toAdd = idle <= CONFIG.INTERVALS.READING_IDLE ? elapsed : Math.max(0, elapsed - (idle - CONFIG.INTERVALS.READING_IDLE) / 1e3);
        toAdd = Math.min(toAdd, CONFIG.INTERVALS.READING_SAVE / 1e3 * 1.5);
      }
      this._lastSave = now;
      if (!TabLeader.isLeader()) return;
      let stored = this._storage.get("readingTime", null);
      if (!(stored == null ? void 0 : stored.dailyData)) {
        stored = { dailyData: {}, monthlyCache: {}, yearlyCache: {} };
      }
      let today = stored.dailyData[todayKey] || { totalMinutes: 0 };
      const minutes = toAdd / 60;
      if (minutes > 0.05) {
        today.totalMinutes += minutes;
        stored.dailyData[todayKey] = today;
        const d = new Date(todayKey);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const yKey = `${d.getFullYear()}`;
        stored.monthlyCache[mKey] = (stored.monthlyCache[mKey] || 0) + minutes;
        stored.yearlyCache[yKey] = (stored.yearlyCache[yKey] || 0) + minutes;
        this._yearCache = null;
      }
      this._storage.set("readingTime", stored);
    }
    getTodayTime() {
      var _a, _b;
      const stored = this._storage.get("readingTime", null);
      const saved = ((_b = (_a = stored == null ? void 0 : stored.dailyData) == null ? void 0 : _a[Utils.getTodayKey()]) == null ? void 0 : _b.totalMinutes) || 0;
      const now = Date.now();
      const elapsed = (now - this._lastSave) / 1e3;
      const idle = now - this._lastActivity;
      let unsaved = 0;
      if (idle <= CONFIG.INTERVALS.READING_IDLE) {
        unsaved = elapsed / 60;
      } else {
        unsaved = Math.max(0, elapsed - (idle - CONFIG.INTERVALS.READING_IDLE) / 1e3) / 60;
      }
      return saved + Math.max(0, unsaved);
    }
    getWeekHistory() {
      var _a, _b;
      const result = [];
      const now = /* @__PURE__ */ new Date();
      const stored = this._storage.get("readingTime", null);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        result.push({
          date: key,
          label: Utils.formatDate(d.getTime()),
          day: CONFIG.WEEKDAYS[d.getDay()],
          minutes: i === 0 ? this.getTodayTime() : ((_b = (_a = stored == null ? void 0 : stored.dailyData) == null ? void 0 : _a[key]) == null ? void 0 : _b.totalMinutes) || 0,
          isToday: i === 0
        });
      }
      return result;
    }
    getYearData() {
      const now = Date.now();
      if (this._yearCache && now - this._yearCacheTime < 5e3) return this._yearCache;
      const today = /* @__PURE__ */ new Date();
      const year = today.getFullYear();
      const stored = this._storage.get("readingTime", null);
      const daily = (stored == null ? void 0 : stored.dailyData) || {};
      const result = /* @__PURE__ */ new Map();
      for (const [key, data] of Object.entries(daily)) {
        if (new Date(key).getFullYear() === year) result.set(key, data.totalMinutes || 0);
      }
      result.set(Utils.getTodayKey(), this.getTodayTime());
      this._yearCache = result;
      this._yearCacheTime = now;
      return result;
    }
    destroy() {
      this._intervals.forEach((id) => clearInterval(id));
      this._intervals = [];
      this._tracking = false;
      if (this._activityHandler) {
        for (const e of ["mousedown", "keydown", "click", "touchstart", "pointerdown"]) {
          document.removeEventListener(e, this._activityHandler, { passive: true, capture: true });
        }
        for (const e of ["mousemove", "scroll", "wheel", "touchmove", "pointermove"]) {
          document.removeEventListener(e, this._highFreqHandler, { passive: true, capture: true });
        }
      }
      if (this._visibilityHandler) document.removeEventListener("visibilitychange", this._visibilityHandler);
      if (this._pageShowHandler) window.removeEventListener("pageshow", this._pageShowHandler);
      if (this._pageHideHandler) window.removeEventListener("pagehide", this._pageHideHandler);
      if (this._focusHandler) {
        window.removeEventListener("focus", this._focusHandler);
        document.removeEventListener("focus", this._focusHandler);
      }
      if (this._blurHandler) window.removeEventListener("blur", this._blurHandler);
      if (this._beforeUnloadHandler) window.removeEventListener("beforeunload", this._beforeUnloadHandler);
      this.save();
    }
  }
  class Notifier {
    constructor(_storage) {
      this._storage = _storage;
    }
    checkMilestones(reqs) {
      const achieved = this._storage.get("nle_milestones", {});
      let changed = false;
      for (const r of reqs) {
        if (r.isSuccess && !achieved[r.key]) {
          achieved[r.key] = Date.now();
          changed = true;
          this._notify(`恭喜！「${r.name}」已达标`, `你的${r.name}已经达到${r.current}，满足升级要求`);
        }
      }
      if (changed) this._storage.set("nle_milestones", achieved);
    }
    _notify(title, body) {
      try {
        if (typeof GM_notification === "function") {
          GM_notification({ title, text: body, timeout: 5e3 });
        }
      } catch {
      }
    }
  }
  const Screen = {
    _cache: null,
    _cacheTime: 0,
    getWidth() {
      var _a;
      const now = Date.now();
      if (this._cache !== null && now - this._cacheTime < 200) return this._cache;
      this._cache = ((_a = window.visualViewport) == null ? void 0 : _a.width) || window.innerWidth;
      this._cacheTime = now;
      return this._cache;
    },
    isMobile() {
      return this.getWidth() <= 600;
    },
    isTablet() {
      return this.getWidth() <= 900 && this.getWidth() > 600;
    },
    getPanelConfig() {
      const w = this.getWidth();
      if (w <= 480) return { width: 260, fontSize: 12, ringSize: 80 };
      if (w <= 768) return { width: 280, fontSize: 13, ringSize: 100 };
      if (w >= 1920) return { width: 340, fontSize: 15, ringSize: 140 };
      return { width: 300, fontSize: 14, ringSize: 120 };
    }
  };
  class Renderer {
    constructor(_panel) {
      this._panel = _panel;
    }
    get $() {
      return this._panel.$;
    }
    renderTrustLevel(user, _stats, reqItems, pct) {
      const cfg = Screen.getPanelConfig();
      const r = cfg.ringSize / 2 - 8;
      const circ = 2 * Math.PI * r;
      const clampedPct = Math.max(0, Math.min(100, pct));
      const off = circ * (1 - clampedPct / 100);
      const colors = CONFIG.TRUST_LEVEL_COLORS;
      const levelNames = CONFIG.TRUST_LEVEL_NAMES;
      const currentLevel = (user == null ? void 0 : user.trust_level) || 0;
      const color = colors[currentLevel] || colors[0];
      const currentLevelName = levelNames[currentLevel] || "未知";
      const nextLevel = Math.min(currentLevel + 1, levelNames.length - 1);
      const nextLevelName = levelNames[nextLevel] || "未知";
      const isMaxLevel = currentLevel >= levelNames.length - 1;
      const displayPct = clampedPct.toFixed(1);
      const currentLevelLabel = `Lv${currentLevel} · ${currentLevelName}`;
      this.$.trustRing.innerHTML = `
      <svg width="${cfg.ringSize}" height="${cfg.ringSize}" class="nle-ring-svg">
        <circle cx="${cfg.ringSize / 2}" cy="${cfg.ringSize / 2}" r="${r}" class="nle-ring-bg" stroke-width="8"/>
        <circle cx="${cfg.ringSize / 2}" cy="${cfg.ringSize / 2}" r="${r}" class="nle-ring-fg"
          stroke-width="8" stroke="${color}"
          stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
        <text x="${cfg.ringSize / 2}" y="${cfg.ringSize / 2 - 6}" class="nle-ring-text">${displayPct}%</text>
        <text x="${cfg.ringSize / 2}" y="${cfg.ringSize / 2 + 14}" class="nle-ring-label">${currentLevelLabel}</text>
      </svg>
    `;
      this.$.trustBadge.textContent = isMaxLevel ? `Lv${currentLevel} · 已达最高等级` : `Lv${currentLevel} → Lv${nextLevel} · ${nextLevelName}`;
      this.$.trustBadge.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
      this.$.trustUser.textContent = (user == null ? void 0 : user.name) || (user == null ? void 0 : user.username) || "--";
      let reqHTML = "";
      if (reqItems.length === 0) {
        reqHTML = '<div class="nle-empty">🎉 已达成最高等级</div>';
      } else {
        for (const item of reqItems) {
          const cls = item.isSuccess ? "met" : "";
          const check = item.isSuccess ? "✓" : "○";
          const values = item.required <= 1 && (item.key === "not_silenced" || item.key === "not_suspended") ? "" : `${item.current}/${item.required}`;
          reqHTML += `
          <div class="nle-req-item ${cls}">
            <span class="nle-req-name">${Utils.escapeHtml(item.name)}</span>
            <span class="nle-req-values">${values}</span>
            <div class="nle-req-bar-wrap"><div class="nle-req-bar" style="width:${Math.round(item.progress * 100)}%"></div></div>
            <span class="nle-req-check">${check}</span>
          </div>
        `;
        }
      }
      this.$.reqList.innerHTML = reqHTML;
    }
    renderReading(minutes, isActive) {
      const level = Utils.getReadingLevel(minutes);
      this.$.readingToday.textContent = Utils.formatReadingTime(minutes);
      this.$.readingLevel.textContent = `${level.icon} ${level.label}`;
      this.$.readingLevel.style.color = level.color;
      const actEl = this.$.readingActive;
      actEl.textContent = isActive ? "● 正在阅读" : "○ 未活动";
      actEl.className = "nle-reading-active " + (isActive ? "on" : "off");
      const week = this._panel.tracker.getWeekHistory();
      let cellsHTML = "";
      for (const d of week) {
        const hLevel = Utils.getHeatmapLevel(d.minutes);
        cellsHTML += `<div class="nle-heatmap-cell h${hLevel}" title="${d.day} ${Utils.formatReadingTime(d.minutes)}"></div>`;
      }
      this.$.heatmapGrid.innerHTML = cellsHTML;
      this.$.heatmapLabels.innerHTML = week.map((d) => `<span>${d.day[1]}</span>`).join("");
      const goalHours = this._panel.storage.get("nle_readingGoalHours", null) || 0;
      if (goalHours > 0) {
        const goalMin = goalHours * 60;
        const progress = Math.min(100, Math.round(minutes / goalMin * 100));
        this.$.readingGoalBar.innerHTML = `
        <div class="nle-heatmap-bar-fill"><div class="nle-heatmap-bar-inner" style="width:${progress}%"></div></div>
        <span class="nle-heatmap-bar-label">${progress}%</span>
      `;
        this.$.readingGoalBar.style.display = "flex";
      } else {
        this.$.readingGoalBar.style.display = "none";
      }
    }
    renderLeaderboard(data, type) {
      const users = (data == null ? void 0 : data.users) || [];
      const personal = data == null ? void 0 : data.personal;
      let html = "";
      if (personal && personal.position) {
        html += `
        <div class="nle-lb-personal">
          <span>🏅</span>
          <span class="nle-lb-personal-rank">#${personal.position}</span>
          <span>${Utils.escapeHtml(personal.username || "你")}</span>
          <span style="flex:1"></span>
          <span style="font-weight:700;color:var(--nle-accent)">${Utils.formatNumber(personal.total_score)}</span>
        </div>
      `;
      }
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const rank = u.position || i + 1;
        let rankCls = "";
        if (rank === 1) rankCls = "gold";
        else if (rank === 2) rankCls = "silver";
        else if (rank === 3) rankCls = "bronze";
        let avatar;
        if (u.avatar_template && CURRENT_SITE) {
          avatar = `${CURRENT_SITE.origin}${u.avatar_template.replace(PATTERNS.AVATAR_SIZE, "/40/")}`;
        } else {
          avatar = Utils.buildLetterAvatar(u.username);
        }
        html += `
        <div class="nle-lb-item">
          <span class="nle-lb-rank ${rankCls}">${rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : String(rank)}</span>
          <img class="nle-lb-avatar" src="${avatar}" loading="lazy" onerror="this.src='${Utils.buildLetterAvatar(u.username)}'">
          <span class="nle-lb-name">${Utils.escapeHtml(u.name || u.username)}</span>
          <span class="nle-lb-score">${Utils.formatNumber(u.total_score)}</span>
        </div>
      `;
      }
      this.$[type === "energy" ? "energyLb" : "postingLb"].innerHTML = html || '<div class="nle-empty">暂无数据</div>';
    }
    renderActivity(items) {
      let html = "";
      for (const a of items) {
        const title = a.title || a.excerpt || a.topic_title || "";
        const time = Utils.formatRelativeTime(a.created_at || a.updated_at || "");
        const actionType = a.action_type || a.notification_type;
        let icon = "📄";
        if (actionType === 2) icon = "❤️";
        else if (actionType === 5) icon = "💬";
        else if (actionType === 6) icon = "✏️";
        else if (actionType === 9) icon = "🔖";
        html += `
        <div class="nle-activity-item" data-topic-id="${a.topic_id || ""}">
          <div class="nle-activity-title">${icon} ${Utils.escapeHtml(Utils.sanitize(title, 80))}</div>
          <div class="nle-activity-meta">${time}</div>
        </div>
      `;
      }
      return html || '<div class="nle-empty">暂无活动记录</div>';
    }
    renderFollowList(users) {
      let html = "";
      for (const u of users) {
        let avatar;
        if (u.avatar_template && CURRENT_SITE) {
          avatar = `${CURRENT_SITE.origin}${u.avatar_template.replace(PATTERNS.AVATAR_SIZE, "/40/")}`;
        } else {
          avatar = Utils.buildLetterAvatar(u.username);
        }
        html += `
        <div class="nle-follow-item" data-username="${Utils.escapeHtml(u.username)}">
          <img class="nle-follow-avatar" src="${avatar}" loading="lazy" onerror="this.src='${Utils.buildLetterAvatar(u.username)}'">
          <span class="nle-follow-name">${Utils.escapeHtml(u.name || u.username)}</span>
        </div>
      `;
      }
      return html || '<div class="nle-empty">暂无数据</div>';
    }
    showToast(msg) {
      const el = document.createElement("div");
      el.className = "nle-toast";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  }
  class NavBarEnergy {
    constructor(network) {
      this._el = null;
      this._valueEl = null;
      this._timer = null;
      this._network = network;
    }
    inject() {
      const navBar = document.querySelector("ul.d-header-icons");
      if (!navBar || this._el) return;
      const li = document.createElement("li");
      li.id = "nle-nav-energy";
      li.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M31 4H16L10 27H18L14 44L40 16H28L31 4Z" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 11L19 19" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <span class="nle-nav-energy-value">--</span>
    `;
      navBar.insertBefore(li, navBar.firstChild);
      this._el = li;
      this._valueEl = li.querySelector(".nle-nav-energy-value");
    }
    async update() {
      var _a, _b;
      if (!this._valueEl || !CURRENT_SITE) return;
      try {
        const data = await this._network.fetchJSON(
          `${CURRENT_SITE.origin}/leaderboard/2.json`,
          { cacheTtl: 3e4 }
        );
        const score = (_b = (_a = data == null ? void 0 : data.personal) == null ? void 0 : _a.user) == null ? void 0 : _b.total_score;
        if (score !== void 0 && score !== null) {
          this._valueEl.textContent = Utils.formatNumber(score);
        }
      } catch {
        this._valueEl.textContent = "--";
      }
    }
    startAutoRefresh() {
      this.update();
      this._timer = setInterval(() => this.update(), CONFIG.INTERVALS.ENERGY_REFRESH);
    }
    stop() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    }
  }
  const DRAG_THRESHOLD = 5;
  class Panel {
    constructor() {
      this._els = {};
      this._destroyed = false;
      this._loading = false;
      this._activeTab = "trust";
      this._activeLbType = "energy";
      this._activeFollowTab = "following";
      this._user = null;
      this._reqItems = [];
      this._lastPct = 0;
      this._collapsed = false;
      this._themeMode = "auto";
      this._energyLoaded = false;
      this._postingLoaded = false;
      this._activityType = "bookmarks";
      this._activityOffset = 0;
      this._activityList = [];
      this._followingList = [];
      this._followersList = [];
      this._refreshTimer = null;
      this._readingTimer = null;
      this._dragging = false;
      this._moved = false;
      this._ox = 0;
      this._oy = 0;
      this._sx = 0;
      this._sy = 0;
      this._dragStartStyles = null;
      this.storage = new Storage();
      this._network = new Network();
      this._trustParser = new TrustLevelParser(this._network);
      this._lbFetcher = new LeaderboardFetcher(this._network);
      this._activityFetcher = new ActivityFetcher(this._network);
      this._followFetcher = new FollowFetcher(this._network);
      this.tracker = new ReadingTracker(this.storage);
      this._notifier = new Notifier(this.storage);
      this._renderer = new Renderer(this);
      this._navEnergy = new NavBarEnergy(this._network);
      this._initDOM();
      this._initTheme();
      this._bindEvents();
      this._initTimers();
      if (this.storage.get("nle_collapsed")) {
        this._toggleCollapse(true);
      }
      requestAnimationFrame(() => {
        this._restorePosition();
      });
      this.fetch();
    }
    get $() {
      return this._els;
    }
    isMounted() {
      return !!this._el && document.body.contains(this._el);
    }
    /* ─── DOM ─── */
    _initDOM() {
      if (!CURRENT_SITE) return;
      this._el = document.createElement("div");
      this._el.id = "nle-panel";
      this._el.setAttribute("role", "complementary");
      this._el.innerHTML = `
      <div class="nle-hdr">
        <div class="nle-hdr-info">
          <img src="${CURRENT_SITE.icon}" alt="NL" class="nle-hdr-logo">
          <div>
            <div class="nle-hdr-title">NodeLoc</div>
            <div class="nle-hdr-ver">v${"1.0.0"}</div>
          </div>
        </div>
        <div class="nle-hdr-btns">
          <button id="nle-btn-refresh" title="刷新">🔄</button>
          <button id="nle-btn-theme" title="切换主题">🌓</button>
          <button class="nle-toggle" id="nle-btn-toggle" title="折叠面板">
            <span class="nle-toggle-arrow">◀</span>
            <img class="nle-toggle-logo" src="${CURRENT_SITE.icon}" alt="NL" draggable="false">
          </button>
        </div>
      </div>
      <div class="nle-tab-nav">
        <button class="nle-tab active" data-tab="trust">📊 信任</button>
        <button class="nle-tab" data-tab="leaderboard">🏆 排行</button>
        <button class="nle-tab" data-tab="activity">📋 活动</button>
        <button class="nle-tab" data-tab="follows">👥 关注</button>
      </div>
      <div class="nle-body">
        <div class="nle-section active" id="nle-sec-trust">
          <div class="nle-trust-ring-wrap" id="nle-trustRing"></div>
          <div id="nle-trustBadge" class="nle-trust-level-badge" style="text-align:center">--</div>
          <div id="nle-trustUser" class="nle-trust-user" style="text-align:center"></div>
          <div class="nle-reading-card">
            <div class="nle-reading-today" id="nle-readingToday">0分钟</div>
            <div class="nle-reading-level" id="nle-readingLevel">--</div>
            <div class="nle-reading-active off" id="nle-readingActive">○ 未活动</div>
            <div class="nle-heatmap" id="nle-heatmapGrid"></div>
            <div class="nle-heatmap-labels" id="nle-heatmapLabels"></div>
            <div class="nle-heatmap-bar" id="nle-readingGoalBar" style="display:none"></div>
          </div>
          <div class="nle-req-list" id="nle-reqList"></div>
        </div>
        <div class="nle-section" id="nle-sec-leaderboard">
          <div class="nle-lb-subtabs">
            <button class="nle-lb-subtab active" data-lb-tab="energy">⚡ 能量榜</button>
            <button class="nle-lb-subtab" data-lb-tab="posting">💧 水王榜</button>
          </div>
          <div id="nle-energyLb"></div>
          <div id="nle-postingLb" style="display:none"></div>
        </div>
        <div class="nle-section" id="nle-sec-activity">
          <div class="nle-lb-subtabs">
            <button class="nle-lb-subtab active" data-activity-type="bookmarks">🔖 书签</button>
            <button class="nle-lb-subtab" data-activity-type="notifications">🔔 通知</button>
            <button class="nle-lb-subtab" data-activity-type="all">📋 全部</button>
          </div>
          <div id="nle-activityList"></div>
          <div id="nle-activityMore" style="text-align:center;padding:10px;display:none">
            <button id="nle-activityLoadmore" style="border:1px solid var(--nle-border);background:var(--nle-bg-card);color:var(--nle-txt);padding:4px 16px;border-radius:12px;cursor:pointer;font-size:12px">加载更多</button>
          </div>
        </div>
        <div class="nle-section" id="nle-sec-follows">
          <div class="nle-follow-stats">
            <div class="nle-follow-stat active" data-follow-tab="following">
              <div class="nle-follow-num" id="nle-followingCount">--</div>
              <div class="nle-follow-label">关注</div>
            </div>
            <div class="nle-follow-stat" data-follow-tab="followers">
              <div class="nle-follow-num" id="nle-followersCount">--</div>
              <div class="nle-follow-label">粉丝</div>
            </div>
          </div>
          <div id="nle-followList"></div>
        </div>
      </div>
    `;
      document.body.appendChild(this._el);
      const ids = [
        "trustRing",
        "trustBadge",
        "trustUser",
        "reqList",
        "readingToday",
        "readingLevel",
        "readingActive",
        "heatmapGrid",
        "heatmapLabels",
        "readingGoalBar",
        "energyLb",
        "postingLb",
        "activityList",
        "activityMore",
        "followingCount",
        "followersCount",
        "followList"
      ];
      for (const id of ids) {
        this._els[id] = this._el.querySelector(`#nle-${id}`);
      }
    }
    /* ─── Theme ─── */
    _initTheme() {
      const saved = this.storage.get("nle_themeMode", null);
      this._applyTheme(saved || "auto");
    }
    _applyTheme(mode) {
      this._themeMode = mode;
      this.storage.set("nle_themeMode", mode);
      const isDark = mode === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : mode === "dark";
      document.documentElement.classList.toggle("nle-theme-light", !isDark);
    }
    /* ─── Events ─── */
    _bindEvents() {
      this._el.querySelector("#nle-btn-refresh").addEventListener("click", () => this.fetch());
      this._el.querySelector("#nle-btn-theme").addEventListener("click", () => {
        const modes = ["auto", "dark", "light"];
        const idx = modes.indexOf(this._themeMode);
        this._applyTheme(modes[(idx + 1) % modes.length]);
        const label = this._themeMode === "auto" ? "跟随系统" : this._themeMode === "dark" ? "深色" : "浅色";
        this._renderer.showToast(`主题: ${label}`);
      });
      this._el.querySelector("#nle-btn-toggle").addEventListener("click", (e) => {
        e.stopPropagation();
        this._toggleCollapse();
      });
      for (const t of this._el.querySelectorAll(".nle-tab")) {
        t.addEventListener("click", () => this._switchTab(t.dataset.tab));
      }
      for (const t of this._el.querySelectorAll(".nle-lb-subtab")) {
        t.addEventListener("click", () => {
          const lbType = t.dataset.lbTab;
          this._activeLbType = lbType;
          for (const b of t.parentElement.querySelectorAll(".nle-lb-subtab")) b.classList.remove("active");
          t.classList.add("active");
          this._els.energyLb.style.display = lbType === "energy" ? "" : "none";
          this._els.postingLb.style.display = lbType === "posting" ? "" : "none";
          if (lbType === "posting" && !this._postingLoaded) this._loadPostingLeaderboard();
        });
      }
      for (const t of this._el.querySelectorAll("[data-activity-type]")) {
        t.addEventListener("click", () => {
          for (const b of t.parentElement.querySelectorAll("[data-activity-type]")) b.classList.remove("active");
          t.classList.add("active");
          this._activityType = t.dataset.activityType;
          this._activityOffset = 0;
          this._loadActivity();
        });
      }
      this._el.querySelector("#nle-activityLoadmore").addEventListener("click", () => this._loadActivity(true));
      for (const s of this._el.querySelectorAll(".nle-follow-stat")) {
        s.addEventListener("click", () => {
          const tab = s.dataset.followTab;
          this._activeFollowTab = tab;
          for (const fs of this._el.querySelectorAll(".nle-follow-stat")) fs.classList.remove("active");
          s.classList.add("active");
          this._loadFollowList();
        });
      }
      this._themeMediaListener = (e) => {
        if (this._themeMode === "auto") {
          document.documentElement.classList.toggle("nle-theme-light", !e.matches);
        }
      };
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this._themeMediaListener);
      this._resizeHandler = Utils.debounce(() => {
        if (this._user && this._reqItems.length > 0) {
          this._renderer.renderTrustLevel(this._user, null, this._reqItems, this._lastPct);
        }
      }, 300);
      window.addEventListener("resize", this._resizeHandler);
      window.addEventListener("orientationchange", this._resizeHandler);
      this._onDragStart = (e) => this._startDrag(e);
      this._onDragMove = (e) => this._updateDrag(e);
      this._onDragEnd = () => this._endDrag();
      this._el.querySelector(".nle-hdr").addEventListener("mousedown", (e) => {
        if (!this._el.classList.contains("nle-collapsed")) this._startDrag(e);
      });
      this._el.addEventListener("mousedown", (e) => {
        if (this._el.classList.contains("nle-collapsed")) this._startDrag(e);
      });
      document.addEventListener("mousemove", this._onDragMove);
      document.addEventListener("mouseup", this._onDragEnd);
      this._onTouchEnd = () => {
        const wasDragging = this._dragging;
        const isCollapsed = this._el.classList.contains("nle-collapsed");
        this._endDrag();
        if (wasDragging && !this._moved && isCollapsed) this._toggleCollapse();
        if (isCollapsed && wasDragging) {
          this._el.classList.add("no-hover-effect");
          setTimeout(() => this._el.classList.remove("no-hover-effect"), 50);
        }
      };
      this._el.querySelector(".nle-hdr").addEventListener("touchstart", (e) => {
        if (!this._el.classList.contains("nle-collapsed")) this._startDrag(e);
      }, { passive: false });
      this._el.addEventListener("touchstart", (e) => {
        if (this._el.classList.contains("nle-collapsed")) this._startDrag(e);
      }, { passive: false });
      document.addEventListener("touchmove", this._onDragMove, { passive: false });
      document.addEventListener("touchend", this._onTouchEnd);
      document.addEventListener("touchcancel", this._onTouchEnd);
    }
    /* ─── Timers ─── */
    _initTimers() {
      this._refreshTimer = setInterval(() => {
        if (!this._destroyed && TabLeader.isLeader()) this.fetch();
      }, CONFIG.INTERVALS.REFRESH);
      this._readingTimer = setInterval(() => {
        if (!this._destroyed) {
          const mins = this.tracker.getTodayTime();
          this._renderer.renderReading(mins, this.tracker.isActive);
        }
      }, CONFIG.INTERVALS.READING_UPDATE);
    }
    /* ─── Tabs ─── */
    _switchTab(tab) {
      this._activeTab = tab;
      for (const t of this._el.querySelectorAll(".nle-tab")) {
        t.classList.toggle("active", t.dataset.tab === tab);
      }
      for (const s of this._el.querySelectorAll(".nle-section")) {
        s.classList.toggle("active", s.id === `nle-sec-${tab}`);
      }
      if (tab === "leaderboard") this._loadLeaderboard();
      else if (tab === "activity") this._loadActivity();
      else if (tab === "follows") this._loadFollows();
    }
    /* ─── Collapse ─── */
    _toggleCollapse(initCollapsed = false) {
      if (!initCollapsed) this._collapsed = !this._collapsed;
      else this._collapsed = true;
      this._el.classList.add("no-trans");
      this._el.classList.toggle("nle-collapsed", this._collapsed);
      this.storage.set("nle_collapsed", this._collapsed);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._el.classList.remove("no-trans");
        });
      });
    }
    /* ─── Drag ─── */
    _startDrag(e) {
      const isCollapsed = this._el.classList.contains("nle-collapsed");
      if (!isCollapsed && (e.target.closest("button") || e.target.closest(".nle-tab"))) return;
      const getPos = (ev) => {
        const tev = ev;
        if (tev.touches) return { x: tev.touches[0].clientX, y: tev.touches[0].clientY };
        const mev = ev;
        return { x: mev.clientX, y: mev.clientY };
      };
      const p = getPos(e);
      this._dragging = true;
      this._moved = false;
      const rect = this._el.getBoundingClientRect();
      this._dragStartStyles = {
        left: this._el.style.left,
        right: this._el.style.right,
        top: this._el.style.top
      };
      this._el.classList.add("no-trans");
      this._el.style.left = rect.left + "px";
      this._el.style.right = "auto";
      this._ox = p.x - rect.left;
      this._oy = p.y - rect.top;
      this._sx = p.x;
      this._sy = p.y;
      e.preventDefault();
    }
    _updateDrag(e) {
      if (!this._dragging) return;
      const tev = e;
      const p = tev.touches ? { x: tev.touches[0].clientX, y: tev.touches[0].clientY } : { x: e.clientX, y: e.clientY };
      if (Math.abs(p.x - this._sx) > DRAG_THRESHOLD || Math.abs(p.y - this._sy) > DRAG_THRESHOLD) {
        this._moved = true;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const w = this._el.offsetWidth;
      const h = this._el.offsetHeight;
      const maxLeft = Math.max(margin, vw - w - margin);
      const maxTop = Math.max(margin, vh - h - margin);
      this._el.style.left = Math.max(margin, Math.min(p.x - this._ox, maxLeft)) + "px";
      this._el.style.top = Math.max(margin, Math.min(p.y - this._oy, maxTop)) + "px";
    }
    _endDrag() {
      if (!this._dragging) return;
      this._dragging = false;
      this._el.classList.remove("no-trans");
      if (!this._moved) {
        if (this._dragStartStyles) {
          this._el.style.left = this._dragStartStyles.left;
          this._el.style.right = this._dragStartStyles.right;
          this._el.style.top = this._dragStartStyles.top;
        }
        this._dragStartStyles = null;
        return;
      }
      this._dragStartStyles = null;
      const rect = this._el.getBoundingClientRect();
      const vw = window.innerWidth;
      const centerX = rect.left + rect.width / 2;
      const alignRight = centerX > vw / 2;
      if (alignRight) {
        this._el.style.right = Math.round(vw - rect.right) + "px";
        this._el.style.left = "auto";
      }
      this._savePosition();
    }
    _savePosition() {
      const rect = this._el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const centerX = rect.left + rect.width / 2;
      const alignRight = centerX > vw / 2;
      let anchorX;
      if (alignRight) {
        anchorX = Math.round(parseFloat(this._el.style.right) || vw - rect.right);
      } else {
        anchorX = Math.round(parseFloat(this._el.style.left) || rect.left);
      }
      this.storage.set("nle_panelPosition", {
        topRatio: vh > 0 ? Math.max(0, Math.min(1, rect.top / vh)) : 0,
        anchorX,
        alignRight
      });
    }
    _restorePosition() {
      const pos = this.storage.get("nle_panelPosition", null);
      if (!pos) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const isCollapsed = this._el.classList.contains("nle-collapsed");
      const panelWidth = isCollapsed ? 48 : this._el.offsetWidth;
      const panelHeight = isCollapsed ? 48 : this._el.offsetHeight;
      let anchorX = pos.anchorX || 16;
      const alignRight = pos.alignRight !== false;
      const maxX = Math.max(margin, vw - panelWidth - margin);
      anchorX = Math.max(margin, Math.min(anchorX, maxX));
      if (pos.topRatio !== void 0) {
        const maxTop = Math.max(margin, vh - panelHeight - margin);
        this._el.style.top = Math.max(margin, Math.min(Math.round(pos.topRatio * vh), maxTop)) + "px";
      }
      if (alignRight) {
        this._el.style.right = anchorX + "px";
        this._el.style.left = "auto";
      } else {
        this._el.style.left = anchorX + "px";
        this._el.style.right = "auto";
      }
    }
    /* ─── Data Fetching ─── */
    async fetch() {
      if (this._loading) return;
      this._loading = true;
      const username = this.storage.getUser();
      if (!username) {
        this._showLoginPrompt();
        this._loading = false;
        return;
      }
      this.storage.setUser(username);
      try {
        const [profile, stats] = await Promise.all([
          this._trustParser.fetchUserProfile(username),
          this._trustParser.fetchCurrentStats(username)
        ]);
        if (!profile) {
          this._showLoginPrompt();
          this._loading = false;
          return;
        }
        this._user = profile;
        const reqItems = this._trustParser.buildRequirementItems(stats, profile.trust_level);
        const pct = this._trustParser.getCompletionPercent(reqItems);
        this._reqItems = reqItems;
        this._lastPct = pct;
        this._renderer.renderTrustLevel(profile, stats, reqItems, pct);
        this.tracker.init(username);
        this._notifier.checkMilestones(reqItems);
      } catch (e) {
        console.warn("[NLE] Fetch error:", e.message);
        this._showError(ErrorFormatter.withIcon(e));
      } finally {
        this._loading = false;
      }
    }
    async _loadLeaderboard() {
      try {
        const data = await this._lbFetcher.fetchEnergyLeaderboard();
        this._renderer.renderLeaderboard(data, "energy");
        this._energyLoaded = true;
      } catch {
      }
    }
    async _loadPostingLeaderboard() {
      try {
        const data = await this._lbFetcher.fetchPostingLeaderboard();
        this._renderer.renderLeaderboard(data, "posting");
        this._postingLoaded = true;
      } catch {
      }
    }
    async _loadActivity(loadMore = false) {
      if (!loadMore) this._activityOffset = 0;
      const username = this.storage.getUser();
      if (!username) return;
      const type = this._activityType || "bookmarks";
      try {
        let items = [];
        let hasMore = false;
        if (type === "bookmarks") {
          const result = await this._activityFetcher.fetchBookmarks(username, this._activityOffset);
          items = result.bookmarks.map((b) => ({
            topic_id: b.topic_id,
            title: b.title || b.name || "书签",
            excerpt: "",
            created_at: b.updated_at,
            action_type: 9
          }));
          hasMore = result.more;
        } else if (type === "notifications") {
          items = await this._activityFetcher.fetchNotifications(username);
        } else {
          const result = await this._activityFetcher.fetchActivity(username, this._activityOffset);
          items = result.actions;
          hasMore = result.more;
        }
        if (loadMore) {
          this._activityList = [...this._activityList, ...items];
        } else {
          this._activityList = items;
        }
        this._els.activityList.innerHTML = this._renderer.renderActivity(this._activityList);
        this._els.activityMore.style.display = hasMore ? "" : "none";
        for (const item of this._els.activityList.querySelectorAll(".nle-activity-item")) {
          item.addEventListener("click", () => {
            const tid = item.dataset.topicId;
            if (tid && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/t/topic/${tid}`, "_blank");
          });
        }
        this._activityOffset++;
      } catch {
      }
    }
    async _loadFollows() {
      const username = this.storage.getUser();
      if (!username) return;
      try {
        const [following, followers] = await Promise.all([
          this._followFetcher.fetchFollowing(username),
          this._followFetcher.fetchFollowers(username)
        ]);
        this._followingList = following;
        this._followersList = followers;
        this._els.followingCount.textContent = String(following.length);
        this._els.followersCount.textContent = String(followers.length);
        this._loadFollowList();
      } catch {
      }
    }
    _loadFollowList() {
      const users = this._activeFollowTab === "following" ? this._followingList : this._followersList;
      this._els.followList.innerHTML = this._renderer.renderFollowList(users || []);
      for (const item of this._els.followList.querySelectorAll(".nle-follow-item")) {
        item.addEventListener("click", () => {
          const uname = item.dataset.username;
          if (uname && CURRENT_SITE) window.open(`${CURRENT_SITE.origin}/u/${uname}`, "_blank");
        });
      }
    }
    /* ─── States ─── */
    _showLoginPrompt() {
      this._els.trustRing.innerHTML = "";
      this._els.trustBadge.textContent = "未登录";
      this._els.trustUser.textContent = "";
      this._els.reqList.innerHTML = '<div class="nle-empty">🔒 请先登录 NodeLoc 论坛</div>';
      this._els.readingToday.textContent = "--";
      this._els.readingLevel.textContent = "";
    }
    _showError(msg) {
      if (this._els.reqList) {
        this._els.reqList.innerHTML = `<div class="nle-empty">${Utils.escapeHtml(msg)}</div>`;
      }
      this._renderer.showToast(msg);
    }
    /* ─── Cleanup ─── */
    destroy() {
      var _a, _b, _c, _d, _e;
      if (this._destroyed) return;
      this._destroyed = true;
      if (this._refreshTimer) clearInterval(this._refreshTimer);
      if (this._readingTimer) clearInterval(this._readingTimer);
      (_a = this.tracker) == null ? void 0 : _a.destroy();
      (_b = this._navEnergy) == null ? void 0 : _b.stop();
      (_c = this.storage) == null ? void 0 : _c.flush();
      if ((_d = this._resizeHandler) == null ? void 0 : _d.cancel) this._resizeHandler.cancel();
      window.removeEventListener("resize", this._resizeHandler);
      window.removeEventListener("orientationchange", this._resizeHandler);
      if (this._themeMediaListener) {
        window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", this._themeMediaListener);
      }
      if (this._onDragMove) {
        document.removeEventListener("mousemove", this._onDragMove);
        document.removeEventListener("mouseup", this._onDragEnd);
        document.removeEventListener("touchmove", this._onDragMove);
        document.removeEventListener("touchend", this._onTouchEnd);
        document.removeEventListener("touchcancel", this._onTouchEnd);
      }
      EventBus.clear();
      (_e = this._el) == null ? void 0 : _e.remove();
    }
  }
  if (!detectSite()) {
    throw new Error("NodeLoc Enhance: unsupported site");
  }
  async function startup() {
    TabLeader.init();
    let panel;
    try {
      panel = new Panel();
    } catch (e) {
      Logger.error("Panel initialization failed:", e);
      return;
    }
    const navObserver = new MutationObserver(() => {
      const navBar = document.querySelector("ul.d-header-icons");
      if (navBar) {
        navObserver.disconnect();
        const network = new Network();
        const navEnergy = new NavBarEnergy(network);
        navEnergy.inject();
        navEnergy.startAutoRefresh();
        const unload = () => {
          navEnergy.stop();
          window.removeEventListener("beforeunload", unload);
        };
        window.addEventListener("beforeunload", unload);
      }
    });
    navObserver.observe(document.body, { childList: true, subtree: true });
    let lastUrl = location.href;
    const navigationCheck = setInterval(() => {
      if (lastUrl !== location.href) {
        lastUrl = location.href;
        if (panel && !panel.isMounted()) ;
      }
    }, 5e3);
    window.addEventListener("beforeunload", () => {
      clearInterval(navigationCheck);
      panel == null ? void 0 : panel.destroy();
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startup);
  } else {
    startup();
  }

})();