"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  imgClassName?: string;
  containerClassName?: string;
};

// Intenta cargar la imagen directo, luego via proxy, luego oculta el contenedor
export function NewsImage({ src, alt, imgClassName, containerClassName }: Props) {
  const [state, setState] = useState<"direct" | "proxy" | "failed">("direct");

  if (state === "failed") return null;

  const imgSrc =
    state === "proxy" ? `/api/img?url=${encodeURIComponent(src)}` : src;

  return (
    <div className={containerClassName}>
      <img
        src={imgSrc}
        alt={alt}
        className={imgClassName}
        loading="lazy"
        onError={() => {
          if (state === "direct") setState("proxy");
          else setState("failed");
        }}
      />
    </div>
  );
}
