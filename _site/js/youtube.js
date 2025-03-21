document.querySelectorAll('.video__wrapper').forEach(wrapper => {
  const iframe = wrapper.querySelector('.youtube__player');
  const placeholder = wrapper.querySelector('.video__placeholder');

  wrapper.addEventListener('click', () => {
    wrapper.classList.add('playing');
    const videoId = new URL(iframe.src).pathname.split('/').pop().split('?')[0];

    const player = new YT.Player(iframe, {
      width: placeholder.offsetWidth,
      height: placeholder.offsetHeight,
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        mute: 1
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
          event.target.unMute();
        }
      }
    });
  });
});
