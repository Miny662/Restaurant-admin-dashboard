# Restaurant AI Management System

## Overview

This is a full-stack web application built for restaurant management with AI-powered features. The system provides receipt analysis, review management, and reservation handling with intelligent automation capabilities. It uses a modern tech stack with React frontend, Express backend, and PostgreSQL database.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js server with TypeScript support
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Framework**: Shadcn/ui components with Radix primitives and Tailwind CSS
- **AI Integration**: OpenAI API for receipt analysis, review sentiment analysis, and automated responses

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application with client-side routing using Wouter
- **Component Library**: Comprehensive UI components based on Shadcn/ui and Radix primitives
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **File Upload**: Multer for handling receipt image uploads with size and type validation
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **AI Services**: OpenAI integration for various AI-powered features

### Database Schema
The system uses four main tables:
- **Users**: Authentication and user management
- **Receipts**: Receipt storage with AI analysis results (merchant, amount, fraud detection)
- **Reviews**: Customer reviews with sentiment analysis and AI-generated replies
- **Reservations**: Restaurant booking system with customer information and status tracking

## Data Flow

1. **Receipt Processing**: Images uploaded → AI analysis via OpenAI → fraud detection → database storage → dashboard display
2. **Review Management**: Reviews created → sentiment analysis → AI reply generation → manual approval → response posting
3. **Reservation System**: Booking creation → validation → confirmation email generation → status tracking
4. **Analytics**: Data aggregation → weekly summaries → AI-generated insights

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o for receipt analysis, review sentiment analysis, and automated response generation
- **Vision Analysis**: Image-to-text extraction for receipt processing
- **Natural Language Processing**: Sentiment analysis and automated reply generation

### Database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database operations with schema validation

### Development Tools
- **Vite**: Frontend build tool with HMR and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast server-side bundling for production

## Deployment Strategy

The application is configured for Replit deployment with:
- **Development Mode**: `npm run dev` starts both frontend and backend with hot reloading
- **Production Build**: Vite builds frontend assets, ESBuild bundles server code
- **Port Configuration**: Server runs on port 5000, accessible via port 80 externally
- **Database Migrations**: Drizzle Kit handles schema changes and migrations

The deployment process includes:
1. Frontend build to `dist/public`
2. Server bundling to `dist/index.js`
3. Environment variable configuration for database and API keys
4. Auto-scaling deployment target for production workloads

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 17, 2025. Initial setup