document.addEventListener("DOMContentLoaded", () => {

    const socket = io('http://localhost:5000');
    const video = document.getElementById("video");
    const name = document.getElementById("name");
    const playPause = document.getElementById("playPause");
    const stop = document.getElementById("stop");
    const time = document.getElementById("time");
    const progress = document.getElementById("progress");
    const progressBar = document.getElementById("progressBar");
    const volume = document.getElementById("volume");
    const fullscreen = document.getElementById("fullscreen");
    const volumeIcon = document.getElementById("volumeIcon")
    //User Info country,IP, City, Timezone

    let currentId;

    volume.value = 0.3;
    const videoUrl = name.dataset.src;

    console.log('videoUrl', videoUrl)

    function extractFileNameFromDropbox(url) {
      // Decode URL so %20 → spaces, etc.
      const decodedUrl = decodeURIComponent(url);

      // Use regex to find the actual filename
      const match = decodedUrl.match(/\/([^\/]+\.mp4)/);

      if (match && match[1]) {
          // Replace dashes with spaces for readability
          return match[1].replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      }

      return null;
    }

    const videoname = extractFileNameFromDropbox(videoUrl)

    function formatTime(sec) {
    if (isNaN(sec) || sec === undefined || sec === null) return "00:00:00";
      const h = Math.floor(sec / 3600).toString().padStart(2, "0");
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(sec % 60).toString().padStart(2, "0");
      return `${h}:${m}:${s}`;
    }

      // Geting Client information ex: ip, country, region, timezone
    
    let clientInfo;
    async function getUserInfo () {
      try {
        const res = await fetch('https://ipwhois.app/json/');
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          clientInfo = await res.json();
          const data = {clientInfo, videoUrl}
          socket.emit('getUserInfo', data)
        } else {
          const text = await res.text();
          console.error('API returned non-JSON:', text);
          data = { error: text };
        }
      } catch (err) {
          console.error('Error fetching IP data:', err);
      }
    }

    getUserInfo()

    video.addEventListener("loadedmetadata", () => {
      time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    });

    //Getting current client information id
    async function getClientInfoId() {
      try {

       socket.on('addClientId', async(id) => {
          if(!currentId) {
            currentId = id; //First time = your own ID
          } else {
            console.log('📡 Another user connected with ID:', id);
          }
       })

      } catch (error) {
        // console.error('Failed to get location:', error);
      }
    }

    getClientInfoId();

    let lastSentTime = 0
    
    // Save to sessionStorage (clears when browser closes)
    function saveVideoState(currentTime, videoname, currentId) {
      const state = { currentTime, videoname, currentId };
      sessionStorage.setItem('videoState', JSON.stringify(state));
    }    

    let cnt = 1
    
    video.addEventListener("timeupdate", () => {
      if(cnt) {
        socket.emit('emailNotification')
      }
      cnt = 0;
      const percent = (video.currentTime / video.duration) * 100;
      progress.style.width = percent + "%";
      time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;

      const now = Date.now()

      const currentTime = video.currentTime;

      if(now - lastSentTime > 5000 || video.paused) {
      
        //Save locally
        saveVideoState(currentTime, videoname, currentId)
        lastSentTime = now;
      } 

      if(currentTime === video.duration && video.paused) {

        const state = sessionStorage.getItem('videoState');
        if (state) {
            const { currentTime, videoname, currentId } = JSON.parse(state);
            emitVideoState(currentTime, videoname, currentId);
        }
      }

    });

    //Emit to server
    async function emitVideoState(currentTime, videoname, currentId) {
      socket.emit('viewTimeUpdateFromClient', {
          viewTime: currentTime,
          videoName: videoname,
          userId: currentId
      });
    }
      // Pause video if tab is not active, play if active
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          video.pause();
        } else {
        if (playPause.textContent === "⏸️") {
          video.play();
        }
        }
      });

    // Handle browser close/tab close
    window.addEventListener('beforeunload', () => {
      const state = sessionStorage.getItem('videoState');
      console.log('beforeunload state', state)
      if (state) {
          const { currentTime, videoname, currentId } = JSON.parse(state);
          emitVideoState(currentTime, videoname, currentId);
      }
    });

    playPause.addEventListener("click", () => {
      if (video.paused) {
        video.play();
        playPause.textContent = "⏸️";
      } else {
        video.pause();
        playPause.textContent = "▶️";
      }
    });

    stop.addEventListener("click", () => {
      video.pause();
      video.currentTime = 0;
      playPause.textContent = "▶️";
    });

    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = percent * video.duration;
    });

    function setVolumeBarColor(val) {
      const percent = val * 100;
      volume.style.background = `linear-gradient(to right, #f69cb0 0%, #f69cb0 ${percent}%, #888 ${percent}%, #888 100%)`;
    }

    volume.addEventListener("input", () => {
      video.volume = volume.value;
      volumeIcon.textContent = volume.value == 0 ? '🔇' : '🔊';
      setVolumeBarColor(volume.value);
    });

    fullscreen.addEventListener("click", () => {
      if (video.requestFullscreen) video.requestFullscreen();
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
      else if (video.msRequestFullscreen) video.msRequestFullscreen();
    });

    const unmuteOnClick = () => {
      if(!video.paused) {
           video.pause()
      }
      volumeIcon.textContent = '🔊';
      video.muted = false;
      video.play().catch(err => console.error("Unmuted play failed:", err));
      document.removeEventListener("click", unmuteOnClick);
    };

    document.addEventListener("click", unmuteOnClick);
  });