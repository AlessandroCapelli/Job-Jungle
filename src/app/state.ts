import { Injectable, signal, effect } from '@angular/core';
import { JobPosition, ChatSession } from './models';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  positions = signal<JobPosition[]>([]);
  chatSessions = signal<ChatSession[]>([]);
  selectedPosition = signal<JobPosition | null>(null);

  constructor() {
    this.loadFromStorage();

    this.initializeSampleData();

    effect(() => {
      localStorage.setItem('positions', JSON.stringify(this.positions()));
    });

    effect(() => {
      localStorage.setItem('chatSessions', JSON.stringify(this.chatSessions()));
    });

    effect(() => {
      if (this.selectedPosition()) {
        localStorage.setItem('selectedPosition', JSON.stringify(this.selectedPosition()));
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const storedPositions = localStorage.getItem('positions');
      if (storedPositions) {
        this.positions.set(JSON.parse(storedPositions));
      }

      const storedSessions = localStorage.getItem('chatSessions');
      if (storedSessions) {
        this.chatSessions.set(JSON.parse(storedSessions));
      }

      const storedSelectedPosition = localStorage.getItem('selectedPosition');
      if (storedSelectedPosition) {
        this.selectedPosition.set(JSON.parse(storedSelectedPosition));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  addPosition(position: JobPosition): void {
    this.positions.update(positions => [...positions, position]);
  }

  addChatSession(session: ChatSession): void {
    this.chatSessions.update(sessions => [...sessions, session]);
  }

  updateChatSession(sessionId: string, updates: Partial<ChatSession>): void {
    this.chatSessions.update(sessions =>
      sessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  }

  deleteChatSession(sessionId: string): void {
    this.chatSessions.update(sessions =>
      sessions.filter(session => session.id !== sessionId)
    );
  }

  clearAllChatSessions(): void {
    this.chatSessions.set([]);
  }

  deletePosition(positionId: string): void {
    this.positions.update(positions =>
      positions.filter(position => position.id !== positionId)
    );
  }

  setSelectedPosition(position: JobPosition | null): void {
    this.selectedPosition.set(position);
  }

  private initializeSampleData(): void {
    if (this.positions().length === 0) {
      const samplePositions: JobPosition[] = [
        {
          id: '1',
          title: 'Frontend Developer',
          description: 'Sviluppatore frontend esperto in React, Angular e Vue.js. Responsabile della creazione di interfacce utente moderne e responsive. Richiesta esperienza con TypeScript, CSS3, HTML5 e framework moderni.',
          hint: 'Concentrati su competenze tecniche frontend, creatività nel design UI/UX, capacità di problem solving e attenzione ai dettagli.'
        },
        {
          id: '2',
          title: 'Backend Developer',
          description: 'Sviluppatore backend specializzato in Node.js, Python o Java. Gestione di database, API REST, microservizi e architetture scalabili. Esperienza con cloud computing e DevOps.',
          hint: 'Valuta competenze tecniche backend, capacità di progettazione di sistemi, problem solving complesso e mentalità orientata alla performance.'
        },
        {
          id: '3',
          title: 'Product Manager',
          description: 'Product Manager responsabile della strategia prodotto, roadmap e coordinamento team cross-funzionali. Analisi di mercato, definizione requisiti e gestione stakeholder.',
          hint: 'Focalizzati su leadership, capacità strategiche, comunicazione, orientamento al business e capacità di gestione progetti complessi.'
        },
        {
          id: '4',
          title: 'UX/UI Designer',
          description: 'Designer UX/UI per la creazione di esperienze utente intuitive e design systems coerenti. Competenze in Figma, Adobe Creative Suite, prototipazione e user research.',
          hint: 'Valuta creatività, empatia verso gli utenti, capacità di ricerca, attenzione ai dettagli e competenze di design thinking.'
        },
        {
          id: '5',
          title: 'Data Scientist',
          description: 'Data Scientist per analisi dati avanzate, machine learning e AI. Esperienza con Python, R, SQL, TensorFlow e strumenti di visualizzazione dati.',
          hint: 'Concentrati su competenze analitiche, problem solving quantitativo, curiosità intellettuale e capacità di comunicare insights complessi.'
        }
      ];

      this.positions.set(samplePositions);
    }
  }
}
