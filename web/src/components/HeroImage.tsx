"use client";

import { useState } from "react";

export function HeroImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] to-[#283593]" />;
  }

  return (
    <img
      src={`/api/img?url=${encodeURIComponent(src)}`}
      alt=""
      className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}
