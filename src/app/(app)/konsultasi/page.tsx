import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { CONSULT_STATUS_TONE, CONSULT_ANSWER_ROLES, labels, type ConsultTopic, type ConsultRejectReason, type Role } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { makeTr, type Lang } from "@/lib/i18n";
import { fmtDateTime, cn } from "@/lib/format";
import { ILLUSTRATION } from "@/lib/icons";
import { AskForm, ScreenForm, AnswerForm, PublishToggle } from "./forms";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Konsultasi K3", "OHS consultation") };
}

const include = {
  asker: { select: { name: true, jabatan: true, departemen: true } },
  assignee: { select: { name: true, jabatan: true } },
} as const;

type Item = Awaited<ReturnType<typeof loadItems>>[number];
const loadItems = (where: object, take = 50) => db.consultation.findMany({ where, include, orderBy: { createdAt: "desc" }, take });

export default async function KonsultasiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const role = user.role as Role;
  const isHse = role === "ADMIN";
  const isPengurus = CONSULT_ANSWER_ROLES.includes(role);
  const sp = await searchParams;

  const [screenCount, answerCount] = await Promise.all([
    isHse ? db.consultation.count({ where: { status: "DIAJUKAN" } }) : 0,
    isPengurus ? db.consultation.count({ where: { status: "DITERUSKAN", assigneeId: user.id } }) : 0,
  ]);
  const tabs = [
    { key: "", label: tr("Tanya", "Ask"), count: null as number | null },
    ...(isHse ? [{ key: "saring", label: tr("Penyaringan", "Screening"), count: screenCount }] : []),
    ...(isPengurus ? [{ key: "jawab", label: tr("Perlu dijawab", "To answer"), count: answerCount }] : []),
    { key: "terbuka", label: tr("Tanya jawab", "Q&A"), count: null },
  ];
  const tab = tabs.find((t) => t.key === (sp.tab ?? "")) ?? tabs[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={tr("Komitmen pimpinan", "Leadership commitment")}
        title={tr("Konsultasi K3", "OHS consultation")}
        description={tr("Pertanyaan seputar K3 dan SMK3 disaring tim HSE, lalu dijawab langsung oleh pengurus.", "Questions on OHS and the OHS management system (SMK3) are screened by the HSE team, then answered directly by Management.")}
      />
      <nav aria-label={tr("Bagian konsultasi", "Consultation sections")} className="no-print mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key ? `/konsultasi?tab=${t.key}` : "/konsultasi"} aria-current={t.key === tab.key ? "page" : undefined} className={cn("chip shrink-0 min-h-11 md:min-h-0", t.key === tab.key && "chip-active")}>
            {t.label}
            {!!t.count && <span className={cn("rounded-full px-1.5 text-xs font-semibold tabular-nums", t.key === tab.key ? "bg-white/20" : "bg-brand-700 text-white")}>{t.count}</span>}
          </Link>
        ))}
      </nav>
      {tab.key === "" && <AskTab userId={user.id} lang={lang} />}
      {tab.key === "saring" && isHse && <ScreenTab lang={lang} />}
      {tab.key === "jawab" && isPengurus && <AnswerTab userId={user.id} lang={lang} />}
      {tab.key === "terbuka" && <PublicTab lang={lang} />}
    </div>
  );
}

async function AskTab({ userId, lang }: { userId: string; lang: Lang }) {
  const tr = makeTr(lang);
  const mine = await loadItems({ askerId: userId });
  return (
    <div className="space-y-4">
      <AskForm />
      <h2 className="pt-2 text-lg font-bold text-ink-900">{tr("Pertanyaan saya", "My questions")}</h2>
      {mine.length === 0 ? (
        <EmptyState image={ILLUSTRATION.kosongNotifikasi} title={tr("Belum ada pertanyaan", "No questions yet")} description={tr("Pertanyaan dan jawaban pengurus akan tampil di sini.", "Your questions and answers from Management will appear here.")} />
      ) : (
        <div className="space-y-3">{mine.map((c) => <ConsultCard key={c.id} c={c} view="asker" lang={lang} />)}</div>
      )}
    </div>
  );
}

async function ScreenTab({ lang }: { lang: Lang }) {
  const tr = makeTr(lang);
  const [waiting, forwarded, answered, pengurus] = await Promise.all([
    loadItems({ status: "DIAJUKAN" }),
    loadItems({ status: "DITERUSKAN" }),
    loadItems({ status: "DIJAWAB" }, 30),
    db.user.findMany({ where: { status: "ACTIVE", role: { in: CONSULT_ANSWER_ROLES } }, select: { id: true, name: true, jabatan: true, role: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
  ]);
  const opts = pengurus.map((p) => ({ id: p.id, name: p.name ?? "-", jabatan: p.jabatan }));
  return (
    <div className="space-y-6">
      <Section title={tr("Menunggu penyaringan", "Awaiting screening")} count={waiting.length} empty={tr("Tidak ada pertanyaan baru.", "No new questions.")}>
        {waiting.map((c) => (
          <ConsultCard key={c.id} c={c} view="hse" lang={lang}>
            <ScreenForm id={c.id} pengurus={opts} />
          </ConsultCard>
        ))}
      </Section>
      <Section title={tr("Menunggu jawaban pengurus", "Awaiting answer from Management")} count={forwarded.length} empty={tr("Tidak ada pertanyaan yang menunggu jawaban.", "No questions awaiting an answer.")}>
        {forwarded.map((c) => <ConsultCard key={c.id} c={c} view="hse" lang={lang} />)}
      </Section>
      <Section title={tr("Sudah dijawab", "Answered")} count={answered.length} empty={tr("Belum ada jawaban.", "No answers yet.")}>
        {answered.map((c) => (
          <ConsultCard key={c.id} c={c} view="hse" lang={lang}>
            <PublishToggle id={c.id} published={c.published} />
          </ConsultCard>
        ))}
      </Section>
    </div>
  );
}

async function AnswerTab({ userId, lang }: { userId: string; lang: Lang }) {
  const tr = makeTr(lang);
  const [waiting, answered] = await Promise.all([loadItems({ status: "DITERUSKAN", assigneeId: userId }), loadItems({ status: "DIJAWAB", assigneeId: userId }, 20)]);
  return (
    <div className="space-y-6">
      <Section title={tr("Perlu dijawab", "To answer")} count={waiting.length} empty={tr("Tidak ada pertanyaan yang menunggu jawaban Anda.", "No questions awaiting your answer.")}>
        {waiting.map((c) => (
          <ConsultCard key={c.id} c={c} view="pengurus" lang={lang}>
            <AnswerForm id={c.id} />
          </ConsultCard>
        ))}
      </Section>
      <Section title={tr("Telah Anda jawab", "Answered by you")} count={answered.length} empty={tr("Belum ada.", "None yet.")}>
        {answered.map((c) => <ConsultCard key={c.id} c={c} view="pengurus" lang={lang} />)}
      </Section>
    </div>
  );
}

async function PublicTab({ lang }: { lang: Lang }) {
  const tr = makeTr(lang);
  const items = await loadItems({ status: "DIJAWAB", published: true }, 100);
  return items.length === 0 ? (
    <EmptyState image={ILLUSTRATION.kosongLaporan} title={tr("Belum ada tanya jawab", "No Q&A yet")} description={tr("Tanya jawab pilihan tim HSE akan tampil di sini tanpa nama penanya.", "Q&A selected by the HSE team will appear here without the asker's name.")} />
  ) : (
    <div className="space-y-3">{items.map((c) => <ConsultCard key={c.id} c={c} view="public" lang={lang} />)}</div>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-lg font-bold text-ink-900">
        {title} <span className="text-sm font-medium tabular-nums text-ink-500">{count}</span>
      </h2>
      {count === 0 ? <p className="rounded-xl border border-dashed border-ink-200 px-4 py-5 text-sm text-ink-500">{empty}</p> : <div className="space-y-3">{children}</div>}
    </section>
  );
}

/** Kartu satu pertanyaan; identitas pemohon disesuaikan dengan siapa yang melihat */
function ConsultCard({ c, view, lang, children }: { c: Item; view: "asker" | "hse" | "pengurus" | "public"; lang: Lang; children?: React.ReactNode }) {
  const tr = makeTr(lang);
  const L = labels(lang);
  const who =
    view === "public" || view === "asker"
      ? null
      : view === "pengurus" && c.anonymous
        ? tr("Penanya dirahasiakan", "Asker's name withheld")
        : `${c.asker.name ?? "-"}${c.asker.jabatan ? `, ${c.asker.jabatan}` : ""}${view === "hse" && c.anonymous ? tr(" (dirahasiakan dari pengurus)", " (withheld from Management)") : ""}`;
  return (
    <article className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{L.CONSULT_TOPIC_LABEL[c.topic as ConsultTopic] ?? c.topic}</Badge>
        {view !== "public" && <Badge tone={CONSULT_STATUS_TONE[c.status] ?? "neutral"}>{L.CONSULT_STATUS_LABEL[c.status] ?? c.status}</Badge>}
        {view === "hse" && c.published && <Badge tone="brand">{tr("Ditampilkan", "Published")}</Badge>}
        <span className="ml-auto text-xs tabular-nums text-ink-500">{fmtDateTime(c.createdAt, false, lang)}</span>
      </div>
      {who && <div className="mt-2 text-xs font-medium text-ink-600">{who}</div>}
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{c.question}</p>
      {c.screenNote && view !== "asker" && view !== "public" && (
        <div className="mt-3 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
          <span className="font-semibold">{tr("Catatan tim HSE:", "HSE team note:")}</span> {c.screenNote}
        </div>
      )}
      {c.status === "DITERUSKAN" && c.assignee && view !== "pengurus" && <div className="mt-2 text-xs text-ink-500">{tr("Diteruskan kepada", "Forwarded to")} {c.assignee.name}{c.assignee.jabatan ? `, ${c.assignee.jabatan}` : ""}</div>}
      {c.status === "DITOLAK" && (
        <div className="mt-3 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
          <span className="font-semibold">{L.CONSULT_REJECT_LABEL[c.rejectReason as ConsultRejectReason] ?? tr("Tidak diteruskan", "Not forwarded")}.</span> {c.rejectNote}
          {c.rejectReason === "LAPORAN_BAHAYA" && view === "asker" && (
            <Link href="/lapor" className="ml-1 font-semibold text-brand-700 hover:underline">{tr("Lapor bahaya", "Report a hazard")}</Link>
          )}
        </div>
      )}
      {c.answer && (
        <div className="mt-3 border-l-4 border-brand-600 bg-brand-50/70 py-2.5 pl-3.5 pr-3">
          <div className="text-xs font-semibold text-brand-800">
            {tr(`Jawaban ${c.assignee?.name ?? "pengurus"}`, `Answer from ${c.assignee?.name ?? "Management"}`)}
            {c.assignee?.jabatan ? `, ${c.assignee.jabatan}` : ""}
            {c.answeredAt && <span className="font-normal text-ink-500">, {fmtDateTime(c.answeredAt, false, lang)}</span>}
          </div>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{c.answer}</p>
        </div>
      )}
      {children}
    </article>
  );
}
