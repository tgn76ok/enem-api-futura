const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'c:/Users/Thiago Germano/Documents/GitHub/enem-api-futura/public';
const YEARS = ['2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

const VALID_SUBCATEGORIES = {
  'ciencias-humanas': new Set([
    'historia-antiga','historia-medieval','historia-moderna','historia-contemporanea',
    'historia-do-brasil-colonia','historia-do-brasil-imperio','historia-do-brasil-republica',
    'movimentos-sociais-cidadania','cultura-memoria',
    'cartografia','geografia-fisica','geopolitica','demografia','urbanizacao',
    'industrializacao','agropecuaria','questoes-ambientais','globalizacao',
    'filosofia-antiga','filosofia-moderna','filosofia-contemporanea','etica','politica','epistemologia',
    'cultura-identidade','cidadania','movimentos-sociais','trabalho','desigualdade-social','estado-poder-politica',
  ]),
  'ciencias-natureza': new Set([
    'citologia','bioquimica','genetica','evolucao','ecologia','fisiologia-humana',
    'parasitologia-saude','biotecnologia','botanica','zoologia',
    'mecanica','cinematica','dinamica','trabalho-energia','hidrostatica','termologia',
    'termodinamica','optica','ondulatoria','eletrostatica','eletrodinamica','magnetismo','fisica-moderna',
    'estrutura-atomica','tabela-periodica','ligacoes-quimicas','funcoes-inorganicas','estequiometria',
    'solucoes','termoquimica','cinetica-quimica','equilibrio-quimico','eletroquimica',
    'quimica-organica','quimica-ambiental',
  ]),
  'linguagens': new Set([
    'interpretacao-textual','generos-textuais','funcoes-da-linguagem','variacao-linguistica',
    'gramatica-contextualizada','argumentacao','linguagens-midiaticas',
    'escolas-literarias','analise-literaria','modernismo','poesia','prosa','relacoes-texto-contexto',
    'artes-visuais','musica','teatro','danca','patrimonio-cultural',
    'corpo-saude','esporte','praticas-corporais','inclusao-corporal','lazer-cultura-corporal',
    'interpretacao-em-lem','vocabulario-em-contexto','generos-em-lem','diversidade-cultural',
  ]),
  'matematica': new Set([
    'numeros-proporcionalidade','algebra','funcoes','geometria-plana','geometria-espacial',
    'geometria-analitica','trigonometria','grandezas-medidas','estatistica','probabilidade',
    'analise-combinatoria','matematica-financeira','leitura-graficos-tabelas',
  ]),
};

function normalizeAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const FIX_MAP = {
  // Matematica
  'proporcionalidade': 'numeros-proporcionalidade',
  'logaritmos': 'funcoes',
  'logaritmo': 'funcoes',
  'tempo': 'grandezas-medidas',
  'velocidade-tempos': 'grandezas-medidas',
  'velocidade-e-tempo': 'grandezas-medidas',
  'velocidade-tempo': 'grandezas-medidas',
  'matriz': 'algebra',
  'exponencial-logaritmica': 'funcoes',
  'exponenciacao': 'funcoes',
  'sequencias': 'funcoes',
  'analisar-situacoes-problema': 'leitura-graficos-tabelas',
  // Ciencias-natureza
  'energia-trabalho': 'trabalho-energia',
  'circuito-eletrico': 'eletrodinamica',
  'energia': 'trabalho-energia',
  'energia-renovavel': 'quimica-ambiental',
  'imunologia': 'fisiologia-humana',
  'nutrientes-acuaticos': 'ecologia',
  'rotacao': 'dinamica',
  'hemorragias': 'fisiologia-humana',
  'radioatividade': 'fisica-moderna',
  'biologia-ambiental': 'ecologia',
  'nutricao': 'fisiologia-humana',
  'atmosfera-planetas': 'fisica-moderna',
  'densidade': 'hidrostatica',
  'astronomia': 'fisica-moderna',
  'acustica': 'ondulatoria',
  // Linguagens
  'music': 'musica',
};

const issues = { accent: [], easyFix: [], needsReview: [], unclassified: [] };

for (const year of YEARS) {
  const questionsDir = path.join(PUBLIC_DIR, year, 'questions');
  if (!fs.existsSync(questionsDir)) continue;

  for (const entry of fs.readdirSync(questionsDir)) {
    if (entry.includes('-')) continue;
    const filePath = path.join(questionsDir, entry, 'details.json');
    if (!fs.existsSync(filePath)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { continue; }

    if (data.subcategory === undefined || data.subcategory === null) {
      issues.unclassified.push({ year, index: entry, disc: data.discipline });
      continue;
    }

    const disc = data.discipline || 'unknown';
    const sub = data.subcategory;
    const validSubs = VALID_SUBCATEGORIES[disc];
    if (!validSubs || validSubs.has(sub)) continue;

    const normalized = normalizeAccents(sub);
    const validNormalized = [...validSubs].find(s => normalizeAccents(s) === normalized);

    if (validNormalized && validNormalized !== sub) {
      issues.accent.push({ year, index: entry, disc, sub, fix: validNormalized, filePath });
    } else if (FIX_MAP[sub]) {
      issues.easyFix.push({ year, index: entry, disc, sub, fix: FIX_MAP[sub], filePath });
    } else {
      issues.needsReview.push({
        year, index: entry, disc, sub, filePath,
        title: data.title,
        context: (data.context || '').replace(/!\[.*?\]\(.*?\)/g, '[imagem]').replace(/\n/g, ' ').substring(0, 150),
      });
    }
  }
}

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║      RELATÓRIO DE ANÁLISE DE CLASSIFICAÇÕES ENEM      ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const total = issues.accent.length + issues.easyFix.length + issues.needsReview.length + issues.unclassified.length;
console.log('TOTAL DE PROBLEMAS: ' + total + ' / 2628 questões\n');

console.log('━━━ TIPO A: Erros de acento (' + issues.accent.length + ' questões) ━━━');
console.log('Correção automática segura — remover acento do slug\n');
const accentByVal = {};
issues.accent.forEach(i => {
  if (!accentByVal[i.sub]) accentByVal[i.sub] = { fix: i.fix, cases: [] };
  accentByVal[i.sub].cases.push(i.year + '/#' + i.index);
});
Object.entries(accentByVal).forEach(([k, v]) => {
  const shown = v.cases.slice(0, 5).join(', ') + (v.cases.length > 5 ? '...' : '');
  console.log('  "' + k + '" -> "' + v.fix + '" (' + v.cases.length + 'x: ' + shown + ')');
});

console.log('\n━━━ TIPO B: Nome errado / variante (' + issues.easyFix.length + ' questões) ━━━');
console.log('Correção automática segura — mapear para subcategoria equivalente\n');
const easyByVal = {};
issues.easyFix.forEach(i => {
  if (!easyByVal[i.sub]) easyByVal[i.sub] = { fix: i.fix, disc: i.disc, cases: [] };
  easyByVal[i.sub].cases.push(i.year + '/#' + i.index);
});
Object.entries(easyByVal).sort((a, b) => b[1].cases.length - a[1].cases.length).forEach(([k, v]) => {
  const shown = v.cases.slice(0, 5).join(', ') + (v.cases.length > 5 ? '...' : '');
  console.log('  [' + v.disc + '] "' + k + '" -> "' + v.fix + '" (' + v.cases.length + 'x: ' + shown + ')');
});

console.log('\n━━━ TIPO C: Revisão necessária (' + issues.needsReview.length + ' questões) ━━━');
console.log('Discipline pode estar errado ou subcategoria sem equivalente claro\n');
issues.needsReview.forEach(i => {
  console.log('  ' + i.year + '/#' + i.index + ' [' + i.disc + '] sub="' + i.sub + '"');
  if (i.context) console.log('    ' + i.context);
});

if (issues.unclassified.length) {
  console.log('\n━━━ TIPO D: Não classificadas (' + issues.unclassified.length + ') ━━━');
  issues.unclassified.forEach(i => console.log('  ' + i.year + '/#' + i.index + ' [' + i.disc + ']'));
}

console.log('\n\nRESUMO FINAL:');
console.log('  A (acento):    ' + issues.accent.length + ' - auto-corrigível');
console.log('  B (nome):      ' + issues.easyFix.length + ' - auto-corrigível');
console.log('  C (revisão):   ' + issues.needsReview.length + ' - requer análise manual');
console.log('  D (sem class): ' + issues.unclassified.length + ' - requer classificação');
console.log('  TOTAL:         ' + total);
