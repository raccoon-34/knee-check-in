export type KneeSide = "左膝" | "右膝" | "双膝" | "说不清";

export type CheckInRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateTime: string;
  kneeSide: KneeSide;
  overallScore: number;
  duration: string;
  locations: string[];
  timing: string[];
  triggers: string[];
  exerciseIntensity: string;
  exerciseDuration: string;
  activityChange: string;
  restChange: string;
  reliefMethods: string[];
  reliefEffect: string;
  redFlags: string[];
  note: string;
};

export type DraftRecord = Omit<CheckInRecord, "id" | "createdAt" | "updatedAt">;
