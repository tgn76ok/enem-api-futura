import fs from 'fs';
import path from 'path';

interface Correction {
  year: number;
  index: number;
  discipline: string;
  subcategory: string;
  competency: string;
  skill: string;
  confidence: number;
  justification: string;
}

const corrections: Correction[] = JSON.parse(fs.readFileSync('corrections.json', 'utf-8'));

let successCount = 0;
let errorCount = 0;

corrections.forEach((correction) => {
  try {
    const questionPath = path.join('public', String(correction.year), 'questions', String(correction.index), 'details.json');
    
    if (!fs.existsSync(questionPath)) {
      console.warn(`⚠️  Arquivo não encontrado: ${questionPath}`);
      errorCount++;
      return;
    }

    let fileContent = fs.readFileSync(questionPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Atualizar campos de classificação
    data.subcategory = correction.subcategory;
    data.competency = correction.competency;
    data.skill = correction.skill;
    data.confidence = correction.confidence;
    data.justification = correction.justification;

    fs.writeFileSync(questionPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ ${correction.year}/${correction.index}: ${correction.discipline} → ${correction.subcategory} (${correction.competency}/${correction.skill})`);
    successCount++;
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${correction.year}/${correction.index}:`, error);
    errorCount++;
  }
});

console.log(`\n📊 Resultado: ${successCount} corrigidas, ${errorCount} erros`);
