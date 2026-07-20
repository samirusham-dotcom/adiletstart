"use client";

import { FormEvent, useState } from "react";

type Language = "ru" | "kz";

type AskResponse = {
  right: string;
  articles: string[];
  plain: string;
  steps: string[];
  where_to_go: string[];
  disclaimer: string;
};

type Student = {
  id: number;
  name: string;
  university: string;
  year: number;
  rating: number;
};

const STUDENTS: Student[] = [
  {
    id: 1,
    name: "Айгерим Сабитова",
    university: "КазГЮУ",
    year: 3,
    rating: 4.9,
  },
  {
    id: 2,
    name: "Нурлан Бекенов",
    university: "КБТУ",
    year: 4,
    rating: 4.8,
  },
  {
    id: 3,
    name: "Дана Қасымова",
    university: "ЕНУ им. Гумилёва",
    year: 2,
    rating: 4.7,
  },
  {
    id: 4,
    name: "Ерлан Жанабеков",
    university: "Алматинский университет",
    year: 3,
    rating: 4.9,
  },
];

const COPY = {
  ru: {
    nav: {
      home: "Главная",
      consultant: "ИИ-консультант",
      students: "Студенты-консультанты",
      about: "О проекте",
    },
    hero: {
      badge: "Права на первой работе",
      title: "Adilet — твои права простым языком",
      subtitle:
        "Объясню твои права на первой работе простым языком и подскажу, что делать сегодня — со ссылками на Трудовой кодекс РК.",
      cta: "Задать вопрос",
    },
    consultant: {
      title: "ИИ-консультант",
      subtitle:
        "Опиши ситуацию своими словами — получишь право, статью закона и 3 конкретных шага.",
      placeholder: "Например: работаю официантом, договор не дали, зарплату задержали на 2 недели…",
      submit: "Получить ответ",
      loading: "Анализирую ситуацию…",
      examplesLabel: "Быстрые примеры:",
      examples: [
        "Работодатель не выплатил зарплату",
        "Работаю без договора",
        "Не оплачивают переработки",
        "Испытательный срок без зарплаты",
      ],
      yourRight: "Твоё право",
      basis: "Основание в законе",
      explanation: "Простыми словами",
      steps: "Что делать — 3 шага",
      whereToGo: "Куда обратиться",
      stepLabel: (n: number) => `Шаг ${n}`,
      error: "Не удалось получить ответ. Попробуйте ещё раз.",
    },
    students: {
      title: "Бесплатные консультации студентов",
      subtitle:
        "Студенты-юристы помогут разобраться в ситуации лично — бесплатно и с пониманием.",
      year: (n: number) => `${n}-й курс`,
      rating: "Рейтинг",
      button: "Получить консультацию",
    },
    about: {
      title: "О проекте",
      text: "Adilet создан для молодёжи 16–23 лет, которая впервые выходит на работу. Мы переводим Трудовой кодекс РК на понятный язык и показываем конкретные шаги — это не замена юриста, а честная навигация по вашим правам.",
      points: [
        "Ссылки на реальные статьи ТК РК с adilet.zan.kz",
        "Ответ за ~30 секунд — без юридического жаргона",
        "Бесплатные консультации со студентами-юристами",
      ],
    },
    footer: "Adilet · Гражданская грамотность · Хакатон 2026",
  },
  kz: {
    nav: {
      home: "Басты бет",
      consultant: "AI кеңесші",
      students: "Студент кеңесшілері",
      about: "Жоба туралы",
    },
    hero: {
      badge: "Алғашқы жұмыстағы құқықтар",
      title: "Adilet — құқықтарыңыз оңай тілде",
      subtitle:
        "Алғашқы жұмыстағы құқықтарыңызды оңай тілде түсіндіремін және бүгін не істеу керектігін айтамын — ҚР Еңбек кодексінің мақалаларымен.",
      cta: "Сұрақ қою",
    },
    consultant: {
      title: "AI кеңесші",
      subtitle:
        "Жағдайыңызды өз сөзіңізбен сипаттаңыз — құқығыңыз, заң мақаласы және 3 нақты қадам аласыз.",
      placeholder:
        "Мысалы: даяшы болып жұмыс істеймін, келісімшарт бермеді, екі аптадан бері жалақы бермейді…",
      submit: "Жауап алу",
      loading: "Жағдайды талдауда…",
      examplesLabel: "Жылдам мысалдар:",
      examples: [
        "Жұмыс беруші жалақы төлемеді",
        "Келісімшартсыз жұмыс істеймін",
        "Қосымша жұмыс уақытын төлемейді",
        "Сынақ мерзімінде жалақысыз",
      ],
      yourRight: "Сіздің құқығыңыз",
      basis: "Заңдағы негіз",
      explanation: "Қарапайым тілде",
      steps: "Не істеу керек — 3 қадам",
      whereToGo: "Қайда жүгіну керек",
      stepLabel: (n: number) => `${n}-қадам`,
      error: "Жауап алу мүмкін болмады. Қайта көріңіз.",
    },
    students: {
      title: "Студенттердің тегін кеңес беруі",
      subtitle:
        "Заң студенттері жағдайыңызды жеке түсіндіруге көмектеседі — тегін әрі мейірімді.",
      year: (n: number) => `${n}-курс`,
      rating: "Рейтинг",
      button: "Кеңес алу",
    },
    about: {
      title: "Жоба туралы",
      text: "Adilet алғаш рет жұмысқа орналасатын 16–23 жастағы жастарға арналған. Біз ҚР Еңбек кодексін түсінікті тілге аударамыз және нақты қадамдарды көрсетеміз — бұл заңгердің орны емес, құқықтарыңыз бойынша адал нұсқау.",
      points: [
        "adilet.zan.kz сайтындағы нақты ЕК мақалаларына сілтеме",
        "~30 секундта жауап — заң терминдері жоқ",
        "Заң студенттерінің тегін кеңес беруі",
      ],
    },
    footer: "Adilet · Азаматтық сауаттылық · Хакатон 2026",
  },
} as const;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("ru");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const t = COPY[language];

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), language }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? t.consultant.error);
      }

      setResponse(data as AskResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.consultant.error);
    } finally {
      setLoading(false);
    }
  }

  function handleExample(example: string) {
    setQuestion(example);
    setError(null);
    setResponse(null);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-teal-50/40 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => scrollTo("home")}
            className="text-xl font-bold tracking-tight text-teal-800"
          >
            Adilet
          </button>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {(
              [
                ["home", t.nav.home],
                ["consultant", t.nav.consultant],
                ["students", t.nav.students],
                ["about", t.nav.about],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className="transition-colors hover:text-teal-700"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setLanguage("ru")}
              className={`rounded-full px-3 py-1 transition-colors ${
                language === "ru"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-teal-700"
              }`}
            >
              Рус
            </button>
            <button
              type="button"
              onClick={() => setLanguage("kz")}
              className={`rounded-full px-3 py-1 transition-colors ${
                language === "kz"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-teal-700"
              }`}
            >
              Қаз
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-800">
              {t.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {t.hero.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              {t.hero.subtitle}
            </p>
            <button
              type="button"
              onClick={() => scrollTo("consultant")}
              className="mt-8 rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-800"
            >
              {t.hero.cta}
            </button>
          </div>
        </section>

        <section
          id="consultant"
          className="border-y border-slate-200/80 bg-white/70 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {t.consultant.title}
              </h2>
              <p className="mt-3 text-slate-600">{t.consultant.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 max-w-3xl">
              <label htmlFor="situation" className="sr-only">
                {t.consultant.placeholder}
              </label>
              <textarea
                id="situation"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.consultant.placeholder}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 shadow-sm outline-none ring-teal-600/20 transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4"
              />

              <p className="mt-4 text-sm font-medium text-slate-500">
                {t.consultant.examplesLabel}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.consultant.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExample(example)}
                    className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="mt-6 rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t.consultant.loading : t.consultant.submit}
              </button>
            </form>

            {error && (
              <div className="mt-6 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
                {error}
              </div>
            )}

            {response && (
              <div className="mt-10 max-w-3xl space-y-4">
                <article className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-lg shadow-teal-900/5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    {t.consultant.yourRight}
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-relaxed text-slate-900">
                    {response.right}
                  </p>
                  <p className="mt-4 text-slate-600">{response.plain}</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t.consultant.basis}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {response.articles.map((article) => (
                      <li
                        key={article}
                        className="flex items-start gap-2 text-slate-800"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                        <span>{article}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t.consultant.steps}
                  </p>
                  <ol className="mt-4 space-y-4">
                    {response.steps.map((step, index) => (
                      <li key={step} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="pt-1.5 leading-relaxed text-slate-800">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t.consultant.whereToGo}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {response.where_to_go.map((place) => (
                      <li
                        key={place}
                        className="flex items-start gap-2 text-slate-800"
                      >
                        <span className="text-teal-600">→</span>
                        <span>{place}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <p className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
                  {response.disclaimer}
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="students" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {t.students.title}
              </h2>
              <p className="mt-3 text-slate-600">{t.students.subtitle}</p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STUDENTS.map((student) => (
                <article
                  key={student.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-800">
                    {student.name.charAt(0)}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {student.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {student.university}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t.students.year(student.year)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-amber-600">
                    ★ {student.rating.toFixed(1)} · {t.students.rating}
                  </p>
                  <button
                    type="button"
                    className="mt-5 w-full rounded-xl border border-teal-200 bg-teal-50 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
                  >
                    {t.students.button}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="border-t border-slate-200/80 bg-white/70 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {t.about.title}
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              {t.about.text}
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {t.about.points.map((point) => (
                <li
                  key={point}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400 sm:px-6">
        {t.footer}
      </footer>
    </div>
  );
}
