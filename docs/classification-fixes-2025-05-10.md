# Análise e Correção das Classificações ENEM

**Data:** 2025-05-10  
**Questões analisadas:** 2628  
**Problemas encontrados e corrigidos:** 133

---

## Contexto

As questões são classificadas pelo script [`scripts/classify-questions.ts`](../scripts/classify-questions.ts) usando LLM (Groq ou Ollama). Cada questão recebe:
- `discipline` — área do ENEM (ciencias-humanas, ciencias-natureza, linguagens, matematica)
- `subcategory` — tópico específico dentro da área
- `competency` — código C1–C9 conforme a matriz ENEM
- `skill` — código H1–H30 conforme a matriz ENEM

A taxonomia válida está definida em `DISCIPLINE_CONFIG` dentro do script de classificação.

---

## Scripts criados

| Script | Função |
|--------|--------|
| [`scripts/analyze-report.js`](../scripts/analyze-report.js) | Analisa todas as questões e reporta problemas por tipo |
| [`scripts/fix-classifications.js`](../scripts/fix-classifications.js) | Aplica todas as correções nos arquivos `details.json` |
| [`scripts/check-index-discipline.js`](../scripts/check-index-discipline.js) | Auxiliar: verifica correlação entre índice e discipline |

---

## Tipos de problemas encontrados

### Tipo A — Erros de acento (32 questões)

O LLM gerou slugs de subcategoria com acentos, que devem ser sem acento no padrão da taxonomia.

| Subcategoria errada | Correção | Ocorrências |
|---|---|---|
| `história-moderna` | `historia-moderna` | 6 |
| `história-do-brasil-republica` | `historia-do-brasil-republica` | 7 |
| `história-do-brasil-colonia` | `historia-do-brasil-colonia` | 7 |
| `história-do-brasil-imperio` | `historia-do-brasil-imperio` | 3 |
| `história-contemporânea` | `historia-contemporanea` | 3 |
| `história-medieval` | `historia-medieval` | 2 |
| `história-antiga` | `historia-antiga` | 2 |
| `política` | `politica` | 2 |

---

### Tipo B — Nome errado / variante (51 questões)

Subcategorias semanticamente corretas mas com nome fora da taxonomia oficial.

| Subcategoria errada | Correção | Área | Ocorrências |
|---|---|---|---|
| `proporcionalidade` | `numeros-proporcionalidade` | matematica | 14 |
| `music` | `musica` | linguagens | 7 |
| `logaritmos` / `logaritmo` | `funcoes` | matematica | 4 |
| `velocidade-tempos` / `velocidade-e-tempo` / `velocidade-tempo` | `grandezas-medidas` | matematica | 3 |
| `energia-renovavel` | `quimica-ambiental` | ciencias-natureza | 2 |
| `imunologia` | `fisiologia-humana` | ciencias-natureza | 2 |
| `energia-trabalho` | `trabalho-energia` | ciencias-natureza | 1 |
| `circuito-eletrico` | `eletrodinamica` | ciencias-natureza | 1 |
| `energia` | `trabalho-energia` | ciencias-natureza | 1 |
| `nutrientes-acuaticos` | `ecologia` | ciencias-natureza | 1 |
| `rotacao` | `dinamica` | ciencias-natureza | 1 |
| `hemorragias` | `fisiologia-humana` | ciencias-natureza | 1 |
| `radioatividade` | `fisica-moderna` | ciencias-natureza | 1 |
| `biologia-ambiental` | `ecologia` | ciencias-natureza | 1 |
| `nutricao` | `fisiologia-humana` | ciencias-natureza | 1 |
| `atmosfera-planetas` | `fisica-moderna` | ciencias-natureza | 1 |
| `densidade` | `hidrostatica` | ciencias-natureza | 1 |
| `astronomia` | `fisica-moderna` | ciencias-natureza | 1 |
| `acustica` | `ondulatoria` | ciencias-natureza | 1 |
| `tempo` | `grandezas-medidas` | matematica | 1 |
| `analisar-situacoes-problema` | `leitura-graficos-tabelas` | matematica | 1 |
| `matriz` | `algebra` | matematica | 1 |
| `exponencial-logaritmica` | `funcoes` | matematica | 1 |
| `exponenciacao` | `funcoes` | matematica | 1 |
| `sequencias` | `funcoes` | matematica | 1 |

---

### Tipo C — Discipline e/ou subcategoria erradas (49 questões)

Casos onde o campo `discipline` estava incorreto (conteúdo pertence a outra área) ou a subcategoria era completamente inventada.

#### C1 — Conteúdo de Ciências Natureza classificado como `ciencias-humanas` (23 questões)

| Questão | Conteúdo | Discipline nova | Subcategoria nova |
|---|---|---|---|
| 2009/#29 | Antimônio, isótopos (50 prótons) | ciencias-natureza | estrutura-atomica |
| 2013/#53 | Vilosidades intestinais de serpente | ciencias-natureza | fisiologia-humana |
| 2013/#60 | Aranhas/escorpiões após cópula | ciencias-natureza | evolucao |
| 2014/#69 | Bactéria com gene de resistência | ciencias-natureza | genetica |
| 2014/#79 | Tipos sanguíneos ABO | ciencias-natureza | genetica |
| 2014/#85 | Imunobiológicos, anticorpos | ciencias-natureza | parasitologia-saude |
| 2015/#46 | Hipoxia, oxigênio no sangue de atletas | ciencias-natureza | fisiologia-humana |
| 2015/#56 | Raças de cães, cruzamento genético | ciencias-natureza | evolucao |
| 2015/#78 | Queimaduras, transferência de calor | ciencias-natureza | termologia |
| 2016/#79 | Vacinas, microrganismos | ciencias-natureza | parasitologia-saude |
| 2016/#90 | Síntese proteica | ciencias-natureza | bioquimica |
| 2017/#126 | Gases nobres/inertes | ciencias-natureza | estrutura-atomica |
| 2017/#128 | Retina, formação de imagem | ciencias-natureza | fisiologia-humana |
| 2017/#130 | Cromatografia em papel | ciencias-natureza | quimica-organica |
| 2017/#134 | Ozonólise, aldeídos, cetonas | ciencias-natureza | quimica-organica |
| 2018/#106 | Formação de novas espécies (especiação) | ciencias-natureza | evolucao |
| 2018/#117 | RNA, proteínas, metabolismo celular | ciencias-natureza | bioquimica |
| 2019/#119 | Pressão dos pneus de bicicleta (gás) | ciencias-natureza | termologia |
| 2021/#106 | Icterícia em recém-nascidos | ciencias-natureza | fisiologia-humana |
| 2022/#108 | Ácido tartárico no vinho | ciencias-natureza | quimica-organica |
| 2023/#96 | Cloreto de cálcio, massa molar, % em massa | ciencias-natureza | estequiometria |
| 2023/#97 | Amadurecimento do abacate, etileno | ciencias-natureza | botanica |
| 2023/#98 | Lesmas-do-mar, cloroplastos (evolução) | ciencias-natureza | evolucao |

#### C2 — Conteúdo de Matemática classificado como `ciencias-humanas` (10 questões)

| Questão | Conteúdo | Discipline nova | Subcategoria nova |
|---|---|---|---|
| 2011/#147 | Superfície de revolução (cone) | matematica | geometria-espacial |
| 2011/#151 | Geometria espacial | matematica | geometria-espacial |
| 2011/#152 | Preço × kg de frutas, gráfico proporcional | matematica | funcoes |
| 2011/#157 | Poupança vs CDB, montante final | matematica | matematica-financeira |
| 2012/#140 | Compra de terreno, opções de pagamento | matematica | matematica-financeira |
| 2012/#162 | Ações, investidores, bolsa de valores | matematica | matematica-financeira |
| 2013/#180 | Geometria plana | matematica | geometria-plana |
| 2018/#136 | Matriz de transferências TED entre bancos | matematica | algebra |
| 2021/#140 | Faturamento de filiais de supermercado | matematica | estatistica |
| 2023/#148 | Mastro com cabos de aço, ângulos | matematica | trigonometria |
| 2023/#154 | Silhuetas de torres de castelo | matematica | geometria-plana |

#### C3 — `ciencias-natureza` classificado como `matematica` (1 questão)

| Questão | Conteúdo | Discipline nova | Subcategoria nova |
|---|---|---|---|
| 2019/#141 | Jogo online, parâmetros de nível/experiência | matematica | funcoes |

#### C4 — Conteúdo de Linguagens classificado como `ciencias-humanas` (2 questões)

| Questão | Conteúdo | Discipline nova | Subcategoria nova |
|---|---|---|---|
| 2010/#110 | Educação física — capacidades físicas (flexibilidade) | linguagens | praticas-corporais |
| 2010/#130 | Conectivos do texto: enquanto, mesmo, no entanto | linguagens | gramatica-contextualizada |

#### C5 — Subcategoria inventada, discipline correta (13 questões)

Questões genuinamente de ciencias-humanas, mas o LLM criou subcategorias que não existem na taxonomia.

| Questão | Subcategoria errada | Subcategoria nova | Motivo |
|---|---|---|---|
| 2009/#5 | `ciencias-natureza` | `fisica-moderna` | Ptolomeu, Copérnico, Kepler |
| 2010/#108 | `tecnologia-e-sociedade` | `globalizacao` | Tecnologia e impacto social |
| 2014/#1 | `telecomunicacoes` | `globalizacao` | Meios de comunicação globais |
| 2014/#6 | `economia` | `historia-contemporanea` | Crise de 1929, economia cafeeira |
| 2017/#56 | `infraestrutura` | `globalizacao` | Logística, exportação de minério |
| 2019/#94 | `ciencias-humanas` | `cultura-memoria` | Jingle de 1962, rádio e TV |
| 2021/#28 | `tecnologia-e-sociedade` | `globalizacao` | Facebook, redes sociais |
| 2021/#57 | `sociedade-economia` | `trabalho` | Marcuse, capitalismo e consumo |
| 2022/#48 | `racismo` | `desigualdade-social` | Discriminação racial |
| 2023/#55 | `capitalismo` | `estado-poder-politica` | Modo de produção capitalista |
| 2023/#72 | `tecnologia-e-sociedade` | `globalizacao` | Viagens ao espaço, tecnologia |
| 2023/#128 | `fisica` | `grandezas-medidas` | Ondas eletromagnéticas (math) |
| 2023/#128 | (discipline matematica, sub incorreta) | `grandezas-medidas` | — |

---

### Tipo D — Questão sem classificação (1 questão)

| Questão | Conteúdo | Discipline atribuída | Subcategoria atribuída |
|---|---|---|---|
| 2022/#144 | Dígito verificador bancário (módulo 11) | matematica | numeros-proporcionalidade |

---

## Taxonomia de referência

A taxonomia válida usada nas validações está em `scripts/classify-questions.ts` (objeto `DISCIPLINE_CONFIG`):

- **ciencias-humanas:** subcategorias de História, Geografia, Filosofia e Sociologia
- **ciencias-natureza:** subcategorias de Biologia, Física e Química
- **linguagens:** subcategorias de Língua Portuguesa, Literatura, Artes, Educação Física e Língua Estrangeira
- **matematica:** subcategorias de Matemática

**Faixas de competências por área:**
| Área | Competências | Habilidades |
|---|---|---|
| ciencias-humanas | C1–C6 | H1–H30 |
| ciencias-natureza | C1–C8 | H1–H30 |
| linguagens | C1–C9 | H1–H30 |
| matematica | C1–C7 | H1–H30 |

---

## Como re-executar a análise

```bash
# Verificar se há novos problemas após rodar o classify-questions.ts
node scripts/analyze-report.js

# Aplicar correções manualmente definidas
node scripts/fix-classifications.js
```
