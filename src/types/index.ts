export type Opportunity = {
  id: string;
  company: string;
  industry: string;
  location: string;
  score: number;
  signals: string[];
};

export type Signal = {
  id: string;
  type: string;
  company: string;
  description: string;
  time: string;
  impact: "High" | "Medium" | "Low";
  confidence: number;
};

export type Person = {
  id: string;
  name: string;
  title: string;
  department: string;
  score: number;
};
