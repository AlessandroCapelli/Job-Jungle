import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { StateService } from '../state';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChatSession as AppChatSession, Message, PersonalityScores, SkillScores } from '../models';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

interface DisplayChatSession extends AppChatSession {
  candidateName: string;
  candidateEmail: string;
  date: Date;
  duration: number;
  personalityProfile: PersonalityScores;
  skillsProfile: SkillScores & { creativity: number };
  completed: boolean;
}

@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './results-page.html',
  styleUrls: ['./results-page.css']
})
export class ResultsPage implements OnInit {

  constructor(private stateService: StateService) {}

  sessions = computed(() => {
    const realSessions = this.stateService.chatSessions();

    return realSessions.map(session => {
      const startTime = new Date(session.startTime);
      const endTime = session.endTime ? new Date(session.endTime) : undefined;

      const displaySession: Partial<DisplayChatSession> = {
        ...session,
        candidateName: session.userInfo.name,
        candidateEmail: session.userInfo.email,
        date: startTime,
        duration: endTime
          ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
          : 0,
        personalityProfile: session.personalityScores,
        skillsProfile: {
          ...session.skillAffinity,
          creativity: session.skillAffinity.technical * 0.9,
        },
        completed: !!endTime,
      };
      return displaySession as DisplayChatSession;
    });
  });

  selectedSession = signal<DisplayChatSession | null>(null);

  searchTerm = signal('');

  filteredSessions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.sessions();
    }
    return this.sessions().filter(session =>
      session.candidateName.toLowerCase().includes(term) ||
      session.candidateEmail.toLowerCase().includes(term)
    );
  });

  paginatedSessions = computed(() => {
    return this.filteredSessions();
  });

  onSearchChange(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);
  }

  totalSessions = computed(() => this.filteredSessions().length);
  averageScore = computed(() => {
    const sessions = this.sessions();
    if (sessions.length === 0) return 0;
    return Math.round(sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length);
  });

  private chartObserver: MutationObserver | null = null;

  ngOnInit() {
    const sessions = this.sessions();
    if (sessions.length > 0) {
      this.selectedSession.set(sessions[0]);
      this.observeAndCreateCharts();
    }
  }

  selectSession(session: DisplayChatSession) {
    this.selectedSession.set(session);
    this.observeAndCreateCharts();
  }

  private observeAndCreateCharts() {
    if (this.chartObserver) {
      this.chartObserver.disconnect();
    }

    const tabGroup = document.querySelector('.analysis-tabs');
    if (tabGroup) {
      this.chartObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            this.createCharts();
          }
        }
      });

      this.chartObserver.observe(tabGroup, { attributes: true, subtree: true });
    }

    setTimeout(() => this.createCharts(), 100);
  }

  private createCharts() {
    const session = this.selectedSession();
    if (!session) return;

    this.createPersonalityChart(session.personalityProfile);
    this.createSkillsChart(session.skillsProfile);
  }

  private createPersonalityChart(profile: PersonalityScores) {
    const ctx = document.getElementById('personalityChart') as HTMLCanvasElement;
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Apertura', 'Coscienziosità', 'Estroversione', 'Gradevolezza', 'Nevroticismo'],
        datasets: [{
          label: 'Profilo Personalità',
          data: [
            profile.openness,
            profile.conscientiousness,
            profile.extraversion,
            profile.agreeableness,
            100 - profile.neuroticism
          ],
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(76, 175, 80, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(76, 175, 80, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private createSkillsChart(profile: SkillScores & { creativity: number }) {
    const ctx = document.getElementById('skillsChart') as HTMLCanvasElement;
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Tecniche', 'Comunicazione', 'Leadership', 'Problem Solving', 'Creatività', 'Teamwork'],
        datasets: [{
          label: 'Competenze (%)',
          data: [
            profile.technical,
            profile.communication,
            profile.leadership,
            profile.problemSolving,
            profile.creativity,
            profile.teamwork
          ],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(33, 150, 243, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(255, 87, 34, 0.8)',
            'rgba(0, 188, 212, 0.8)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(255, 87, 34, 1)',
            'rgba(0, 188, 212, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Eccellente';
    if (score >= 60) return 'Buono';
    return 'Da migliorare';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  exportResults() {
    const session = this.selectedSession();
    if (!session) return;

    const data = {
      candidato: session.candidateName,
      email: session.candidateEmail,
      posizione: session.positionTitle,
      data: this.formatDate(session.date),
      punteggio: session.overallScore,
      personalita: session.personalityProfile,
      competenze: session.skillsProfile,
      raccomandazioni: session.recommendations
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risultati_${session.candidateName.replace(' ', '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStrengths(session: DisplayChatSession | null): string[] {
    if (!session) return [];
    const strengths: string[] = [];
    if (session.personalityProfile.openness > 70) strengths.push('Elevata apertura a nuove esperienze');
    if (session.personalityProfile.conscientiousness > 70) strengths.push('Grande affidabilità e organizzazione');
    if (session.personalityProfile.extraversion > 70) strengths.push('Eccellenti doti comunicative e sociali');
    if (session.personalityProfile.agreeableness > 70) strengths.push('Grande capacità di lavorare in team');
    if (session.personalityProfile.neuroticism < 30) strengths.push('Elevata stabilità emotiva e gestione dello stress');
    if (session.skillsProfile.technical > 70) strengths.push('Solide competenze tecniche');
    if (session.skillsProfile.communication > 70) strengths.push('Abilità comunicative efficaci');
    if (session.skillsProfile.leadership > 70) strengths.push('Potenziale di leadership');
    if (session.skillsProfile.problemSolving > 70) strengths.push('Forti capacità di problem-solving');
    if (session.skillsProfile.teamwork > 70) strengths.push('Ottimo spirito di squadra');
    return strengths;
  }

  getWeaknesses(session: DisplayChatSession | null): string[] {
    if (!session) return [];
    const weaknesses: string[] = [];
    if (session.personalityProfile.openness < 40) weaknesses.push('Poca apertura a nuove esperienze');
    if (session.personalityProfile.conscientiousness < 40) weaknesses.push('Scarsa affidabilità e organizzazione');
    if (session.personalityProfile.extraversion < 40) weaknesses.push('Scarse doti comunicative e sociali');
    if (session.personalityProfile.agreeableness < 40) weaknesses.push('Scarsa capacità di lavorare in team');
    if (session.personalityProfile.neuroticism > 70) weaknesses.push('Scarsa stabilità emotiva e gestione dello stress');
    if (session.skillsProfile.technical < 40) weaknesses.push('Scarse competenze tecniche');
    if (session.skillsProfile.communication < 40) weaknesses.push('Scarse abilità comunicative');
    if (session.skillsProfile.leadership < 40) weaknesses.push('Scarso potenziale di leadership');
    if (session.skillsProfile.problemSolving < 40) weaknesses.push('Scarse capacità di problem-solving');
    if (session.skillsProfile.teamwork < 40) weaknesses.push('Scarso spirito di squadra');
    return weaknesses;
  }

  async exportToPDF() {
    const session = this.selectedSession();
    if (!session) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;

    pdf.setFontSize(22);
    pdf.setTextColor(46, 125, 50);
    pdf.text('Rapporto di Valutazione Candidato', pageWidth / 2, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Candidato: ${session.candidateName}`, margin, y);
    pdf.text(`Email: ${session.candidateEmail}`, margin, y + 7);
    pdf.text(`Posizione: ${session.positionTitle}`, margin, y + 14);
    pdf.text(`Data: ${this.formatDate(session.date)}`, margin, y + 21);
    pdf.text(`Punteggio Complessivo: ${session.overallScore}%`, margin, y + 28);
    y += 35;

    const personalityChartCanvas = document.getElementById('personalityChart') as HTMLCanvasElement;
    const skillsChartCanvas = document.getElementById('skillsChart') as HTMLCanvasElement;

    if (personalityChartCanvas && skillsChartCanvas) {
      const personalityChartImg = personalityChartCanvas.toDataURL('image/png');
      const skillsChartImg = skillsChartCanvas.toDataURL('image/png');

      pdf.setFontSize(16);
      pdf.setTextColor(46, 125, 50);
      pdf.text('Grafici di Valutazione', margin, y);
      y += 10;

      const chartWidth = (pageWidth - margin * 3) / 2;
      const chartHeight = 70;

      pdf.addImage(personalityChartImg, 'PNG', margin, y, chartWidth, chartHeight);
      pdf.addImage(skillsChartImg, 'PNG', margin + chartWidth + margin, y, chartWidth, chartHeight);
      y += chartHeight + 15;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(46, 125, 50);
    pdf.text('Valutazione Dettagliata', margin, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Punti di Forza:', margin, y);
    y += 7;
    this.getStrengths(session).forEach(strength => {
      pdf.text(`- ${strength}`, margin + 5, y);
      y += 7;
    });

    y += 7;
    pdf.text('Aree di Miglioramento:', margin, y);
    y += 7;
    this.getWeaknesses(session).forEach(weakness => {
      pdf.text(`- ${weakness}`, margin + 5, y);
      y += 7;
    });

    y += 7;
    pdf.text('Domande Suggerite per il Colloquio:', margin, y);
    y += 7;
    session.recommendations.forEach(question => {
      const lines = pdf.splitTextToSize(`- ${question}`, pageWidth - margin * 2 - 5);
      for (const line of lines) {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin + 5, y);
        y += 7;
      }
    });

    if (session.messages && session.messages.length > 0) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(16);
      pdf.setTextColor(46, 125, 50);
      pdf.text('Trascrizione Chat', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      for (const message of session.messages) {
        const prefix = message.sender === 'user' ? 'Candidato: ' : 'Intervistatore: ';
        const text = `${prefix}${message.text}`;
        const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);

        for (const line of lines) {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 5;
        }
        y += 3;
      }
    }

    pdf.save(`Rapporto_${session.candidateName.replace(' ', '_')}.pdf`);
  }
}
