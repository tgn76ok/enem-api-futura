import { NextResponse } from 'next/server';
import { VALID_SUBCATEGORIES } from '@/lib/zod/schemas/questions';

/**
 * Formata um slug para um nome amigável (ex: "geometria-plana" -> "Geometria Plana")
 */
function formatLabel(slug: string): string {
    return slug
        .split('-')
        .map(word => {
            if (word === 'do' || word === 'da' || word === 'de' || word === 'em') return word;
            if (word === 'lem') return 'LEM';
            if (word === 'brasil') return 'Brasil';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

/**
 * Mapeia as subcategorias para suas respectivas disciplinas
 * Baseado no DISCIPLINE_CONFIG do scripts/classify-questions.ts
 */
const SUBCATEGORY_MAP: Record<string, { discipline: string; area: string }> = {
    // Matemática
    'numeros-proporcionalidade': { discipline: 'matematica', area: 'matematica' },
    'algebra': { discipline: 'matematica', area: 'matematica' },
    'funcoes': { discipline: 'matematica', area: 'matematica' },
    'geometria-plana': { discipline: 'matematica', area: 'matematica' },
    'geometria-espacial': { discipline: 'matematica', area: 'matematica' },
    'geometria-analitica': { discipline: 'matematica', area: 'matematica' },
    'trigonometria': { discipline: 'matematica', area: 'matematica' },
    'grandezas-medidas': { discipline: 'matematica', area: 'matematica' },
    'estatistica': { discipline: 'matematica', area: 'matematica' },
    'probabilidade': { discipline: 'matematica', area: 'matematica' },
    'analise-combinatoria': { discipline: 'matematica', area: 'matematica' },
    'matematica-financeira': { discipline: 'matematica', area: 'matematica' },
    'leitura-graficos-tabelas': { discipline: 'matematica', area: 'matematica' },
    
    // Física
    'mecanica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'cinematica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'dinamica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'trabalho-energia': { discipline: 'fisica', area: 'ciencias-natureza' },
    'hidrostatica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'termologia': { discipline: 'fisica', area: 'ciencias-natureza' },
    'termodinamica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'optica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'ondulatoria': { discipline: 'fisica', area: 'ciencias-natureza' },
    'eletrostatica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'eletrodinamica': { discipline: 'fisica', area: 'ciencias-natureza' },
    'magnetismo': { discipline: 'fisica', area: 'ciencias-natureza' },
    'fisica-moderna': { discipline: 'fisica', area: 'ciencias-natureza' },
    
    // Química
    'estrutura-atomica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'tabela-periodica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'ligacoes-quimicas': { discipline: 'quimica', area: 'ciencias-natureza' },
    'funcoes-inorganicas': { discipline: 'quimica', area: 'ciencias-natureza' },
    'estequiometria': { discipline: 'quimica', area: 'ciencias-natureza' },
    'solucoes': { discipline: 'quimica', area: 'ciencias-natureza' },
    'termoquimica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'cinetica-quimica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'equilibrio-quimico': { discipline: 'quimica', area: 'ciencias-natureza' },
    'eletroquimica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'quimica-organica': { discipline: 'quimica', area: 'ciencias-natureza' },
    'quimica-ambiental': { discipline: 'quimica', area: 'ciencias-natureza' },
    
    // Biologia
    'citologia': { discipline: 'biologia', area: 'ciencias-natureza' },
    'bioquimica': { discipline: 'biologia', area: 'ciencias-natureza' },
    'genetica': { discipline: 'biologia', area: 'ciencias-natureza' },
    'evolucao': { discipline: 'biologia', area: 'ciencias-natureza' },
    'ecologia': { discipline: 'biologia', area: 'ciencias-natureza' },
    'fisiologia-humana': { discipline: 'biologia', area: 'ciencias-natureza' },
    'parasitologia-saude': { discipline: 'biologia', area: 'ciencias-natureza' },
    'biotecnologia': { discipline: 'biologia', area: 'ciencias-natureza' },
    'botanica': { discipline: 'biologia', area: 'ciencias-natureza' },
    'zoologia': { discipline: 'biologia', area: 'ciencias-natureza' },
    
    // História
    'historia-antiga': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-medieval': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-moderna': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-contemporanea': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-do-brasil-colonia': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-do-brasil-imperio': { discipline: 'historia', area: 'ciencias-humanas' },
    'historia-do-brasil-republica': { discipline: 'historia', area: 'ciencias-humanas' },
    'movimentos-sociais-cidadania': { discipline: 'historia', area: 'ciencias-humanas' },
    'cultura-memoria': { discipline: 'historia', area: 'ciencias-humanas' },
    
    // Geografia
    'cartografia': { discipline: 'geografia', area: 'ciencias-humanas' },
    'geografia-fisica': { discipline: 'geografia', area: 'ciencias-humanas' },
    'geopolitica': { discipline: 'geografia', area: 'ciencias-humanas' },
    'demografia': { discipline: 'geografia', area: 'ciencias-humanas' },
    'urbanizacao': { discipline: 'geografia', area: 'ciencias-humanas' },
    'industrializacao': { discipline: 'geografia', area: 'ciencias-humanas' },
    'agropecuaria': { discipline: 'geografia', area: 'ciencias-humanas' },
    'questoes-ambientais': { discipline: 'geografia', area: 'ciencias-humanas' },
    'globalizacao': { discipline: 'geografia', area: 'ciencias-humanas' },
    
    // Filosofia
    'filosofia-antiga': { discipline: 'filosofia', area: 'ciencias-humanas' },
    'filosofia-moderna': { discipline: 'filosofia', area: 'ciencias-humanas' },
    'filosofia-contemporanea': { discipline: 'filosofia', area: 'ciencias-humanas' },
    'etica': { discipline: 'filosofia', area: 'ciencias-humanas' },
    'politica': { discipline: 'filosofia', area: 'ciencias-humanas' },
    'epistemologia': { discipline: 'filosofia', area: 'ciencias-humanas' },
    
    // Sociologia
    'cultura-identidade': { discipline: 'sociologia', area: 'ciencias-humanas' },
    'cidadania': { discipline: 'sociologia', area: 'ciencias-humanas' },
    'movimentos-sociais': { discipline: 'sociologia', area: 'ciencias-humanas' },
    'trabalho': { discipline: 'sociologia', area: 'ciencias-humanas' },
    'desigualdade-social': { discipline: 'sociologia', area: 'ciencias-humanas' },
    'estado-poder-politica': { discipline: 'sociologia', area: 'ciencias-humanas' },
    
    // Língua Portuguesa
    'interpretacao-textual': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'generos-textuais': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'funcoes-da-linguagem': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'variacao-linguistica': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'gramatica-contextualizada': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'argumentacao': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    'linguagens-midiaticas': { discipline: 'lingua-portuguesa', area: 'linguagens' },
    
    // Literatura
    'escolas-literarias': { discipline: 'literatura', area: 'linguagens' },
    'analise-literaria': { discipline: 'literatura', area: 'linguagens' },
    'modernismo': { discipline: 'literatura', area: 'linguagens' },
    'poesia': { discipline: 'literatura', area: 'linguagens' },
    'prosa': { discipline: 'literatura', area: 'linguagens' },
    'relacoes-texto-contexto': { discipline: 'literatura', area: 'linguagens' },
    
    // Artes
    'artes-visuais': { discipline: 'artes', area: 'linguagens' },
    'musica': { discipline: 'artes', area: 'linguagens' },
    'teatro': { discipline: 'artes', area: 'linguagens' },
    'danca': { discipline: 'artes', area: 'linguagens' },
    'patrimonio-cultural': { discipline: 'artes', area: 'linguagens' },
    
    // Educação Física
    'corpo-saude': { discipline: 'educacao-fisica', area: 'linguagens' },
    'esporte': { discipline: 'educacao-fisica', area: 'linguagens' },
    'praticas-corporais': { discipline: 'educacao-fisica', area: 'linguagens' },
    'inclusao-corporal': { discipline: 'educacao-fisica', area: 'linguagens' },
    'lazer-cultura-corporal': { discipline: 'educacao-fisica', area: 'linguagens' },
    
    // Língua Estrangeira
    'interpretacao-em-lem': { discipline: 'lingua-estrangeira', area: 'linguagens' },
    'vocabulario-em-contexto': { discipline: 'lingua-estrangeira', area: 'linguagens' },
    'generos-em-lem': { discipline: 'lingua-estrangeira', area: 'linguagens' },
    'diversidade-cultural': { discipline: 'lingua-estrangeira', area: 'linguagens' },
};

export async function GET() {
    const formattedSubcategories = VALID_SUBCATEGORIES.map(slug => {
        const info = SUBCATEGORY_MAP[slug] || { discipline: 'outros', area: 'outros' };
        return {
            slug,
            label: formatLabel(slug),
            discipline: info.discipline,
            area: info.area
        };
    });

    // Opcional: Agrupar por disciplina para o front
    const grouped = formattedSubcategories.reduce((acc, curr) => {
        if (!acc[curr.discipline]) {
            acc[curr.discipline] = [];
        }
        acc[curr.discipline].push(curr);
        return acc;
    }, {} as Record<string, typeof formattedSubcategories>);

    return NextResponse.json({
        total: formattedSubcategories.length,
        subcategories: formattedSubcategories,
        grouped
    });
}
