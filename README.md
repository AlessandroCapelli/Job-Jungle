# Job Jungle - Job Chatbot App

A modern Angular application for assessing personality and professional skills through an AI chatbot.

## 🚀 Key Features

### Architecture
- **Angular 17+** with Standalone Components
- **Angular Signals** for reactive state management
- **Angular Material** for the user interface
- **Chart.js** with ng2-charts for advanced visualizations
- **OpenAI API** for conversational artificial intelligence
- **LocalStorage** for data persistence

### Functionality

#### 1. **Admin Page** (`/admin`)
- Management of job positions
- Form to add new positions with:
  - Position title
  - Detailed description
  - "Hint" field to guide the chatbot
- View and edit existing positions

#### 2. **Chatbot Page** (`/`)
- Selection of the job position
- Candidate registration form (name and email)
- Interactive chat with AI for personality assessment
- Analysis based on the Big Five personality traits:
  - Openness
  - Conscientiousness
  - Extraversion
  - Agreeableness
  - Neuroticism
- Skills assessment:
  - Technical
  - Communication
  - Leadership
  - Problem Solving
  - Creativity
  - Teamwork

#### 3. **Results Page** (`/results`)
- Comprehensive dashboard with statistics
- View assessment sessions
- **Pagination** for session list
- **Search and filter** functionality for candidates
- Interactive charts:
  - **Radar Chart**: Big Five personality profile
  - **Bar Chart**: Professional skills
  - **Line Chart**: Comparison between candidates
- Detailed analysis per candidate
- Automatic recommendation system
- Export results in JSON format

## 🛠️ Technologies Used

### Frontend
- **Angular 17+** (Standalone Components)
- **Angular Material** (UI Components)
- **Angular Signals** (State Management)
- **Angular Router** (Navigation)
- **Reactive Forms** (Form Handling)

### Charts and Visualizations
- **Chart.js** (Charting Library)
- **ng2-charts** (Angular Chart.js Wrapper)

### AI and Backend
- **OpenAI API** (GPT-4o-mini)
- **Fetch API** (HTTP Requests)

### Styling
- **CSS3** with custom variables
- **Flexbox** and **CSS Grid**
- **Responsive Design**
- **Material Design** principles

## 🚀 Installation and Startup

### Prerequisites
- Node.js 18+
- npm or yarn
- Angular CLI 17+

### Setup
```bash
# Install dependencies
npm install

# Configure the OpenAI key
# Modify src/environments/environment.ts
export const environment = {
  production: false,
  openaiApiKey: 'your-openai-api-key-here'
};

# Start the application
ng serve

# Open the browser to http://localhost:4200
```

### Production Build
```bash
ng build --prod
```

## 🔧 Configuration

### OpenAI API
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add the key to `src/environments/environment.ts`
3. Make sure you have enough credits for API calls

## 🔄 Roadmap

- [ ] **Database integration** (PostgreSQL/MongoDB)
- [ ] **User authentication** and authorization
- [ ] **Multi-language support** (i18n)
- [ ] **Advanced analytics** and reporting
- [ ] **Email notifications** for results
- [ ] **PDF export** for reports
- [ ] **Real-time collaboration** between HR
- [ ] **Mobile app** (Ionic/React Native)
