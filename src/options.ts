import type { DraftRecord, KneeSide } from "./types";

export const kneeSides: KneeSide[] = ["左膝", "右膝", "双膝", "说不清"];

export const overallScores = [
  { value: 0, label: "0 完全没感觉" },
  { value: 1, label: "1 有存在感，但不痛" },
  { value: 2, label: "2 酸胀或紧绷" },
  { value: 3, label: "3 轻微疼痛" },
  { value: 4, label: "4 明显疼痛，但还能正常走路" },
  { value: 5, label: "5 影响走路或日常活动" },
];

export const durations = ["几分钟", "不到1小时", "1-3小时", "半天左右", "一整天都明显", "说不清"];
export const locations = ["膝盖前方", "髌骨周围", "膝盖内侧", "膝盖外侧", "膝盖后方", "整个膝盖", "说不清"];
export const timings = ["久坐后起身", "上楼", "下楼", "蹲下或站起", "走久了", "跳操后", "早晨起床", "晚上", "今天没有明显时刻", "说不清"];
export const triggers = [
  "久坐超过4小时",
  "连续坐着超过1小时没有起身",
  "上下楼较多",
  "走路较多",
  "站立较久",
  "跳操",
  "深蹲",
  "弓步",
  "开合跳或其他跳跃动作",
  "快速扭转膝盖",
  "穿了不太舒服的鞋",
  "地面较硬",
  "都没有",
  "说不清",
];
export const exerciseIntensities = ["没跳操", "很轻松", "有点累", "比较累", "很累", "说不清"];
export const exerciseDurations = ["没跳操", "10分钟以内", "10-20分钟", "20-40分钟", "40分钟以上", "说不清"];
export const activityChanges = ["变好了", "没变化", "更明显了", "不确定", "今天没有观察到"];
export const restChanges = ["变好了", "没变化", "更明显了", "不确定", "今天没有观察到"];
export const reliefMethods = ["没有特别处理", "休息", "减少上下楼", "停止跳操", "热敷", "冰敷", "拉伸", "轻微走动", "其他"];
export const reliefEffects = ["没尝试", "有明显缓解", "有一点缓解", "没什么变化", "更不舒服", "说不清"];
export const redFlags = [
  "明显肿胀",
  "发热发红",
  "不能正常承重",
  "膝盖卡住，伸不直或弯不下去",
  "膝盖打软或突然没力",
  "受伤时听到或感觉到“啪”的一下",
  "明显咔哒声并伴随不适",
  "发烧，同时膝盖红肿痛",
  "都没有",
];

export const defaultDraft = (): DraftRecord => ({
  dateTime: new Date().toISOString().slice(0, 16),
  kneeSide: "说不清",
  overallScore: 1,
  duration: "说不清",
  locations: [],
  timing: [],
  triggers: [],
  exerciseIntensity: "没跳操",
  exerciseDuration: "没跳操",
  activityChange: "今天没有观察到",
  restChange: "今天没有观察到",
  reliefMethods: [],
  reliefEffect: "没尝试",
  redFlags: ["都没有"],
  note: "",
});
