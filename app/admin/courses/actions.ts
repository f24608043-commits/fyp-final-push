"use server";

import { db } from "@/db";
import { courses, units, lessons, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: Verify current user is admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    throw new Error("You must be an admin to perform this action");
  }

  return user.id;
}

export async function createCourse(data: {
  name: string;
  description: string;
}) {
  try {
    await verifyAdmin();

    const [course] = await db
      .insert(courses)
      .values({
        title: data.name,
        description: data.description,
      })
      .returning();

    revalidatePath("/admin/courses");
    return course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function createUnit(data: {
  courseId: string;
  name: string;
  description: string;
  order: number;
}) {
  await verifyAdmin();

  const [unit] = await db
    .insert(units)
    .values({
      courseId: data.courseId,
      title: data.name,
      description: data.description,
      orderIndex: data.order,
    })
    .returning();

  revalidatePath("/admin/courses");
  return unit;
}

export async function createLesson(data: {
  unitId: string;
  title: string;
  description: string;
  videoUrl: string;
  xpReward: number;
  order: number;
}) {
  await verifyAdmin();

  const [lesson] = await db
    .insert(lessons)
    .values({
      unitId: data.unitId,
      title: data.title,
      description: data.description,
      youtubeVideoId: data.videoUrl,
      xpReward: data.xpReward,
      orderIndex: data.order,
    })
    .returning();

  revalidatePath("/admin/courses");
  return lesson;
}

export async function getAllCourses() {
  try {
    await verifyAdmin();
    const allCourses = await db.select().from(courses).orderBy(courses.title).limit(50);
    return allCourses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseUnits(courseId: string) {
  try {
    await verifyAdmin();
    return await db
      .select()
      .from(units)
      .where(eq(units.courseId, courseId))
      .orderBy(units.orderIndex);
  } catch (error) {
    console.error('Error fetching course units:', error);
    return [];
  }
}

export async function getUnitLessons(unitId: string) {
  try {
    await verifyAdmin();
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.unitId, unitId))
      .orderBy(lessons.orderIndex);
  } catch (error) {
    console.error('Error fetching unit lessons:', error);
    return [];
  }
}
