import z from '@/lib/zod';
import { ZodOpenApiOperationObject } from 'zod-openapi';
import { ExamYearPath } from '@/lib/zod/schemas/exams';
import { GetSubcategoriesResponseSchema } from '@/lib/zod/schemas/questions';
import { openApiErrorResponses } from '@/lib/openapi/responses';

export const getSubcategories: ZodOpenApiOperationObject = {
    operationId: 'getSubcategories',
    summary: 'Listar subcategorias',
    description:
        'Retorna a lista de subcategorias disponíveis para um determinado ano, com a contagem de questões e a disciplina associada.',
    requestParams: {
        path: z.object({
            year: ExamYearPath,
        }),
    },
    responses: {
        '200': {
            description: 'Lista de subcategorias retornada com sucesso',
            content: {
                'application/json': {
                    schema: GetSubcategoriesResponseSchema,
                },
            },
        },
        ...openApiErrorResponses,
    },
    tags: ['Questões'],
};
