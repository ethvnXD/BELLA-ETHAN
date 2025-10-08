// ====== CONFIG ======
// Put your image file names or URLs (at least 10). If you host images in the repo, put the relative path (e.g. "images/1.jpg")
const IMAGES = [
  "IMG_0468.jpeg","IMG_0393.jpeg","IMG_0106.jpeg","IMG_3195.jpeg","IMG_3195.jpeg",
  "IMG_2998 jpeg","IMG_3506.jpeg","IMG_0486.jpeg","IMG_2099.jpeg","IMG_2047.jpeg"
];

// Initial youtube link (you can change or use the input below)
let YT_URL = "https://youtu.be/9vMskIqWz5M?si=8JB84d8glBAk_pNE";

// Custom text default
let CUSTOM_TEXT = document.getElementById ? document.getElementById('customText').innerHTML : "";

// ====== SLIDESHOW ======
const slideshow = document.getElementById('slideshow');
let currentIndex = 0;
let slideEls = [];

function buildSlideshow() {
  slideshow.innerHTML = '';
  slideEls = IMAGES.map((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    if (i===0) img.classList.add('active');
    slideshow.appendChild(img);
    return img;
  });
}
buildSlideshow();

function nextSlide() {
  if (slideEls.length === 0) return;
  slideEls[currentIndex].classList.remove('active');
  currentIndex = (currentIndex + 1) % slideEls.length;
  slideEls[currentIndex].classList.add('active');
}
setInterval(nextSlide, 4500); // change every 4.5s, smooth fade via CSS

// ====== COUNT UP TIMER FROM 2025-01-01 00:00:00 ======
const counterStart = new Date(Date.UTC(2025,0,1,0,0,0)); // UTC start
const countTextEl = document.getElementById('countText');

function calcElapsedParts(from, to) {
  // computes years, months, days, hours, minutes, seconds between from and to in calendar terms
  // We'll increment years/months then compute remaining using Date math.
  let y = to.getUTCFullYear() - from.getUTCFullYear();
  let m = to.getUTCMonth() - from.getUTCMonth();
  let d = to.getUTCDate() - from.getUTCDate();
  let hh = to.getUTCHours() - from.getUTCHours();
  let mm = to.getUTCMinutes() - from.getUTCMinutes();
  let ss = to.getUTCSeconds() - from.getUTCSeconds();

  if (ss < 0) { ss += 60; mm -= 1; }
  if (mm < 0) { mm += 60; hh -= 1; }
  if (hh < 0) { hh += 24; d -= 1; }

  if (d < 0) {
    // borrow days from previous month of "to"
    const prev = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)); // last day of previous month
    d += prev.getUTCDate();
    m -= 1;
  }
  if (m < 0) { m += 12; y -= 1; }
  return {years: y, months: m, days: d, hours: hh, minutes: mm, seconds: ss};
}

function updateTimer(){
  const now = new Date();
  // use UTC for consistent counting disregarding local timezone shifts
  const elapsed = calcElapsedParts(counterStart, now);
  countTextEl.textContent = `${elapsed.years} years, ${elapsed.months} months, ${elapsed.days} days, ${elapsed.hours} hours, ${elapsed.minutes} minutes and ${elapsed.seconds} seconds`;
}
updateTimer();
setInterval(updateTimer, 1000);

// ====== CUSTOM TEXT CONTROL ======
const applyTextBtn = document.getElementById('applyTextBtn');
const customInput = document.getElementById('customInput');
applyTextBtn?.addEventListener('click', ()=>{
  const val = customInput.value.trim();
  if(val) {
    document.getElementById('customText').innerText = val;
  }
});

// ====== YOUTUBE PLAYER + MUSIC WIDGET ======
let player;
const musicTitle = document.getElementById('musicTitle');
const musicSub = document.getElementById('musicSub');
const musicToggle = document.getElementById('musicToggle');
const loadYtBtn = document.getElementById('loadYtBtn');
const ytInput = document.getElementById('ytInput');

function extractYouTubeID(url){
  // crude but works for common formats
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    // /embed/VIDEOID
    const parts = u.pathname.split('/');
    const idx = parts.indexOf('embed');
    if (idx>=0) return parts[idx+1];
    return null;
  } catch(e) { return null; }
}

// Called by YouTube API when it's ready
function onYouTubeIframeAPIReady() {
  // create a player element (will be hidden). We'll create when user provides a URL.
  // Keep function global for API callback.
}

function ensurePlayer(videoId){
  if(!videoId) return;
  if(player){
    player.loadVideoById(videoId);
    return;
  }
  player = new YT.Player('ytPlayerContainer', {
    height: '0',
    width: '0',
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0
    },
    events: {
      onReady: (e) => {
        // read video data
        const data = e.target.getVideoData();
        musicTitle.textContent = data.title || 'Unknown Title';
        musicSub.textContent = data.author || '';
        // start paused; user can play using the widget button
      },
      onStateChange: (evt) => {
        // update title when the video changes or loads
        try{
          const d = evt.target.getVideoData();
          if(d && d.title) { musicTitle.textContent = d.title; musicSub.textContent = d.author || ''; }
        } catch(e){}
        // Toggle button text
        if(evt.data === YT.PlayerState.PLAYING) musicToggle.textContent = "Pause";
        if(evt.data === YT.PlayerState.PAUSED || evt.data === YT.PlayerState.ENDED) musicToggle.textContent = "Play";
      }
    }
  });
}

loadYtBtn.addEventListener('click', ()=>{
  const url = ytInput.value.trim();
  const id = extractYouTubeID(url);
  if(!id){ alert('Could not parse YouTube link. Use full link like https://www.youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID'); return; }
  YTreadyThen(()=>ensurePlayer(id));
});

function YTreadyThen(cb){
  if(typeof YT !== 'undefined' && YT && YT.Player) return cb();
  // if API not yet ready, poll
  const t = setInterval(()=>{
    if(typeof YT !== 'undefined' && YT && YT.Player){
      clearInterval(t); cb();
    }
  }, 150);
}

// toggle play/pause
musicToggle.addEventListener('click', ()=>{
  if(!player){ alert('Load a YouTube link first.'); return; }
  const state = player.getPlayerState();
  if(state === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
});

// If page loaded with a YT_URL set in config, auto-load it
if(YT_URL){
  const id = extractYouTubeID(YT_URL);
  if(id) YTreadyThen(()=>ensurePlayer(id));
}

/* NOTE:
   - Autoplaying audio might be blocked by browsers until user interacts with the page.
   - The player is created hidden; the widget shows the video title & author via getVideoData.
*/

// ====== Helpful: allow images to be missing gracefully ======
slideEls.forEach(img => {
  img.addEventListener('error', ()=> {
    img.style.background = '#111';
    img.alt = 'Image missing - upload your images into /images in the repo and edit script.js';
  });
});
