-- RLS Policies for Groups and Related Tables

-- Enable RLS on all new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Groups Policies
DROP POLICY IF EXISTS "Tutors can view own groups" ON public.groups;
CREATE POLICY "Tutors can view own groups"
ON public.groups
FOR SELECT
TO authenticated
USING (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can insert own groups" ON public.groups;
CREATE POLICY "Tutors can insert own groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can update own groups" ON public.groups;
CREATE POLICY "Tutors can update own groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (auth.uid() = tutor_id)
WITH CHECK (auth.uid() = tutor_id);

DROP POLICY IF EXISTS "Tutors can delete own groups" ON public.groups;
CREATE POLICY "Tutors can delete own groups"
ON public.groups
FOR DELETE
TO authenticated
USING (auth.uid() = tutor_id);

-- Group Members Policies
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can manage group members" ON public.group_members;
CREATE POLICY "Tutors can manage group members"
ON public.group_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.tutor_id = auth.uid()
  )
);

-- Assignments Policies
DROP POLICY IF EXISTS "Group members can view assignments" ON public.assignments;
CREATE POLICY "Group members can view assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = assignments.group_id
    AND group_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can manage assignments" ON public.assignments;
CREATE POLICY "Tutors can manage assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = assignments.group_id
    AND groups.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = assignments.group_id
    AND groups.tutor_id = auth.uid()
  )
);

-- Assignment Attachments Policies
DROP POLICY IF EXISTS "Group members can view assignment attachments" ON public.assignment_attachments;
CREATE POLICY "Group members can view assignment attachments"
ON public.assignment_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = assignment_attachments.assignment_id
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = assignments.group_id
      AND group_members.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Tutors can manage assignment attachments" ON public.assignment_attachments;
CREATE POLICY "Tutors can manage assignment attachments"
ON public.assignment_attachments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = assignment_attachments.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = assignment_attachments.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
);

-- Submissions Policies
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
CREATE POLICY "Students can view own submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.submissions;
CREATE POLICY "Students can insert own submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Tutors can view group submissions" ON public.submissions;
CREATE POLICY "Tutors can view group submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = submissions.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can grade submissions" ON public.submissions;
CREATE POLICY "Tutors can grade submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = submissions.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = submissions.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
);

-- Submission Attachments Policies
DROP POLICY IF EXISTS "Students can manage own submission attachments" ON public.submission_attachments;
CREATE POLICY "Students can manage own submission attachments"
ON public.submission_attachments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions
    WHERE submissions.id = submission_attachments.submission_id
    AND submissions.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM submissions
    WHERE submissions.id = submission_attachments.submission_id
    AND submissions.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can view submission attachments" ON public.submission_attachments;
CREATE POLICY "Tutors can view submission attachments"
ON public.submission_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions
    WHERE submissions.id = submission_attachments.submission_id
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.tutor_id = auth.uid()
    )
  )
);

-- Quizzes Policies
DROP POLICY IF EXISTS "Group members can view quizzes" ON public.quizzes;
CREATE POLICY "Group members can view quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = quizzes.assignment_id
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = assignments.group_id
      AND group_members.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Tutors can manage quizzes" ON public.quizzes;
CREATE POLICY "Tutors can manage quizzes"
ON public.quizzes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = quizzes.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = quizzes.assignment_id
    AND assignments.tutor_id = auth.uid()
  )
);

-- Quiz Questions Policies
DROP POLICY IF EXISTS "Group members can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Group members can view quiz questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = quizzes.assignment_id
      AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = assignments.group_id
        AND group_members.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Tutors can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Tutors can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = quizzes.assignment_id
      AND assignments.tutor_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = quizzes.assignment_id
      AND assignments.tutor_id = auth.uid()
    )
  )
);

-- Quiz Options Policies
DROP POLICY IF EXISTS "Group members can view quiz options" ON public.quiz_options;
CREATE POLICY "Group members can view quiz options"
ON public.quiz_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
    AND EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND EXISTS (
        SELECT 1 FROM assignments
        WHERE assignments.id = quizzes.assignment_id
        AND EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = assignments.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Tutors can manage quiz options" ON public.quiz_options;
CREATE POLICY "Tutors can manage quiz options"
ON public.quiz_options
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
    AND EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND EXISTS (
        SELECT 1 FROM assignments
        WHERE assignments.id = quizzes.assignment_id
        AND assignments.tutor_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_questions
    WHERE quiz_questions.id = quiz_options.question_id
    AND EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND EXISTS (
        SELECT 1 FROM assignments
        WHERE assignments.id = quizzes.assignment_id
        AND assignments.tutor_id = auth.uid()
      )
    )
  )
);

-- Quiz Attempts Policies
DROP POLICY IF EXISTS "Students can view own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can view own quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can insert own quiz attempts"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Tutors can view group quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Tutors can view group quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_attempts.quiz_id
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = quizzes.assignment_id
      AND assignments.tutor_id = auth.uid()
    )
  )
);

-- Quiz Answers Policies
DROP POLICY IF EXISTS "Students can view own quiz answers" ON public.quiz_answers;
CREATE POLICY "Students can view own quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.attempt_id
    AND quiz_attempts.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can insert own quiz answers" ON public.quiz_answers;
CREATE POLICY "Students can insert own quiz answers"
ON public.quiz_answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.attempt_id
    AND quiz_attempts.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can view quiz answers" ON public.quiz_answers;
CREATE POLICY "Tutors can view quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.attempt_id
    AND EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND EXISTS (
        SELECT 1 FROM assignments
        WHERE assignments.id = quizzes.assignment_id
        AND assignments.tutor_id = auth.uid()
      )
    )
  )
);

-- Group Announcements Policies
DROP POLICY IF EXISTS "Group members can view announcements" ON public.group_announcements;
CREATE POLICY "Group members can view announcements"
ON public.group_announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_announcements.group_id
    AND group_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can manage announcements" ON public.group_announcements;
CREATE POLICY "Tutors can manage announcements"
ON public.group_announcements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_announcements.group_id
    AND groups.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_announcements.group_id
    AND groups.tutor_id = auth.uid()
  )
);

-- Group Comments Policies
DROP POLICY IF EXISTS "Group members can view comments" ON public.group_comments;
CREATE POLICY "Group members can view comments"
ON public.group_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_comments.group_id
    AND group_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group members can insert comments" ON public.group_comments;
CREATE POLICY "Group members can insert comments"
ON public.group_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_comments.group_id
    AND group_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own comments" ON public.group_comments;
CREATE POLICY "Users can update own comments"
ON public.group_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tutor Reviews Policies
DROP POLICY IF EXISTS "Anyone can view tutor reviews" ON public.tutor_reviews;
CREATE POLICY "Anyone can view tutor reviews"
ON public.tutor_reviews
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Students can insert reviews" ON public.tutor_reviews;
CREATE POLICY "Students can insert reviews"
ON public.tutor_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own reviews" ON public.tutor_reviews;
CREATE POLICY "Students can update own reviews"
ON public.tutor_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Enrollment Requests Policies
DROP POLICY IF EXISTS "Students can view own requests" ON public.enrollment_requests;
CREATE POLICY "Students can view own requests"
ON public.enrollment_requests
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert requests" ON public.enrollment_requests;
CREATE POLICY "Students can insert requests"
ON public.enrollment_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Tutors can view group requests" ON public.enrollment_requests;
CREATE POLICY "Tutors can view group requests"
ON public.enrollment_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = enrollment_requests.group_id
    AND groups.tutor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tutors can manage requests" ON public.enrollment_requests;
CREATE POLICY "Tutors can manage requests"
ON public.enrollment_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = enrollment_requests.group_id
    AND groups.tutor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = enrollment_requests.group_id
    AND groups.tutor_id = auth.uid()
  )
);
