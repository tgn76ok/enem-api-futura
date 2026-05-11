// Ranges reais do ENEM pós-2010:
// 1-45: ciencias-humanas, 46-90: ciencias-natureza, 91-135: linguagens, 136-180: matematica
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'c:/Users/Thiago Germano/Documents/GitHub/enem-api-futura/public';
// 2009 era formato unificado - índices não seguem o padrão
const YEARS = ['2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023'];

function expectedDiscipline(index) {
  const i = parseInt(index, 10);
  if (i >= 1 && i <= 45) return 'ciencias-humanas';
  if (i >= 46 && i <= 90) return 'ciencias-natureza';
  if (i >= 91 && i <= 135) return 'linguagens';
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
    if (expected !== 'unknown' && expected !== actual) {
      mismatches.push({
        year, index: parseInt(entry, 10), actual, expected,
        subcategory: data.subcategory || '(sem sub)',
        context: (data.context || '').replace(/!\[.*?\]\(.*?\)/g, '[img]').replace(/\n/g,' ').substring(0, 120),
        title: data.title,
      });
    }
  }
}

console.log('ERROS DE DISCIPLINE (ranges corrigidos): ' + mismatches.length + ' questões\n');

const patterns = {};
mismatches.forEach(m => {
  const key = m.actual + ' vs esperado ' + m.expected;
  if (!patterns[key]) patterns[key] = [];
  patterns[key].push(m);
});

Object.entries(patterns).forEach(([k, cases]) => {
  console.log('━━━ ' + k + ' (' + cases.length + ' casos) ━━━');
  cases.sort((a,b) => a.year - b.year || a.index - b.index).slice(0, 12).forEach(c => {
    console.log('  ' + c.year + '/#' + c.index + ' sub="' + c.subcategory + '"');
    if (c.context && c.context.length > 5) console.log('    ' + c.context);
  });
  if (cases.length > 12) console.log('  ... e mais ' + (cases.length - 12));
  console.log();
});
