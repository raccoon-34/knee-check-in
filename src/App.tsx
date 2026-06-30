import { type ChangeEvent, type ReactNode, useMemo, useRef, useState } from "react";
import {
  activityChanges,
  defaultDraft,
  durations,
  exerciseDurations,
  exerciseIntensities,
  kneeSides,
  locations,
  overallScores,
  redFlags,
  reliefEffects,
  reliefMethods,
  restChanges,
  timings,
  triggers,
} from "./options";
import { exportCsv, exportJson, hasRedFlags, loadRecords, parseImportedRecords, saveRecords } from "./storage";
import type { CheckInRecord, DraftRecord, KneeSide } from "./types";

type Tab = "today" | "history" | "trends" | "settings";
type Filter = "全部" | "左膝" | "右膝" | "双膝" | "有危险信号" | "评分>=3";
type MultiKey = "locations" | "timing" | "triggers" | "reliefMethods" | "redFlags";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "today", label: "今日打卡" },
  { key: "history", label: "历史记录" },
  { key: "trends", label: "趋势概览" },
  { key: "settings", label: "设置/说明" },
];

export default function App() {
  const [records, setRecords] = useState<CheckInRecord[]>(() => sortRecords(loadRecords()));
  const [tab, setTab] = useState<Tab>("today");
  const [draft, setDraft] = useState<DraftRecord>(() => defaultDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [doneMessage, setDoneMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("全部");

  const persist = (nextRecords: CheckInRecord[]) => {
    const sorted = sortRecords(nextRecords);
    setRecords(sorted);
    saveRecords(sorted);
  };

  const submitRecord = () => {
    const now = new Date().toISOString();
    const existing = records.find((record) => record.id === editingId);
    const nextRecord: CheckInRecord = {
      ...draft,
      id: editingId || crypto.randomUUID(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      redFlags: draft.redFlags.length ? draft.redFlags : ["都没有"],
    };

    persist(editingId ? records.map((record) => (record.id === editingId ? nextRecord : record)) : [nextRecord, ...records]);
    setDoneMessage("已记录。今天请好好照顾膝盖噢！");

    if (hasRedFlags(nextRecord)) {
      window.alert("今天记录到可能需要医疗评估的情况。这个网页不能判断病因。如果出现明显肿胀、发热发红、不能承重、膝盖卡住、打软腿或突然严重疼痛，建议尽快联系医生、骨科、运动医学科或康复科。");
    }

    setDraft(defaultDraft());
    setEditingId(null);
    setStep(0);
    setTab("history");
  };

  const editRecord = (record: CheckInRecord) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = record;
    setDraft(editable);
    setEditingId(record.id);
    setStep(0);
    setDoneMessage("");
    setTab("today");
  };

  const deleteRecord = (id: string) => {
    if (window.confirm("确定删除这条记录吗？")) {
      persist(records.filter((record) => record.id !== id));
    }
  };

  const cancelEdit = () => {
    setDraft(defaultDraft());
    setEditingId(null);
    setStep(0);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">家庭自用记录工具</p>
          <h1>Knee Check-in</h1>
        </div>
        <p className="soft-note">只用于记录和观察趋势，不能替代医生诊断。</p>
      </header>
      <SafetyNotice />
      <nav className="tabs" aria-label="页面导航">
        {tabs.map((item) => (
          <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>
      <main>
        {tab === "today" && <TodayCheckIn draft={draft} setDraft={setDraft} step={step} setStep={setStep} onSubmit={submitRecord} editing={Boolean(editingId)} onCancelEdit={cancelEdit} doneMessage={doneMessage} />}
        {tab === "history" && <History records={records} filter={filter} setFilter={setFilter} onEdit={editRecord} onDelete={deleteRecord} />}
        {tab === "trends" && <Trends records={records} />}
        {tab === "settings" && <Settings records={records} persist={persist} />}
      </main>
    </div>
  );
}

function SafetyNotice() {
  return <section className="notice">如果出现明显肿胀、发热发红、不能承重、膝盖卡住伸不直、打软腿、突然严重疼痛，应该及时就医。</section>;
}

function TodayCheckIn({
  draft,
  setDraft,
  step,
  setStep,
  onSubmit,
  editing,
  onCancelEdit,
  doneMessage,
}: {
  draft: DraftRecord;
  setDraft: (draft: DraftRecord) => void;
  step: number;
  setStep: (step: number) => void;
  onSubmit: () => void;
  editing: boolean;
  onCancelEdit: () => void;
  doneMessage: string;
}) {
  const setField = <K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) => setDraft({ ...draft, [key]: value });
  const toggle = (key: MultiKey, value: string) => {
    const exclusive = ["都没有", "说不清", "今天没有明显时刻", "没有特别处理"];
    const current = draft[key];
    let next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (exclusive.includes(value) && next.includes(value)) next = [value];
    if (!exclusive.includes(value)) next = next.filter((item) => !exclusive.includes(item));
    setField(key, next as DraftRecord[typeof key]);
  };

  const scoreLabel = overallScores.find((item) => item.value === draft.overallScore)?.label || overallScores[0].label;
  const steps: ReactNode[] = [
    <Question title="一、基础信息">
      <label className="field">
        日期和时间
        <input type="datetime-local" value={draft.dateTime} onChange={(event: ChangeEvent<HTMLInputElement>) => setField("dateTime", event.target.value)} />
      </label>
      <ChoiceGroup options={kneeSides} value={draft.kneeSide} onSelect={(value) => setField("kneeSide", value as KneeSide)} />
    </Question>,
    <Question title="二、今天的整体状态">
      <ChoiceGroup options={overallScores.map((item) => item.label)} value={scoreLabel} onSelect={(value) => setField("overallScore", Number(value.slice(0, 1)))} />
    </Question>,
    <Question title="二、持续时间"><ChoiceGroup options={durations} value={draft.duration} onSelect={(value) => setField("duration", value)} /></Question>,
    <Question title="三、不适位置"><ChoiceGroup multi options={locations} value={draft.locations} onToggle={(value) => toggle("locations", value)} /></Question>,
    <Question title="四、出现时机"><ChoiceGroup multi options={timings} value={draft.timing} onToggle={(value) => toggle("timing", value)} /></Question>,
    <Question title="五、今天可能的诱因"><ChoiceGroup multi options={triggers} value={draft.triggers} onToggle={(value) => toggle("triggers", value)} /></Question>,
    <Question title="五、跳操强度"><ChoiceGroup options={exerciseIntensities} value={draft.exerciseIntensity} onSelect={(value) => setField("exerciseIntensity", value)} /></Question>,
    <Question title="五、跳操时长"><ChoiceGroup options={exerciseDurations} value={draft.exerciseDuration} onSelect={(value) => setField("exerciseDuration", value)} /></Question>,
    <Question title="六、活动后的变化"><ChoiceGroup options={activityChanges} value={draft.activityChange} onSelect={(value) => setField("activityChange", value)} /></Question>,
    <Question title="六、休息后的变化"><ChoiceGroup options={restChanges} value={draft.restChange} onSelect={(value) => setField("restChange", value)} /></Question>,
    <Question title="七、缓解方式"><ChoiceGroup multi options={reliefMethods} value={draft.reliefMethods} onToggle={(value) => toggle("reliefMethods", value)} /></Question>,
    <Question title="七、缓解效果"><ChoiceGroup options={reliefEffects} value={draft.reliefEffect} onSelect={(value) => setField("reliefEffect", value)} /></Question>,
    <Question title="八、危险信号"><ChoiceGroup multi options={redFlags} value={draft.redFlags} onToggle={(value) => toggle("redFlags", value)} /></Question>,
    <Question title="九、可选备注">
      <textarea value={draft.note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setField("note", event.target.value)} placeholder="例如今天走很多路、鞋不舒服、跳操后明显、睡眠不好等。" rows={5} />
    </Question>,
    <ReviewCard draft={draft} />,
  ];

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{editing ? "编辑记录" : "今日打卡"}</p>
          <h2>{step + 1}/15</h2>
        </div>
        {editing && <button className="ghost" onClick={onCancelEdit}>取消编辑</button>}
      </div>
      <div className="progress"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      {doneMessage && <p className="success">{doneMessage}</p>}
      {steps[step]}
      <div className="step-actions">
        <button className="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</button>
        {step < steps.length - 1 ? <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>下一步</button> : <button onClick={onSubmit}>{editing ? "保存修改" : "提交记录"}</button>}
      </div>
    </section>
  );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
  return <section className="question-card"><h3>{title}</h3>{children}</section>;
}

function ChoiceGroup({ options, value, multi, onSelect, onToggle }: { options: string[]; value: string | string[]; multi?: boolean; onSelect?: (value: string) => void; onToggle?: (value: string) => void }) {
  return (
    <div className="choices">
      {options.map((option) => {
        const selected = Array.isArray(value) ? value.includes(option) : value === option;
        return <button key={option} className={selected ? "choice selected" : "choice"} onClick={() => (multi ? onToggle?.(option) : onSelect?.(option))}>{option}</button>;
      })}
    </div>
  );
}

function ReviewCard({ draft }: { draft: DraftRecord }) {
  return (
    <Question title="提交前确认">
      <div className="review-grid">
        <span>时间</span><strong>{formatDateTime(draft.dateTime)}</strong>
        <span>膝盖</span><strong>{draft.kneeSide}</strong>
        <span>状态</span><strong>{draft.overallScore} 分</strong>
        <span>危险信号</span><strong>{draft.redFlags.join("、") || "未选择"}</strong>
      </div>
      <p className="soft-note">提交后仍可在历史记录中编辑或删除。</p>
    </Question>
  );
}

function History({ records, filter, setFilter, onEdit, onDelete }: { records: CheckInRecord[]; filter: Filter; setFilter: (filter: Filter) => void; onEdit: (record: CheckInRecord) => void; onDelete: (id: string) => void }) {
  const filtered = records.filter((record) => {
    if (filter === "全部") return true;
    if (filter === "有危险信号") return hasRedFlags(record);
    if (filter === "评分>=3") return record.overallScore >= 3;
    return record.kneeSide === filter;
  });

  return (
    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">共 {records.length} 条</p><h2>历史记录</h2></div></div>
      <div className="filter-row">
        {(["全部", "左膝", "右膝", "双膝", "有危险信号", "评分>=3"] as Filter[]).map((item) => <button key={item} className={filter === item ? "mini selected" : "mini"} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      {filtered.length === 0 ? <p className="empty">还没有符合条件的记录。</p> : filtered.map((record) => (
        <article className="record-card" key={record.id}>
          <div>
            <h3>{formatDateTime(record.dateTime)}</h3>
            <p>{record.kneeSide} · 整体状态 {record.overallScore} 分</p>
            <p>最明显时机：{record.timing.join("、") || "未记录"}</p>
            <p className={hasRedFlags(record) ? "danger-text" : ""}>危险信号：{hasRedFlags(record) ? record.redFlags.join("、") : "无"}</p>
          </div>
          <div className="record-actions">
            <button className="secondary" onClick={() => onEdit(record)}>编辑</button>
            <button className="ghost danger" onClick={() => onDelete(record.id)}>删除</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Trends({ records }: { records: CheckInRecord[] }) {
  const stats = useMemo(() => buildStats(records), [records]);
  return (
    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">观察趋势，不做诊断</p><h2>趋势概览</h2></div></div>
      {records.some(hasRedFlags) && <div className="alert">曾记录到危险信号。若相关情况持续、加重或反复出现，建议及时联系医生或康复专业人员。</div>}
      <div className="stat-grid">
        <Stat label="最近7天平均" value={stats.avg7} />
        <Stat label="最近14天平均" value={stats.avg14} />
        <Stat label="最近7天最高分" value={String(stats.max7)} />
        <Stat label="连续记录" value={`${stats.streak} 天`} />
      </div>
      <TrendList title="常见触发因素" items={stats.topTriggers} />
      <TrendList title="常见位置" items={stats.topLocations} />
      {stats.rising && <div className="tip">最近一周不适程度有上升趋势，建议减少高冲击运动并继续观察。</div>}
      {stats.threeHigh && <div className="tip">近期多次出现轻微疼痛或更明显不适，建议考虑咨询医生或康复专业人员。</div>}
      {records.length === 0 && <p className="empty">记录几天后，这里会显示趋势。</p>}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function TrendList({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  return <section className="trend-block"><h3>{title}</h3>{items.length === 0 ? <p className="empty">暂无数据</p> : items.map((item) => <div className="bar-row" key={item.name}><span>{item.name}</span><strong>{item.count} 次</strong></div>)}</section>;
}

function Settings({ records, persist }: { records: CheckInRecord[]; persist: (records: CheckInRecord[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseImportedRecords(await file.text());
      persist(sortRecords(imported));
      window.alert(`已导入 ${imported.length} 条记录。`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "导入失败，请检查 JSON 文件。");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clearAll = () => {
    if (window.confirm("确定清空全部数据吗？此操作不能撤销。") && window.confirm("请再次确认：真的要清空所有 Knee Check-in 记录吗？")) {
      persist([]);
    }
  };

  return (
    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">本地保存</p><h2>设置/说明</h2></div></div>
      <section className="question-card">
        <h3>免责声明</h3>
        <p>本工具只用于日常记录，不能替代医生诊断，也不根据记录判断病因。</p>
        <p>数据只保存在当前浏览器本地。如果换手机、清理浏览器缓存或使用无痕模式，数据可能丢失。</p>
      </section>
      <section className="question-card">
        <h3>数据管理</h3>
        <div className="settings-actions">
          <button onClick={() => exportCsv(records)}>导出 CSV</button>
          <button onClick={() => exportJson(records)}>导出 JSON</button>
          <button className="secondary" onClick={() => inputRef.current?.click()}>导入 JSON</button>
          <button className="ghost danger" onClick={clearAll}>清空全部数据</button>
        </div>
        <input ref={inputRef} className="hidden-input" type="file" accept="application/json,.json" onChange={(event: ChangeEvent<HTMLInputElement>) => importJson(event.target.files?.[0])} />
      </section>
    </section>
  );
}

function buildStats(records: CheckInRecord[]) {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const inRange = (days: number) => records.filter((record) => new Date(record.dateTime) >= daysAgo(days));
  const last7 = inRange(7);
  const last14 = inRange(14);
  const previous7 = records.filter((record) => {
    const date = new Date(record.dateTime);
    return date >= daysAgo(14) && date < daysAgo(7);
  });
  const recentSorted = [...records].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  return {
    avg7: average(last7),
    avg14: average(last14),
    max7: last7.length ? Math.max(...last7.map((record) => record.overallScore)) : 0,
    streak: recordStreak(records),
    topTriggers: topItems(records.flatMap((record) => record.triggers).filter((item) => !["都没有", "说不清"].includes(item))).slice(0, 5),
    topLocations: topItems(records.flatMap((record) => record.locations).filter((item) => item !== "说不清")).slice(0, 5),
    rising: Number(average(last7)) > Number(average(previous7)) && previous7.length > 0,
    threeHigh: recentSorted.slice(0, 3).length === 3 && recentSorted.slice(0, 3).every((record) => record.overallScore >= 3),
  };
}

function average(records: CheckInRecord[]) {
  if (!records.length) return "0.0";
  return (records.reduce((sum, record) => sum + record.overallScore, 0) / records.length).toFixed(1);
}

function topItems(items: string[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function recordStreak(records: CheckInRecord[]) {
  const days = new Set(records.map((record) => new Date(record.dateTime).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function sortRecords(records: CheckInRecord[]) {
  return [...records].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

function formatDateTime(value: string) {
  if (!value) return "未填写";
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
