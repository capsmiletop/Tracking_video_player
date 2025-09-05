Database -- postgresql
Node version --- v22.15.1
You should do to run server. --- node server.js


+++++++++++++++++++++++++++++++++++++++++++++++++++++
Large MP3 file => HLS with Using FFmpeg

mkdir -p english
ffmpeg -i video3.mp4 \
  -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k \
  -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "viet/segment_%03d.ts" \
  viet/index.m3u8

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
if(Hls.isSupported()) {
    var video = document.getElementById('video');
    var hls = new Hls();
    hls.loadSource('./english/index.m3u8');
    hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // For Safari/iOS native HLS support
    video.src = './english/index.m3u8';
}
</script>
+++++++++++++++++++++++++++++++++++++++++++++++++++++

Node emailer by using SMTP server.

// Configure Outlook SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // or 587 if using STARTTLS
  secure: true, // true for 465, false for 587
  auth: {
    user: "jmv1210@gmail.com",// your Gmail address
    pass: "rfyd idhf rkzk gpxw"      // Gmail App Password
  }
});

await transporter.sendMail({
      from: "jmv1210@gmail.com",
      to: "JosephValanzuolo@gmail.com",
      subject: "Video",
      text: `A user from ${}, ${}, ${} is currently watching ${} video.`
});

++++++++++++++++++++++++++++++++++++++++++++++++++++


