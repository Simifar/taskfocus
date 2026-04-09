# TaskFocus

**TaskFocus** - intelligent task management system designed specifically for users with ADHD. The application implements a focused approach to task management with energy level tracking and flexible deadlines.

## Features

### Core Functionality
- **Limited Active Tasks**: Maximum 3 active tasks to prevent overload
- **Energy-Based Task Management**: 1-5 energy level scale for task allocation
- **Flexible Deadlines**: Date ranges instead of fixed deadlines
- **Task Hierarchies**: Support for subtasks and nested task structures
- **Multiple Views**: Today, Inbox, Week, Calendar, and Day views
- **Project Categories**: Organize tasks by project/category

### User Experience
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Dark/Light Theme**: System theme support with manual toggle
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant task status updates and statistics
- **Drag-and-Drop**: Task reordering capabilities (implemented)

### Authentication & Security
- **JWT-based Authentication**: Secure token-based auth system
- **Rate Limiting**: Protection against brute force attacks
- **Password Hashing**: bcrypt for secure password storage
- **Session Management**: HTTP-only cookies for token storage

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui component library
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts (installed, ready for implementation)

### Backend
- **API**: Next.js API Routes
- **Database**: SQL Server
- **ORM**: Prisma
- **Authentication**: Custom JWT implementation
- **Validation**: Zod schemas

### Development Tools
- **Package Manager**: Bun
- **Linting**: ESLint with Next.js config
- **Database Migrations**: Prisma Migrate

## Database Schema

### Users Table
```sql
- id (string, primary key)
- email (string, unique)
- username (string, unique)
- passwordHash (string)
- name (string, optional)
- avatar (string, optional)
- createdAt (datetime)
- updatedAt (datetime)
```

### Tasks Table
```sql
- id (string, primary key)
- userId (string, foreign key)
- title (string)
- description (string, optional)
- status (enum: active, completed, archived)
- priority (enum: low, medium, high)
- energyLevel (integer, 1-5)
- category (string, optional)
- dueDateStart (datetime, optional)
- dueDateEnd (datetime, optional)
- parentTaskId (string, optional, self-reference)
- createdAt (datetime)
- updatedAt (datetime)
- completedAt (datetime, optional)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/subtasks` - Create subtask

### Statistics
- `GET /api/stats` - Get user statistics

## Project Structure

```
src/
 app/
   api/                    # API routes
     auth/                # Authentication endpoints
     tasks/               # Task management endpoints
     stats/               # Statistics endpoint
   layout.tsx             # Root layout
   page.tsx              # Home page (auth/dashboard router)
 components/
   auth/                 # Authentication components
   dashboard/            # Dashboard layout and views
     views/              # Different dashboard views
     sidebar/            # Navigation sidebar
     shared/             # Shared dashboard components
   tasks/                # Task management components
   ui/                   # shadcn/ui components
 lib/
   auth/                 # Authentication utilities
   db.ts                 # Prisma client
   rate-limit.ts         # Rate limiting
   utils.ts              # General utilities
 types/
   index.ts              # TypeScript type definitions
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Bun package manager
- SQL Server instance
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd taskfocus
bun install
```

### 2. Environment Configuration
Create `.env` file based on `.env.example`:
```env
DATABASE_URL="sqlserver://username:password@localhost:1433/database?trustServerCertificate=true"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-chars"
```

### 3. Database Setup
```bash
bun run db:generate    # Generate Prisma client
bun run db:migrate     # Run database migrations
```

### 4. Development Server
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema to database
- `bun run db:reset` - Reset database

## Key Features in Detail

### ADHD-Focused Design
- **Task Limiting**: Maximum 3 active tasks prevent overwhelm
- **Energy Matching**: Tasks tagged with required energy levels (1-5)
- **Flexible Timing**: Date range deadlines reduce time pressure
- **Visual Organization**: Clean, distraction-free interface

### Task Management
- **Hierarchical Structure**: Parent-child task relationships
- **Status Tracking**: Active, completed, archived states
- **Priority Levels**: Low, medium, high priorities
- **Category Organization**: Project-based grouping

### Dashboard Views
- **Today View**: Current day's tasks with energy filtering
- **Inbox View**: Uncategorized tasks for processing
- **Week View**: Weekly task overview
- **Calendar View**: Monthly calendar interface
- **Day View**: Specific day task management

## Development Notes

### Current Implementation Status
- **Core Features**: Fully implemented and functional
- **Authentication**: Complete with JWT and security measures
- **Task Management**: CRUD operations with subtasks
- **UI Components**: Modern, responsive interface
- **Database**: Properly designed schema with relationships

### Ready for Enhancement
- **Statistics Visualization**: Recharts library installed
- **Advanced Filtering**: Search and filter infrastructure in place
- **Export/Import**: API structure ready for data export
- **Notifications**: Foundation for reminder system

### Security Considerations
- Rate limiting on authentication endpoints
- Secure password hashing with bcrypt
- HTTP-only cookies for JWT tokens
- Input validation with Zod schemas
- SQL injection prevention through Prisma ORM

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of a diploma thesis and is currently for educational use.

## Support

For questions or issues, please refer to the project documentation or contact the development team.
