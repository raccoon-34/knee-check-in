import type { CheckInRecord } from "./types";

const STORAGE_KEY = "knee-check-in-records-v1";

export function loadRecords(): CheckInRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord).filter(Boolean) as CheckInRecord[];
  } catch {
    return [];
  }
}

export function saveRecords(records: CheckInRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function hasRedFlags(record: Pick<CheckInRecord, "redFlags">) {
  return record.redFlags.some((flag) => flag !== "都没有");
}

export function exportJson(records: CheckInRecord[]) {
  downloadFile(`knee-check-in-${dateStamp()}.json`, JSON.stringify(records, null, 2), "application/json");
}

export function exportCsv(records: CheckInRecord[]) {
  const headers: Array<keyof CheckInRecord> = [
    "id",
    "createdAt",
    "updatedAt",
    "dateTime",
    "kneeSide",
    "overallScore",
    "duration",
    "locations",
    "timing",
    "triggers",
    "exerciseIntensity",
    "exerciseDuration",
    "activityChange",
    "restChange",
    "reliefMethods",
    "reliefEffect",
    "redFlags",
    "note",
  ];
  const rows = records.map((record) =>
    headers.map((key) => csvCell(Array.isArray(record[key]) ? (record[key] as string[]).join("; ") : String(record[key] ?? ""))).join(","),
  );
  downloadFile(`knee-check-in-${dateStamp()}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
}

export function parseImportedRecords(text: string): CheckInRecord[] {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("JSON 顶层需要是记录数组。");
  }
  const records = parsed.map(normalizeRecord).filter(Boolean) as CheckInRecord[];
  if (records.length === 0 && parsed.length > 0) {
    throw new Error("没有找到可识别的记录。");
  }
  return records;
}

function normalizeRecord(input: unknown): CheckInRecord | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Partial<CheckInRecord>;
  const now = new Date().toISOString();
  const normalized: CheckInRecord = {
    id: String(record.id || crypto.randomUUID()),
    createdAt: String(record.createdAt || now),
    updatedAt: String(record.updatedAt || now),
    dateTime: String(record.dateTime || now.slice(0, 16)),
    kneeSide: record.kneeSide || "说不清",
    overallScore: Number.isFinite(Number(record.overallScore)) ? Number(record.overallScore) : 0,
    duration: String(record.duration || "说不清"),
    locations: normalizeStringArray(record.locations),
    timing: normalizeStringArray(record.timing),
    triggers: normalizeStringArray(record.triggers),
    exerciseIntensity: String(record.exerciseIntensity || "没跳操"),
    exerciseDuration: String(record.exerciseDuration || "没跳操"),
    activityChange: String(record.activityChange || "今天没有观察到"),
    restChange: String(record.restChange || "今天没有观察到"),
    reliefMethods: normalizeStringArray(record.reliefMethods),
    reliefEffect: String(record.reliefEffect || "没尝试"),
    redFlags: normalizeStringArray(record.redFlags),
    note: String(record.note || ""),
  };

  if (normalized.redFlags.length === 0) normalized.redFlags = ["都没有"];
  return normalized;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
