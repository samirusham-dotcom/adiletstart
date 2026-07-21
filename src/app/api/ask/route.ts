import knowledgeBase from "@/knowledge-base.json";

/**
 * POST /api/ask
 *
 * Правовой ассистент Adilet для женщин, столкнувшихся с бытовым насилием.
 *
 * Как это работает (кастомная цепочка «поиск → ответ»):
 *  1) ПОИСК по базе знаний (детерминированный, без ИИ) — находим статьи законов РК,
 *     подходящие под вопрос. Это «заземление» (grounding): ответ строится только на
 *     реальных законах, без выдумок. Работает даже без ключа Claude.
 *  2) ОТВЕТ. Если задан ANTHROPIC_API_KEY — Claude формулирует тёплый ответ строго по
 *     найденным статьям. Если ключа нет или что-то пошло не так — возвращаем безопасный
 *     ответ, собранный из базы. Сервис никогда не показывает «ошибку» человеку в беде.
 *
 * БЕЗОПАСНОСТЬ ПРЕЖДЕ ВСЕГО: при угрозе прямо сейчас первый шаг — 102 / 112.
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

const ENTRIES = knowledgeBase as KbEntry[];

const COPY = {
  ru: {
    steps: (article: string) => [
      "Если опасность угрожает прямо сейчас — позвони 102 (полиция) или 112 и постарайся уйти в безопасное место.",
      "Сохрани доказательства: сними побои в травмпункте, сделай фото, сохрани переписку, угрозы и имена свидетелей.",
      `Обратись за защитой, опираясь на ${article}: подай заявление в полицию, а за приютом и бесплатной помощью — в кризисный центр.`,
    ],
    whereToGo: [
      "При угрозе прямо сейчас — полиция 102 или единый номер 112",
      "Кризисные центры и приюты для женщин в вашем городе",
      "Национальная телефонная линия доверия против насилия",
    ],
    disclaimer:
      "Это не юридическая консультация, а поддержка и навигация по твоим правам. Если есть угроза жизни — немедленно звони 102 или 112. Ты не виновата, и помощь есть.",
    noMatch: {
      right: "У тебя есть право на защиту и безопасность",
      plain:
        "Опиши свою ситуацию чуть подробнее — например, про угрозы, побои, защитное предписание, развод или кризисный центр. Пока подскажу общие безопасные шаги.",
    },
  },
  kz: {
    steps: (article: string) => [
      "Қауіп қазір төніп тұрса — 102 (полиция) немесе 112-ге қоңырау шал және қауіпсіз жерге кетуге тырыс.",
      "Дәлелдерді сақта: жарақатты травмпунктте тіркет, фото түсір, хат алмасуды, қорқытуларды және куәгерлердің есімдерін сақта.",
      `${article} негізінде қорғау сұра: полицияға өтініш бер, ал баспана мен тегін көмек үшін дағдарыс орталығына жүгін.`,
    ],
    whereToGo: [
      "Қауіп қазір төнсе — полиция 102 немесе бірыңғай нөмір 112",
      "Қалаңыздағы әйелдерге арналған дағдарыс орталықтары мен баспаналар",
      "Зорлық-зомбылыққа қарсы ұлттық сенім телефоны",
    ],
    disclaimer:
      "Бұл заңгерлік кеңес емес, қолдау және құқықтарың бойынша бағдар. Өмірге қауіп болса — дереу 102 немесе 112-ге қоңырау шал. Сен кінәлі емессің, көмек бар.",
    noMatch: {
      right: "Сенде қорғау мен қауіпсіздікке құқық бар",
      plain:
        "Жағдайыңды сәл толығырақ сипатта — мысалы, қорқыту, зорлық, қорғау нұсқамасы, ажырасу немесе дағдарыс орталығы туралы. Әзірше жалпы қауіпсіз қадамдарды ұсынамын.",
    },
  },
} as const;

/**
 * Приводим слово к основе (первые 5 букв), чтобы совпадали разные формы:
 * «угрожает» и «угроза» → «угро», «развод» и «развестись» → «разво».
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

/** Ищем статьи законов, чьи ключевые слова встречаются в вопросе. */
function retrieve(question: string): KbEntry[] {
  const qStems = stems(question);
  return ENTRIES.map((entry) => {
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
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

/** Собираем структурированный ответ из найденных статей — работает всегда, без внешних вызовов. */
function buildAnswer(matched: KbEntry[], language: Language): AskResponse {
  const t = COPY[language];

  if (matched.length === 0) {
    return {
      right: t.noMatch.right,
      articles: [],
      plain: t.noMatch.plain,
      steps: t.steps("законы РК"),
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
 * Необязательно: Claude формулирует более человечный ответ, СТРОГО по найденным статьям.
 * Возвращает null, если ключа нет или что-то пошло не так — тогда берём ответ из базы.
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

    const langLine =
      language === "kz"
        ? "Отвечай только на казахском языке."
        : "Отвечай только на русском языке.";

    const system = `Ты — Adilet, помощник по правовой защите женщин Казахстана, столкнувшихся с бытовым насилием и угрозами. Отвечай анонимно, с поддержкой и без осуждения.
БЕЗОПАСНОСТЬ ПРЕЖДЕ ВСЕГО: если в ситуации есть угроза прямо сейчас — первым шагом всегда советуй позвонить 102 (полиция) или 112.
Отвечай ТОЛЬКО на основе приведённых ниже материалов о законах РК. Указывай название закона; номер статьи указывай, только если он есть в материалах — не выдумывай номера, при сомнении советуй проверить на adilet.zan.kz.
${langLine}
Верни СТРОГО JSON без markdown по схеме:
{"right": string, "articles": string[], "plain": string, "steps": string[3], "where_to_go": string[], "disclaimer": string}
Материалы (законы РК):
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
    return Response.json(
      { error: language === "kz" ? "Жағдайыңызды сипаттаңыз." : "Опишите вашу ситуацию." },
      { status: 400 },
    );
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
