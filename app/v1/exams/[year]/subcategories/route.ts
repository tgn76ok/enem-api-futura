import { NextRequest, NextResponse } from 'next/server';
import { EnemApiError, handleAndReturnErrorResponse } from '@/lib/api/errors';
import { getExamDetails } from '@/lib/api/exams/get-exam-details';
import { getQuestionDetails } from '@/lib/api/questions/get-question-details';
import { GetSubcategoriesResponseSchema } from '@/lib/zod/schemas/questions';
import { RateLimiter } from '@/lib/api/rate-limit';
import { logger } from '@/lib/api/logger';

export const dynamic = 'force-dynamic';

const rateLimiter = new RateLimiter();

export async function GET(
    request: NextRequest,
    { params }: { params: { year: string } },
) {
    try {
        const { rateLimitHeaders } = rateLimiter.check(request);
        await logger(request);

        const exam = await getExamDetails(params.year);
        if (!exam) {
            throw new EnemApiError({
                code: 'not_found',
                message: `No exam found for year ${params.year}`,
            });
        }

        // Load all questions (using default language for language-specific questions)
        const defaultLanguage = exam.languages.length > 0 ? exam.languages[0].value : undefined;
        const languageFiltered = exam.questions.filter(
            q => q.language === defaultLanguage || !q.language,
        );

        const allDetails = await Promise.all(
            languageFiltered.map(q =>
                getQuestionDetails({ year: params.year, index: q.index, language: defaultLanguage }),
            ),
        );

        // Count subcategories grouped by discipline
        const subcategoryMap = new Map<string, { count: number; discipline: string }>();
        for (const q of allDetails) {
            if (!q || !q.subcategory) continue;
            const key = q.subcategory;
            if (subcategoryMap.has(key)) {
                subcategoryMap.get(key)!.count++;
            } else {
                subcategoryMap.set(key, { count: 1, discipline: q.discipline ?? 'unknown' });
            }
        }

        const subcategories = Array.from(subcategoryMap.entries())
            .map(([slug, { count, discipline }]) => ({ slug, count, discipline }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json(
            GetSubcategoriesResponseSchema.parse({
                year: Number(params.year),
                subcategories,
            }),
            { headers: rateLimitHeaders },
        );
    } catch (error) {
        return handleAndReturnErrorResponse(error);
    }
}
