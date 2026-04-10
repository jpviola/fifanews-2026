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
  facts?: string[];
  body?: string;
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
    facts: [
      "La demanda global vuelve a subir a medida que se publican nuevas guías y cronogramas oficiales.",
      "Los cambios suelen enfocarse en verificación de identidad, límites por comprador y reventa autorizada.",
      "Las ventanas se anuncian con antelación limitada: conviene tener la cuenta y los datos listos.",
    ],
    body:
      "La FIFA viene ajustando el proceso de venta de entradas para reducir fraudes y ordenar la alta demanda de cara a 2026. El punto central suele ser la verificación: desde validar identidad hasta reforzar controles de pago y mecanismos anti-bots.\n\nEn la práctica, esto se traduce en ventanas de compra más delimitadas, reglas claras sobre cuántos tickets se pueden adquirir por persona y, en algunos casos, un foco mayor en la reventa oficial. Si estás planificando viajar, lo más importante es seguir el calendario de fases y tener tu perfil listo antes de que se abra la siguiente etapa.\n\nLa recomendación simple: registrarte con tiempo, revisar requisitos de documentación, y preparar un método de pago habilitado para compras internacionales. Cuando se anuncian fechas tentativas, el margen de reacción suele ser corto.",
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
    facts: [
      "La prioridad suele estar en conectividad: accesos viales, transporte público y señalización.",
      "Los planes incluyen protocolos de ingreso para mitigar cuellos de botella en horarios pico.",
      "Las mejoras también apuntan a la experiencia del visitante: movilidad, seguridad y tiempos de espera.",
    ],
    body:
      "La preparación de sedes para un Mundial no se agota en el estadio: el cuello de botella real aparece en los accesos, el transporte y la coordinación de eventos en simultáneo. En Estados Unidos, el foco está puesto en movilidad y seguridad, con obras que buscan acelerar el ingreso y salida de grandes volúmenes de público.\n\nLas ciudades anfitrionas suelen priorizar corredores de transporte público, refuerzos de trenes y buses en días de partido, y planes de tránsito que contemplan fan zones y eventos satélite. El objetivo es bajar tiempos de espera y evitar congestiones que impacten en el horario de inicio.\n\nEn paralelo, la experiencia del visitante se trabaja con señalización, servicios y protocolos de control que permitan un flujo más continuo. Para el hincha, la clave será planificar: elegir rutas, horarios y medios de transporte con margen, especialmente en partidos de alta convocatoria.",
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
    facts: [
      "El tramo final de temporada suele definir estados físicos y decisiones de último momento.",
      "La competencia interna se intensifica cuando vuelven lesionados y aparecen nuevos nombres.",
      "Los amistosos previos y las ventanas FIFA funcionan como termómetro real de roles.",
    ],
    body:
      "Con el Mundial 2026 en el horizonte, el armado de listas pasa por dos variables que se mueven semana a semana: el estado físico y la continuidad competitiva. Las lesiones y los regresos suelen reordenar prioridades, sobre todo en puestos donde hay alternativas con estilos distintos.\n\nA la par, aparece la competencia interna: futbolistas que llegan con ritmo, otros que vuelven con dudas, y algunos que empujan desde atrás por rendimiento en clubes. En ese contexto, los amistosos y las ventanas FIFA son más que una prueba: funcionan como una señal de roles, sociedades y jerarquías dentro del plantel.\n\nPara el cuerpo técnico, el desafío es equilibrar experiencia y actualidad, sin perder cohesión. Para el hincha, la lectura más útil es seguir minutos, cargas y continuidad: ahí suele estar la pista de quién gana terreno realmente.",
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
    facts: [
      "El techo retráctil ayuda a estabilizar clima y reducir impacto de lluvias o viento fuerte.",
      "La acústica y la iluminación cambian: se amplifica el ambiente y se controla mejor la luz.",
      "La operación del techo suele depender de condiciones y protocolos de seguridad.",
    ],
    body:
      "Los estadios con techo retráctil ganan protagonismo cuando el calendario incluye ciudades con climas variables. La ventaja obvia es proteger el juego de lluvias, viento y temperaturas extremas, pero la experiencia también cambia puertas adentro: acústica, iluminación y sensación térmica se vuelven más controlables.\n\nCon el techo cerrado, el sonido se concentra y el ambiente puede sentirse más intenso. A la vez, la iluminación pasa a estar más “diseñada” y menos sujeta a la luz natural, lo que influye en transmisión y visibilidad. Para el fútbol, la estabilidad climática suele traducirse en un ritmo más predecible, especialmente en pelotas paradas.\n\nLa contracara es que la operación del techo no es trivial: hay protocolos por seguridad, tiempos de apertura/cierre y decisiones que dependen de pronósticos. Para el hincha, la recomendación es simple: revisar indicaciones del estadio (ropa, accesos y horarios) porque la logística puede variar según el modo de operación del día.",
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
    facts: [
      "El cierre de temporada suele disparar picos de rendimiento y también lesiones por acumulación.",
      "Los equipos buscan perfiles que rindan rápido: adaptación y rol claro pesan más que la promesa.",
      "Para selecciones, el diferencial suele ser continuidad y aporte específico (presión, balón parado, etc.).",
    ],
    body:
      "En el tramo final de la temporada, el mercado se mueve entre dos fuerzas: oportunidad y urgencia. Los clubes miran rendimiento reciente y estado físico, porque el margen para esperar adaptación es mínimo. Por eso ganan valor los perfiles con rol claro: extremos con desequilibrio, mediocampistas de ida y vuelta, centrales con buen juego aéreo.\n\nPara los futbolistas, este período también es una vidriera hacia selecciones: las listas se construyen con continuidad y señales concretas (minutos, impacto, regularidad). No alcanza con un pico aislado si no hay consistencia en partidos exigentes.\n\nLa lectura práctica es separar ruido de tendencia: más allá del rumor, lo que suele anticipar un salto es la suma de minutos, la evolución física y el encaje táctico. Si un jugador está “en forma”, se nota en continuidad, confianza y estadísticas sostenibles, no en una semana espectacular.",
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
    facts: [
      "El sorteo del fixture definitivo depende de confirmaciones logísticas y del calendario FIFA.",
      "Cambios de fecha suelen responder a ajustes de sedes, ventanas de selección y acuerdos de transmisión.",
      "El anuncio oficial llega con lineamientos para venta de entradas, viajes y organización de fan zones.",
    ],
    body:
      "La organización trabaja con fechas tentativas para el sorteo del fixture definitivo y, como suele pasar en ciclos mundialistas, los cambios se explican por logística y coordinación con el calendario internacional. La prioridad es asegurar que sedes, equipos y calendarios de selecciones encajen sin superposiciones críticas.\n\nCuando se mueve la fecha del sorteo, el efecto cascada es claro: planificación de viajes, anuncios de paquetes, ventanas de venta y cronogramas de eventos paralelos. Por eso la confirmación final suele llegar acompañada de un paquete de información operativa.\n\nPor ahora, lo más razonable es tomar las fechas como orientación y esperar la comunicación oficial. Si estás armando viaje, conviene planificar con flexibilidad: reservas reembolsables y margen de días, porque el calendario definitivo es el que termina ordenando todo lo demás.",
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

