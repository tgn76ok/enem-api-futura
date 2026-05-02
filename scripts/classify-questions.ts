import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBCATEGORIES: Record<string, string[]> = {
    'ciencias-humanas': ['historia', 'geografia', 'filosofia', 'sociologia'],
    'ciencias-natureza': ['biologia', 'quimica', 'fisica'],
    linguagens: [
        'lingua-portuguesa',
        'literatura',
        'artes',
        'educacao-fisica',
        'lingua-estrangeira',
    ],
    matematica: ['matematica'],
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

interface QuestionMeta {
    filePath: string;
    year: string;
    index: string;
    data: QuestionData;
}

function buildPrompt(data: QuestionData): string {
    const discipline = data.discipline ?? 'unknown';
    const validSubcategories = SUBCATEGORIES[discipline] ?? [];

    const contextText = data.context
        ? `\nContexto: ${data.context.substring(0, 800)}`
        : '';

    const intro = data.alternativesIntroduction
        ? `\n${data.alternativesIntroduction}`
        : '';

    const alternativesText =
        data.alternatives
            ?.filter((a) => a.text)
            .map((a) => `${a.letter}) ${a.text}`)
            .join('\n') ?? '';

    return `Você é um especialista no ENEM. Classifique esta questão com base no conteúdo.

Área: ${discipline}
Subcategorias válidas: ${validSubcategories.join(', ')}${contextText}${intro}
${alternativesText}

Responda APENAS em JSON (sem texto extra):
{"subcategory":"<uma das subcategorias válidas>","competency":"<C1-C9>","skill":"<H1-H36>"}`;
}

// Collect all main questions (skip language variants like 1-ingles, 1-espanhol)
const publicDir = path.join(process.cwd(), 'public');
const questions: QuestionMeta[] = [];

for (const year of YEARS) {
    const questionsDir = path.join(publicDir, year, 'questions');
    if (!fs.existsSync(questionsDir)) continue;

    for (const entry of fs.readdirSync(questionsDir)) {
        // Skip language variants
        if (entry.includes('-')) continue;

        const filePath = path.join(questionsDir, entry, 'details.json');
        if (!fs.existsSync(filePath)) continue;

        const data: QuestionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Skip already classified
        if (data.subcategory !== undefined) continue;

        questions.push({ filePath, year, index: entry, data });
    }
}

console.log(`Found ${questions.length} questions to classify`);

if (questions.length === 0) {
    console.log('All questions already classified!');
    process.exit(0);
}

async function main() {
    // Build batch requests
    const batchRequests = questions.map((q) => ({
        custom_id: `${q.year}-${q.index}`,
        params: {
            model: 'claude-haiku-4-5-20251001' as const,
            max_tokens: 100,
            messages: [
                {
                    role: 'user' as const,
                    content: buildPrompt(q.data),
                },
            ],
        },
    }));

    // Submit batch
    console.log(`Submitting batch with ${batchRequests.length} requests...`);
    const batch = await client.messages.batches.create({ requests: batchRequests });
    console.log(`Batch created: ${batch.id}`);
    fs.writeFileSync('batch-id.txt', batch.id, 'utf-8');

    // Poll until done
    let batchStatus = batch;
    while (batchStatus.processing_status !== 'ended') {
        await new Promise((r) => setTimeout(r, 15000));
        batchStatus = await client.messages.batches.retrieve(batch.id);
        console.log(
            `Status: ${batchStatus.processing_status} | ${JSON.stringify(batchStatus.request_counts)}`,
        );
    }

    console.log('Batch complete! Processing results...');

    // Process results
    let updated = 0;
    let errors = 0;

    for await (const result of await client.messages.batches.results(batch.id)) {
        if (result.result.type !== 'succeeded') {
            console.warn(`Failed: ${result.custom_id}`);
            errors++;
            continue;
        }

        const parts = result.custom_id.split('-');
        const year = parts[0];
        const index = parts[1];
        const q = questions.find((q) => q.year === year && q.index === index);
        if (!q) continue;

        try {
            const content = result.result.message.content[0];
            if (content.type !== 'text') continue;

            const classification = JSON.parse(content.text.trim());

            const applyClassification = (data: QuestionData) => {
                data.subcategory = classification.subcategory ?? null;
                data.competency = classification.competency ?? null;
                data.skill = classification.skill ?? null;
            };

            applyClassification(q.data);
            fs.writeFileSync(q.filePath, JSON.stringify(q.data, null, 4), 'utf-8');

            // Copy to language variants
            const questionsBaseDir = path.dirname(path.dirname(q.filePath));
            for (const lang of ['ingles', 'espanhol']) {
                const variantPath = path.join(questionsBaseDir, `${index}-${lang}`, 'details.json');
                if (fs.existsSync(variantPath)) {
                    const variantData: QuestionData = JSON.parse(
                        fs.readFileSync(variantPath, 'utf-8'),
                    );
                    applyClassification(variantData);
                    fs.writeFileSync(variantPath, JSON.stringify(variantData, null, 4), 'utf-8');
                }
            }

            updated++;
        } catch {
            console.warn(`Parse error for ${result.custom_id}`);
            errors++;
        }
    }

    console.log(`\nDone! Updated: ${updated} | Errors: ${errors}`);
    if (fs.existsSync('batch-id.txt')) fs.unlinkSync('batch-id.txt');
}

main().catch(console.error);
