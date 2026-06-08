import { useEffect, useState } from "react";

/** True on desktop with mouse; false on touch devices (e.g. iPhone). */
export function usePrefersFinePointer(): boolean {
  const [prefersFinePointer, setPrefersFinePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const update = () => setPrefersFinePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersFinePointer;
}
