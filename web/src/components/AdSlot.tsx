"use client";

import { useEffect, useId, useMemo } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    googletag?: {
      cmd: Array<() => void>;
      pubads: () => unknown;
      enableServices: () => void;
      display: (id: string) => void;
      defineSlot: (adUnitPath: string, size: number[] | number[][], id: string) => unknown;
    };
  }
}

type AdSenseProps = {
  provider: "adsense";
  slot: string;
  format?: string;
  fullWidthResponsive?: boolean;
};

type GamProps = {
  provider: "gam";
  adUnitPath: string;
  sizes: number[] | number[][];
};

export function AdSlot({
  className,
  style,
  ...props
}: (AdSenseProps | GamProps) & {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId();
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

  const containerId = useMemo(() => `ad_${id.replaceAll(":", "")}`, [id]);

  useEffect(() => {
    if (props.provider === "adsense") {
      if (!client || !props.slot) return;
      const w = window as Window;
      w.adsbygoogle = w.adsbygoogle ?? [];
      try {
        w.adsbygoogle.push({});
      } catch {
      }
      return;
    }

    const w = window as Window;
    if (!w.googletag) return;
    w.googletag.cmd.push(() => {
      try {
        const slot = w.googletag?.defineSlot(props.adUnitPath, props.sizes, containerId) as unknown as
          | { addService: (svc: unknown) => void }
          | undefined;
        if (slot && w.googletag) {
          slot.addService(w.googletag.pubads());
          w.googletag.enableServices();
          w.googletag.display(containerId);
        }
      } catch {
      }
    });
  }, [client, containerId, props]);

  if (props.provider === "adsense") {
    if (!client || !props.slot) return null;
    return (
      <div className={className} style={style}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={props.slot}
          data-ad-format={props.format ?? "auto"}
          data-full-width-responsive={(props.fullWidthResponsive ?? true) ? "true" : "false"}
        />
      </div>
    );
  }

  return (
    <div id={containerId} className={className} style={style} />
  );
}

