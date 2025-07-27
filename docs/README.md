# 🚀 JobFinder AI - Job Automation Platform

A comprehensive, AI-powered job search automation platform built with modern web technologies. Transform your career with intelligent job matching, automated applications, AI career coaching, and persistent chat memory.

## ✨ Features

### 🔐 **Secure Authentication**
- Complete user registration and sign-in system
- Secure session management with Supabase Auth
- Full user data isolation with Row Level Security (RLS)
- Password reset and profile management

### 🤖 **AI-Powered Core**
- **OpenAI Integration**: GPT-4o-mini for intelligent responses
- **Persistent Chat Memory**: Context-aware conversations per job/session
- **Multiple AI Assistants**: Job analysis, CV review, interview prep, career coaching
- **Smart Prompts**: Specialized system prompts for different use cases

### 💼 **Job Management**
- Browse LinkedIn jobs from N8N-processed database
- AI-powered job analysis and match scoring  
- Application status tracking and notes
- Priority and tag-based organization
- Job-specific chat sessions for targeted advice

### 💬 **Intelligent Chat System**
- Per-job conversation sessions with persistent memory
- Multiple chat types: job analysis, CV review, interview prep, career coaching
- Message threading and context preservation
- Token counting and context window management

### 📄 **CV & Resume Tools**
- CV text input and analysis
- AI-powered resume optimization
- Skills extraction and matching
- Context integration for personalized advice

### 📧 **Email Automation**
- Professional email generation
- Application, follow-up, and networking templates
- Automated sending capabilities
- Email tracking and analytics

### 🎯 **Career Coaching**
- Personalized learning plans
- Skills assessments and recommendations
- Interview preparation and practice
- Career development roadmaps

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** with App Router
- **React 18+** with Concurrent Features
- **TypeScript** for type safety
- **Tailwind CSS** with design system
- **shadcn/ui** component library
- **Lucide React** for icons

### **Backend & Database**
- **Supabase** (PostgreSQL with built-in auth)
- **Prisma ORM** for type-safe database access
- **Row Level Security** for data isolation
- **Real-time subscriptions**

### **AI & Integration**
- **OpenAI API** (GPT-4o-mini)
- **N8N External Pipeline**: Automated job scraping and processing
- **Intelligent prompt management**
- **Context-aware conversations**

### **State Management**
- **Zustand** for global state
- **React Hook Form** for form handling
- **Zod** for validation schemas
- **Persistent storage** with localStorage

## 📁 Project Structure

```
job-finder-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── auth/             # Authentication forms
│   │   ├── jobs/             # Job management
│   │   ├── chat/             # Chat interface
│   │   └── dashboard/        # Dashboard components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Core utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── prisma.ts         # Prisma client
│   │   ├── openai.ts         # OpenAI client
│   │   ├── utils.ts          # Utility functions
│   │   └── validations.ts    # Zod schemas
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript types
│   └── services/             # API services
├── prisma/                   # Database schema
├── public/                   # Static assets  
└── docs/                     # Documentation
```

## 🗄️ Database Schema

Comprehensive schema with full user isolation:

- **Users**: Profile and authentication data
- **Jobs**: Job opportunities and tracking
- **ChatSessions**: Conversation sessions per job/user
- **Messages**: Individual chat messages with AI context
- **CVs**: Resume management and analysis
- **Emails**: Generated and sent communications
- **CoachingSessions**: Career coaching data
- **Assessments**: Skills and career assessments
- **LearningPlans**: Personalized development paths

## 📊 **Data Pipeline Architecture**

### **N8N External Pipeline**
1. **Job Scraping**: Automated LinkedIn job collection
2. **Data Processing**: Job description formatting and cleaning
3. **AI Analysis**: N8N AI agent identifies job attributes and requirements
4. **Rating System**: Automated job scoring based on multiple criteria
5. **Database Storage**: Processed jobs stored in Supabase `Linkedin_JobFound` table

### **Application Data Flow**
1. **Job Browsing**: Frontend fetches jobs from `Linkedin_JobFound` table
2. **Job Import**: Users can import jobs to personal `jobs` table
3. **AI Chat**: Agents analyze jobs with user CV context
4. **Session Management**: Isolated conversations per user/job/agent

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone and setup**:
```bash
cd job-finder-app
npm install
```

2. **Environment Configuration**:
Copy `.env.local` and fill in your values:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Database
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_direct_postgresql_connection_string
```

3. **Database Setup**:
```bash
npx prisma generate
npx prisma db push
```

4. **Run Development Server**:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Comprehensive error handling
- Accessibility considerations

## 🚦 Current Status

### ✅ **Completed**
- [x] Project setup and configuration
- [x] Comprehensive database schema design
- [x] Authentication system with Supabase
- [x] Core UI components (shadcn/ui)
- [x] Form validation with Zod
- [x] State management with Zustand
- [x] Landing page and auth pages
- [x] Dashboard with job browsing and chat
- [x] OpenAI client configuration
- [x] AI chat system with 4 specialized agents
- [x] CV text processing and analysis
- [x] Job management from N8N-processed database
- [x] Security implementation with RLS
- [x] Dual theme system (light/dark)
- [x] Session management and isolation

### 📋 **External Dependencies**
- **N8N Pipeline**: External workflow for job scraping and processing
- **Supabase Database**: Central data storage for processed LinkedIn jobs
- **OpenAI API**: AI-powered analysis and chat functionality

## 🤝 Contributing

This is a comprehensive job automation platform designed for production use. The architecture supports:

- **Scalability**: Modular design with clear separation of concerns
- **Security**: Row-level security and proper authentication
- **Performance**: Optimized queries and efficient state management
- **User Experience**: Modern, accessible interface design
- **AI Integration**: Sophisticated prompt management and context handling

## 📝 License

This project is built for educational and professional development purposes.

---

**Built with ❤️ using modern web technologies and AI**
