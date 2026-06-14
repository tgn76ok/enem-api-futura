import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Responde preflight (`OPTIONS`) das rotas `/v1/*` com 200 + cabeçalhos CORS.
 *
 * `next.config.mjs` já anexa `Access-Control-Allow-*` nas respostas das
 * rotas, mas isso não cobre o preflight: o Next só invoca o handler exportado
 * pela rota (`GET`, etc.), e nenhuma rota exporta `OPTIONS`. Sem uma resposta
 * 2xx ao preflight, o navegador bloqueia a requisição real com
 * "Response to preflight request doesn't pass access control check" — curl e
 * `fetch` server-side não enforce CORS, então passam normalmente e mascaram
 * o problema.
 */
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
    if (request.method === "OPTIONS") {
        return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    return NextResponse.next();
}

export const config = {
    matcher: "/v1/:path*",
};