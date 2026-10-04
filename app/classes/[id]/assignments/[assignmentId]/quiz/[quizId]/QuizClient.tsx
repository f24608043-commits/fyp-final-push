"use client";

import { useState } from "react";
import { submitQuiz } from "./actions";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  points: number;
  orderIndex: number | null;
  options: Array<{
    id: string;
    optionText: string;
    orderIndex: number | null;
  }>;
}

interface Quiz {
  timeLimit: number | null;
  allowRetakes: boolean;
  maxAttempts: number;
  randomizeQuestions: boolean;
  showResultsAfter: boolean;
}

interface QuizClientProps {
  quizId: string;
  assignmentId: string;
  groupId: string;
  questions: Question[];
  quiz: Quiz;
  attemptsRemaining: number;
}

export default function QuizClient({
  quizId,
  assignmentId,
  groupId,
  questions,
  quiz,
  attemptsRemaining,
}: QuizClientProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    quiz.timeLimit ? quiz.timeLimit * 60 : 0
  );

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("quizId", quizId);
      formData.append("groupId", groupId);
      
      Object.entries(answers).forEach(([questionId, optionId]) => {
        formData.append(`answer_${questionId}`, optionId);
      });

      Object.entries(textAnswers).forEach(([questionId, text]) => {
        formData.append(`text_${questionId}`, text);
      });

      await submitQuiz(formData);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Quiz Progress */}
      <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="font-label-md font-semibold text-text-primary">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {quiz.timeLimit && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}</span>
              </div>
            )}
          </div>
          <span className="font-label-sm font-semibold text-text-muted">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-surface-border rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-2">
              {question.questionText}
            </h2>
            <p className="font-label-sm font-semibold text-primary">
              {question.points} point{question.points !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-surface-border font-label-sm font-semibold text-text-muted capitalize">
            {question.questionType.replace(/_/g, " ")}
          </span>
        </div>

        {/* Multiple Choice / True False */}
        {(question.questionType === "multiple_choice" || question.questionType === "true_false") && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(question.id, option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[question.id] === option.id
                    ? "border-primary bg-primary/5"
                    : "border-surface-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[question.id] === option.id
                      ? "border-primary bg-primary"
                      : "border-surface-border"
                  }`}>
                    {answers[question.id] === option.id && (
                      <span className="material-symbols-outlined text-text-primary text-[16px]">check</span>
                    )}
                  </div>
                  <span className="font-body-md text-text-primary">{option.optionText}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Short Answer / Essay */}
        {(question.questionType === "short_answer" || question.questionType === "essay") && (
          <textarea
            value={textAnswers[question.id] || ""}
            onChange={(e) => handleTextAnswer(question.id, e.target.value)}
            rows={question.questionType === "essay" ? 8 : 4}
            className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            placeholder="Type your answer here..."
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-primary px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Previous
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                Submitting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check</span>
                Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            Next
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Question Navigation */}
      <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
        <h3 className="font-label-md font-semibold text-text-primary mb-4">Question Navigator</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-10 h-10 rounded-full font-label-md font-semibold transition-all ${
                currentQuestion === idx
                  ? "bg-primary text-text-primary shadow-clay-primary"
                  : answers[q.id] || textAnswers[q.id]
                  ? "bg-primary/10 text-success border-2 border-primary/30"
                  : "bg-surface-border text-text-muted border-2 border-surface-border hover:border-primary/50"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
