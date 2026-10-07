// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import OpenAI from "openai";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function generateQuizzesForCourses() {
  console.log("🎯 Generating AI quiz questions for production courses...");

  // Get all lessons from the new courses
  const courses = await sql`
    SELECT id, title FROM public.courses 
    WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security')
    ORDER BY title;
  `;

  console.log(`Found ${courses.length} courses`);

  for (const course of courses) {
    console.log(`\n📚 Processing course: ${course.title}`);

    // Get all lessons for this course
    const lessons = await sql`
      SELECT l.id, l.title, l.description, u.title as unit_title
      FROM public.lessons l
      JOIN public.units u ON l.unit_id = u.id
      WHERE u.course_id = ${course.id}
      ORDER BY u.order_index, l.order_index;
    `;

    console.log(`  Found ${lessons.length} lessons`);

    for (const lesson of lessons) {
      console.log(`    📝 Generating quiz for: ${lesson.title}`);

      try {
        const questions = await generateQuizQuestionsDirect(lesson.title, lesson.description || "", 3);
        console.log(`      ✅ Generated ${questions.length} questions`);

        // Insert the generated quiz questions into the challenges table
        for (const question of questions) {
          const [challenge] = await sql`
            INSERT INTO public.challenges (lesson_id, question_text, points, is_published)
            VALUES (${lesson.id}, ${question.questionText}, ${question.points}, true)
            RETURNING id;
          `;

          // Insert options
          for (const option of question.options) {
            await sql`
              INSERT INTO public.challenge_options (challenge_id, option_text, is_correct)
              VALUES (${challenge.id}, ${option.optionText}, ${option.isCorrect});
            `;
          }
        }

        console.log(`      ✅ Saved quiz to database`);
      } catch (error) {
        console.error(`      ❌ Failed to generate quiz for lesson ${lesson.id}:`, error);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await sql.end();
  console.log("\n🎉 QUIZ GENERATION COMPLETE!");
  process.exit(0);
}

async function generateQuizQuestionsDirect(lessonTitle: string, lessonDescription: string, count: number = 3) {
  const prompt = `You are an expert curriculum and educational quiz designer for a gamified micro-learning platform.
Topic: "${lessonTitle}"
Lesson Description: "${lessonDescription}"

Generate ${count} high-quality, conceptual multiple-choice quiz questions based strictly on this topic.
Requirements:
1. Return ONLY a valid JSON array of question objects (no markdown, no code fences, no extra text).
2. Each question object must have:
   - "questionText": Clear, concise question statement
   - "points": Integer point value (default 1)
   - "options": Array of exactly 4 options. Each option must have:
     - "optionText": string
     - "isCorrect": boolean (EXACTLY ONE option must have isCorrect: true)
3. Do not assume or reference video timestamps.`;

  // Try OpenRouter first, then OpenAI, then fallback
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "sk-or-v1-mock-fallback-key") {
    try {
      const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output only valid JSON arrays of quiz questions." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      const candidateArray = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || Object.values(parsed)[0];
      
      return candidateArray.slice(0, count);
    } catch (err) {
      console.warn("OpenRouter failed, trying OpenAI:", err);
    }
  }

  // Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You output only valid JSON arrays of quiz questions." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      const candidateArray = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || Object.values(parsed)[0];
      
      return candidateArray.slice(0, count);
    } catch (err) {
      console.warn("OpenAI failed, using fallback:", err);
    }
  }

  // Generic fallback
  return [
    {
      questionText: `What is the primary topic covered in "${lessonTitle}"?`,
      points: 1,
      options: [
        { optionText: `Understanding key concepts of ${lessonTitle}`, isCorrect: true },
        { optionText: "Writing unrelated low-level code", isCorrect: false },
        { optionText: "Configuring hardware servers", isCorrect: false },
        { optionText: "Deploying operating system kernels", isCorrect: false },
      ],
    },
    {
      questionText: `Which of the following best describes the goal of "${lessonTitle}"?`,
      points: 1,
      options: [
        { optionText: "To build practical understanding through examples", isCorrect: true },
        { optionText: "To bypass learning and skip ahead", isCorrect: false },
        { optionText: "To memorize arbitrary information", isCorrect: false },
        { optionText: "To delete existing files", isCorrect: false },
      ],
    },
    {
      questionText: `How should a learner apply the lessons from "${lessonTitle}"?`,
      points: 1,
      options: [
        { optionText: "By practicing and applying concepts interactively", isCorrect: true },
        { optionText: "By avoiding all testing", isCorrect: false },
        { optionText: "By guessing blindly", isCorrect: false },
        { optionText: "By ignoring feedback", isCorrect: false },
      ],
    },
  ].slice(0, count);
}

generateQuizzesForCourses().catch(async (e) => {
  console.error("Quiz generation error:", e);
  await sql.end();
  process.exit(1);
});
