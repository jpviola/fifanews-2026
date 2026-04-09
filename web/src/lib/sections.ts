export type SectionKey =
  | "ultima-hora"
  | "selecciones"
  | "paises-anfitriones"
  | "estadios"
  | "jugadores"
  | "entradas"
  | "partidos-y-fixture";

export type Section = {
  key: SectionKey;
  label: string;
  href: string;
};

export const SECTIONS: Section[] = [
  { key: "ultima-hora", label: "Última hora", href: "/secciones/ultima-hora" },
  { key: "selecciones", label: "Selecciones", href: "/secciones/selecciones" },
  {
    key: "paises-anfitriones",
    label: "Países anfitriones",
    href: "/secciones/paises-anfitriones",
  },
  { key: "estadios", label: "Estadios", href: "/secciones/estadios" },
  { key: "jugadores", label: "Jugadores", href: "/secciones/jugadores" },
  { key: "entradas", label: "Entradas", href: "/secciones/entradas" },
  {
    key: "partidos-y-fixture",
    label: "Partidos y fixture",
    href: "/fixture",
  },
];

export function getSectionLabel(keyOrSlug: string): string {
  const match = SECTIONS.find((s) => s.key === keyOrSlug);
  return match?.label ?? "Noticias";
}

