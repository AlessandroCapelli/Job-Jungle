import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { RouterModule } from '@angular/router';
import { StateService } from '../state';
import { OpenaiService, OpenAIMessage } from '../openai';
import { JobPosition, Message, ChatSession, UserInfo } from '../models';

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TextFieldModule,
    RouterModule,
    DatePipe,
    SlicePipe
  ],
  templateUrl: './chatbot-page.html',
  styleUrls: ['./chatbot-page.css']
})
export class ChatbotPage {
  messageForm: FormGroup;
  userInfoForm: FormGroup;
  messages = signal<Message[]>([]);
  suggestedAnswers = signal<string[]>([]);
  isLoading = signal(false);
  currentSession: ChatSession | null = null;
  positions: any;
  selectedPosition = signal<JobPosition | null>(null);
  showUserInfoForm = signal(false);
  userInfo = signal<UserInfo | null>(null);
  chatEnded = signal(false);
  chatLocked = signal(false);

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private openaiService: OpenaiService
  ) {
    this.positions = this.stateService.positions;
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
    this.userInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  selectPosition(position: JobPosition): void {
    this.selectedPosition.set(position);
    this.stateService.setSelectedPosition(position);
    this.showUserInfoForm.set(true);
  }

  submitUserInfo(): void {
    if (!this.userInfoForm.valid || !this.selectedPosition()) {
      return;
    }

    const userInfo: UserInfo = {
      name: this.userInfoForm.value.name,
      email: this.userInfoForm.value.email
    };

    this.userInfo.set(userInfo);
    this.showUserInfoForm.set(false);
    this.startNewSession(this.selectedPosition()!, userInfo);
  }

  private async startNewSession(position: JobPosition, userInfo: UserInfo): Promise<void> {
    this.currentSession = {
      id: Date.now().toString(),
      positionTitle: position.title,
      userInfo: userInfo,
      messages: [],
      personalityScores: {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0
      },
      skillAffinity: {
        technical: 0,
        leadership: 0,
        communication: 0,
        problemSolving: 0,
        teamwork: 0
      },
      overallScore: 0,
      recommendations: [],
      startTime: new Date()
    };
    this.messages.set([]);
    this.getBotResponse();
  }

  cancelUserInfo(): void {
    this.showUserInfoForm.set(false);
    this.selectedPosition.set(null);
    this.userInfoForm.reset();
  }

  async sendMessage(): Promise<void> {
    if (!this.messageForm.valid || !this.selectedPosition() || !this.currentSession || this.chatEnded() || this.chatLocked()) {
      return;
    }

    const userMessage: Message = {
      sender: 'user',
      text: this.messageForm.value.message
    };
    this.messageForm.reset();
    this.sendUserMessage(userMessage.text);
  }

  sendSuggestedAnswer(answer: string) {
    this.sendUserMessage(answer);
  }

  private async sendUserMessage(text: string): Promise<void> {
    if (!this.selectedPosition() || !this.currentSession || this.chatEnded() || this.chatLocked()) {
      return;
    }

    const userMessage: Message = {
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.currentSession.messages.push(userMessage);
    this.isLoading.set(true);
    this.getBotResponse();
  }

  private async getBotResponse(): Promise<void> {
    if (!this.currentSession || !this.selectedPosition()) {
      return;
    }

    this.isLoading.set(true);
    this.suggestedAnswers.set([]);

    try {
      const position = this.selectedPosition()!;
      const systemPrompt = `You are an expert HR psychologist assessing a candidate for the position of ${position.title}.
Job Description: ${position.description}

Guidance: ${position.hint}

ASSESSMENT STRATEGY:
You need to systematically assess the candidate through targeted questions that reveal specific personality traits and skills. Ask questions that will elicit responses showing:

**OPENNESS**: Creativity, curiosity, learning new things, innovation
- "How do you stay updated with new technologies/trends in your field?"
- "Describe a time when you had to learn something completely new for work"
- "What's the most creative solution you've implemented?"

**CONSCIENTIOUSNESS**: Organization, attention to detail, reliability, planning
- "How do you organize your work and manage deadlines?"
- "Tell me about a time when attention to detail was crucial"
- "How do you ensure quality in your work?"

**EXTRAVERSION**: Social energy, leadership, teamwork, communication
- "How do you prefer to work - independently or in teams?"
- "Describe your communication style with colleagues"
- "Have you ever led a team or project?"

**AGREEABLENESS**: Cooperation, empathy, conflict resolution
- "How do you handle disagreements with colleagues?"
- "Describe a time when you helped a teammate"
- "How do you build relationships at work?"

**NEUROTICISM**: Stress management, emotional stability, pressure handling
- "How do you handle stressful situations or tight deadlines?"
- "Describe a challenging period at work and how you coped"
- "What motivates you when facing difficulties?"

**HARD SKILLS**: Technical abilities, tools, certifications, measurable competencies
**SOFT SKILLS**: Communication, leadership, problem-solving, adaptability

INSTRUCTIONS:
1. Analyze the candidate's previous response for personality indicators.
2. Ask ONE specific follow-up question that targets a trait you haven't fully assessed yet.
3. Make questions behavioral (ask for specific examples and stories).
4. Keep responses conversational but focused.
5. After 5-7 exchanges, suggest ending the session for analysis.
6. **IMPORTANT**: Your entire response must be a single JSON object with two keys: "response" and "suggestions".
   - "response": A string containing your conversational reply to the user.
    - "suggestions": An array of 3-4 short, relevant, and distinct suggested replies for the candidate. These should be plausible answers to your question.

Current conversation length: ${this.currentSession.messages.length} messages. After 5-7 exchanges, suggest ending the session.`;

      const conversationHistory: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt }
      ];

      if (this.currentSession.messages.length === 0) {
        conversationHistory.push({ role: 'user', content: `Ciao, sono ${this.userInfo()?.name} e sono interessato alla posizione di ${position.title}.` });
      } else {
        this.currentSession.messages.forEach(msg => {
          if (msg.sender === 'user') {
            conversationHistory.push({ role: 'user', content: msg.text });
          } else if (msg.sender === 'bot') {
            conversationHistory.push({ role: 'assistant', content: msg.text });
          }
        });
      }

      const botResponse = await this.openaiService.sendMessage(conversationHistory);

      const botMessage: Message = {
        sender: 'bot',
        text: botResponse.message,
        timestamp: new Date()
      };

      if (botResponse.suggestions) {
        this.suggestedAnswers.set(botResponse.suggestions);
      }

      this.messages.update(msgs => [...msgs, botMessage]);
      this.currentSession.messages.push(botMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'Scusa, ho riscontrato un errore. Riprova per favore.',
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, errorMessage]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession || !this.selectedPosition() || this.chatEnded()) {
      return;
    }

    this.isLoading.set(true);
    this.chatLocked.set(true);

    try {
      const conversation = this.currentSession.messages
        .map(m => `${m.sender}: ${m.text}`)
        .join('\n');

      const analysis = await this.openaiService.analyzePersonality(
        conversation,
        this.selectedPosition()!.description
      );

      this.currentSession.personalityScores = {
        openness: analysis.openness,
        conscientiousness: analysis.conscientiousness,
        extraversion: analysis.extraversion,
        agreeableness: analysis.agreeableness,
        neuroticism: analysis.neuroticism
      };

      this.currentSession.skillAffinity = {
        technical: analysis.hardSkills || 0,
        leadership: Math.round(Math.random() * 100), // Placeholder - will be improved with better analysis
        communication: Math.round(Math.random() * 100),
        problemSolving: Math.round(Math.random() * 100),
        teamwork: analysis.softSkills || 0
      };

      const personalityAvg = Object.values(this.currentSession.personalityScores).reduce((a, b) => a + b, 0) / 5;
      const skillsAvg = Object.values(this.currentSession.skillAffinity).reduce((a, b) => a + b, 0) / 5;
      this.currentSession.overallScore = Math.round((personalityAvg + skillsAvg) / 2);

      this.currentSession.recommendations = analysis.questions;
      this.currentSession.endTime = new Date();

      this.stateService.addChatSession(this.currentSession);

      const endMessage: Message = {
        sender: 'bot',
        text: 'Grazie per la conversazione! La tua valutazione è stata completata. Puoi visualizzare i risultati nella pagina Risultati.',
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, endMessage]);

      this.chatEnded.set(true);

    } catch (error) {
      console.error('Error ending session:', error);
      this.chatLocked.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  changePosition(): void {
    this.selectedPosition.set(null);
    this.currentSession = null;
    this.messages.set([]);
    this.userInfo.set(null);
    this.chatEnded.set(false);
    this.chatLocked.set(false);
    this.showUserInfoForm.set(false);
    this.messageForm.reset();
    this.userInfoForm.reset();
  }

  endSessionAndReset(): void {
    if (this.currentSession && !this.chatEnded()) {
      this.endSession().then(() => {
        setTimeout(() => {
          this.changePosition();
        }, 2000);
      });
    } else {
      this.changePosition();
    }
  }

  startNewChat(): void {
    this.changePosition();
  }
}
