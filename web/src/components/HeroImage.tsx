"use client";

import { useState } from "react";

export function HeroImage({
  src,
  sourceUrl,
}: {
  src?: string;
  sourceUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [triedOg, setTriedOg] = useState(false);

  // Primary: proxy the direct image URL
  const proxyUrl = src
    ? `/api/img?url=${encodeURIComponent(src)}`
    : undefined;

  // Fallback: extract OG image from the source article page
  const ogUrl = sourceUrl
    ? `/api/og-img?page=${encodeURIComponent(sourceUrl)}`
    : undefined;

  const currentSrc =
    !failed && proxyUrl
      ? proxyUrl
      : !triedOg && ogUrl
        ? ogUrl
        : undefined;

  if (!currentSrc) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] to-[#283593]" />
    );
  }

  return (
    <img
      src={currentSrc}
      alt=""
      className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
      onError={() => {
        if (!failed) {
          setFailed(true); // try OG fallback
        } else {
          setTriedOg(true); // give up, show gradient
        }
      }}
    />
  );
}
