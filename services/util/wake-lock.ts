import { onCleanup } from "solid-js";

// custom solid.js hook that ensures the wake lock is released when the component is unmounted
export function wakeLock() {
  let wakeLock = null;
  const requestWakeLock = async () => {
    if (!document.hidden) {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          console.log("Wake Lock was released");
        });
        console.log("Wake Lock is active");
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };
  document.addEventListener("visibilitychange", requestWakeLock);
  onCleanup(() => {
    wakeLock?.release();
    document.removeEventListener("visibilitychange", requestWakeLock);
  });

  requestWakeLock();
}