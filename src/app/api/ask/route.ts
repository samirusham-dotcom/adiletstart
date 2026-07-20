import Anthropic from "@anthropic-ai/sdk";
import knowledgeBase from "@/knowledge-base.json";

const client = new Anthropic();

type Language = "ru" | "kz";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    right: {
      type: "string",
      description: "One or two sentences explaining the user's right in plain language",
    },
    articles: {
      type: "array",
      items: { type: "string" },
      description: "Specific Labor Code article references with numbers",
    },
    plain: {
      type: "string",
      description: "A short empathetic explanation of the situation",
    },
    steps: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
      description: "Exactly three concrete action steps the user can take today",
    },
    where_to_go: {
      type: "array",
      items: { type: "string" },
      description: "Contacts and institutions to reach out to",
    },
    disclaimer: {
      type: "string",
      description: "Professional legal disclaimer",
    },
  },
  required: [
    "right",
    "articles",
    "plain",
    "steps",
    "where_to_go",
    "disclaimer",
  ],
  additionalProperties: false,
} as const;

function buildSystemPrompt(language: Language): string {
  const langInstruction =
    language === "kz"
      ? "Жауапты тек қазақ тілінде жаз."
      : "Отвечай только на русском языке.";

  return `Ты — Adilet, помощник по трудовым правам для молодёжи Казахстана (16–23 года), которая устраивается на первую работу.
Отвечай ТОЛЬКО на основе приведённых ниже статей Трудового кодекса РК.
Всегда указывай номер статьи-основания. Пиши простым, эмпатичным языком, как для 18-летнего.
Если в статьях нет ответа — честно скажи об этом, не выдумывай закон.
В поле steps верни ровно 3 конкретных шага, которые человек может сделать сегодня.
В поле where_to_go укажи: 1414, госинспекцию труда, Enbek.kz — где уместно.
${langInstruction}

База знаний (статьи):
${JSON.stringify(knowledgeBase, null, 2)}`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        {
          error:
            "Сервис временно недоступен. Добавьте ANTHROPIC_API_KEY в .env.local",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const question =
      typeof body.question === "string" ? body.question.trim() : "";
    const language: Language = body.language === "kz" ? "kz" : "ru";

    if (!question) {
      return Response.json(
        { error: "Опишите вашу ситуацию" },
        { status: 400 },
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      system: buildSystemPrompt(language),
      output_config: {
        format: {
          type: "json_schema",
          schema: RESPONSE_SCHEMA,
        },
      },
      messages: [{ role: "user", content: question }],
    });

    const text =
      response.content.find((block) => block.type === "text")?.text ?? "{}";

    return Response.json(JSON.parse(text));
  } catch (error) {
    console.error("[api/ask]", error);
    return Response.json(
      { error: "Не удалось получить ответ. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}
