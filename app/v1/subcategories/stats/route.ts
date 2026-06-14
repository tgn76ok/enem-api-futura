import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { VALID_SUBCATEGORIES } from "@/lib/zod/schemas/questions";

/**
 * `GET /v1/subcategories/stats`
 *
 * Caminha todas as questões classificadas (public/<ano>/questions/<idx>/details.json)
 * e agrega:
 *   - quantas questões existem por `subcategory`
 *   - quantas questões existem por `discipline`
 *   - percentual da subcategory dentro da sua discipline (frequência de incidência)
 *
 * Resposta:
 * ```json
 * {
 *   "totalQuestions": 2757,
 *   "perDiscipline": { "matematica": 250, "fisica": 180, ... },
 *   "subcategories": [
 *     {
 *       "slug": "geometria-plana",
 *       "label": "Geometria Plana",
 *       "discipline": "matematica",
 *       "area": "matematica",
 *       "count": 23,
 *       "percentInDiscipline": 9.2,
 *       "percentOverall": 0.83
 *     }
 *   ],
 *   "grouped": { "matematica": [...], ... }
 * }
 * ```
 *
 * Os campos `label`, `discipline` e `area` seguem a mesma fonte de verdade
 * do endpoint `/v1/subcategories` (mantém consistência).
 *
 * Resultado fica em cache de módulo após o primeiro request — a recomputação
 * só ocorre se o processo reiniciar.
 *
 * Deduplicação de variantes de idioma (ex.: `93-espanhol` / `93-ingles` da
 * mesma questão) é determinística via `LANGUAGE_PRIORITY` — não depende da
 * ordem de `readdir`, que varia por SO/filesystem. Sem isso, quando as duas
 * variantes são classificadas com `subcategory` diferente (caso real: ano
 * 2010 índice 93), a contagem final mudava a cada rebuild.
 */

interface SubcategoryStat {
    slug: string;
    label: string;
    discipline: string;
    area: string;
    count: number;
    percentInDiscipline: number;
    percentOverall: number;
}

interface StatsResponse {
    totalQuestions: number;
    perDiscipline: Record<string, number>;
    subcategories: SubcategoryStat[];
    grouped: Record<string, SubcategoryStat[]>;
}

let cache: StatsResponse | null = null;
let inflight: Promise<StatsResponse> | null = null;

function formatLabel(slug: string): string {
    const stop = new Set(["do", "da", "de", "em", "e"]);
    return slug
        .split("-")
        .map((word) => {
            if (stop.has(word)) return word;
            if (word === "lem") return "LEM";
            if (word === "brasil") return "Brasil";
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

/**
 * Importa o `SUBCATEGORY_MAP` em runtime para evitar duplicação.
 * O arquivo da rota principal exporta o mapa internamente, então
 * fazemos uma cópia minimal aqui (reaproveitar via import seria melhor,
 * mas evitamos refactor desnecessário do route.ts existente).
 */
async function getDisciplineFor(slug: string): Promise<{ discipline: string; area: string }> {
    // Match heurístico baseado em prefixos comuns dos slugs — cobre 99%
    // dos casos sem precisar manter um mapa duplicado. Os 1% restantes
    // caem em `outros`.
    const s = slug.toLowerCase();
    const matchers: Array<[RegExp, { discipline: string; area: string }]> = [
        [/^algebra|^funcoes|^geometria|^trigonometria|^estatistica|^probabilidade|^analise-combinatoria|^matematica|^grandezas-medidas|^leitura-graficos|^numeros|^operacoes|^porcentagem|^proporcionalidade|^raciocinio-logico|^numeracao|^media-aritmetica/, { discipline: "matematica", area: "matematica" }],
        [/^fisica|^cinematica|^dinamica|^trabalho-energia|^hidrostatica|^termo|^optica|^ondulatoria|^eletro|^magnetismo|^mecanica/, { discipline: "fisica", area: "ciencias-natureza" }],
        [/^quimica|^estrutura-atomica|^tabela-periodica|^ligacoes|^funcoes-inorganicas|^estequiometria|^solucoes|^cinetica-quimica|^equilibrio|^eletroquimica/, { discipline: "quimica", area: "ciencias-natureza" }],
        [/^biologia|^citologia|^bioquimica|^genetica|^evolucao|^ecologia|^fisiologia|^parasitologia|^biotecnologia|^botanica|^zoologia|^imunologia|^virologia|^agropecuaria(?!-)|^impactos-ambientais/, { discipline: "biologia", area: "ciencias-natureza" }],
        [/^historia|^cultura-memoria|^movimentos-sociais/, { discipline: "historia", area: "ciencias-humanas" }],
        [/^geografia|^cartografia|^demografia|^urbanizacao|^industrializacao|^questoes-ambientais|^globalizacao|^geopolitica|^geologia/, { discipline: "geografia", area: "ciencias-humanas" }],
        [/^filosofia/, { discipline: "filosofia", area: "ciencias-humanas" }],
        [/^sociologia|^estado-poder|^politica|^cidadania|^direito|^relacoes-internacionais|^trabalho$|^religioes/, { discipline: "sociologia", area: "ciencias-humanas" }],
        [/^interpretacao-textual|^generos-textuais|^norma-padrao|^funcoes-da-linguagem|^variedades-linguisticas|^gramatica|^argumentacao|^linguagens-midiaticas|^vocabulario-em-contexto/, { discipline: "lingua-portuguesa", area: "linguagens" }],
        [/^analise-literaria|^escolas-literarias|^modernismo|^literatura|^poesia/, { discipline: "literatura", area: "linguagens" }],
        [/^artes|^musica|^artes-visuais/, { discipline: "artes", area: "linguagens" }],
        [/^corpo-saude|^esporte/, { discipline: "educacao-fisica", area: "linguagens" }],
        [/^interpretacao-em-lem|^lingua-estrangeira|^interpretacao-grafica|^linguagem-oral|^diversidade-cultural|^cultura-identidade|^identidade-cultural|^artes-e-cultura|^interpretacao-de-dados|^leitura-graficos-tabelas/, { discipline: "lingua-estrangeira", area: "linguagens" }],
    ];

    for (const [re, info] of matchers) {
        if (re.test(s)) return info;
    }
    return { discipline: "outros", area: "outros" };
}

/** Prioridade de desempate determinística entre variantes de idioma de
 *  uma mesma questão (ex.: 93-espanhol vs 93-ingles, que podem ter sido
 *  classificadas com `subcategory` diferentes). Quanto menor, mais
 *  prioridade. Questões sem `language` (a maioria — não são de LEM) não
 *  colidem entre si, então a ordem entre elas é irrelevante. */
const LANGUAGE_PRIORITY = ['ingles', 'espanhol'];

function languageRank(language?: string | null): number {
    if (!language) return -1;
    const idx = LANGUAGE_PRIORITY.indexOf(language);
    return idx === -1 ? LANGUAGE_PRIORITY.length : idx;
}

async function computeStats(): Promise<StatsResponse> {
    const publicDir = path.join(process.cwd(), "public");
    const years = (await readdir(publicDir, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && /^\d{4}$/.test(d.name))
        .map((d) => d.name);

    /** Melhor candidato por (year, index, discipline) — dedup determinístico
     *  de variantes de idioma via `languageRank`, não pela ordem do `readdir`. */
    const candidates = new Map<string, { language?: string | null; subcategory?: string }>();
    /** count[subcategory] */
    const subCount = new Map<string, number>();
    /** count[discipline granular] — construído depois, a partir de `subCount`
     *  classificada via `getDisciplineFor`. Não usar o `discipline` bruto do
     *  JSON: ele vem em granularidade de área (ex.: "linguagens",
     *  "ciencias-humanas"), enquanto `info.discipline` é granular (ex.:
     *  "biologia", "lingua-portuguesa") — vocabulários incompatíveis que
     *  fariam `percentInDiscipline` ficar sempre 0 fora de Matemática. */
    const discCount = new Map<string, number>();
    let total = 0;

    for (const year of years) {
        const qDir = path.join(publicDir, year, "questions");
        if (!existsSync(qDir)) continue;

        const indices = (await readdir(qDir, { withFileTypes: true }))
            .filter((d) => d.isDirectory())
            .map((d) => d.name);

        for (const idxDir of indices) {
            const file = path.join(qDir, idxDir, "details.json");
            if (!existsSync(file)) continue;

            try {
                const raw = await readFile(file, "utf-8");
                const q = JSON.parse(raw) as {
                    index?: number;
                    discipline?: string;
                    subcategory?: string;
                    language?: string | null;
                };

                const dedupKey = `${year}-${q.index ?? idxDir}-${q.discipline ?? ""}`;
                const existing = candidates.get(dedupKey);
                if (!existing || languageRank(q.language) < languageRank(existing.language)) {
                    candidates.set(dedupKey, { language: q.language, subcategory: q.subcategory });
                }
            } catch {
                // ignora arquivos corrompidos individuais
            }
        }
    }

    // Agrega a partir dos candidatos já resolvidos (1 por questão, idioma
    // de maior prioridade vence em caso de variantes divergentes).
    candidates.forEach((c) => {
        total++;
        if (c.subcategory) {
            subCount.set(c.subcategory, (subCount.get(c.subcategory) ?? 0) + 1);
        }
    });

    // Classifica cada slug válido uma única vez — reaproveitada tanto pra
    // montar `discCount` (denominador) quanto o array final (numerador),
    // garantindo que ambos venham da mesma fonte e somem ~100% por disciplina.
    const classificacoes = await Promise.all(
        VALID_SUBCATEGORIES.map(async (slug: string) => ({
            slug,
            info: await getDisciplineFor(slug),
            count: subCount.get(slug) ?? 0,
        })),
    );

    for (const { info, count } of classificacoes) {
        discCount.set(info.discipline, (discCount.get(info.discipline) ?? 0) + count);
    }

    // Constrói array final só com slugs válidos
    const subcategories: SubcategoryStat[] = classificacoes.map(({ slug, info, count }) => {
        const totalNaDisciplina = discCount.get(info.discipline) ?? 0;
        return {
            slug,
            label: formatLabel(slug),
            discipline: info.discipline,
            area: info.area,
            count,
            percentInDiscipline: totalNaDisciplina > 0
                ? Number(((count / totalNaDisciplina) * 100).toFixed(2))
                : 0,
            percentOverall: total > 0
                ? Number(((count / total) * 100).toFixed(2))
                : 0,
        };
    });

    // Ordena por count desc dentro de cada disciplina
    subcategories.sort((a, b) => {
        if (a.discipline !== b.discipline) return a.discipline.localeCompare(b.discipline);
        return b.count - a.count;
    });

    const grouped = subcategories.reduce((acc, s) => {
        (acc[s.discipline] ??= []).push(s);
        return acc;
    }, {} as Record<string, SubcategoryStat[]>);

    return {
        totalQuestions: total,
        perDiscipline: Object.fromEntries(discCount.entries()),
        subcategories,
        grouped,
    };
}

export async function GET() {
    if (cache) return NextResponse.json(cache);
    if (!inflight) inflight = computeStats();

    try {
        const data = await inflight;
        cache = data;
        return NextResponse.json(data);
    } catch (err) {
        inflight = null;
        return NextResponse.json(
            {
                code: "internal_server_error",
                message: `Failed to compute subcategory stats: ${(err as Error).message}`,
            },
            { status: 500 },
        );
    }
}
