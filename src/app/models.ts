export interface JobPosition {
  id: string;
  title: string;
  description: string;
  hint: string;
}

export interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

export interface UserInfo {
  name: string;
  email: string;
}

export interface PersonalityScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface SkillScores {
  technical: number;
  leadership: number;
  communication: number;
  problemSolving: number;
  teamwork: number;
}

export interface PersonalityInsight {
  trait: string;
  score: number;
  level: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
}

export interface AssessmentMetrics {
  responseTime: number;
  engagementLevel: number;
  consistencyScore: number;
  detailLevel: number;
}

export interface ChatSession {
  id: string;
  positionTitle: string;
  userInfo: UserInfo;
  messages: Message[];
  personalityScores: PersonalityScores;
  skillAffinity: SkillScores;
  overallScore: number;
  recommendations: string[];
  startTime: Date;
  endTime?: Date;
  assessmentMetrics?: AssessmentMetrics;
  insights?: PersonalityInsight[];
}
