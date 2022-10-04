import { createEffect, createSignal } from 'solid-js';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// https://kitcross.net/hevc-web-video-alpha-channel/
// https://www.npmjs.com/package/m3u8-to-mp4

export namespace ExerciseDemonstration {
  export interface Props {
    video: string;
  }
}

export function ExerciseDemonstration(props: ExerciseDemonstration.Props) {
  let underlayVideo, overlayVideo;
  let players = [];

  const [visible, setVisible] = createSignal(true);

  createEffect(() => {
    [underlayVideo, overlayVideo].forEach((video) => {
      const player = videojs(
        video,
        {
          autoplay: 'muted',
          loop: 'true',
          sources: [
            {
              src: props.video,
              type: 'application/x-mpegURL',
            },
          ],
        },
        () => {
          function sync() {
            player?.tech_.vhs.representations?.().forEach(function (rep) {
              if (rep.width >= 720) {
                rep.enabled(true);
              } else {
                rep.enabled(false);
              }
            });
            setTimeout(sync, 100);
          }
          setTimeout(sync, 100);
        }
      );
      player.on('playing', () => {
        setVisible(true);
      });
      players.push(player);
    });

    players[1].on('timeupdate', () => {
      if (
        Math.abs(players[0].currentTime() - players[1].currentTime()) > 0.01
      ) {
        players[0].currentTime(players[1].currentTime());
      }
    });
  });

  return (
    <div
      class={`relative bg-slate-800 ${!visible() && 'hidden'}`}
      style="
    width:400px;
    height:400px;
    overflow:hidden;"
    >
      <div
        style="mix-blend-mode:lighten;
  filter:saturate(0) brightness(0.55) contrast(100) invert(1);
  transform: translate3d(0, 0, 0);
  z-index:1;"
      >
        <video
          style="width:400px;height:500px;object-fit:cover;
          margin-top:-70px;
          margin-left:-10px"
          ref={underlayVideo}
        ></video>
      </div>
      <div
        style="mix-blend-mode:multiply;
  filter:brightness(1);
  transform: translate3d(0, 0, 0);
  z-index:2;
  position:absolute;
  top: 0;"
      >
        <video
          style="width:400px;height:500px;object-fit:cover;
          margin-top:-70px;
          margin-left:-10px"
          ref={overlayVideo}
        ></video>
      </div>
    </div>
  );
}
