/**
 * Aplica correções nas classificações das questões do ENEM.
 * Tipos de correções:
 *   A - Erros de acento no slug da subcategoria
 *   B - Nome errado / variante sem equivalente direto
 *   C - Erro de discipline (muda área) e/ou subcategoria inválida/inventada
 *   D - Questão sem subcategoria (2022/#144)
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'c:/Users/Thiago Germano/Documents/GitHub/enem-api-futura/public';

// ─────────────────────────────────────────────────────────────────
// TIPO A: Correções de acento (subcategoria apenas)
// ─────────────────────────────────────────────────────────────────
const ACCENT_FIX = new Map([
  ['história-moderna',             'historia-moderna'],
  ['história-do-brasil-republica', 'historia-do-brasil-republica'],
  ['história-do-brasil-colonia',   'historia-do-brasil-colonia'],
  ['história-do-brasil-imperio',   'historia-do-brasil-imperio'],
  ['história-contemporânea',       'historia-contemporanea'],
  ['história-medieval',            'historia-medieval'],
  ['história-antiga',              'historia-antiga'],
  ['política',                     'politica'],
]);

// ─────────────────────────────────────────────────────────────────
// TIPO B: Nome errado / variante (subcategoria apenas)
// ─────────────────────────────────────────────────────────────────
const NAME_FIX = new Map([
  // Matemática
  ['proporcionalidade',         'numeros-proporcionalidade'],
  ['logaritmos',                'funcoes'],
  ['logaritmo',                 'funcoes'],
  ['tempo',                     'grandezas-medidas'],
  ['velocidade-tempos',         'grandezas-medidas'],
  ['velocidade-e-tempo',        'grandezas-medidas'],
  ['velocidade-tempo',          'grandezas-medidas'],
  ['matriz',                    'algebra'],
  ['exponencial-logaritmica',   'funcoes'],
  ['exponenciacao',             'funcoes'],
  ['sequencias',                'funcoes'],
  ['analisar-situacoes-problema','leitura-graficos-tabelas'],
  // Ciências da Natureza
  ['energia-trabalho',          'trabalho-energia'],
  ['circuito-eletrico',         'eletrodinamica'],
  ['energia',                   'trabalho-energia'],
  ['energia-renovavel',         'quimica-ambiental'],
  ['imunologia',                'fisiologia-humana'],
  ['nutrientes-acuaticos',      'ecologia'],
  ['rotacao',                   'dinamica'],
  ['hemorragias',               'fisiologia-humana'],
  ['radioatividade',            'fisica-moderna'],
  ['biologia-ambiental',        'ecologia'],
  ['nutricao',                  'fisiologia-humana'],
  ['atmosfera-planetas',        'fisica-moderna'],
  ['densidade',                 'hidrostatica'],
  ['astronomia',                'fisica-moderna'],
  ['acustica',                  'ondulatoria'],
  // Linguagens
  ['music',                     'musica'],
]);

// ─────────────────────────────────────────────────────────────────
// TIPO C: Discipline + subcategoria (e Tipo D)
// Formato: { discipline?, subcategory }
// Se discipline está presente, o campo discipline do JSON também muda.
// ─────────────────────────────────────────────────────────────────
const SPECIFIC_FIXES = new Map([
  // Conteúdo de Química/Física/Biologia → ciencias-natureza
  ['2009/29',  { discipline: 'ciencias-natureza', subcategory: 'estrutura-atomica' }],       // antimônio, isótopos
  ['2013/53',  { discipline: 'ciencias-natureza', subcategory: 'fisiologia-humana' }],       // vilosidades intestinais de serpente
  ['2013/60',  { discipline: 'ciencias-natureza', subcategory: 'evolucao' }],                // aranhas/escorpiões após cópula
  ['2014/69',  { discipline: 'ciencias-natureza', subcategory: 'genetica' }],                // bactéria com gene de resistência
  ['2014/79',  { discipline: 'ciencias-natureza', subcategory: 'genetica' }],                // tipos sanguíneos (ABO)
  ['2014/85',  { discipline: 'ciencias-natureza', subcategory: 'parasitologia-saude' }],     // imunobiológicos, anticorpos
  ['2015/46',  { discipline: 'ciencias-natureza', subcategory: 'fisiologia-humana' }],       // hipoxia, oxigênio no sangue
  ['2015/56',  { discipline: 'ciencias-natureza', subcategory: 'evolucao' }],                // raças de cães, cruzamento
  ['2015/78',  { discipline: 'ciencias-natureza', subcategory: 'termologia' }],              // queimaduras, transferência de calor
  ['2016/79',  { discipline: 'ciencias-natureza', subcategory: 'parasitologia-saude' }],     // vacinas, microrganismos
  ['2016/90',  { discipline: 'ciencias-natureza', subcategory: 'bioquimica' }],              // síntese proteica (sem contexto)
  ['2017/126', { discipline: 'ciencias-natureza', subcategory: 'estrutura-atomica' }],       // gases nobres/inertes
  ['2017/128', { discipline: 'ciencias-natureza', subcategory: 'fisiologia-humana' }],       // retina, formação de imagem
  ['2017/130', { discipline: 'ciencias-natureza', subcategory: 'quimica-organica' }],        // cromatografia em papel
  ['2017/134', { discipline: 'ciencias-natureza', subcategory: 'quimica-organica' }],        // ozonólise, aldeídos, cetonas
  ['2018/106', { discipline: 'ciencias-natureza', subcategory: 'evolucao' }],                // formação de novas espécies
  ['2018/117', { discipline: 'ciencias-natureza', subcategory: 'bioquimica' }],              // RNA, proteínas, metabolismo
  ['2019/119', { discipline: 'ciencias-natureza', subcategory: 'termologia' }],              // pressão dos pneus de bicicleta
  ['2021/106', { discipline: 'ciencias-natureza', subcategory: 'fisiologia-humana' }],       // icterícia em recém-nascidos
  ['2022/108', { discipline: 'ciencias-natureza', subcategory: 'quimica-organica' }],        // ácido tartárico no vinho
  ['2023/96',  { discipline: 'ciencias-natureza', subcategory: 'estequiometria' }],          // cloreto de cálcio, massa molar
  ['2023/97',  { discipline: 'ciencias-natureza', subcategory: 'botanica' }],                // amadurecimento do abacate, etileno
  ['2023/98',  { discipline: 'ciencias-natureza', subcategory: 'evolucao' }],                // lesmas-do-mar, cloroplastos

  // Conteúdo de Linguagens → linguagens
  ['2010/110', { discipline: 'linguagens', subcategory: 'praticas-corporais' }],             // educação física, capacidades físicas
  ['2010/130', { discipline: 'linguagens', subcategory: 'gramatica-contextualizada' }],      // conectivos: enquanto, mesmo, no entanto

  // Conteúdo de Matemática → matematica
  ['2011/147', { discipline: 'matematica', subcategory: 'geometria-espacial' }],             // superfície de revolução (cone)
  ['2011/151', { discipline: 'matematica', subcategory: 'geometria-espacial' }],             // geometria espacial (imagem)
  ['2011/152', { discipline: 'matematica', subcategory: 'funcoes' }],                        // preço × kg de frutas, gráfico
  ['2011/157', { discipline: 'matematica', subcategory: 'matematica-financeira' }],          // poupança vs CDB, montante
  ['2012/140', { discipline: 'matematica', subcategory: 'matematica-financeira' }],          // compra de terreno, opções de pagamento
  ['2012/162', { discipline: 'matematica', subcategory: 'matematica-financeira' }],          // ações, investidores, bolsa
  ['2013/180', { discipline: 'matematica', subcategory: 'geometria-plana' }],                // geometria (imagem)
  ['2018/136', { discipline: 'matematica', subcategory: 'algebra' }],                        // matriz de transferências bancárias (TED)
  ['2019/141', { discipline: 'matematica', subcategory: 'funcoes' }],                        // jogo online, parâmetros de experiência
  ['2021/140', { discipline: 'matematica', subcategory: 'estatistica' }],                    // faturamento de filiais de supermercado
  ['2022/144', { discipline: 'matematica', subcategory: 'numeros-proporcionalidade' }],      // dígito verificador bancário (módulo 11)
  ['2023/128', { subcategory: 'grandezas-medidas' }],                                        // ondas eletromagnéticas, questão de math
  ['2023/148', { discipline: 'matematica', subcategory: 'trigonometria' }],                  // mastro, cabos de aço, ângulos
  ['2023/154', { discipline: 'matematica', subcategory: 'geometria-plana' }],                // silhuetas de torres, geometria

  // Ciencias-humanas — subcategoria inventada, corrigindo para mais próxima válida
  ['2009/5',   { subcategory: 'fisica-moderna' }],                                           // Ptolomeu, Copérnico, Kepler (sem troca de disc.)
  ['2010/108', { subcategory: 'globalizacao' }],                                             // tecnologia-e-sociedade
  ['2014/1',   { subcategory: 'globalizacao' }],                                             // telecomunicacoes
  ['2014/6',   { subcategory: 'historia-contemporanea' }],                                   // crise de 1929, economia cafeeira
  ['2017/56',  { subcategory: 'globalizacao' }],                                             // infraestrutura logística, exportação
  ['2019/94',  { subcategory: 'cultura-memoria' }],                                          // jingle de 1962, rádio e TV
  ['2021/28',  { subcategory: 'globalizacao' }],                                             // Facebook, tecnologia-e-sociedade
  ['2021/57',  { subcategory: 'trabalho' }],                                                 // Marcuse, capitalismo, consumo
  ['2022/48',  { subcategory: 'desigualdade-social' }],                                      // racismo
  ['2023/55',  { subcategory: 'estado-poder-politica' }],                                    // capitalismo
  ['2023/72',  { subcategory: 'globalizacao' }],                                             // tecnologia-e-sociedade, viagens ao espaço
]);

// ─────────────────────────────────────────────────────────────────
// Aplicar correções
// ─────────────────────────────────────────────────────────────────

function applyFix(data, fix) {
  if (fix.discipline) data.discipline = fix.discipline;
  if (fix.subcategory) data.subcategory = fix.subcategory;
}

function processFile(filePath, year, index) {
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { return null; }

  const key = `${year}/${index}`;
  let changed = false;
  let reason = '';

  // Priority: SPECIFIC_FIXES override everything
  if (SPECIFIC_FIXES.has(key)) {
    const fix = SPECIFIC_FIXES.get(key);
    const before = { discipline: data.discipline, subcategory: data.subcategory };
    applyFix(data, fix);
    changed = true;
    reason = `Tipo C/D: ${JSON.stringify(before)} → ${JSON.stringify(fix)}`;
  } else if (data.subcategory) {
    const sub = data.subcategory;
    if (ACCENT_FIX.has(sub)) {
      const fix = ACCENT_FIX.get(sub);
      data.subcategory = fix;
      changed = true;
      reason = `Tipo A (acento): "${sub}" → "${fix}"`;
    } else if (NAME_FIX.has(sub)) {
      const fix = NAME_FIX.get(sub);
      data.subcategory = fix;
      changed = true;
      reason = `Tipo B (nome): "${sub}" → "${fix}"`;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
    return reason;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

const YEARS = ['2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

let total = 0;
let changed = 0;
const log = [];

for (const year of YEARS) {
  const questionsDir = path.join(PUBLIC_DIR, year, 'questions');
  if (!fs.existsSync(questionsDir)) continue;

  for (const entry of fs.readdirSync(questionsDir)) {
    if (entry.includes('-')) continue;
    const filePath = path.join(questionsDir, entry, 'details.json');
    if (!fs.existsSync(filePath)) continue;
    total++;

    const result = processFile(filePath, year, entry);
    if (result) {
      changed++;
      log.push(`${year}/#${entry}: ${result}`);

      // Atualizar variantes de língua estrangeira, se existirem
      const baseDir = path.dirname(filePath);
      for (const lang of ['ingles', 'espanhol']) {
        const variantPath = path.join(path.dirname(baseDir), `${entry}-${lang}`, 'details.json');
        if (fs.existsSync(variantPath)) {
          processFile(variantPath, year, entry);
        }
      }
    }
  }
}

console.log(`\nProcessadas: ${total} questões`);
console.log(`Corrigidas:  ${changed} questões\n`);
console.log('─── LOG ───');
log.forEach(l => console.log(' ', l));
console.log('\nConcluído.');
