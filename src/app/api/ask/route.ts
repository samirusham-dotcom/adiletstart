import kb from "@/data/knowledge-base.json";

/**
 * POST /api/ask
 *
 * Grounded legal assistant for young workers in Kazakhstan.
 *
 * Design: retrieval is DETERMINISTIC (keyword match against knowledge-base.json),
 * so the demo works on Vercel with ZERO secrets and never hallucinates a law.
 * If ANTHROPIC_API_KEY is set, Claude composes a nicer, grounded explanation on
 * top of the retrieved articles; on any error we fall back to the deterministic
 * answer. This keeps the live link reliable while allowing the AI upgrade.
 */

type Language = "ru" | "kz";

type KbEntry = {
  id: string;
  topic: string;
  article: string;
  plain: string;
  keywords: string[];
  source_url: string;
};

type AskResponse = {
  right: string;
  articles: string[];
  plain: string;
  steps: string[];
  where_to_go: string[];
  disclaimer: string;
};

const ENTRIES = kb as KbEntry[];

const COPY = {
  ru: {
    steps: (article: string) => [
      "Зафиксируйте всё: сохраните трудовой договор (если есть), переписку, скриншоты, расчётные листки и даты.",
      `Сошлитесь на ${article}: обратитесь к работодателю письменно с требованием устранить нарушение.`,
      "Если работодатель не реагирует — подайте обращение: позвоните на 1414, в госинспекцию труда или через Enbek.kz.",
    ],
    whereToGo: [
      "Единый контакт-центр 1414 (звонок бесплатный)",
      "Государственная инспекция труда вашего региона",
      "Enbek.kz — электронный трудовой договор и подача обращений",
    ],
    disclaimer:
      "Это не юридическая консультация, а объяснение и навигация по вашим правам. В сложной ситуации обратитесь к юристу или в госинспекцию труда.",
    noMatch: {
      right: "Не удалось точно определить статью по вашему вопросу",
      plain:
        "Опишите ситуацию с первой работой конкретнее — например, про трудовой договор, испытательный срок, задержку зарплаты или оплату переработок. Пока подскажу общие шаги.",
    },
  },
  kz: {
    steps: (article: string) => [
      "Барлығын тіркеңіз: еңбек шартын (болса), хат алмасуды, скриншоттарды, есеп парақтарын және күндерді сақтаңыз.",
      `${article} негізінде: жұмыс берушіге бұзушылықты жою туралы жазбаша өтініш жасаңыз.`,
      "Егер жұмыс беруші әрекет етпесе — өтініш беріңіз: 1414-ке қоңырау шалыңыз, еңбек инспекциясына немесе Enbek.kz арқылы.",
    ],
    whereToGo: [
      "Бірыңғай байланыс орталығы 1414 (қоңырау тегін)",
      "Аймағыңыздың Мемлекеттік еңбек инспекциясы",
      "Enbek.kz — электрондық еңбек шарты және өтініштер",
    ],
    disclaimer:
      "Бұл заңгерлік кеңес емес, құқықтарыңыз бойынша түсіндірме және бағдар. Күрделі жағдайда заңгерге немесе еңбек инспекциясына жүгініңіз.",
    noMatch: {
      right: "Сұрағыңыз бойынша нақты бапты анықтау мүмкін болмады",
      plain:
        "Алғашқы жұмысқа қатысты жағдайды нақтырақ жазыңыз — мысалы, еңбек шарты, сынақ мерзімі, жалақының кешігуі немесе қосымша жұмыстың төленуі туралы. Әзірше жалпы қадамдарды ұсынамын.",
    },
  },
} as const;

/**
 * Reduce a word to a stem prefix so inflected forms match (Russian/Kazakh are
 * heavily inflected): "зарплату" and "зарплата" both stem to "зарпл",
 * "задержали" and "задержка" both stem to "задер".
 */
function stem(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-zа-яёұқғөәһіңʼ]/gi, "")
    .slice(0, 5);
}

function stems(text: string): Set<string> {
  return new Set(
    text
      .split(/\s+/)
      .map(stem)
      .filter((s) => s.length >= 4),
  );
}

/** Score each knowledge-base entry by how many keyword/topic stems appear in the question. */
function retrieve(question: string): KbEntry[] {
  const qStems = stems(question);
  const scored = ENTRIES.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      for (const s of stems(kw)) {
        if (qStems.has(s)) score += 2;
      }
    }
    for (const s of stems(entry.topic)) {
      if (qStems.has(s)) score += 1;
    }
    return { entry, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

/** Build a structured answer from retrieved articles — always works, no external calls. */
function buildAnswer(matched: KbEntry[], language: Language): AskResponse {
  const t = COPY[language];

  if (matched.length === 0) {
    return {
      right: t.noMatch.right,
      articles: [],
      plain: t.noMatch.plain,
      steps: t.steps("Трудовой кодекс РК"),
      where_to_go: [...t.whereToGo],
      disclaimer: t.disclaimer,
    };
  }

  const primary = matched[0];
  const top = matched.slice(0, 3);

  return {
    right: primary.topic,
    articles: top.map((e) => `${e.article} — ${e.source_url}`),
    plain: top.map((e) => e.plain).join("\n\n"),
    steps: t.steps(primary.article),
    where_to_go: [...t.whereToGo],
    disclaimer: t.disclaimer,
  };
}

/**
 * Optional: let Claude compose a warmer, situation-specific explanation, grounded
 * STRICTLY in the retrieved articles. Returns null if the key is absent or anything
 * goes wrong, so the caller falls back to the deterministic answer.
 */
async function enhanceWithClaude(
  question: string,
  matched: KbEntry[],
  language: Language,
  fallback: AskResponse,
): Promise<AskResponse | null> {
  if (!process.env.ANTHROPIC_API_KEY || matched.length === 0) return null;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    const lang = language === "kz" ? "казахском" : "русском";
    const system = `Ты помощник по трудовым правам молодёжи Казахстана.
Отвечай ТОЛЬКО на основе приведённых ниже статей Трудового кодекса РК — не выдумывай закон.
Всегда указывай номер статьи-основания. Пиши простым языком, как для 18-летнего, на ${lang} языке.
Верни СТРОГО JSON без markdown по схеме:
{"right": string, "articles": string[], "plain": string, "steps": string[], "where_to_go": string[], "disclaimer": string}
Статьи (база знаний):
${JSON.stringify(matched)}`;

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: question }],
    });

    const block = response.content.find((b) => b.type === "text");
    const text = block && "text" in block ? block.text : "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Partial<AskResponse>;

    if (
      typeof parsed.right === "string" &&
      Array.isArray(parsed.steps) &&
      typeof parsed.plain === "string"
    ) {
      return {
        right: parsed.right || fallback.right,
        articles: parsed.articles?.length ? parsed.articles : fallback.articles,
        plain: parsed.plain || fallback.plain,
        steps: parsed.steps.length ? parsed.steps : fallback.steps,
        where_to_go: parsed.where_to_go?.length
          ? parsed.where_to_go
          : fallback.where_to_go,
        disclaimer: parsed.disclaimer || fallback.disclaimer,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { question?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const language: Language = body.language === "kz" ? "kz" : "ru";

  if (!question) {
    return Response.json({ error: "Опишите вашу ситуацию." }, { status: 400 });
  }

  const matched = retrieve(question);
  const deterministic = buildAnswer(matched, language);
  const enhanced = await enhanceWithClaude(
    question,
    matched,
    language,
    deterministic,
  );

  return Response.json(enhanced ?? deterministic);
}
