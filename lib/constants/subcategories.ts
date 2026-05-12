export type Discipline =
    | 'linguagens'
    | 'ciencias-humanas'
    | 'ciencias-natureza'
    | 'matematica';

export interface SubcategoryInfo {
    slug: string;
    label: string;
    discipline: Discipline;
}

export const SUBCATEGORIES: Record<string, SubcategoryInfo> = {
    // LINGUAGENS
    'analise-literaria': { slug: 'analise-literaria', label: 'Análise Literária', discipline: 'linguagens' },
    'argumentacao': { slug: 'argumentacao', label: 'Argumentação e Dissertação', discipline: 'linguagens' },
    'artes-e-cultura': { slug: 'artes-e-cultura', label: 'Artes e Cultura', discipline: 'linguagens' },
    'artes-visuais': { slug: 'artes-visuais', label: 'Artes Visuais', discipline: 'linguagens' },
    'corpo-saude': { slug: 'corpo-saude', label: 'Corpo e Saúde', discipline: 'linguagens' },
    'cultura-identidade': { slug: 'cultura-identidade', label: 'Cultura e Identidade', discipline: 'linguagens' },
    'diversidade-cultural': { slug: 'diversidade-cultural', label: 'Diversidade Cultural', discipline: 'linguagens' },
    'escolas-literarias': { slug: 'escolas-literarias', label: 'Escolas Literárias', discipline: 'linguagens' },
    'esporte': { slug: 'esporte', label: 'Esporte e Lazer', discipline: 'linguagens' },
    'funcoes-da-linguagem': { slug: 'funcoes-da-linguagem', label: 'Funções da Linguagem', discipline: 'linguagens' },
    'generos-textuais': { slug: 'generos-textuais', label: 'Gêneros Textuais', discipline: 'linguagens' },
    'gramatica-contextualizada': { slug: 'gramatica-contextualizada', label: 'Gramática Contextualizada', discipline: 'linguagens' },
    'identidade-cultural': { slug: 'identidade-cultural', label: 'Identidade Cultural', discipline: 'linguagens' },
    'interpretacao-de-dados': { slug: 'interpretacao-de-dados', label: 'Interpretação de Dados', discipline: 'linguagens' },
    'interpretacao-em-lem': { slug: 'interpretacao-em-lem', label: 'Interpretação em Língua Estrangeira', discipline: 'linguagens' },
    'interpretacao-grafica': { slug: 'interpretacao-grafica', label: 'Interpretação Gráfica', discipline: 'linguagens' },
    'interpretacao-textual': { slug: 'interpretacao-textual', label: 'Interpretação Textual', discipline: 'linguagens' },
    'leitura-graficos-tabelas': { slug: 'leitura-graficos-tabelas', label: 'Leitura de Gráficos e Tabelas', discipline: 'linguagens' },
    'lingua-estrangeira': { slug: 'lingua-estrangeira', label: 'Língua Estrangeira', discipline: 'linguagens' },
    'linguagem-oral': { slug: 'linguagem-oral', label: 'Linguagem Oral', discipline: 'linguagens' },
    'linguagens-midiaticas': { slug: 'linguagens-midiaticas', label: 'Linguagens Midiáticas', discipline: 'linguagens' },
    'literatura': { slug: 'literatura', label: 'Literatura', discipline: 'linguagens' },
    'modernismo': { slug: 'modernismo', label: 'Modernismo', discipline: 'linguagens' },
    'musica': { slug: 'musica', label: 'Música', discipline: 'linguagens' },
    'norma-padrao': { slug: 'norma-padrao', label: 'Norma Padrão da Língua', discipline: 'linguagens' },
    'poesia': { slug: 'poesia', label: 'Poesia', discipline: 'linguagens' },
    'variedades-linguisticas': { slug: 'variedades-linguisticas', label: 'Variedades Linguísticas', discipline: 'linguagens' },
    'vocabulario-em-contexto': { slug: 'vocabulario-em-contexto', label: 'Vocabulário em Contexto', discipline: 'linguagens' },

    // CIÊNCIAS HUMANAS
    'cidadania': { slug: 'cidadania', label: 'Cidadania e Direitos', discipline: 'ciencias-humanas' },
    'cultura-memoria': { slug: 'cultura-memoria', label: 'Cultura e Memória', discipline: 'ciencias-humanas' },
    'demografia': { slug: 'demografia', label: 'Demografia', discipline: 'ciencias-humanas' },
    'direito-agrario': { slug: 'direito-agrario', label: 'Direito Agrário', discipline: 'ciencias-humanas' },
    'estado-poder-politica': { slug: 'estado-poder-politica', label: 'Estado, Poder e Política', discipline: 'ciencias-humanas' },
    'filosofia': { slug: 'filosofia', label: 'Filosofia', discipline: 'ciencias-humanas' },
    'filosofia-contemporanea': { slug: 'filosofia-contemporanea', label: 'Filosofia Contemporânea', discipline: 'ciencias-humanas' },
    'filosofia-do-direito': { slug: 'filosofia-do-direito', label: 'Filosofia do Direito', discipline: 'ciencias-humanas' },
    'filosofia-etica': { slug: 'filosofia-etica', label: 'Filosofia e Ética', discipline: 'ciencias-humanas' },
    'filosofia-modernos': { slug: 'filosofia-modernos', label: 'Filosofia Moderna', discipline: 'ciencias-humanas' },
    'geografia-agropecuaria': { slug: 'geografia-agropecuaria', label: 'Geografia Agropecuária', discipline: 'ciencias-humanas' },
    'geografia-fisica': { slug: 'geografia-fisica', label: 'Geografia Física', discipline: 'ciencias-humanas' },
    'geografia-humana': { slug: 'geografia-humana', label: 'Geografia Humana', discipline: 'ciencias-humanas' },
    'geografia-politica': { slug: 'geografia-politica', label: 'Geografia Política', discipline: 'ciencias-humanas' },
    'geografia-urbana': { slug: 'geografia-urbana', label: 'Geografia Urbana', discipline: 'ciencias-humanas' },
    'geografia-urbana-e-regional': { slug: 'geografia-urbana-e-regional', label: 'Geografia Urbana e Regional', discipline: 'ciencias-humanas' },
    'historia-america-latina': { slug: 'historia-america-latina', label: 'História da América Latina', discipline: 'ciencias-humanas' },
    'historia-cultural': { slug: 'historia-cultural', label: 'História Cultural', discipline: 'ciencias-humanas' },
    'historia-da-cultura-popular': { slug: 'historia-da-cultura-popular', label: 'História da Cultura Popular', discipline: 'ciencias-humanas' },
    'historia-da-educacao': { slug: 'historia-da-educacao', label: 'História da Educação', discipline: 'ciencias-humanas' },
    'historia-da-politica': { slug: 'historia-da-politica', label: 'História da Política', discipline: 'ciencias-humanas' },
    'historia-do-brasil': { slug: 'historia-do-brasil', label: 'História do Brasil', discipline: 'ciencias-humanas' },
    'historia-do-brasil-colonia': { slug: 'historia-do-brasil-colonia', label: 'História do Brasil — Colônia', discipline: 'ciencias-humanas' },
    'historia-do-brasil-imperio': { slug: 'historia-do-brasil-imperio', label: 'História do Brasil — Império', discipline: 'ciencias-humanas' },
    'historia-do-brasil-republica': { slug: 'historia-do-brasil-republica', label: 'História do Brasil — República', discipline: 'ciencias-humanas' },
    'historia-dos-direitos-humanos': { slug: 'historia-dos-direitos-humanos', label: 'História dos Direitos Humanos', discipline: 'ciencias-humanas' },
    'historia-geral': { slug: 'historia-geral', label: 'História Geral', discipline: 'ciencias-humanas' },
    'movimentos-sociais-cidadania': { slug: 'movimentos-sociais-cidadania', label: 'Movimentos Sociais e Cidadania', discipline: 'ciencias-humanas' },
    'politica': { slug: 'politica', label: 'Política', discipline: 'ciencias-humanas' },
    'politicas-publicas': { slug: 'politicas-publicas', label: 'Políticas Públicas', discipline: 'ciencias-humanas' },
    'politicas-publicas-e-direitos-humanos': { slug: 'politicas-publicas-e-direitos-humanos', label: 'Políticas Públicas e Direitos Humanos', discipline: 'ciencias-humanas' },
    'relacoes-internacionais': { slug: 'relacoes-internacionais', label: 'Relações Internacionais', discipline: 'ciencias-humanas' },
    'religioes-afro-brasileiras': { slug: 'religioes-afro-brasileiras', label: 'Religiões Afro-Brasileiras', discipline: 'ciencias-humanas' },
    'sociologia': { slug: 'sociologia', label: 'Sociologia', discipline: 'ciencias-humanas' },
    'trabalho': { slug: 'trabalho', label: 'Trabalho e Sociedade', discipline: 'ciencias-humanas' },

    // CIÊNCIAS DA NATUREZA
    'agropecuaria': { slug: 'agropecuaria', label: 'Agropecuária', discipline: 'ciencias-natureza' },
    'biologia-ecologia': { slug: 'biologia-ecologia', label: 'Biologia — Ecologia', discipline: 'ciencias-natureza' },
    'biologia-microbiologia': { slug: 'biologia-microbiologia', label: 'Biologia — Microbiologia', discipline: 'ciencias-natureza' },
    'biologia-molecular': { slug: 'biologia-molecular', label: 'Biologia Molecular', discipline: 'ciencias-natureza' },
    'biologia-olhos-e-visao': { slug: 'biologia-olhos-e-visao', label: 'Biologia — Olhos e Visão', discipline: 'ciencias-natureza' },
    'biologia-zoologia': { slug: 'biologia-zoologia', label: 'Biologia — Zoologia', discipline: 'ciencias-natureza' },
    'botanica': { slug: 'botanica', label: 'Botânica', discipline: 'ciencias-natureza' },
    'ecologia': { slug: 'ecologia', label: 'Ecologia', discipline: 'ciencias-natureza' },
    'ecologia-adaptacoes': { slug: 'ecologia-adaptacoes', label: 'Ecologia — Adaptações', discipline: 'ciencias-natureza' },
    'eletrodinamica': { slug: 'eletrodinamica', label: 'Física — Eletrodinâmica', discipline: 'ciencias-natureza' },
    'eletrostatica': { slug: 'eletrostatica', label: 'Física — Eletrostática', discipline: 'ciencias-natureza' },
    'estrutura-atomica': { slug: 'estrutura-atomica', label: 'Química — Estrutura Atômica', discipline: 'ciencias-natureza' },
    'fisica': { slug: 'fisica', label: 'Física (Geral)', discipline: 'ciencias-natureza' },
    'fisica-atomica': { slug: 'fisica-atomica', label: 'Física Atômica', discipline: 'ciencias-natureza' },
    'fisica-eletricidade': { slug: 'fisica-eletricidade', label: 'Física — Eletricidade', discipline: 'ciencias-natureza' },
    'fisica-eletromagnetismo': { slug: 'fisica-eletromagnetismo', label: 'Física — Eletromagnetismo', discipline: 'ciencias-natureza' },
    'fisica-mecanica': { slug: 'fisica-mecanica', label: 'Física — Mecânica', discipline: 'ciencias-natureza' },
    'fisica-moderna': { slug: 'fisica-moderna', label: 'Física Moderna', discipline: 'ciencias-natureza' },
    'fisica-ondas': { slug: 'fisica-ondas', label: 'Física — Ondas', discipline: 'ciencias-natureza' },
    'fisica-termica': { slug: 'fisica-termica', label: 'Física — Térmica', discipline: 'ciencias-natureza' },
    'fisica-termologia': { slug: 'fisica-termologia', label: 'Física — Termologia', discipline: 'ciencias-natureza' },
    'fisiologia': { slug: 'fisiologia', label: 'Fisiologia', discipline: 'ciencias-natureza' },
    'fisiologia-muscular': { slug: 'fisiologia-muscular', label: 'Fisiologia Muscular', discipline: 'ciencias-natureza' },
    'funcoes-inorganicas': { slug: 'funcoes-inorganicas', label: 'Química — Funções Inorgânicas', discipline: 'ciencias-natureza' },
    'genetica': { slug: 'genetica', label: 'Genética', discipline: 'ciencias-natureza' },
    'geologia-e-meio-ambiente': { slug: 'geologia-e-meio-ambiente', label: 'Geologia e Meio Ambiente', discipline: 'ciencias-natureza' },
    'imunologia': { slug: 'imunologia', label: 'Imunologia', discipline: 'ciencias-natureza' },
    'impactos-ambientais-na-agricultura': { slug: 'impactos-ambientais-na-agricultura', label: 'Impactos Ambientais na Agricultura', discipline: 'ciencias-natureza' },
    'ondulatoria': { slug: 'ondulatoria', label: 'Física — Ondulatória', discipline: 'ciencias-natureza' },
    'parasitologia-saude': { slug: 'parasitologia-saude', label: 'Parasitologia e Saúde', discipline: 'ciencias-natureza' },
    'quimica-analitica': { slug: 'quimica-analitica', label: 'Química Analítica', discipline: 'ciencias-natureza' },
    'quimica-estequiometria': { slug: 'quimica-estequiometria', label: 'Química — Estequiometria', discipline: 'ciencias-natureza' },
    'quimica-fisica': { slug: 'quimica-fisica', label: 'Química Física', discipline: 'ciencias-natureza' },
    'quimica-inorganica': { slug: 'quimica-inorganica', label: 'Química Inorgânica', discipline: 'ciencias-natureza' },
    'quimica-nuclear': { slug: 'quimica-nuclear', label: 'Química Nuclear', discipline: 'ciencias-natureza' },
    'quimica-organica': { slug: 'quimica-organica', label: 'Química Orgânica', discipline: 'ciencias-natureza' },
    'virologia': { slug: 'virologia', label: 'Virologia', discipline: 'ciencias-natureza' },
    'trabalho-energia': { slug: 'trabalho-energia', label: 'Física — Trabalho e Energia', discipline: 'ciencias-natureza' },
    'questoes-ambientais': { slug: 'questoes-ambientais', label: 'Questões Ambientais', discipline: 'ciencias-natureza' },

    // MATEMÁTICA
    'algebra': { slug: 'algebra', label: 'Álgebra', discipline: 'matematica' },
    'estatistica': { slug: 'estatistica', label: 'Estatística', discipline: 'matematica' },
    'funcoes': { slug: 'funcoes', label: 'Funções', discipline: 'matematica' },
    'funcoes-matematicas': { slug: 'funcoes-matematicas', label: 'Funções Matemáticas', discipline: 'matematica' },
    'geometria': { slug: 'geometria', label: 'Geometria', discipline: 'matematica' },
    'grandezas-medidas': { slug: 'grandezas-medidas', label: 'Grandezas e Medidas', discipline: 'matematica' },
    'matematica-analise-de-dados': { slug: 'matematica-analise-de-dados', label: 'Análise de Dados', discipline: 'matematica' },
    'matematica-analise-dimensional': { slug: 'matematica-analise-dimensional', label: 'Análise Dimensional', discipline: 'matematica' },
    'matematica-financeira': { slug: 'matematica-financeira', label: 'Matemática Financeira', discipline: 'matematica' },
    'media-aritmetica': { slug: 'media-aritmetica', label: 'Média Aritmética', discipline: 'matematica' },
    'numeracao-e-sistemas-de-numeracao': { slug: 'numeracao-e-sistemas-de-numeracao', label: 'Numeração e Sistemas de Numeração', discipline: 'matematica' },
    'numeros-proporcionalidade': { slug: 'numeros-proporcionalidade', label: 'Números e Proporcionalidade', discipline: 'matematica' },
    'operacoes-basicas': { slug: 'operacoes-basicas', label: 'Operações Básicas', discipline: 'matematica' },
    'porcentagem-e-razoes': { slug: 'porcentagem-e-razoes', label: 'Porcentagem e Razões', discipline: 'matematica' },
    'proporcionalidade-regra-de-tres': { slug: 'proporcionalidade-regra-de-tres', label: 'Proporcionalidade e Regra de Três', discipline: 'matematica' },
    'raciocinio-logico': { slug: 'raciocinio-logico', label: 'Raciocínio Lógico', discipline: 'matematica' },
    'trigonometria': { slug: 'trigonometria', label: 'Trigonometria', discipline: 'matematica' },
    'numeracao-codigos': { slug: 'numeracao-codigos', label: 'Numeração e Códigos', discipline: 'matematica' },
};

/**
 * Retorna as informações de uma subcategoria pelo slug.
 * Se não encontrar, retorna um objeto genérico com o próprio slug como label.
 */
export function getSubcategoryInfo(slug: string): SubcategoryInfo {
    return SUBCATEGORIES[slug] || {
        slug,
        label: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        discipline: 'linguagens' // fallback
    };
}

/**
 * Retorna todas as subcategorias de uma determinada disciplina.
 */
export function getSubcategoriesByDiscipline(discipline: Discipline): SubcategoryInfo[] {
    return Object.values(SUBCATEGORIES).filter(sub => sub.discipline === discipline);
}
