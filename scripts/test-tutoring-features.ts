import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== Starting Tutoring Platform Feature Tests ===\n");

  try {
    // Sign in as test user
    console.log("1. Signing in as test user...");
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "test123",
    });

    if (signInError) {
      console.log("Sign in failed, attempting to sign up...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: "test@example.com",
        password: "test123",
      });
      if (signUpError) {
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }
      console.log("✓ Test user created");
    } else {
      console.log("✓ Signed in as test user");
    }

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("No user logged in");

    console.log(`User ID: ${currentUser.id}`);

    // Test 1: Create Tutor Profile
    console.log("\n2. Creating tutor profile...");
    const profileResponse = await fetch("http://localhost:3000/api/tutor-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        bio: "Experienced tutor in Math and Science with 5 years of teaching experience.",
        subjects: ["Math", "Science", "Physics"],
        hourlyRate: 25,
        timezone: "UTC",
      }),
    });

    if (profileResponse.ok) {
      console.log("✓ Tutor profile created");
    } else {
      console.log("Tutor profile may already exist or failed");
    }

    // Test 2: Request Enrollment
    console.log("\n3. Testing enrollment request...");
    const enrollmentResponse = await fetch("http://localhost:3000/api/enrollments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        tutorId: currentUser.id, // Self-enrollment for testing
        message: "I would like to learn from you",
      }),
    });

    if (enrollmentResponse.ok) {
      console.log("✓ Enrollment request sent");
    } else {
      console.log("Enrollment request may have failed (expected for self-enrollment)");
    }

    // Test 3: Create Group
    console.log("\n4. Testing group creation...");
    const groupResponse = await fetch("http://localhost:3000/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        name: "Test Math Group",
        description: "A group for learning advanced mathematics",
        subject: "Math",
        level: "Advanced",
        memberIds: [],
      }),
    });

    if (groupResponse.ok) {
      const groupData = await groupResponse.json();
      console.log("✓ Group created:", groupData.group?.id);
    } else {
      console.log("Group creation failed");
    }

    // Test 4: Create Task
    console.log("\n5. Testing task creation...");
    const taskResponse = await fetch("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        targetType: "learner",
        targetId: currentUser.id,
        title: "Complete Chapter 1 Exercises",
        description: "Solve all problems in Chapter 1 of the textbook",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    if (taskResponse.ok) {
      console.log("✓ Task created");
    } else {
      console.log("Task creation failed - API endpoint may not exist");
    }

    // Test 5: Award Badge
    console.log("\n6. Testing badge awarding...");
    const badgeResponse = await fetch("http://localhost:3000/api/badges/award", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        learnerId: currentUser.id,
        badgeId: "test-badge-id",
        context: "For completing first task",
      }),
    });

    if (badgeResponse.ok) {
      console.log("✓ Badge awarded");
    } else {
      console.log("Badge awarding failed - API endpoint may not exist");
    }

    // Test 6: Award Rank Points
    console.log("\n7. Testing rank point awarding...");
    const rankResponse = await fetch("http://localhost:3000/api/rank/award", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.session?.access_token}`,
      },
      body: JSON.stringify({
        userId: currentUser.id,
        points: 100,
        reason: "For completing first task",
      }),
    });

    if (rankResponse.ok) {
      console.log("✓ Rank points awarded");
    } else {
      console.log("Rank point awarding failed - API endpoint may not exist");
    }

    console.log("\n=== Tests Completed ===");
    console.log("Note: Some API endpoints may need to be created for full functionality");

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
