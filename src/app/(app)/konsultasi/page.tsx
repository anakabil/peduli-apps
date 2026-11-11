import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { CONSULT_TOPIC_LABEL, CONSULT_STATUS_LABEL, CONSULT_STATUS_TONE, CONSULT_REJECT_LABEL, CONSULT_ANSWER_ROLES, type ConsultTopic, type ConsultRejectReason, type Role } from "@/lib/constants";
import { fmtDateTime, cn } from "@/lib/format";
import { ILLUSTRATION } from "@/lib/icons";
import { AskForm, ScreenForm, AnswerForm, PublishToggle } from "./forms";

export const metadata = { title: "Konsultasi K3" };

const include = {
  asker: { select: { name: true, jabatan: true, departemen: true } },
  assignee: { select: { name: true, jabatan: true } },
} as const;

type Item = Awaited<ReturnType<typeof loadItems>>[number];
const loadItems = (where: object, take = 50) => db.consultation.findMany({ where, include, orderBy: { createdAt: "desc" }, take });

export default async function KonsultasiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const role = user.role as Role;
  const isHse = role === "ADMIN";
  const isPengurus = CONSULT_ANSWER_ROLES.includes(role);
  const sp = await searchParams;

  const [screenCount, answerCount] = await Promise.all([
    isHse ? db.consultation.count({ where: { status: "DIAJUKAN" } }) : 0,
    isPengurus ? db.consultation.count({ where: { status: "DITERUSKAN", assigneeId: user.id } }) : 0,
  ]);
  const tabs = [
    { key: "", label: "Tanya", count: null as number | null },
    ...(isHse ? [{ key: "saring", label: "Penyaringan", count: screenCount }] : []),
    ...(isPengurus ? [{ key: "jawab", label: "Perlu dijawab", count: answerCount }] : []),
    { key: "terbuka", label: "Tanya jawab", count: null },
  ];
  const tab = tabs.find((t) => t.key === (sp.tab ?? "")) ?? tabs[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Komitmen pimpinan" title="Konsultasi K3" description="Pertanyaan seputar K3 dan SMK3 disaring tim HSE, lalu dijawab langsung oleh pengurus." />
      <nav aria-label="Bagian konsultasi" className="no-print mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key ? `/konsultasi?tab=${t.key}` : "/konsultasi"} aria-current={t.key === tab.key ? "page" : undefined} className={cn("chip shrink-0 min-h-11 md:min-h-0", t.key === tab.key && "chip-active")}>
            {t.label}
            {!!t.count && <span className={cn("rounded-full px-1.5 text-xs font-semibold tabular-nums", t.key === tab.key ? "bg-white/20" : "bg-brand-700 text-white")}>{t.count}</span>}
          </Link>
        ))}
      </nav>
      {tab.key === "" && <AskTab userId={user.id} />}
      {tab.key === "saring" && isHse && <ScreenTab />}
      {tab.key === "jawab" && isPengurus && <AnswerTab userId={user.id} />}
      {tab.key === "terbuka" && <PublicTab />}
    </div>
  );
}

async function AskTab({ userId }: { userId: string }) {
  const mine = await loadItems({ askerId: userId });
  return (
    <div className="space-y-4">
      <AskForm />
      <h2 className="pt-2 text-lg font-bold text-ink-900">Pertanyaan saya</h2>
      {mine.length === 0 ? (
        <EmptyState image={ILLUSTRATION.kosongNotifikasi} title="Belum ada pertanyaan" description="Pertanyaan dan jawaban pengurus akan tampil di sini." />
      ) : (
        <div className="space-y-3">{mine.map((c) => <ConsultCard key={c.id} c={c} view="asker" />)}</div>
      )}
    </div>
  );
}

async function ScreenTab() {
  const [waiting, forwarded, answered, pengurus] = await Promise.all([
    loadItems({ status: "DIAJUKAN" }),
    loadItems({ status: "DITERUSKAN" }),
    loadItems({ status: "DIJAWAB" }, 30),
    db.user.findMany({ where: { status: "ACTIVE", role: { in: CONSULT_ANSWER_ROLES } }, select: { id: true, name: true, jabatan: true, role: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
  ]);
  const opts = pengurus.map((p) => ({ id: p.id, name: p.name ?? "-", jabatan: p.jabatan }));
  return (
    <div className="space-y-6">
      <Section title="Menunggu penyaringan" count={waiting.length} empty="Tidak ada pertanyaan baru.">
        {waiting.map((c) => (
          <ConsultCard key={c.id} c={c} view="hse">
            <ScreenForm id={c.id} pengurus={opts} />
          </ConsultCard>
        ))}
      </Section>
      <Section title="Menunggu jawaban pengurus" count={forwarded.length} empty="Tidak ada pertanyaan yang menunggu jawaban.">
        {forwarded.map((c) => <ConsultCard key={c.id} c={c} view="hse" />)}
      </Section>
      <Section title="Sudah dijawab" count={answered.length} empty="Belum ada jawaban.">
        {answered.map((c) => (
          <ConsultCard key={c.id} c={c} view="hse">
            <PublishToggle id={c.id} published={c.published} />
          </ConsultCard>
        ))}
      </Section>
    </div>
  );
}

async function AnswerTab({ userId }: { userId: string }) {
  const [waiting, answered] = await Promise.all([loadItems({ status: "DITERUSKAN", assigneeId: userId }), loadItems({ status: "DIJAWAB", assigneeId: userId }, 20)]);
  return (
    <div className="space-y-6">
      <Section title="Perlu dijawab" count={waiting.length} empty="Tidak ada pertanyaan yang menunggu jawaban Anda.">
        {waiting.map((c) => (
          <ConsultCard key={c.id} c={c} view="pengurus">
            <AnswerForm id={c.id} />
          </ConsultCard>
        ))}
      </Section>
      <Section title="Telah Anda jawab" count={answered.length} empty="Belum ada.">
        {answered.map((c) => <ConsultCard key={c.id} c={c} view="pengurus" />)}
      </Section>
    </div>
  );
}

async function PublicTab() {
  const items = await loadItems({ status: "DIJAWAB", published: true }, 100);
  return items.length === 0 ? (
    <EmptyState image={ILLUSTRATION.kosongLaporan} title="Belum ada tanya jawab" description="Tanya jawab pilihan tim HSE akan tampil di sini tanpa nama penanya." />
  ) : (
    <div className="space-y-3">{items.map((c) => <ConsultCard key={c.id} c={c} view="public" />)}</div>
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
function ConsultCard({ c, view, children }: { c: Item; view: "asker" | "hse" | "pengurus" | "public"; children?: React.ReactNode }) {
  const who =
    view === "public" || view === "asker"
      ? null
      : view === "pengurus" && c.anonymous
        ? "Penanya dirahasiakan"
        : `${c.asker.name ?? "-"}${c.asker.jabatan ? `, ${c.asker.jabatan}` : ""}${view === "hse" && c.anonymous ? " (dirahasiakan dari pengurus)" : ""}`;
  return (
    <article className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{CONSULT_TOPIC_LABEL[c.topic as ConsultTopic] ?? c.topic}</Badge>
        {view !== "public" && <Badge tone={CONSULT_STATUS_TONE[c.status] ?? "neutral"}>{CONSULT_STATUS_LABEL[c.status] ?? c.status}</Badge>}
        {view === "hse" && c.published && <Badge tone="brand">Ditampilkan</Badge>}
        <span className="ml-auto text-xs tabular-nums text-ink-500">{fmtDateTime(c.createdAt)}</span>
      </div>
      {who && <div className="mt-2 text-xs font-medium text-ink-600">{who}</div>}
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{c.question}</p>
      {c.screenNote && view !== "asker" && view !== "public" && (
        <div className="mt-3 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
          <span className="font-semibold">Catatan tim HSE:</span> {c.screenNote}
        </div>
      )}
      {c.status === "DITERUSKAN" && c.assignee && view !== "pengurus" && <div className="mt-2 text-xs text-ink-500">Diteruskan kepada {c.assignee.name}{c.assignee.jabatan ? `, ${c.assignee.jabatan}` : ""}</div>}
      {c.status === "DITOLAK" && (
        <div className="mt-3 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
          <span className="font-semibold">{CONSULT_REJECT_LABEL[c.rejectReason as ConsultRejectReason] ?? "Tidak diteruskan"}.</span> {c.rejectNote}
          {c.rejectReason === "LAPORAN_BAHAYA" && view === "asker" && (
            <Link href="/lapor" className="ml-1 font-semibold text-brand-700 hover:underline">Lapor bahaya</Link>
          )}
        </div>
      )}
      {c.answer && (
        <div className="mt-3 border-l-4 border-brand-600 bg-brand-50/70 py-2.5 pl-3.5 pr-3">
          <div className="text-xs font-semibold text-brand-800">
            Jawaban {c.assignee?.name ?? "pengurus"}
            {c.assignee?.jabatan ? `, ${c.assignee.jabatan}` : ""}
            {c.answeredAt && <span className="font-normal text-ink-500">, {fmtDateTime(c.answeredAt)}</span>}
          </div>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{c.answer}</p>
        </div>
      )}
      {children}
    </article>
  );
}
