import { config } from 'dotenv';
config({ path: '.env.local' });

import Groq from 'groq-sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROVIDER = (process.env.LLM_PROVIDER ?? 'groq') as 'groq' | 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct-q4_K_M';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
const MODEL = PROVIDER === 'ollama' ? OLLAMA_MODEL : GROQ_MODEL;
const CONCURRENCY = parseInt(
    process.env.CLASSIFY_CONCURRENCY ?? (PROVIDER === 'ollama' ? '4' : '10'),
    10,
);
const MAX_RETRIES = 2;
const BATCH_SIZE = 20; // Processa em lotes pequenos para debug
const CACHE_FILE = path.join(process.cwd(), '.classify-cache.json');

const client: OpenAI =
    PROVIDER === 'ollama'
        ? new OpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: 'ollama' })
        : (new Groq({ apiKey: process.env.GROQ_API_KEY }) as unknown as OpenAI);

// ---------------------------------------------------------------------------
// Cache System
// ---------------------------------------------------------------------------

interface CacheEntry {
    hash: string;
    discipline: string;
    subcategory: string;
    competency: string;
    skill: string;
    justification: string;
    timestamp: number;
}

type ClassificationCache = Record<string, CacheEntry>;

let cache: ClassificationCache = {};
let cacheHits = 0;
let cacheMisses = 0;

// Carregar cache ao iniciar
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            console.log(`📂 Cache carregado com ${Object.keys(cache).length} entradas`);
        } catch (err) {
            console.warn('⚠️  Erro ao carregar cache, iniciando novo');
            cache = {};
        }
    }
}

// Salvar cache periodicamente
function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (err) {
        console.error('❌ Erro ao salvar cache:', err);
    }
}

// Gerar hash de uma questão para detecção de duplicatas
function generateQuestionHash(data: QuestionData): string {
    const content = `${data.title}|${data.context}|${data.alternatives?.map((a) => a.text).join('|')}`;
    // Simples hash baseado em comprimento e caracteres-chave
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Converter para 32-bit int
    }
    return `${data.discipline}_${Math.abs(hash)}`;
}

// Consultar cache
function getFromCache(data: QuestionData): CacheEntry | null {
    const hash = generateQuestionHash(data);
    const entry = cache[hash];
    if (entry) {
        cacheHits++;
        return entry;
    }
    cacheMisses++;
    return null;
}

// Armazenar no cache
function putInCache(data: QuestionData, classification: Classification) {
    const hash = generateQuestionHash(data);
    cache[hash] = {
        hash,
        discipline: data.discipline || 'unknown',
        subcategory: classification.subcategory,
        competency: classification.competency,
        skill: classification.skill,
        justification: classification.justification,
        timestamp: Date.now(),
    };
}

// ---------------------------------------------------------------------------
// Taxonomy — aligned with the official ENEM reference matrix
// ---------------------------------------------------------------------------

type DisciplineKey =
    | 'historia'
    | 'geografia'
    | 'filosofia'
    | 'sociologia'
    | 'biologia'
    | 'quimica'
    | 'fisica'
    | 'lingua-portuguesa'
    | 'literatura'
    | 'artes'
    | 'educacao-fisica'
    | 'lingua-estrangeira'
    | 'matematica';

interface DisciplineConfig {
    area: string;
    competencies: string[];
    skills: string[];
    subcategories: string[];
}

const h = (n: number) => Array.from({ length: n }, (_, i) => `H${i + 1}`);
const c = (n: number) => Array.from({ length: n }, (_, i) => `C${i + 1}`);

const DISCIPLINE_CONFIG: Record<DisciplineKey, DisciplineConfig> = {
    matematica: {
        area: 'matematica',
        competencies: c(7),
        skills: h(30),
        subcategories: [
            'numeros-proporcionalidade',
            'algebra',
            'funcoes',
            'geometria-plana',
            'geometria-espacial',
            'geometria-analitica',
            'trigonometria',
            'grandezas-medidas',
            'estatistica',
            'probabilidade',
            'analise-combinatoria',
            'matematica-financeira',
            'leitura-graficos-tabelas',
        ],
    },
    fisica: {
        area: 'ciencias-natureza',
        competencies: c(8),
        skills: h(30),
        subcategories: [
            'mecanica',
            'cinematica',
            'dinamica',
            'trabalho-energia',
            'hidrostatica',
            'termologia',
            'termodinamica',
            'optica',
            'ondulatoria',
            'eletrostatica',
            'eletrodinamica',
            'magnetismo',
            'fisica-moderna',
        ],
    },
    quimica: {
        area: 'ciencias-natureza',
        competencies: c(8),
        skills: h(30),
        subcategories: [
            'estrutura-atomica',
            'tabela-periodica',
            'ligacoes-quimicas',
            'funcoes-inorganicas',
            'estequiometria',
            'solucoes',
            'termoquimica',
            'cinetica-quimica',
            'equilibrio-quimico',
            'eletroquimica',
            'quimica-organica',
            'quimica-ambiental',
        ],
    },
    biologia: {
        area: 'ciencias-natureza',
        competencies: c(8),
        skills: h(30),
        subcategories: [
            'citologia',
            'bioquimica',
            'genetica',
            'evolucao',
            'ecologia',
            'fisiologia-humana',
            'parasitologia-saude',
            'biotecnologia',
            'botanica',
            'zoologia',
        ],
    },
    historia: {
        area: 'ciencias-humanas',
        competencies: c(6),
        skills: h(30),
        subcategories: [
            'historia-antiga',
            'historia-medieval',
            'historia-moderna',
            'historia-contemporanea',
            'historia-do-brasil-colonia',
            'historia-do-brasil-imperio',
            'historia-do-brasil-republica',
            'movimentos-sociais-cidadania',
            'cultura-memoria',
        ],
    },
    geografia: {
        area: 'ciencias-humanas',
        competencies: c(6),
        skills: h(30),
        subcategories: [
            'cartografia',
            'geografia-fisica',
            'geopolitica',
            'demografia',
            'urbanizacao',
            'industrializacao',
            'agropecuaria',
            'questoes-ambientais',
            'globalizacao',
        ],
    },
    filosofia: {
        area: 'ciencias-humanas',
        competencies: c(6),
        skills: h(30),
        subcategories: [
            'filosofia-antiga',
            'filosofia-moderna',
            'filosofia-contemporanea',
            'etica',
            'politica',
            'epistemologia',
        ],
    },
    sociologia: {
        area: 'ciencias-humanas',
        competencies: c(6),
        skills: h(30),
        subcategories: [
            'cultura-identidade',
            'cidadania',
            'movimentos-sociais',
            'trabalho',
            'desigualdade-social',
            'estado-poder-politica',
        ],
    },
    'lingua-portuguesa': {
        area: 'linguagens',
        competencies: c(9),
        skills: h(30),
        subcategories: [
            'interpretacao-textual',
            'generos-textuais',
            'funcoes-da-linguagem',
            'variacao-linguistica',
            'gramatica-contextualizada',
            'argumentacao',
            'linguagens-midiaticas',
        ],
    },
    literatura: {
        area: 'linguagens',
        competencies: c(9),
        skills: h(30),
        subcategories: [
            'escolas-literarias',
            'analise-literaria',
            'modernismo',
            'poesia',
            'prosa',
            'relacoes-texto-contexto',
        ],
    },
    artes: {
        area: 'linguagens',
        competencies: c(9),
        skills: h(30),
        subcategories: [
            'artes-visuais',
            'musica',
            'teatro',
            'danca',
            'patrimonio-cultural',
        ],
    },
    'educacao-fisica': {
        area: 'linguagens',
        competencies: c(9),
        skills: h(30),
        subcategories: [
            'corpo-saude',
            'esporte',
            'praticas-corporais',
            'inclusao-corporal',
            'lazer-cultura-corporal',
        ],
    },
    'lingua-estrangeira': {
        area: 'linguagens',
        competencies: c(9),
        skills: ['H5', 'H6', 'H7', 'H8'],
        subcategories: [
            'interpretacao-em-lem',
            'vocabulario-em-contexto',
            'generos-em-lem',
            'diversidade-cultural',
        ],
    },
};

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

interface QuestionData {
    title: string;
    index: number;
    year: number;
    language: string | null;
    discipline: string | null;
    subcategory?: string | null;
    competency?: string | null;
    skill?: string | null;
    context?: string | null;
    files?: string[];
    correctAlternative?: string;
    alternativesIntroduction?: string | null;
    alternatives?: Array<{
        letter: string;
        text: string | null;
        file: string | null;
        isCorrect: boolean;
    }>;
}

interface QuestionMeta {
    filePath: string;
    year: string;
    index: string;
    data: QuestionData;
}

const ClassificationSchema = z.object({
    subcategory: z.string().min(1).default('').transform(s => s.trim()),
    competency: z
        .union([
            z.string().regex(/^C\d+$/),
            z.number().transform(n => `C${n}`),
        ])
        .default('C1'),
    skill: z
        .union([
            z.string().regex(/^H\d+$/),
            z.number().transform(n => `H${n}`),
        ])
        .default('H1'),
    confidence: z
        .union([
            z.number().min(0).max(1),
            z.string().transform(s => {
                const num = parseFloat(s);
                return isNaN(num) ? 0.8 : Math.min(1, Math.max(0, num));
            }),
        ])
        .default(0.8),
    justification: z.string().max(500).default('Classificação automática'),
}).passthrough(); // Permite campos extras do modelo

type Classification = z.infer<typeof ClassificationSchema>;

// Função para "limpar" resposta JSON incompleta do modelo
function cleanAndFixJSON(rawJson: string): object {
    try {
        // Tentar parse direto
        let obj = JSON.parse(rawJson);
        
        // Coercionar types
        if (typeof obj.confidence === 'string') {
            obj.confidence = parseFloat(obj.confidence) || 0.8;
        }
        if (typeof obj.competency === 'number') {
            obj.competency = `C${obj.competency}`;
        }
        if (typeof obj.skill === 'number') {
            obj.skill = `H${obj.skill}`;
        }
        
        return obj;
    } catch {
        // Se falhar, tentar consertar JSON quebrado
        let fixed = rawJson;
        
        // Se terminar com vírgula, remover
        fixed = fixed.replace(/,\s*}/, '}');
        fixed = fixed.replace(/,\s*]/, ']');
        
        // Se campos estiverem vazios ou undefined, tentar adicionar placeholders
        if (!fixed.includes('"subcategory"')) {
            fixed = fixed.replace('{', '{"subcategory":"",');
        }
        if (!fixed.includes('"competency"')) {
            fixed = fixed.replace('{', '{"competency":"C1",');
        }
        if (!fixed.includes('"skill"')) {
            fixed = fixed.replace('{', '{"skill":"H1",');
        }
        if (!fixed.includes('"confidence"')) {
            fixed = fixed.replace('{', '{"confidence":0.8,');
        }
        
        try {
            let obj = JSON.parse(fixed);
            
            // Coercionar types novamente
            if (typeof obj.confidence === 'string') {
                obj.confidence = parseFloat(obj.confidence) || 0.8;
            }
            if (typeof obj.competency === 'number') {
                obj.competency = `C${obj.competency}`;
            }
            if (typeof obj.skill === 'number') {
                obj.skill = `H${obj.skill}`;
            }
            
            return obj;
        } catch {
            // Se continuar falhando, retornar objeto padrão
            return {
                subcategory: '',
                competency: 'C1',
                skill: 'H1',
                justification: 'Erro ao processar resposta',
                confidence: 0.5,
            };
        }
    }
}

// Validação local adicional
function validateAgainstDiscipline(
    discipline: DisciplineKey,
    parsed: Classification,
): boolean {
    const cfg = DISCIPLINE_CONFIG[discipline];
    if (!cfg) return false;

    const isValidSubcategory = cfg.subcategories.includes(parsed.subcategory);
    const isValidCompetency = cfg.competencies.includes(parsed.competency);
    const isValidSkill = cfg.skills.includes(parsed.skill);

    if (!isValidSubcategory) {
        console.warn(`  ⚠️  Subcategoria inválida: "${parsed.subcategory}" não está em ${discipline}`);
    }
    if (!isValidCompetency) {
        console.warn(`  ⚠️  Competência inválida: "${parsed.competency}" não está em ${discipline}`);
    }
    if (!isValidSkill) {
        console.warn(`  ⚠️  Habilidade inválida: "${parsed.skill}" não está em ${discipline}`);
    }

    return isValidSubcategory && isValidCompetency && isValidSkill;
}

// ---------------------------------------------------------------------------
// Prompt Builder - RIGOROSO E FOCADO NA DISCIPLINA
// ---------------------------------------------------------------------------

function buildPrompt(data: QuestionData): string {
    const discipline = (data.discipline ?? 'matematica') as DisciplineKey;
    const cfg = DISCIPLINE_CONFIG[discipline] ?? DISCIPLINE_CONFIG['matematica'];

    const contextText = data.context
        ? `\n\n📋 CONTEXTO:\n${data.context.substring(0, 1200)}`
        : '';

    const intro = data.alternativesIntroduction
        ? `\n\n🔤 ENUNCIADO:\n${data.alternativesIntroduction.substring(0, 500)}`
        : '';

    const alternativesText =
        data.alternatives
            ?.filter((a) => a.text)
            .map((a) => `${a.letter}) ${a.text}`)
            .join('\n') ?? '';

    // PROMPT FOCADO NA DISCIPLINA
    return `🎓 CLASSIFICADOR ESPECIALISTA DO ENEM

DISCIPLINA: ${discipline}
ÁREA ENEM: ${cfg.area}

⚠️ REGRAS CRÍTICAS:
1. A subcategoria DEVE ser UMA DESTAS: ${cfg.subcategories.join(', ')}
2. A competência DEVE ser UMA DESTAS: ${cfg.competencies.join(', ')}
3. A habilidade DEVE ser UMA DESTAS: ${cfg.skills.join(', ')}
4. NÃO use campos de outras disciplinas
5. Se não tiver certeza, escolha a MAIS PRÓXIMA logicamente

📌 QUESTÃO: ${data.title}${contextText}${intro}

📌 ALTERNATIVAS:
${alternativesText}

🔍 RESPOSTA (JSON válido, RIGOROSAMENTE dentro da taxonomia):
`;
}

// ---------------------------------------------------------------------------
// Classify one question (com retry e validação rigorosa)
// ---------------------------------------------------------------------------

async function classifyOne(q: QuestionMeta): Promise<void> {
    const discipline = (q.data.discipline ?? 'matematica') as DisciplineKey;

    // ✅ VERIFICAR CACHE PRIMEIRO
    const cached = getFromCache(q.data);
    if (cached) {
        const parsed: Classification = {
            subcategory: cached.subcategory,
            competency: cached.competency,
            skill: cached.skill,
            justification: cached.justification,
            confidence: 1.0, // Cache hit = confiança total
        };

        const apply = (data: QuestionData) => {
            data.subcategory = parsed.subcategory;
            data.competency = parsed.competency;
            data.skill = parsed.skill;
        };

        apply(q.data);
        fs.writeFileSync(q.filePath, JSON.stringify(q.data, null, 4), 'utf-8');

        const baseDir = path.dirname(path.dirname(q.filePath));
        for (const lang of ['ingles', 'espanhol']) {
            const variantPath = path.join(baseDir, `${q.index}-${lang}`, 'details.json');
            if (fs.existsSync(variantPath)) {
                const v: QuestionData = JSON.parse(fs.readFileSync(variantPath, 'utf-8'));
                apply(v);
                fs.writeFileSync(variantPath, JSON.stringify(v, null, 4), 'utf-8');
            }
        }
        return; // ✅ Retornar com sucesso
    }

    // ❌ SE NÃO ESTIVER NO CACHE, CHAMAR O MODELO
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await client.chat.completions.create({
                model: MODEL,
                temperature: 0.05, // Mais baixo possível
                max_tokens: 500, // Aumentado significativamente
                messages: [
                    {
                        role: 'system',
                        content:
                            'Você é um classificador especialista do ENEM. SEMPRE responda com JSON VÁLIDO E COMPLETO com TIPOS CORRETOS. INCLUA SEMPRE: "subcategory" (string), "competency" (string C#), "skill" (string H#), "confidence" (número 0-1), "justification" (string). NUNCA use subcategorias, competências ou habilidades de outras disciplinas. Respeite RIGOROSAMENTE as listas fornecidas.',
                    },
                    { role: 'user', content: buildPrompt(q.data) },
                ],
                response_format:
                    PROVIDER === 'groq'
                        ? {
                              type: 'json_schema',
                              json_schema: {
                                  name: 'enem_classification',
                                  strict: false,
                                  schema: {
                                      type: 'object',
                                      properties: {
                                          subcategory: { type: 'string' },
                                          competency: { type: 'string' },
                                          skill: { type: 'string' },
                                          confidence: { type: 'number' },
                                          justification: { type: 'string' },
                                      },
                                      required: [
                                          'subcategory',
                                          'competency',
                                          'skill',
                                          'justification',
                                      ],
                                      additionalProperties: false,
                                  },
                              },
                          }
                        : { type: 'json_object' as const },
            });

            const raw = response.choices[0]?.message?.content?.trim() ?? '';
            if (!raw) throw new Error('Resposta vazia do modelo');

            // Extrair JSON de forma mais robusta
            let jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error(`Nenhum JSON encontrado. Resposta: ${raw.substring(0, 200)}`);
            }

            let jsonStr = jsonMatch[0];
            
            // Se o JSON parecer truncado, tentar fechar adequadamente
            if (jsonStr.match(/[,\s]$/)) {
                jsonStr = jsonStr + '}';
            }

            // Limpar e parsear JSON
            const rawObj = cleanAndFixJSON(jsonStr);
            
            // Log detalhado para debug
            if (PROVIDER === 'ollama') {
                console.log(`  📦 JSON raw: ${JSON.stringify(rawObj).substring(0, 150)}`);
            }
            
            let parsed = ClassificationSchema.parse(rawObj);

            // Validações adicionais após parse
            if (!parsed.subcategory || parsed.subcategory.trim() === '') {
                throw new Error('Subcategoria vazia após parse');
            }

            if (parsed.justification.length > 500) {
                parsed.justification = parsed.justification.substring(0, 497) + '...';
            }

            if (!validateAgainstDiscipline(discipline, parsed)) {
                throw new Error(
                    `Classificação inválida para ${discipline}: ${JSON.stringify(parsed)}`,
                );
            }

            // 💾 ARMAZENAR NO CACHE
            putInCache(q.data, parsed);

            const apply = (data: QuestionData) => {
                data.subcategory = parsed.subcategory;
                data.competency = parsed.competency;
                data.skill = parsed.skill;
            };

            apply(q.data);
            fs.writeFileSync(q.filePath, JSON.stringify(q.data, null, 4), 'utf-8');

            const baseDir = path.dirname(path.dirname(q.filePath));
            for (const lang of ['ingles', 'espanhol']) {
                const variantPath = path.join(baseDir, `${q.index}-${lang}`, 'details.json');
                if (fs.existsSync(variantPath)) {
                    const v: QuestionData = JSON.parse(fs.readFileSync(variantPath, 'utf-8'));
                    apply(v);
                    fs.writeFileSync(variantPath, JSON.stringify(v, null, 4), 'utf-8');
                }
            }

            return;
        } catch (err) {
            lastError = err;
            const errMsg = err instanceof Error ? err.message : String(err);

            if (attempt < MAX_RETRIES) {
                console.warn(
                    `  🔄 Retry ${attempt}/${MAX_RETRIES} (erro: ${errMsg.substring(0, 100)})`,
                );
                // Aguardar mais tempo entre tentativas
                await new Promise((r) => setTimeout(r, 1000 * attempt + Math.random() * 500));
            } else {
                console.error(`  ❌ FINAL - Erro após ${MAX_RETRIES} tentativas: ${errMsg.substring(0, 150)}`);
            }
        }
    }

    throw lastError;
}

// ---------------------------------------------------------------------------
// Collect questions
// ---------------------------------------------------------------------------

const YEARS = [
    '2009', '2010', '2011', '2012', '2013', '2014', '2015',
    '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023',
];

const publicDir = path.join(process.cwd(), 'public');
const questions: QuestionMeta[] = [];

for (const year of YEARS) {
    const questionsDir = path.join(publicDir, year, 'questions');
    if (!fs.existsSync(questionsDir)) continue;

    for (const entry of fs.readdirSync(questionsDir)) {
        if (entry.includes('-')) continue;

        const filePath = path.join(questionsDir, entry, 'details.json');
        if (!fs.existsSync(filePath)) continue;

        const data: QuestionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.subcategory !== undefined) continue;

        questions.push({ filePath, year, index: entry, data });
    }
}

console.log(`Found ${questions.length} questions to classify`);
console.log(`Provider: ${PROVIDER} | Model: ${MODEL} | Concurrency: ${CONCURRENCY}`);

if (questions.length === 0) {
    console.log('All questions already classified!');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Main — concurrent workers com logging melhorado
// ---------------------------------------------------------------------------

const errorsLog: string[] = [];
const successLog: Array<{ year: string; index: string; discipline: string; subcategory: string }> = [];

async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         🎓 ENEM QUESTION CLASSIFIER - Batch Processing        ║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  • Provider: ${PROVIDER.toUpperCase()}
  • Model: ${MODEL}
  • Concurrency: ${CONCURRENCY}
  • Max Retries: ${MAX_RETRIES}
  • Batch Size (debug): ${BATCH_SIZE}
    `);

    // 📂 CARREGAR CACHE AO INICIAR
    loadCache();

    let done = 0;
    let errors = 0;
    let cursor = 0;
    let batchCount = 0;

    const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < questions.length) {
            const q = questions[cursor++];

            // Iniciar novo lote a cada BATCH_SIZE questões
            if (cursor % BATCH_SIZE === 1) {
                batchCount++;
                console.log(`\n📦 LOTE #${batchCount} (questões ${cursor - 1}-${Math.min(cursor + BATCH_SIZE - 2, questions.length)})`);
            }

            try {
                await classifyOne(q);
                done++;
                successLog.push({
                    year: q.year,
                    index: q.index,
                    discipline: q.data.discipline || 'unknown',
                    subcategory: q.data.subcategory || 'unknown',
                });

                // Verificar se foi cache hit
                const cached = getFromCache(q.data);
                if (cached) {
                    console.log(`  🔵 ${q.year} #${q.index} → ${q.data.subcategory} (CACHE)`);
                } else {
                    console.log(`  ✅ ${q.year} #${q.index} → ${q.data.subcategory} (NOVO)`);
                }

                // Salvar cache a cada 50 questões
                if (done % 50 === 0) {
                    saveCache();
                }

                if (done % 10 === 0) {
                    console.log(`\n📊 Progresso: ${done}/${questions.length} | Erros: ${errors} | Cache: ${cacheHits}/${cacheHits + cacheMisses} hits`);
                }
            } catch (err) {
                errors++;
                const msg = `${q.year}/${q.index}: ${err instanceof Error ? err.message : String(err)}`;
                errorsLog.push(msg);
                console.warn(`  ❌ ${msg}`);
            }
        }
    });

    await Promise.all(workers);

    // 💾 SALVAR CACHE FINAL
    saveCache();

    // Salvar logs
    if (errorsLog.length > 0) {
        fs.writeFileSync('classify-errors.log', errorsLog.join('\n'), 'utf-8');
    }

    fs.writeFileSync(
        'classify-success.log',
        successLog.map((s) => `${s.year}/${s.index}: ${s.discipline} → ${s.subcategory}`).join('\n'),
        'utf-8',
    );

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      ✅ CLASSIFICAÇÃO CONCLUÍDA                ║
╚════════════════════════════════════════════════════════════════╝

Resumo:
  • Processadas: ${questions.length} questões
  • Sucesso: ${done} ✅
  • Erros: ${errors} ❌
  • Taxa de sucesso: ${((done / questions.length) * 100).toFixed(1)}%

Cache:
  • Cache Hits: ${cacheHits} (${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}%)
  • Cache Misses: ${cacheMisses}
  • Cache Entries: ${Object.keys(cache).length}
  • Cache File: ${CACHE_FILE}

Logs:
  • Sucesso: classify-success.log
  • Erros: classify-errors.log
    `);

    if (errors > 0) {
        process.exit(1);
    }
}

main().catch(console.error);
