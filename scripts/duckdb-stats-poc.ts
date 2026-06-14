/**
 * PoC: compara a forma atual de calcular `/v1/subcategories/stats`
 * (varredura manual de arquivos com `readdir`/`readFile`/`JSON.parse`,
 * ver `app/v1/subcategories/stats/route.ts`) com uma agregação equivalente
 * feita via DuckDB consultando os `details.json` diretamente com SQL.
 *
 * Roda as duas abordagens, mede o tempo de cada uma e confere se o
 * resultado final (contagem por subcategoria) bate.
 *
 * Uso: npx tsx scripts/duckdb-stats-poc.ts
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import duckdb from 'duckdb';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// ---------------------------------------------------------------------------
// Abordagem atual: readdir + readFile + JSON.parse linha a linha
// (cópia fiel da varredura feita em computeStats() no route.ts)
// ---------------------------------------------------------------------------
async function computeStatsCurrentWay() {
    const years = (await readdir(PUBLIC_DIR, { withFileTypes: true }))
        .filter(d => d.isDirectory() && /^\d{4}$/.test(d.name))
        .map(d => d.name);

    const seen = new Set<string>();
    const subCount = new Map<string, number>();
    let total = 0;

    for (const year of years) {
        const qDir = path.join(PUBLIC_DIR, year, 'questions');
        if (!existsSync(qDir)) continue;

        const indices = (await readdir(qDir, { withFileTypes: true }))
            .filter(d => d.isDirectory())
            .map(d => d.name);

        for (const idxDir of indices) {
            const file = path.join(qDir, idxDir, 'details.json');
            if (!existsSync(file)) continue;

            try {
                const raw = await readFile(file, 'utf-8');
                const q = JSON.parse(raw) as {
                    index?: number;
                    discipline?: string;
                    subcategory?: string;
                };

                const dedupKey = `${year}-${q.index ?? idxDir}-${q.discipline ?? ''}`;
                if (seen.has(dedupKey)) continue;
                seen.add(dedupKey);

                total++;
                if (q.subcategory) {
                    subCount.set(q.subcategory, (subCount.get(q.subcategory) ?? 0) + 1);
                }
            } catch {
                // ignora arquivos corrompidos individuais
            }
        }
    }

    return { total, subCount };
}

// ---------------------------------------------------------------------------
// Abordagem com DuckDB: uma única query SQL sobre os JSONs via glob,
// com dedup replicado via row_number() (mesma chave year+index+discipline)
// ---------------------------------------------------------------------------
/**
 * Quando as duas abordagens divergem, é porque existem variantes de uma
 * mesma questão (ex.: 45 vs 45-espanhol) classificadas com `subcategory`
 * diferentes — e a entrada "vencedora" do dedup depende da ordem de
 * iteração (`readdir`, que não garante ordem, vs. `ORDER BY filename`).
 * Esta função lista esses grupos para tornar a causa visível.
 */
function explainDivergentGroups(subcategories: string[]): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
        const db = new duckdb.Database(':memory:');
        const glob = path.join(PUBLIC_DIR, '*', 'questions', '*', 'details.json').replace(/\\/g, '/');
        const list = subcategories.map(s => `'${s}'`).join(', ');

        const sql = `
            WITH raw AS (
                SELECT "index", "year", discipline, subcategory, filename,
                       count(*) OVER (PARTITION BY "year", "index", discipline) AS grp_size
                FROM read_json_auto('${glob}', filename = true)
            )
            SELECT "year", "index", discipline, subcategory, filename
            FROM raw
            WHERE grp_size > 1 AND subcategory IN (${list})
            ORDER BY "year", "index", filename
        `;

        db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

function computeStatsWithDuckDB(): Promise<{ total: number; subCount: Map<string, number> }> {
    return new Promise((resolve, reject) => {
        const db = new duckdb.Database(':memory:');
        const glob = path.join(PUBLIC_DIR, '*', 'questions', '*', 'details.json').replace(/\\/g, '/');

        const sql = `
            WITH raw AS (
                SELECT
                    "index",
                    "year",
                    discipline,
                    subcategory,
                    row_number() OVER (
                        PARTITION BY "year", "index", discipline
                        ORDER BY filename
                    ) AS rn
                FROM read_json_auto('${glob}', filename = true)
            ),
            deduped AS (
                SELECT * FROM raw WHERE rn = 1
            )
            SELECT subcategory, count(*)::BIGINT AS total
            FROM deduped
            GROUP BY subcategory
        `;

        const totalSql = `
            WITH raw AS (
                SELECT "index", "year", discipline,
                       row_number() OVER (PARTITION BY "year", "index", discipline ORDER BY filename) AS rn
                FROM read_json_auto('${glob}', filename = true)
            )
            SELECT count(*)::BIGINT AS total FROM raw WHERE rn = 1
        `;

        db.all(sql, (err, rows) => {
            if (err) return reject(err);

            db.all(totalSql, (err2, totalRows) => {
                if (err2) return reject(err2);

                const subCount = new Map<string, number>();
                for (const row of rows as Array<{ subcategory: string | null; total: bigint }>) {
                    if (row.subcategory) subCount.set(row.subcategory, Number(row.total));
                }

                resolve({ total: Number((totalRows[0] as { total: bigint }).total), subCount });
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Runner: executa as duas, mede tempo e compara resultado
// ---------------------------------------------------------------------------
async function main() {
    console.log('Calculando estatísticas pela abordagem atual (readdir/readFile)...');
    const t0 = Date.now();
    const current = await computeStatsCurrentWay();
    const currentMs = Date.now() - t0;

    console.log('Calculando estatísticas via DuckDB (SQL sobre os JSONs)...');
    const t1 = Date.now();
    const duck = await computeStatsWithDuckDB();
    const duckMs = Date.now() - t1;

    console.log('\n=== Resultado ===');
    console.log(`Atual  -> total: ${current.total}, subcategorias: ${current.subCount.size}, tempo: ${currentMs}ms`);
    console.log(`DuckDB -> total: ${duck.total}, subcategorias: ${duck.subCount.size}, tempo: ${duckMs}ms`);

    let mismatches = 0;
    const divergentKeys: string[] = [];
    const allKeys = new Set([...Array.from(current.subCount.keys()), ...Array.from(duck.subCount.keys())]);
    for (const key of Array.from(allKeys)) {
        const a = current.subCount.get(key) ?? 0;
        const b = duck.subCount.get(key) ?? 0;
        if (a !== b) {
            mismatches++;
            divergentKeys.push(key);
            console.log(`  ⚠ divergência em "${key}": atual=${a} duckdb=${b}`);
        }
    }

    console.log(
        mismatches === 0
            ? '\n✓ Contagens por subcategoria batem 100% entre as duas abordagens.'
            : `\n✗ ${mismatches} subcategorias com contagens divergentes.`,
    );

    if (mismatches > 0) {
        console.log(
            '\nIsso não é um bug do DuckDB — é uma inconsistência que já existe na' +
            '\nimplementação atual: quando uma questão tem variantes (ex.: "45" e' +
            '\n"45-espanhol") classificadas com `subcategory` diferentes, o dedup por' +
            '\n`${year}-${index}-${discipline}` escolhe "a primeira encontrada", e essa' +
            '\nordem depende de `readdir` (não determinística) — então o resultado de' +
            '\n`/v1/subcategories/stats` pode variar entre execuções. Grupos responsáveis:\n',
        );
        const groups = await explainDivergentGroups(divergentKeys);
        console.log(groups);
    }
    console.log(`\nGanho de tempo: ${currentMs - duckMs}ms (DuckDB ${(currentMs / duckMs).toFixed(1)}x mais rápido)`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
