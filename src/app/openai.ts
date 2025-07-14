import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export interface PersonalityAnalysis {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  hardSkills: number;
  softSkills: number;
  questions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  async sendMessage(messages: OpenAIMessage[]): Promise<ChatResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openAiApiKey}`
    });

    const body = {
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    };

    try {
      const response = await this.http.post<any>(this.apiUrl, body, { headers }).toPromise();
      const content = response?.choices[0]?.message?.content || '{}';

      try {
        const parsedContent = JSON.parse(content);
        return {
          message: parsedContent.response || 'Sorry, I had a problem generating a response.',
          suggestions: parsedContent.suggestions || []
        };
      } catch (e) {
        console.error('Error parsing JSON response from OpenAI:', e);
        return { message: 'An error occurred while processing the response.', suggestions: [] };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async analyzePersonality(conversation: string, jobDescription: string): Promise<PersonalityAnalysis> {
    const systemPrompt = `You are an expert psychologist and HR professional specializing in personality assessment and job fit analysis.

Your task is to carefully analyze the candidate's responses in the conversation and provide accurate personality scores based on actual evidence from their communication style, content, and behavior patterns.

Job Description: ${jobDescription}

Full Conversation: ${conversation}

ANALYSIS GUIDELINES:

**Big Five Personality Traits (0-100 scale):**

1. **OPENNESS (0-100)**: Look for creativity, curiosity, intellectual interests, willingness to try new things
   - High (70-100): Shows creativity, asks thoughtful questions, mentions learning new technologies, expresses interest in innovation
   - Medium (40-69): Shows some curiosity but prefers familiar approaches
   - Low (0-39): Prefers routine, traditional methods, avoids new experiences

2. **CONSCIENTIOUSNESS (0-100)**: Look for organization, attention to detail, reliability, goal-oriented behavior
   - High (70-100): Mentions planning, organization, meeting deadlines, attention to detail, structured approach
   - Medium (40-69): Shows some organization but may be flexible with structure
   - Low (0-39): Appears disorganized, mentions procrastination, lacks attention to detail

3. **EXTRAVERSION (0-100)**: Look for social energy, communication style, leadership tendencies
   - High (70-100): Enthusiastic communication, mentions teamwork, leadership, enjoys social interaction
   - Medium (40-69): Balanced between social and independent work
   - Low (0-39): Prefers working alone, quiet communication style, avoids leadership roles

4. **AGREEABLENESS (0-100)**: Look for cooperation, empathy, consideration for others
   - High (70-100): Emphasizes collaboration, shows empathy, mentions helping others, avoids conflict
   - Medium (40-69): Balanced approach to cooperation and assertiveness
   - Low (0-39): Competitive, direct communication, may mention conflicts or disagreements

5. **NEUROTICISM (0-100)**: Look for emotional stability, stress management, anxiety indicators
   - High (70-100): Mentions stress, anxiety, emotional reactions, difficulty handling pressure
   - Medium (40-69): Shows some stress but generally manages well
   - Low (0-39): Calm under pressure, emotionally stable, handles stress well

**Skills Affinity (0-100 scale):**

- **HARD SKILLS**: Technical competencies, specific tools, programming languages, certifications, measurable abilities
- **SOFT SKILLS**: Communication, leadership, teamwork, problem-solving, adaptability, emotional intelligence

**IMPORTANT**: Base your scores ONLY on evidence from the actual conversation. If there's insufficient information for a trait, use a neutral score (45-55) rather than guessing.

Respond with ONLY a valid JSON object in this exact format:
{
  "openness": [score based on evidence],
  "conscientiousness": [score based on evidence],
  "extraversion": [score based on evidence],
  "agreeableness": [score based on evidence],
  "neuroticism": [score based on evidence],
  "hardSkills": [score based on technical discussion],
  "softSkills": [score based on communication and interpersonal evidence],
  "questions": ["Generate 3 relevant follow-up questions based on the conversation to probe deeper into the candidate's skills and personality."]
}`;

    try {
      const response = await this.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this conversation and provide personality scores based on actual evidence from the candidate\'s responses. Be precise and realistic.' }
      ]);

      const cleanedResponse = response.message.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Error analyzing personality:', error);

      return {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
        hardSkills: 50,
        softSkills: 50,
        questions: ['Tell me more about your experience with this type of work.', 'How do you approach problem-solving?', 'What motivates you in your career?']
      };
    }
  }
}
