import type { SectionKey } from "@/lib/sections";

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  publishedAtIso: string;
  section: Exclude<SectionKey, "partidos-y-fixture">;
  sourceLabel: string;
  sourceUrl: string;
  slug: string;
  imageUrl?: string;
};

export type FixtureItem = {
  id: string;
  kickoffIso: string;
  home: string;
  away: string;
  stageLabel: string;
  city: string;
  stadium: string;
};

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "La FIFA ajusta criterios para la venta de entradas: qué cambia y cuándo",
    excerpt:
      "Se esperan nuevas ventanas de compra y un sistema de verificación más estricto. Guía rápida para no perderte el día clave.",
    publishedAtIso: "2026-04-08T11:10:00-03:00",
    section: "entradas",
    sourceLabel: "Fuente oficial",
    sourceUrl: "https://www.fifa.com/",
    slug: "fifa-ajusta-criterios-venta-entradas",
  },
  {
    id: "n2",
    title: "Estados Unidos acelera obras en sedes: el foco está en accesos y transporte",
    excerpt:
      "Las ciudades anfitrionas priorizan movilidad y seguridad. Repaso de las sedes con mayor inversión.",
    publishedAtIso: "2026-04-08T09:05:00-03:00",
    section: "paises-anfitriones",
    sourceLabel: "Cobertura",
    sourceUrl: "https://www.usa.gov/",
    slug: "usa-acelera-obras-sedes-accesos-transporte",
  },
  {
    id: "n3",
    title: "Argentina: panorama de convocados y el termómetro del vestuario",
    excerpt:
      "Lesiones, regresos y competencia interna. Qué se juega cada puesto rumbo al Mundial 2026.",
    publishedAtIso: "2026-04-08T07:40:00-03:00",
    section: "selecciones",
    sourceLabel: "Resumen",
    sourceUrl: "https://www.afa.com.ar/",
    slug: "argentina-panorama-convocados-termometro-vestuario",
  },
  {
    id: "n4",
    title: "Estadios con techo retráctil: ventajas, clima y experiencia para el hincha",
    excerpt:
      "De la acústica a la temperatura: cómo cambia un partido en una cancha cubierta y qué sedes lo tienen.",
    publishedAtIso: "2026-04-07T22:25:00-03:00",
    section: "estadios",
    sourceLabel: "Análisis",
    sourceUrl: "https://www.fifa.com/",
    slug: "estadios-con-techo-retractil-ventajas-clima-experiencia",
  },
  {
    id: "n5",
    title: "Mercado y rumores: quiénes llegan con mejor forma al tramo final de la temporada",
    excerpt:
      "Top de jugadores con impacto inmediato y los que podrían pelear un lugar en sus selecciones.",
    publishedAtIso: "2026-04-07T18:15:00-03:00",
    section: "jugadores",
    sourceLabel: "Radar",
    sourceUrl: "https://www.transfermarkt.com/",
    slug: "mercado-rumores-quienes-llegan-con-mejor-forma",
  },
  {
    id: "n6",
    title: "Última hora: nuevas fechas tentativas para el sorteo del fixture definitivo",
    excerpt:
      "La organización evalúa cambios por logística y calendario internacional. Lo que se sabe hasta ahora.",
    publishedAtIso: "2026-04-08T12:00:00-03:00",
    section: "ultima-hora",
    sourceLabel: "Cobertura",
    sourceUrl: "https://www.fifa.com/",
    slug: "ultima-hora-fechas-tentativas-sorteo-fixture-definitivo",
  },
];

export const SAMPLE_FIXTURE: FixtureItem[] = [
  {
    id: "f1",
    kickoffIso: "2026-06-11T21:00:00-03:00",
    home: "México",
    away: "Canadá",
    stageLabel: "Apertura",
    city: "Ciudad de México",
    stadium: "Estadio Azteca",
  },
  {
    id: "f2",
    kickoffIso: "2026-06-12T19:00:00-03:00",
    home: "Estados Unidos",
    away: "Japón",
    stageLabel: "Fase de grupos",
    city: "Los Ángeles",
    stadium: "SoFi Stadium",
  },
  {
    id: "f3",
    kickoffIso: "2026-06-12T22:00:00-03:00",
    home: "Argentina",
    away: "Nigeria",
    stageLabel: "Fase de grupos",
    city: "Miami",
    stadium: "Hard Rock Stadium",
  },
];

export function getNewsBySection(section: string): NewsItem[] {
  if (section === "ultima-hora") {
    return [...SAMPLE_NEWS].sort((a, b) =>
      b.publishedAtIso.localeCompare(a.publishedAtIso),
    );
  }

  return SAMPLE_NEWS.filter((n) => n.section === section);
}

export function getNewsBySlug(slug: string): NewsItem | undefined {
  return SAMPLE_NEWS.find((n) => n.slug === slug);
}

