# Learner-Tutor Enrollment and Group Teaching Features Documentation

## Overview

This document describes the learner-tutor enrollment flow and group teaching features implemented in the tutoring platform. These features enable learners to formally enroll with tutors, allow tutors to accept/reject enrollment requests, and provide tools for tutors to organize enrolled learners into groups for group sessions.

---

## 1. Enrollment Flow

### 1.1 Database Schema

#### `tutor_enrollments` Table
- **Purpose**: Tracks learner-tutor enrollment relationships
- **Fields**:
  - `id`: UUID primary key
  - `tutorId`: UUID (references profiles.id)
  - `learnerId`: UUID (references profiles.id)
  - `status`: Enum (`pending`, `accepted`, `rejected`, `removed`)
  - `message`: Optional text message from learner
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp
- **Constraints**: Unique constraint on (tutorId, learnerId)

### 1.2 Enrollment Status Flow

```
Learner clicks "Enroll"
    ↓
Status: pending
    ↓
Tutor sees request in dashboard
    ↓
Tutor accepts → Status: accepted (learner is enrolled)
Tutor rejects → Status: rejected (learner can re-request)
Learner cancels → Status: rejected
```

### 1.3 API Endpoints

#### GET `/api/enrollments?role=learner`
- **Purpose**: Get learner's enrollments
- **Auth**: Required (learner only)
- **Response**:
  ```json
  {
    "pending": [...],
    "enrolled": [...],
    "rejected": [...]
  }
  ```

#### GET `/api/enrollments?role=tutor`
- **Purpose**: Get tutor's enrollments
- **Auth**: Required (tutor only)
- **Response**:
  ```json
  {
    "requests": [...],  // pending enrollments
    "enrolled": [...],  // accepted enrollments
    "rejected": [...]
  }
  ```

#### POST `/api/enrollments`
- **Purpose**: Create enrollment request
- **Auth**: Required (learner only)
- **Body**: `{ tutorId: string, message?: string }`
- **Response**: `{ success: true, enrollment: {...} }`

#### POST `/api/enrollments/:id/accept`
- **Purpose**: Accept enrollment request
- **Auth**: Required (tutor only)
- **Response**: `{ success: true, enrollment: {...} }`

#### POST `/api/enrollments/:id/decline`
- **Purpose**: Decline enrollment request
- **Auth**: Required (tutor only)
- **Response**: `{ success: true, enrollment: {...} }`

#### POST `/api/enrollments/:id/cancel`
- **Purpose**: Cancel pending request
- **Auth**: Required (learner only)
- **Response**: `{ success: true, enrollment: {...} }`

### 1.4 Frontend Components

#### `EnrollButton` Component
- **Location**: `app/tutoring/EnrollButton.tsx`
- **States**:
  - `Enroll` - No enrollment exists
  - `Request Sent` - Pending status
  - `Enrolled` - Accepted status (badge only)
  - `Rejected` - Rejected status with "Request Again" option
- **Features**:
  - Loading states during API calls
  - Error handling with inline messages
  - Cancel option for pending requests

#### `EnrollmentStatusBadge` Component
- **Location**: `components/EnrollmentStatusBadge.tsx`
- **Purpose**: Display enrollment status with color-coded badges
- **Styles**:
  - Pending: Yellow
  - Accepted: Green
  - Rejected: Red
  - Removed: Gray

### 1.5 Pages

#### Learner Pages
- **`/tutoring`** - Tutor listing with Enroll buttons
  - Shows enrollment status for each tutor
  - Message button functionality
  - Link to My Enrollments page

- **`/tutoring/my-enrollments`** - Learner's enrollment status
  - Active Enrollments section
  - Pending Requests section
  - Rejected Requests section
  - Actions: Message, Cancel Request

#### Tutor Pages
- **`/tutoring/dashboard`** - Tutor dashboard
  - Pending Enrollment Requests section with Accept/Reject buttons
  - My Learners section (accepted enrollments)
  - Link to Groups page

---

## 2. Group Teaching Features

### 2.1 Database Schema

#### `tutor_groups` Table
- **Purpose**: Groups created by tutors
- **Fields**:
  - `id`: UUID primary key
  - `tutorId`: UUID (references profiles.id)
  - `name`: Text (required)
  - `description`: Optional text
  - `isActive`: Boolean (default: true)
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

#### `tutor_group_members` Table
- **Purpose**: Learners in groups
- **Fields**:
  - `id`: UUID primary key
  - `groupId`: UUID (references tutor_groups.id)
  - `learnerId`: UUID (references profiles.id)
  - `enrolledAt`: Timestamp
- **Constraints**: Unique constraint on (groupId, learnerId)

#### `tutor_group_sessions` Table
- **Purpose**: Group sessions
- **Fields**:
  - `id`: UUID primary key
  - `groupId`: UUID (references tutor_groups.id)
  - `meetingUrl`: Text (required)
  - `startTime`: Timestamp (required)
  - `endTime`: Optional timestamp
  - `status`: Enum (`scheduled`, `ongoing`, `completed`, `cancelled`)
  - `jitsiRoomId`: Text (for Jitsi Meet integration)
  - `notes`: Optional text
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

### 2.2 API Endpoints

#### GET `/api/groups`
- **Purpose**: Get tutor's groups with member counts
- **Auth**: Required (tutor only)
- **Response**: `{ groups: [{ id, name, description, memberCount, ... }] }`

#### POST `/api/groups`
- **Purpose**: Create new group
- **Auth**: Required (tutor only)
- **Body**: `{ name: string, description?: string, learnerIds: string[] }`
- **Validation**: All learnerIds must be enrolled with the tutor (status: accepted)
- **Response**: `{ success: true, group: {...} }`

#### PUT `/api/groups/:id`
- **Purpose**: Update group
- **Auth**: Required (tutor only)
- **Body**: `{ name?: string, description?: string, learnerIds?: string[] }`
- **Response**: `{ success: true, group: {...} }`

#### DELETE `/api/groups/:id`
- **Purpose**: Delete group
- **Auth**: Required (tutor only)
- **Cascade**: Deletes members and sessions
- **Response**: `{ success: true }`

#### GET `/api/groups/:id/sessions`
- **Purpose**: Get group sessions
- **Auth**: Required (tutor only)
- **Response**: `{ sessions: [...] }`

#### POST `/api/groups/:id/sessions`
- **Purpose**: Create group session
- **Auth**: Required (tutor only)
- **Body**: `{ startTime: string, endTime?: string, notes?: string }`
- **Response**: `{ success: true, session: {...} }`
- **Video Integration**: Automatically generates Jitsi Meet room ID and meeting URL

### 2.3 Frontend Pages

#### `/tutoring/groups` - Groups List
- Shows all groups created by the tutor
- Displays member count for each group
- "Create Group" button
- Lists enrolled learners available for group creation
- Actions: Manage group

#### `/tutoring/groups/create` - Create Group
- Form to create new group
- Group name (required)
- Description (optional)
- Multi-select for enrolled learners
- Validation: Only enrolled learners can be added

#### `/tutoring/groups/[groupId]` - Group Detail
- Group information (name, description)
- Members list with avatars
- Add members form (shows available enrolled learners)
- Sessions list
- Create session form:
  - Start time (required)
  - End time (optional)
  - Notes (optional)
- Delete group button
- Start session button (for scheduled sessions)

### 2.4 Video Integration

**Jitsi Meet Integration**:
- Automatically generates unique room ID for each session
- Meeting URL format: `https://meet.jit.si/{jitsiRoomId}`
- Room ID format: `group-{groupId}-{timestamp}`
- No additional setup required (uses free Jitsi Meet service)

**Session Status Flow**:
```
Create session → Status: scheduled
Start session → Status: ongoing
End session → Status: completed
Cancel session → Status: cancelled
```

---

## 3. Shared Components

### `UserAvatar` Component
- **Location**: `components/UserAvatar.tsx`
- **Purpose**: Display user avatar with fallback initials
- **Props**:
  - `avatarUrl?: string | null`
  - `displayName?: string | null`
  - `size?: "sm" | "md" | "lg"`
  - `className?: string`
- **Features**:
  - Gradient background for initials
  - Responsive sizing
  - Border styling

---

## 4. Integration Rules

### Learner ↔ Tutor Symmetry
- Any enrollment created by a learner immediately appears as a request on the tutor's dashboard
- Any action by the tutor (accept/decline) updates the learner's enrollment status
- Groups can only include learners whose enrollment status with that tutor is `accepted`
- If an enrollment is cancelled/rejected, the learner is not automatically removed from groups (manual review required)

### Authorization
- Learners can only:
  - View their own enrollments
  - Send enrollment requests
  - Cancel their own pending requests
  - Message tutors (regardless of enrollment status)
- Tutors can only:
  - View enrollments sent to them
  - Accept/decline requests sent to them
  - Create/manage their own groups
  - Add only enrolled learners to groups

---

## 5. Future Extensions

### Potential Enhancements
1. **Group Chat**: Add messaging within groups
2. **Session Recordings**: Record and store group sessions
3. **Payment Integration**: Charge for group sessions
4. **Calendar Integration**: Sync sessions with external calendars
5. **Attendance Tracking**: Track learner attendance in group sessions
6. **Session Notes**: Collaborative notes during sessions
7. **File Sharing**: Share materials within groups
8. **Automated Reminders**: Email/in-app notifications before sessions

### Data Model Extensions
- Add `group_chat_messages` table for group messaging
- Add `session_recordings` table for video recordings
- Add `attendance` table for tracking session participation
- Add `group_materials` table for shared files

---

## 6. Testing Checklist

### Enrollment Flow
- [ ] Learner can send enrollment request
- [ ] Tutor receives notification of request
- [ ] Tutor can accept request
- [ ] Learner sees status change to "Enrolled"
- [ ] Tutor can reject request
- [ ] Learner can re-request after rejection
- [ ] Learner can cancel pending request
- [ ] Message button works for enrolled and non-enrolled tutors

### Group Features
- [ ] Tutor can create group
- [ ] Only enrolled learners can be added to group
- [ ] Tutor can add/remove members
- [ ] Tutor can update group details
- [ ] Tutor can delete group
- [ ] Tutor can create group session
- [ ] Session generates valid Jitsi Meet URL
- [ ] Session status updates correctly

### UI/UX
- [ ] Loading states on all buttons
- [ ] Error messages display correctly
- [ ] Responsive design on mobile
- [ ] Accessible navigation
- [ ] Consistent styling across pages

---

## 7. Migration Notes

### Database Migration
- Migration file: `drizzle/0003_remarkable_spyke.sql`
- New tables added:
  - `tutor_groups`
  - `tutor_group_members`
  - `tutor_group_sessions`
- New enums added:
  - `group_session_status`

### Deployment Checklist
- [ ] Run database migration
- [ ] Update environment variables (if needed)
- [ ] Test enrollment flow in staging
- [ ] Test group creation in staging
- [ ] Test video integration
- [ ] Monitor for errors in production

---

## 8. Support & Troubleshooting

### Common Issues

**Issue**: Enrollment request not appearing on tutor dashboard
- **Solution**: Check that tutor has profile created and is active

**Issue**: Cannot add learner to group
- **Solution**: Verify learner's enrollment status is "accepted"

**Issue**: Jitsi Meet not loading
- **Solution**: Check network connectivity and ensure Jitsi Meet service is accessible

**Issue**: Session time not displaying correctly
- **Solution**: Verify timezone settings and ensure timestamps are stored in UTC

---

## Summary

The learner-tutor enrollment and group teaching features provide a complete solution for:
1. Formal learner-tutor relationships with enrollment requests
2. Tutor management of enrollment requests
3. Organization of enrolled learners into groups
4. Group session scheduling with video conferencing integration
5. Full learner-tutor symmetry with real-time status updates

All features include proper authorization, error handling, loading states, and follow the platform's design patterns.
