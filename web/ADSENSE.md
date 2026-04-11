Configuración rápida de AdSense

1) Cuenta
- Asegurate de tener el publisher ID (ca‑pub‑XXXXXXXXXXXXXX) y al menos un slot creado.

2) Script de AdSense
- Ya está integrado en el head si definís NEXT_PUBLIC_ADSENSE_CLIENT.
- En Vercel → Project → Settings → Environment Variables:
  - NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-1971729858495340

3) ads.txt
- Publicado en /ads.txt con:
  google.com, pub-1971729858495340, DIRECT, f08c47fec0942fa0

4) Slots recomendados
- NEXT_PUBLIC_ADSENSE_SLOT_HEADER          → header sticky (320x50/300x100/728x90)
- NEXT_PUBLIC_ADSENSE_SLOT_POST_HERO       → post-hero (inline-1)
- NEXT_PUBLIC_ADSENSE_SLOT_INLINE          → 1er párrafo del artículo
- NEXT_PUBLIC_ADSENSE_SLOT_INLINE_2        → 3er párrafo del artículo
- NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR         → sidebar home
- NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_SIDEBAR → sidebar artículo

5) Verificación
- En AdSense, método “Fragmento de código”: ya cargamos el script en <head>.
- Revisión puede tardar 24–48h.

6) Política UX
- Máx 3 anuncios por página móvil.
- Nada de pop-ups intersticiales.
- Inline con IntersectionObserver (ya lazies por defecto del navegador).
