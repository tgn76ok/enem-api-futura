// Verifica a distribuição de disciplinas por faixa de índice para detectar erros sistemáticos
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'c:/Users/Thiago Germano/Documents/GitHub/enem-api-futura/public';
const YEARS = ['2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

// Faixas esperadas para ENEM pós-2010 (caderno padrão)
// Dia 1: 1-45 Linguagens, 46-90 Ciências Humanas
// Dia 2: 91-135 Ciências da Natureza, 136-180 Matemática

const EXPECTED_RANGE = {
  'linguagens':       [1, 45],
  'ciencias-humanas': [46, 90],
  'ciencias-natureza':[91, 135],
  'matematica':       [136, 180],
};

function expectedDiscipline(index) {
  const i = parseInt(index, 10);
  if (i >= 1 && i <= 45) return 'linguagens';
  if (i >= 46 && i <= 90) return 'ciencias-humanas';
  if (i >= 91 && i <= 135) return 'ciencias-natureza';
  if (i >= 136 && i <= 180) return 'matematica';
  return 'unknown';
}

const mismatches = [];

for (const year of YEARS) {
  const questionsDir = path.join(PUBLIC_DIR, year, 'questions');
  if (!fs.existsSync(questionsDir)) continue;

  for (const entry of fs.readdirSync(questionsDir)) {
    if (entry.includes('-')) continue;
    const filePath = path.join(questionsDir, entry, 'details.json');
    if (!fs.existsSync(filePath)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { continue; }

    const expected = expectedDiscipline(entry);
    const actual = data.discipline;
    if (expected !== actual && expected !== 'unknown') {
      mismatches.push({
        year, index: entry, actual, expected,
        subcategory: data.subcategory || '(sem sub)',
        context: (data.context || '').replace(/!\[.*?\]\(.*?\)/g, '[img]').replace(/\n/g,' ').substring(0, 100),
      });
    }
  }
}

console.log('ERROS DE DISCIPLINE POR ÍNDICE: ' + mismatches.length + ' questões\n');

// Agrupar por padrão
const patterns = {};
mismatches.forEach(m => {
  const key = m.actual + ' (real) vs ' + m.expected + ' (esperado)';
  if (!patterns[key]) patterns[key] = [];
  patterns[key].push(m);
});

Object.entries(patterns).forEach(([k, cases]) => {
  console.log('━━━ ' + k + ' (' + cases.length + ' casos) ━━━');
  cases.slice(0, 10).forEach(c => {
    console.log('  ' + c.year + '/#' + c.index + ' sub="' + c.subcategory + '"');
    if (c.context) console.log('    ' + c.context);
  });
  if (cases.length > 10) console.log('  ...e mais ' + (cases.length - 10));
  console.log();
});
