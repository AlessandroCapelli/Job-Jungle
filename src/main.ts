import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';
import { AdminPage } from './app/admin-page/admin-page';
import { ChatbotPage } from './app/chatbot-page/chatbot-page';
import { ResultsPage } from './app/results-page/results-page';

const routes = [
  { path: '', component: ChatbotPage },
  { path: 'admin', component: AdminPage },
  { path: 'results', component: ResultsPage }
];

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient()
  ]
}).catch(err => console.error(err));
