# LEGO Digital Learning Platform - Tutor & Learner Feature Roadmap

## Executive Summary

This document outlines the comprehensive feature roadmap for transforming the LEGO Digital Learning Platform into a full-featured educational platform with Google Classroom-like functionality for tutors and learners. The messaging system has been fixed and should be skipped in this phase.

---

## Current State Assessment

### Completed Features (Recent Updates)
- **UI/UX Improvements:** Claymorphic design system applied across sidebar, header/stats, cards, and empty states
- **Performance Optimizations:** Next.js Image component, dynamic imports for Celebration component, parallel data fetching
- **Bug Fixes:** Hydration error resolved, messaging RLS policies applied

### Existing Pages (Need Enhancement/Integration)
- `/tutoring/dashboard` - Tutor Dashboard (exists, needs enhancement)
- `/tutoring/history` - Tutor History (exists, needs enhancement)
- `/tutoring` - Currently shows learner view, needs tutor-specific My Classes
- `/path` - Learner learning path (exists)
- `/library` - Learner library (exists)
- `/friends` - Social features (recently redesigned)
- `/messages` - Messaging (fixed, skip)
- `/settings` - Basic settings (needs complete overhaul)

### Missing Features (To Be Created)
- Tutor Groups Management (Google Classroom-like)
- Tutor Quiz Creation System
- Task/Assignment Upload System
- Real-time Class Conduction
- Learner Classes View (/classes)
- Tutor Discovery & Enrollment System
- Complete Profile Settings

---

## Feature Requirements

## TUTOR PORTAL

### 1. Tutor Dashboard Enhancement
**Current:** Basic dashboard exists
**Required Enhancements:**
- Overview statistics (total students, active classes, upcoming sessions, pending assignments)
- Quick action cards (create class, schedule session, post announcement)
- Recent activity feed (student enrollments, assignment submissions, messages)
- Upcoming sessions timeline with join links
- Performance metrics (student engagement, completion rates)

**UI Requirements:**
- Claymorphic design consistent with new design system
- Responsive grid layout for statistics cards
- Interactive timeline for sessions
- Real-time updates for activity feed

### 2. Tutor History
**Current:** Basic history exists
**Required Enhancements:**
- Detailed session history with recordings (if available)
- Student attendance records
- Assignment submission history
- Communication logs
- Exportable reports (PDF/CSV)

### 3. Groups Management (NEW - Google Classroom-like)
**Route:** `/tutoring/groups`

**Core Features:**
- **Group Creation:**
  - Multi-select learners to add to group
  - Group name, description, subject, grade level
  - Cover image upload
  - Group code for students to join
  - Privacy settings (public/private/invite-only)

- **Group Dashboard (per group):**
  - Stream view (announcements, posts, updates)
  - Classwork tab (assignments, quizzes, materials)
  - People tab (tutor, students, co-tutors)
  - Grades tab (student progress, submission tracking)
  - Settings tab (group configuration)

- **Assignment/Task Management:**
  - Create assignments with due dates
  - Upload attachments (PDF, images, videos, documents)
  - Point values and grading rubrics
  - Draft and publish states
  - Duplicate assignments
  - Schedule assignments for future release

- **Quiz Creation:**
  - Multiple question types (multiple choice, true/false, short answer, essay)
  - Question bank management
  - Randomized question order
  - Time limits
  - Auto-grading for objective questions
  - Manual grading for subjective questions
  - Quiz analytics

- **Real-time Communication:**
  - Group chat integrated with messaging system
  - Announcement posts with rich text
  - Comments on assignments
  - @mentions for students
  - Notification system

- **Permissions System:**
  - Tutor (full control)
  - Co-tutor (can manage content, not settings)
  - Student (view only, submit work)
  - Parent (view-only child's progress)

**Database Schema Requirements:**
```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  grade_level VARCHAR(50),
  cover_image_url TEXT,
  group_code VARCHAR(10) UNIQUE,
  privacy VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'student', -- tutor, co-tutor, student
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  points INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment attachments table
CREATE TABLE assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, late
  points_earned INTEGER,
  feedback TEXT,
  UNIQUE(assignment_id, student_id)
);

-- Submission attachments table
CREATE TABLE submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  time_limit INTEGER, -- in minutes
  allow_retakes BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  randomize_questions BOOLEAN DEFAULT false,
  show_results_after BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- multiple_choice, true_false, short_answer, essay
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz options table (for multiple choice)
CREATE TABLE quiz_options (
 	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INTEGER,
  UNIQUE(quiz_id, student_id, started_at)
);

-- Quiz answers table
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_options(id),
  text_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER
);

-- Group announcements table
CREATE TABLE group_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group comments table
CREATE TABLE group_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES group_comments(id), -- for replies
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**UI/UX Requirements:**
- Google Classroom-inspired layout
- Left sidebar: navigation (Stream, Classwork, People, Grades)
- Main content area: dynamic based on selected tab
- Top banner: group name, cover image, group code
- Claymorphic design with soft shadows
- Responsive design for mobile/tablet
- Drag-and-drop for file uploads
- Rich text editor for descriptions and announcements

### 4. My Classes (Tutor View)
**Route:** `/tutoring/classes` (rename from `/tutoring`)

**Features:**
- Grid view of all tutor's groups/classes
- Card-based layout with group cover images
- Quick stats per class (student count, pending assignments, recent activity)
- Create new class button
- Search and filter classes
- Archive/unarchive classes
- Duplicate class template

**Current Issue:** Currently shows learner view at `/tutoring` - needs to detect user role and redirect appropriately

### 5. Real-time Class Conduction (NEW)
**Route:** `/tutoring/live/[groupId]`

**Features:**
- **Video/Audio Streaming:**
  - WebRTC integration for video calls
  - Screen sharing capability
  - Virtual whiteboard
  - Recording sessions
  - Breakout rooms

- **Interactive Features:**
  - Live chat during session
  - Hand raising system
  - Polls and quizzes during class
  - Screen sharing from tutor
  - File sharing during session
  - Attendance tracking

- **Session Management:**
  - Schedule sessions with calendar integration
  - Session reminders
  - Join links for students
  - Waiting room for students
  - Session recordings
  - Post-session analytics

**Technical Requirements:**
- WebRTC server (e.g., LiveKit, Jitsi, or custom)
- WebSocket for real-time communication
- Recording service integration
- Calendar API integration (Google Calendar, Outlook)

### 6. Profile Settings (Complete Overhaul)
**Route:** `/settings`

**Features:**
- **Profile Information:**
  - Display name
  - Profile picture upload
  - Bio/description
  - Location
  - Website/social links
  - Expertise areas (for tutors)

- **Account Settings:**
  - Email change
  - Password change
  - Two-factor authentication
  - Account deletion
  - Data export

- **Notification Preferences:**
  - Email notifications
  - Push notifications
  - In-app notifications
  - Notification types (messages, assignments, sessions, etc.)

- **Privacy Settings:**
  - Profile visibility
  - Search visibility
  - Activity visibility
  - Data sharing preferences

- **Tutor-Specific Settings:**
  - Hourly rate
  - Availability calendar
  - Cancellation policy
  - Teaching preferences
  - Verified credentials

**UI Requirements:**
- Tabbed interface for different settings categories
- Form validation
- Preview for profile picture
- Toggle switches for notifications
- Claymorphic design consistent with platform

---

## LEARNNER DESK

### 1. Home/Path
**Route:** `/path` (exists, needs enhancement)

**Required Enhancements:**
- Personalized learning recommendations
- Progress tracking visualizations
- Upcoming deadlines
- Recommended tutors/classes
- Streak and XP display
- Daily goals

### 2. Library
**Route:** `/library` (exists, needs enhancement)

**Required Enhancements:**
- Filter by subject, difficulty, format
- Bookmark/favorite resources
- Download offline access
- Resource ratings and reviews
- Related resources suggestions

### 3. Classes (NEW - Learner View of Groups)
**Route:** `/classes` (new route, not `/tutoring`)

**Features:**
- Grid view of enrolled classes
- Card-based layout matching Google Classroom
- Class cover images and descriptions
- Upcoming assignments and due dates
- Recent announcements
- Quick access to class materials
- Progress indicators per class
- Leave class option

**Per Class View (`/classes/[groupId]`):**
- Same layout as tutor view but with student permissions
- Stream: view announcements, post comments
- Classwork: view assignments, submit work, view grades
- People: view tutor and classmates
- Grades: view own grades and feedback

**Enrollment System:**
- Browse available classes
- Search by subject, tutor, level
- View class details before enrolling
- Request enrollment (if private)
- Join with class code (if public)
- Waitlist for full classes

### 4. Tutor Discovery & Enrollment
**Route:** `/tutors` (new route)

**Features:**
- **Tutor Directory:**
  - Search and filter tutors
  - Tutor profiles with:
    - Profile picture and bio
    - Expertise areas
    - Rating and reviews
    - Hourly rate
    - Availability status
    - Total students taught
    - Sample classes/courses
  - Sort by rating, price, experience

- **Tutor Profile Page (`/tutors/[tutorId]`):**
  - Detailed tutor information
  - Available classes/courses
  - Reviews from students
  - Availability calendar
  - Book session button
  - Send message button

- **Class Discovery:**
  - Browse all available classes
  - Filter by subject, level, price, schedule
  - View class details (syllabus, schedule, requirements)
  - Enroll in classes
  - Request enrollment (if approval required)

**Database Schema Requirements:**
```sql
-- Tutor profiles table (extends profiles)
CREATE TABLE tutor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[], -- array of expertise areas
  hourly_rate DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  availability JSONB, -- schedule data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tutor reviews table
CREATE TABLE tutor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tutor_id, student_id)
);

-- Enrollment requests table
CREATE TABLE enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_message TEXT,
  UNIQUE(group_id, student_id)
);
```

**UI Requirements:**
- Search bar with filters
- Card-based tutor/class listings
- Rating stars display
- Responsive grid layout
- Modal for enrollment requests
- Claymorphic design consistent with platform

### 5. Settings
**Route:** `/settings` (same as tutor settings but without tutor-specific options)

**Features:**
- Same as tutor settings minus:
  - Hourly rate
  - Availability calendar
  - Teaching preferences
  - Verified credentials

---

## INTEGRATION REQUIREMENTS

### Role-Based Routing
- Detect user role (tutor/learner) on login
- Redirect to appropriate dashboard:
  - Tutors → `/tutoring/dashboard`
  - Learners → `/path`
- `/tutoring` route should redirect based on role

### Messaging Integration
- Group chats integrated with existing messaging system
- Direct messaging between tutors and learners
- Notification system for new messages
- Read receipts

### Real-time Updates
- WebSocket for:
  - Live class sessions
  - Real-time chat
  - Assignment updates
  - Grade updates
  - Announcement notifications

### File Storage
- Integration with Supabase Storage or similar
- File type validation
- Size limits
- Virus scanning (optional)

### Calendar Integration
- Google Calendar API
- Outlook Calendar API
- Session scheduling
- Reminder notifications

---

## TECHNICAL ARCHITECTURE

### Frontend Stack
- Next.js 16.3.5 with App Router
- React with TypeScript
- Tailwind CSS with custom claymorphic utilities
- Supabase Auth
- Real-time subscriptions via Supabase Realtime

### Backend Stack
- Supabase (PostgreSQL database)
- Drizzle ORM
- Server Actions for mutations
- Supabase Storage for files
- WebRTC for video (LiveKit or similar)

### Key Libraries to Add
- `@livekit/client` or similar for video
- `@tiptap/react` for rich text editor
- `react-big-calendar` or similar for calendar
- `react-dropzone` for file uploads
- `react-hot-toast` for notifications

---

## IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Week 1-2)
1. Database schema implementation (groups, assignments, submissions, quizzes)
2. Role-based routing
3. Basic Groups CRUD for tutors
4. Classes view for learners
5. Profile settings overhaul

### Phase 2: Core Features (Week 3-4)
1. Assignment creation and submission
2. Quiz creation system
3. Enrollment system
4. Tutor discovery
5. Group communication (announcements, comments)

### Phase 3: Advanced Features (Week 5-6)
1. Real-time class conduction (video/audio)
2. Whiteboard integration
3. Session scheduling
4. Calendar integration
5. Recording sessions

### Phase 4: Polish & Optimization (Week 7-8)
1. Performance optimization
2. Mobile responsiveness
3. Accessibility improvements
4. Analytics dashboard
5. Testing and bug fixes

---

## SUCCESS METRICS

### User Engagement
- Daily active users
- Session duration
- Class enrollment rates
- Assignment completion rates

### Platform Health
- Message delivery success rate
- Video call quality metrics
- Page load times
- Error rates

### Business Metrics
- Tutor sign-ups
- Learner enrollments
- Paid session bookings
- User retention rates

---

## TESTING REQUIREMENTS

### Unit Tests
- Database operations
- Server actions
- Utility functions
- Component rendering

### Integration Tests
- User flows (enrollment, assignment submission)
- Real-time features
- File uploads
- Authentication

### E2E Tests
- Critical user journeys
- Cross-browser testing
- Mobile testing

---

## DEPLOYMENT CHECKLIST

- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] Realtime enabled for new tables
- [ ] Storage buckets configured
- [ ] Environment variables set
- [ ] WebRTC server deployed
- [ ] Calendar API credentials configured
- [ ] Monitoring and logging set up
- [ ] CDN configured for static assets
- [ ] SSL certificates valid

---

## NOTES & CONSIDERATIONS

1. **Scalability:** Design for horizontal scaling as user base grows
2. **Security:** Implement proper RLS policies, input validation, rate limiting
3. **Performance:** Optimize database queries, implement caching, use CDN
4. **Accessibility:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support
5. **Internationalization:** Support multiple languages if needed
6. **Mobile-First:** Ensure all features work well on mobile devices
7. **Offline Support:** Consider PWA features for offline access to materials

---

## NEXT STEPS

1. Review and approve this roadmap
2. Set up database schema for new tables
3. Begin Phase 1 implementation
4. Regular progress reviews
5. User testing at each phase
