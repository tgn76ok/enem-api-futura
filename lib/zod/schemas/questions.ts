import z from '@/lib/zod';

export const VALID_DISCIPLINES = [
    'linguagens',
    'ciencias-humanas',
    'ciencias-natureza',
    'matematica',
] as const;

// Taxonomia canônica — slugs reais em uso no banco de dados (2009–2025)
export const VALID_SUBCATEGORIES = [
    // ── Matemática ──────────────────────────────────────────────────────────
    'numeros-proporcionalidade', 'algebra', 'funcoes', 'geometria',
    'trigonometria', 'grandezas-medidas', 'estatistica',
    'matematica-financeira', 'leitura-graficos-tabelas',
    'matematica-analise-dimensional',

    // ── Ciências da Natureza — Física ───────────────────────────────────────
    'fisica-mecanica', 'fisica-termica', 'fisica-ondas',
    'eletrostatica', 'eletrodinamica', 'fisica-eletricidade', 'fisica-moderna',

    // ── Ciências da Natureza — Química ──────────────────────────────────────
    'quimica-organica', 'quimica-inorganica', 'quimica-analitica',
    'estrutura-atomica',

    // ── Ciências da Natureza — Biologia ─────────────────────────────────────
    'genetica', 'ecologia', 'fisiologia', 'botanica',
    'biologia-molecular', 'parasitologia-saude', 'imunologia',

    // ── Ciências Humanas — História Geral ───────────────────────────────────
    'historia-geral-antiga', 'historia-geral-medieval',
    'historia-geral-moderna', 'historia-geral-contemporanea',

    // ── Ciências Humanas — História do Brasil ───────────────────────────────
    'historia-do-brasil-colonia', 'historia-do-brasil-imperio',
    'historia-do-brasil-republica',

    // ── Ciências Humanas — Filosofia ────────────────────────────────────────
    'filosofia-antiga', 'filosofia-medieval',
    'filosofia-moderna', 'filosofia-contemporanea', 'filosofia-etica',

    // ── Ciências Humanas — Sociologia ───────────────────────────────────────
    'sociologia', 'movimentos-sociais-cidadania', 'cultura-identidade',
    'cultura-memoria', 'estado-poder-politica', 'politica',
    'trabalho', 'religioes-afro-brasileiras',

    // ── Ciências Humanas — Geografia ────────────────────────────────────────
    'geografia-fisica', 'cartografia', 'geopolitica', 'globalizacao',
    'urbanizacao', 'demografia', 'migracao', 'industrializacao',
    'agropecuaria', 'questoes-ambientais',

    // ── Linguagens — Interpretação de Texto ─────────────────────────────────
    'interpretacao-de-texto-literario', 'interpretacao-de-texto-argumentativo',
    'interpretacao-de-texto-informativo', 'interpretacao-de-texto-publicitario',
    'interpretacao-de-texto-multimodal', 'intertextualidade',

    // ── Linguagens — Literatura ──────────────────────────────────────────────
    'analise-literaria', 'escolas-literarias', 'poesia',

    // ── Linguagens — Língua Portuguesa ──────────────────────────────────────
    'argumentacao', 'variedades-linguisticas', 'generos-textuais',
    'funcoes-da-linguagem', 'gramatica-contextualizada', 'linguagens-midiaticas',

    // ── Linguagens — Língua Estrangeira ─────────────────────────────────────
    'interpretacao-em-lem', 'lingua-estrangeira',

    // ── Linguagens — Outros ──────────────────────────────────────────────────
    'corpo-saude',
] as const;

export const QuestionIndexPath = z.string().openapi({
    ref: 'index',
    example: '42',
    description: 'O número da questão na prova',
});

export const QuestionSchema = z
    .object({
        title: z
            .string()
            .describe('O título da questão')
            .openapi({ example: 'Questão 1 - ENEM 2020' }),
        index: z
            .number()
            .int()
            .positive()
            .describe('O número da questão na prova')
            .openapi({ example: 1 }),
        discipline: z
            .string()
            .nullable()
            .describe('A disciplina da questão')
            .openapi({ example: 'linguagens' }),
        language: z
            .string()
            .nullable()
            .optional()
            .describe('O idioma da questão')
            .openapi({ example: 'ingles' }),
        subcategory: z
            .string()
            .nullable()
            .optional()
            .describe('A subcategoria canônica da questão (ex: historia-geral, biologia-molecular)')
            .openapi({ example: 'historia-geral' }),
    })
    .openapi({
        title: 'Questão',
    });

export const QuestionDetailSchema = QuestionSchema.extend({
    competency: z
        .string()
        .nullable()
        .describe('O código de competência da Matriz de Referência do ENEM (ex: C3)')
        .openapi({ example: 'C3' }),
    skill: z
        .string()
        .nullable()
        .describe('O código de habilidade da Matriz de Referência do ENEM (ex: H14)')
        .openapi({ example: 'H14' }),
    year: z
        .number()
        .int()
        .positive()
        .describe('O ano em que a prova foi aplicada')
        .openapi({ example: 2020 }),
    context: z
        .string()
        .nullable()
        .describe('O contexto da questão, em Markdown')
        .openapi({
            example:
                'Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.',
        }),
    files: z
        .array(z.string())
        .describe('Os arquivos da questão')
        .openapi({
            example: [
                'https://enem.dev/2020/questions/1-ingles/6e1ca12e-9bc4-472b-8809-84e7e394714a.png',
            ],
        }),
    correctAlternative: z
        .enum(['A', 'B', 'C', 'D', 'E'])
        .describe('A alternativa correta da questão')
        .openapi({ example: 'A' }),
    alternativesIntroduction: z
        .string()
        .nullable()
        .describe('O texto introdutório das alternativas da questão')
        .openapi({
            example: 'Com base no texto, selecione a alternativa correta',
        }),
    alternatives: z
        .array(
            z.object({
                letter: z
                    .enum(['A', 'B', 'C', 'D', 'E'])
                    .describe('A letra da alternativa')
                    .openapi({ example: 'A' }),
                text: z
                    .string()
                    .nullable()
                    .describe('O texto da alternativa')
                    .openapi({
                        example:
                            'Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.',
                    }),
                file: z
                    .string()
                    .nullable()
                    .describe('O arquivo da alternativa')
                    .openapi({
                        example:
                            'https://enem.dev/2020/questions/1-ingles/6e1ca12e-9bc4-472b-8809-84e7e394714a.png',
                    }),
                isCorrect: z
                    .boolean()
                    .describe('Se a alternativa é a correta ou não')
                    .openapi({ example: true }),
            }),
        )
        .describe('As alternativas da questão'),
}).openapi({
    title: 'Detalhes da questão',
});

export const GetQuestionsResponseSchema = z.object({
    metadata: z.object({
        limit: z
            .number()
            .int()
            .positive()
            .describe('O número máximo de questões retornadas')
            .openapi({ example: 10 }),
        offset: z
            .number()
            .int()
            .nonnegative()
            .describe('O número da primeira questão retornada')
            .openapi({ example: 0 }),
        total: z
            .number()
            .int()
            .nonnegative()
            .describe('O número total de questões da prova')
            .openapi({ example: 180 }),
        hasMore: z
            .boolean()
            .describe('Se há mais questões disponíveis ou não')
            .openapi({ example: true }),
    }),
    questions: z.array(QuestionDetailSchema).describe('As questões da prova'),
});

export const GetQuestionsQuerySchema = z.object({
    limit: z.coerce
        .number()
        .int()
        .positive()
        .default(10)
        .describe('O número máximo de questões a serem retornadas')
        .openapi({ example: 10 }),
    offset: z.coerce
        .number()
        .int()
        .nonnegative()
        .default(0)
        .describe('O numero da primeira questão a ser retornada')
        .openapi({ example: 0 }),
    language: z
        .string()
        .optional()
        .describe('O idioma desejado das questões')
        .openapi({ example: 'ingles' }),
    discipline: z
        .enum(VALID_DISCIPLINES)
        .optional()
        .describe('Filtrar por disciplina (linguagens, ciencias-humanas, ciencias-natureza, matematica)')
        .openapi({ example: 'matematica' }),
    subcategory: z
        .enum(VALID_SUBCATEGORIES)
        .optional()
        .describe('Filtrar por subcategoria canônica (ex: historia-geral-moderna, fisica-mecanica)')
        .openapi({ example: 'historia-geral-moderna' }),
    competency: z
        .string()
        .optional()
        .describe('Filtrar por código de competência da Matriz de Referência (ex: C3)')
        .openapi({ example: 'C3' }),
    skill: z
        .string()
        .optional()
        .describe('Filtrar por código de habilidade da Matriz de Referência (ex: H14)')
        .openapi({ example: 'H14' }),
});

export const SubcategorySchema = z.object({
    slug: z.string().describe('O slug canônico da subcategoria').openapi({ example: 'historia-geral' }),
    count: z.number().int().nonnegative().describe('Número de questões nessa subcategoria').openapi({ example: 12 }),
    discipline: z.string().describe('A disciplina associada').openapi({ example: 'ciencias-humanas' }),
}).openapi({ title: 'Subcategoria' });

export const GetSubcategoriesResponseSchema = z.object({
    year: z.number().int().positive().openapi({ example: 2023 }),
    subcategories: z.array(SubcategorySchema),
}).openapi({ title: 'Subcategorias da prova' });

export const GetQuestionDetailsQuerySchema = z.object({
    language: z
        .string()
        .optional()
        .describe('O idioma desejado da questão')
        .openapi({ example: 'ingles' }),
});
