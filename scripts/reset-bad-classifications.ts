import fs from 'fs';
import path from 'path';

// Importar a mesma taxonomia do classify-questions.ts
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

const YEARS = [
    '2009', '2010', '2011', '2012', '2013', '2014', '2015',
    '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023',
];

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

function isValidClassification(data: QuestionData): boolean {
    if (!data.subcategory || !data.competency || !data.skill) {
        return true; // não classificado ainda, está ok
    }

    const discipline = (data.discipline ?? 'matematica') as DisciplineKey;
    const cfg = DISCIPLINE_CONFIG[discipline];

    if (!cfg) return true;

    // Verificar se subcategory, competency e skill pertencem à disciplina
    const isValidSubcategory = cfg.subcategories.includes(data.subcategory);
    const isValidCompetency = cfg.competencies.includes(data.competency);
    const isValidSkill = cfg.skills.includes(data.skill);

    return isValidSubcategory && isValidCompetency && isValidSkill;
}

const publicDir = path.join(process.cwd(), 'public');
let cleaned = 0;
let total = 0;
let badClassifications: string[] = [];

for (const year of YEARS) {
    const questionsDir = path.join(publicDir, year, 'questions');
    if (!fs.existsSync(questionsDir)) continue;

    for (const entry of fs.readdirSync(questionsDir)) {
        if (entry.includes('-')) continue;

        const filePath = path.join(questionsDir, entry, 'details.json');
        if (!fs.existsSync(filePath)) continue;

        total++;
        const data: QuestionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (!isValidClassification(data)) {
            badClassifications.push(
                `year=${year} index=${entry}: discipline=${data.discipline}, subcategory=${data.subcategory}, competency=${data.competency}, skill=${data.skill}`,
            );
            // Remover classificação inválida
            data.subcategory = undefined;
            data.competency = undefined;
            data.skill = undefined;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
            cleaned++;

            // Também limpar variantes de linguagem
            const baseDir = path.dirname(path.dirname(filePath));
            for (const lang of ['ingles', 'espanhol']) {
                const variantPath = path.join(baseDir, `${entry}-${lang}`, 'details.json');
                if (fs.existsSync(variantPath)) {
                    const v: QuestionData = JSON.parse(fs.readFileSync(variantPath, 'utf-8'));
                    v.subcategory = undefined;
                    v.competency = undefined;
                    v.skill = undefined;
                    fs.writeFileSync(variantPath, JSON.stringify(v, null, 4), 'utf-8');
                }
            }
        }
    }
}

console.log(`Total processado: ${total}`);
console.log(`Classificações incorretas removidas: ${cleaned}`);

if (badClassifications.length > 0) {
    fs.writeFileSync('bad-classifications.log', badClassifications.join('\n'), 'utf-8');
    console.log(`Detalhes salvos em bad-classifications.log`);
}

console.log('Reset concluído! Execute npm run classify para reclassificar.');
