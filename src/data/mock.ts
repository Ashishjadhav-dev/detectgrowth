import type { Opportunity, Person, Signal } from "@/types";

export const opportunities: Opportunity[] = [
  { id: "abc-fashion", company: "ABC Fashion", industry: "E-commerce", location: "Bangalore, India", score: 94, signals: ["New product launch", "Hiring marketing role", "Meta Ads increased"] },
  { id: "xyz-restaurant", company: "XYZ Restaurant", industry: "Food & Beverage", location: "Bangalore, India", score: 91, signals: ["Expanding to new location", "Hiring service team", "Strong growth signals"] },
  { id: "pqr-electronics", company: "PQR Electronics", industry: "Consumer Electronics", location: "Delhi, India", score: 88, signals: ["E-commerce store launched", "Website updated", "Active on Instagram"] },
  { id: "lmn-solutions", company: "LMN Solutions", industry: "SaaS", location: "Mumbai, India", score: 86, signals: ["New funding round", "Hiring for growth", "Strong tech stack"] },
  { id: "stu-education", company: "STU Education", industry: "Education", location: "Bangalore, India", score: 83, signals: ["Ad spend increased", "Website refreshed", "New course launch"] }
];

export const people: Person[] = [
  { id: "1", name: "Rahul Sharma", title: "Head of Marketing", department: "Marketing", score: 91 },
  { id: "2", name: "Neha Patil", title: "Marketing Manager", department: "Marketing", score: 78 },
  { id: "3", name: "Amit Verma", title: "Founder & CEO", department: "Leadership", score: 95 },
  { id: "4", name: "Sanjay Mehta", title: "Sales Director", department: "Sales", score: 72 },
  { id: "5", name: "Ritika Singh", title: "Growth Manager", department: "Marketing", score: 66 }
];

export const signals: Signal[] = [
  { id: "1", type: "New product launch", company: "ABC Fashion", description: "Launched a new winter collection.", time: "4 min ago", impact: "High", confidence: 96 },
  { id: "2", type: "Hiring detected", company: "PQR Electronics", description: "Hiring a Digital Marketing Manager.", time: "1 hour ago", impact: "High", confidence: 91 },
  { id: "3", type: "New outlet opened", company: "XYZ Restaurant", description: "Opened a new outlet in Koramangala.", time: "3 hours ago", impact: "Medium", confidence: 88 },
  { id: "4", type: "Website updated", company: "LMN Solutions", description: "Updated pricing and packaging pages.", time: "5 hours ago", impact: "Medium", confidence: 86 },
  { id: "5", type: "Increased ad activity", company: "STU Education", description: "Meta ad spend increased materially.", time: "1 day ago", impact: "High", confidence: 90 }
];
