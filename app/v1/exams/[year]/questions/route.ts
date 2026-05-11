import z from '@/lib/zod';
import { NextRequest, NextResponse } from 'next/server';
import { getSearchParamsAsObject } from '@/lib/utils';
import {
    QuestionDetailSchema,
    GetQuestionsResponseSchema,
    GetQuestionsQuerySchema,
} from '@/lib/zod/schemas/questions';
import { EnemApiError, handleAndReturnErrorResponse } from '@/lib/api/errors';
import { getExamDetails } from '@/lib/api/exams/get-exam-details';
import { getQuestionDetails } from '@/lib/api/questions/get-question-details';
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

        const searchParams = request.nextUrl.searchParams;

        let { limit, offset, language, discipline, subcategory, competency, skill } =
            GetQuestionsQuerySchema.parse(getSearchParamsAsObject(searchParams));

        if (Number(limit) > 50) {
            throw new EnemApiError({
                code: 'bad_request',
                message: 'Limit cannot be greater than 50',
            });
        }

        const exam = await getExamDetails(params.year);

        if (!exam) {
            throw new EnemApiError({
                code: 'not_found',
                message: `No exam found for year ${params.year}`,
            });
        }

        if (language && !exam.languages.find(lang => lang.value === language)) {
            throw new EnemApiError({
                code: 'bad_request',
                message: `Language ${language} not found in exam`,
            });
        }

        if (!language && exam.languages.length > 0) {
            language = exam.languages[0].value;
        }

        // Filter by language first
        let languageFiltered = exam.questions.filter(
            question => question.language === language || !question.language,
        );

        // Filter by discipline at index level (fast, no file reads needed)
        if (discipline) {
            languageFiltered = languageFiltered.filter(
                question => question.discipline === discipline,
            );
        }

        const needsDetailFilter = !!(subcategory || competency || skill);

        let questions: Array<z.infer<typeof QuestionDetailSchema>> = [];
        let total: number;

        if (needsDetailFilter) {
            // Load all matching questions to filter by detail fields, then paginate
            const allDetails = await Promise.all(
                languageFiltered.map(q =>
                    getQuestionDetails({ year: params.year, index: q.index, language }),
                ),
            );

            const filtered = allDetails.filter(q => {
                if (!q) return false;
                if (subcategory && q.subcategory !== subcategory) return false;
                if (competency && q.competency !== competency) return false;
                if (skill && q.skill !== skill) return false;
                return true;
            }) as Array<z.infer<typeof QuestionDetailSchema>>;

            total = filtered.length;
            questions = filtered.slice(Number(offset), Number(offset) + Number(limit));
        } else {
            const questionsToFetch = languageFiltered
                .filter(question => question.index >= Number(offset))
                .filter(question => question.index <= Number(offset) + Number(limit));

            for (const question of questionsToFetch) {
                const questionDetails = await getQuestionDetails({
                    year: params.year,
                    index: question.index,
                    language,
                });

                if (!questionDetails) {
                    throw new EnemApiError({
                        code: 'internal_server_error',
                        message: `Failed to fetch question ${question.index}`,
                    });
                }

                questions.push(questionDetails);
            }

            total = languageFiltered.length;
        }

        return NextResponse.json(
            GetQuestionsResponseSchema.parse({
                metadata: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total,
                    hasMore: Number(offset) + Number(limit) < total,
                },
                questions,
            }),
            { headers: rateLimitHeaders },
        );
    } catch (error) {
        return handleAndReturnErrorResponse(error);
    }
}
