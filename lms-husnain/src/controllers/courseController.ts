import { Request, Response } from "express";
import { eq, and, inArray, notInArray, sql, ne } from "drizzle-orm";
import { db } from "../config/database";
import {
  coursesTable,
  courseSchedulesTable,
  enrollmentsTable,
  usersTable,
  attendanceTable,
} from "../db/schema";
import { CourseWithDetails, CourseFilterQuery } from "../types/course";

// ✅ HELPER 1: Convert Time Strings ("14:30") to Minutes
const getMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// ✅ HELPER 2: Check for Time Overlap
const isOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
) => {
  return Math.max(startA, startB) < Math.min(endA, endB);
};

// ✅ HELPER 3: Generate Jitsi Meet Link
const generateAutoLink = () => {
  const uniqueCode = Math.random().toString(36).substring(7);
  return `https://meet.jit.si/LMS-Class-${uniqueCode}`;
};

export class CourseController {
  // ==========================================
  // 1. UPDATE COURSE (✅ FIXED: WIPE & REPLACE STRATEGY)
  // ==========================================
  static async updateCourse(req: Request, res: Response) {
    try {
      const id = req.params.id || req.params.courseId;
      if (!id) return res.status(400).json({ error: "Missing Course ID" });

      const {
        title,
        name,
        description,
        category,
        categories,
        level,
        price,
        thumbnail,
        schedules,
        totalSessions,
        courseCurriculum,
      } = req.body;

      // 1. Update Course Details
      await db
        .update(coursesTable)
        .set({
          name: name || title,
          description,
          categories: categories || (category ? [category] : []),
          level,
          price: price ? parseFloat(price.toString()) : 0,
          thumbnail,
          totalSessions,
          courseCurriculum,
          updatedAt: new Date(),
        })
        .where(eq(coursesTable.id, id));

      // 2. Handle Schedules (Wipe & Replace)
      if (schedules) {
        // A. Delete Old
        await db
          .delete(courseSchedulesTable)
          .where(eq(courseSchedulesTable.courseId, id));

        // B. Insert New
        if (Array.isArray(schedules) && schedules.length > 0) {
          const newSchedules = schedules.map((s: any) => ({
            courseId: id,
            dayOfWeek: Number(s.dayOfWeek),
            startTime: s.startTime,
            endTime: s.endTime,
            topic: s.topic || "Regular Class",
            meetLink: `https://meet.jit.si/LMS-${id}`,
          }));

          await db.insert(courseSchedulesTable).values(newSchedules);
        }
      }

      // ✅ CRITICAL FIX: Fetch the FULL course (with schedules) before returning
      const finalCourseData = await CourseController.getCourseWithDetails(id);

      res.json({
        success: true,
        message: "Course updated successfully!",
        course: finalCourseData, // 👈 This now includes the schedules!
      });
    } catch (error: any) {
      console.error("Update Course Error:", error);
      res.status(500).json({
        error: "Failed to update course",
        details: error.message,
      });
    }
  }

  // ==========================================
  // 2. CREATE COURSE
  // ==========================================
  static async createCourse(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const {
        name,
        description,
        categories,
        courseCurriculum,
        totalSessions,
        schedules,
      } = req.body;

      const hasConflict = await CourseController.checkScheduleConflicts(
        teacherId,
        schedules
      );
      if (hasConflict.conflict) {
        return res.status(409).json({
          error: "Schedule conflict detected",
          details: hasConflict.message,
        });
      }

      const [newCourse] = await db
        .insert(coursesTable)
        .values({
          name,
          description,
          categories,
          courseCurriculum,
          totalSessions,
          offeredByTeacherId: teacherId,
        })
        .returning();

      // Auto-generate unique links
      if (schedules && schedules.length > 0) {
        const scheduleData = schedules.map((schedule: any) => ({
          courseId: newCourse.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          meetLink: generateAutoLink(),
        }));
        await db.insert(courseSchedulesTable).values(scheduleData);
      }

      const courseWithDetails = await CourseController.getCourseWithDetails(
        newCourse.id
      );

      res.status(201).json({
        message: "Course created successfully",
        course: courseWithDetails,
      });
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ==========================================
  // 3. ADD SINGLE SCHEDULE
  // ==========================================
  static async addScheduleToCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const teacherId = req.user!.userId;
      const { dayOfWeek, startTime, endTime, topic } = req.body;

      const [existingCourse] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, courseId),
            eq(coursesTable.offeredByTeacherId, teacherId)
          )
        );

      if (!existingCourse) {
        return res
          .status(404)
          .json({ error: "Course not found or unauthorized" });
      }

      const hasConflict =
        await CourseController.checkScheduleConflictsForAddition(teacherId, {
          dayOfWeek,
          startTime,
          endTime,
        });

      if (hasConflict.conflict) {
        return res.status(409).json({
          error: "Schedule conflict detected",
          details: hasConflict.message,
        });
      }

      const meetLink = generateAutoLink();

      const [newSchedule] = await db
        .insert(courseSchedulesTable)
        .values({
          courseId,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          topic: topic || "Weekly Class",
          meetLink: meetLink,
        })
        .returning();

      res.status(201).json({
        message: "Weekly schedule added successfully",
        schedule: {
          id: newSchedule.id,
          dayOfWeek: newSchedule.dayOfWeek,
          startTime: newSchedule.startTime,
          endTime: newSchedule.endTime,
          topic: newSchedule.topic,
          meetLink: newSchedule.meetLink,
        },
      });
    } catch (error) {
      console.error("Add schedule error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ==========================================
  // 4. GET TODAY'S CLASSES
  // ==========================================
  static async getTodayClasses(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const today = new Date();
      const currentDayIndex = today.getDay();

      const targetDays = [currentDayIndex];
      if (currentDayIndex === 0) {
        targetDays.push(7);
      }

      const todaysClasses = await db
        .select({
          courseId: courseSchedulesTable.courseId,
          scheduleId: courseSchedulesTable.id,
          courseName: coursesTable.name,
          teacherName: usersTable.firstName,
          startTime: courseSchedulesTable.startTime,
          endTime: courseSchedulesTable.endTime,
          meetLink: courseSchedulesTable.meetLink,
          dayOfWeek: courseSchedulesTable.dayOfWeek,
        })
        .from(courseSchedulesTable)
        .innerJoin(
          enrollmentsTable,
          eq(enrollmentsTable.courseId, courseSchedulesTable.courseId)
        )
        .innerJoin(
          coursesTable,
          eq(coursesTable.id, courseSchedulesTable.courseId)
        )
        .innerJoin(
          usersTable,
          eq(usersTable.id, coursesTable.offeredByTeacherId)
        )
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            inArray(courseSchedulesTable.dayOfWeek, targetDays)
          )
        )
        .orderBy(courseSchedulesTable.startTime);

      res.json({ success: true, classes: todaysClasses });
    } catch (error) {
      console.error("Get today's classes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ==========================================
  // STANDARD GETTERS
  // ==========================================

  static async getCourses(req: Request, res: Response) {
    try {
      const rawFilters = req.query;
      const filters: CourseFilterQuery = {
        category: rawFilters.category as string,
        teacherName: rawFilters.teacherName as string,
        dayOfWeek: rawFilters.dayOfWeek
          ? parseInt(rawFilters.dayOfWeek as string)
          : undefined,
        startTimeAfter: rawFilters.startTimeAfter as string,
        endTimeBefore: rawFilters.endTimeBefore as string,
        search: rawFilters.search as string,
      };

      const whereConditions = [];
      if (filters.category)
        whereConditions.push(
          sql`${filters.category} = ANY(${coursesTable.categories})`
        );
      if (filters.teacherName)
        whereConditions.push(
          sql`CONCAT(${usersTable.firstName}, ' ', ${
            usersTable.lastName
          }) ILIKE ${"%" + filters.teacherName + "%"}`
        );
      if (filters.search)
        whereConditions.push(
          sql`(${coursesTable.name} ILIKE ${"%" + filters.search + "%"} OR ${
            coursesTable.description
          } ILIKE ${"%" + filters.search + "%"})`
        );

      let baseQuery = db
        .select({
          id: coursesTable.id,
          name: coursesTable.name,
          description: coursesTable.description,
          categories: coursesTable.categories,
          courseCurriculum: coursesTable.courseCurriculum,
          totalSessions: coursesTable.totalSessions,
          offeredByTeacherId: coursesTable.offeredByTeacherId,
          createdAt: coursesTable.createdAt,
          updatedAt: coursesTable.updatedAt,
          teacherFirstName: usersTable.firstName,
          teacherLastName: usersTable.lastName,
          teacherEmail: usersTable.email,
          enrollmentCount: sql<number>`COUNT(DISTINCT ${enrollmentsTable.id})::int`,
        })
        .from(coursesTable)
        .leftJoin(
          usersTable,
          eq(coursesTable.offeredByTeacherId, usersTable.id)
        )
        .leftJoin(
          enrollmentsTable,
          and(
            eq(enrollmentsTable.courseId, coursesTable.id),
            eq(enrollmentsTable.status, "active")
          )
        );

      const query =
        whereConditions.length > 0
          ? baseQuery
              .where(and(...whereConditions))
              .groupBy(
                coursesTable.id,
                usersTable.id,
                usersTable.firstName,
                usersTable.lastName,
                usersTable.email
              )
          : baseQuery.groupBy(
              coursesTable.id,
              usersTable.id,
              usersTable.firstName,
              usersTable.lastName,
              usersTable.email
            );

      const courses = await query;
      const courseIds = courses.map((course) => course.id);
      const schedules =
        courseIds.length > 0
          ? await db
              .select()
              .from(courseSchedulesTable)
              .where(inArray(courseSchedulesTable.courseId, courseIds))
          : [];

      let filteredCourses = courses;
      if (
        filters.dayOfWeek ||
        filters.startTimeAfter ||
        filters.endTimeBefore
      ) {
        const validCourseIds = new Set();
        schedules.forEach((schedule) => {
          let matches = true;
          if (filters.dayOfWeek && schedule.dayOfWeek !== filters.dayOfWeek)
            matches = false;
          if (
            filters.startTimeAfter &&
            schedule.startTime < filters.startTimeAfter
          )
            matches = false;
          if (filters.endTimeBefore && schedule.endTime > filters.endTimeBefore)
            matches = false;
          if (matches) validCourseIds.add(schedule.courseId);
        });
        filteredCourses = courses.filter((course) =>
          validCourseIds.has(course.id)
        );
      }

      const formattedCourses = filteredCourses.map((course) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        categories: course.categories,
        courseCurriculum: course.courseCurriculum,
        totalSessions: course.totalSessions,
        offeredByTeacherId: course.offeredByTeacherId,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        teacher: {
          id: course.offeredByTeacherId,
          firstName: course.teacherFirstName,
          lastName: course.teacherLastName,
          email: course.teacherEmail,
        },
        schedules: schedules
          .filter((s) => s.courseId === course.id)
          .map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        enrollmentCount: course.enrollmentCount,
      }));

      res.json({ courses: formattedCourses });
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getCourseById(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const course = await CourseController.getCourseWithDetails(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json({ course });
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ==========================================
  // DELETE COURSE (✅ FIXED: Cascading Delete)
  // ==========================================
  static async deleteCourse(req: Request, res: Response) {
    try {
      const courseId = req.params.courseId || req.params.id;
      const teacherId = req.user!.userId;

      if (!courseId) {
        return res.status(400).json({ error: "Course ID is required" });
      }

      const [existingCourse] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, courseId),
            eq(coursesTable.offeredByTeacherId, teacherId)
          )
        );
      if (!existingCourse)
        return res
          .status(404)
          .json({ error: "Course not found or unauthorized" });

      // ✅ Delete dependents first
      await db
        .delete(attendanceTable)
        .where(eq(attendanceTable.courseId, courseId));
      await db
        .delete(enrollmentsTable)
        .where(eq(enrollmentsTable.courseId, courseId));
      await db
        .delete(courseSchedulesTable)
        .where(eq(courseSchedulesTable.courseId, courseId));
      await db.delete(coursesTable).where(eq(coursesTable.id, courseId));

      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getTeacherCourses(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const courses = await db
        .select({
          id: coursesTable.id,
          name: coursesTable.name,
          description: coursesTable.description,
          categories: coursesTable.categories,
          totalSessions: coursesTable.totalSessions,
          createdAt: coursesTable.createdAt,
          enrollmentCount: sql<number>`COUNT(DISTINCT ${enrollmentsTable.id})::int`,
        })
        .from(coursesTable)
        .leftJoin(
          enrollmentsTable,
          and(
            eq(enrollmentsTable.courseId, coursesTable.id),
            eq(enrollmentsTable.status, "active")
          )
        )
        .where(eq(coursesTable.offeredByTeacherId, teacherId))
        .groupBy(coursesTable.id);
      res.json({ courses });
    } catch (error) {
      console.error("Get teacher courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async enrollInCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const studentId = req.user!.userId;
      const [course] = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.id, courseId));
      if (!course) return res.status(404).json({ error: "Course not found" });

      const [activeEnrollments] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.status, "active")
          )
        );
      if (activeEnrollments.count >= 5)
        return res.status(400).json({
          error: "Maximum enrollment limit reached",
          details: "You can enroll in maximum 5 courses at a time",
        });

      const [existingEnrollment] = await db
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.courseId, courseId)
          )
        );
      if (existingEnrollment) {
        if (existingEnrollment.status === "active")
          return res
            .status(400)
            .json({ error: "Already enrolled in this course" });
        const [reactivatedEnrollment] = await db
          .update(enrollmentsTable)
          .set({ status: "active", enrolledAt: new Date(), droppedAt: null })
          .where(eq(enrollmentsTable.id, existingEnrollment.id))
          .returning();
        return res.status(200).json({
          message: "Successfully re-enrolled in course",
          enrollment: reactivatedEnrollment,
        });
      }

      const [enrollment] = await db
        .insert(enrollmentsTable)
        .values({ studentId, courseId, status: "active" })
        .returning();
      res
        .status(201)
        .json({ message: "Successfully enrolled in course", enrollment });
    } catch (error) {
      console.error("Enroll in course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async dropCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const studentId = req.user!.userId;
      const [enrollment] = await db
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.courseId, courseId),
            eq(enrollmentsTable.status, "active")
          )
        );
      if (!enrollment)
        return res.status(404).json({ error: "Enrollment not found" });
      await db
        .update(enrollmentsTable)
        .set({ status: "dropped", droppedAt: new Date() })
        .where(eq(enrollmentsTable.id, enrollment.id));
      res.json({ message: "Successfully dropped from course" });
    } catch (error) {
      console.error("Drop course error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getStudentCourses(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const courses = await db
        .select({
          id: coursesTable.id,
          name: coursesTable.name,
          description: coursesTable.description,
          categories: coursesTable.categories,
          totalSessions: coursesTable.totalSessions,
          teacherFirstName: usersTable.firstName,
          teacherLastName: usersTable.lastName,
          enrolledAt: enrollmentsTable.enrolledAt,
          status: enrollmentsTable.status,
        })
        .from(enrollmentsTable)
        .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .innerJoin(
          usersTable,
          eq(coursesTable.offeredByTeacherId, usersTable.id)
        )
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.status, "active")
          )
        );
      res.json({ courses });
    } catch (error) {
      console.error("Get student courses error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getCourseEnrollments(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const teacherId = req.user!.userId;
      const [course] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, courseId),
            eq(coursesTable.offeredByTeacherId, teacherId)
          )
        );
      if (!course)
        return res
          .status(404)
          .json({ error: "Course not found or unauthorized" });
      const enrollments = await db
        .select({
          id: enrollmentsTable.id,
          studentId: enrollmentsTable.studentId,
          enrolledAt: enrollmentsTable.enrolledAt,
          status: enrollmentsTable.status,
          studentFirstName: usersTable.firstName,
          studentLastName: usersTable.lastName,
          studentEmail: usersTable.email,
          rollNumber: usersTable.rollNumber,
        })
        .from(enrollmentsTable)
        .innerJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
        .where(eq(enrollmentsTable.courseId, courseId));
      res.json({ enrollments });
    } catch (error) {
      console.error("Get course enrollments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getStudentClassSchedule(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;

      const enrollments = await db
        .select({ courseId: enrollmentsTable.courseId })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.studentId, studentId));

      if (enrollments.length === 0) {
        return res.json({ schedules: [] });
      }

      const enrolledCourseIds = enrollments.map((e) => e.courseId);

      const allSchedules = await db
        .select({
          id: courseSchedulesTable.id,
          courseName: coursesTable.name,
          dayOfWeek: courseSchedulesTable.dayOfWeek,
          startTime: courseSchedulesTable.startTime,
          endTime: courseSchedulesTable.endTime,
          topic: courseSchedulesTable.topic,
          meetLink: courseSchedulesTable.meetLink,
        })
        .from(courseSchedulesTable)
        .innerJoin(
          coursesTable,
          eq(courseSchedulesTable.courseId, coursesTable.id)
        )
        .where(inArray(courseSchedulesTable.courseId, enrolledCourseIds))
        .orderBy(
          courseSchedulesTable.dayOfWeek,
          courseSchedulesTable.startTime
        );

      res.json({ schedules: allSchedules });
    } catch (error) {
      console.error("Get student schedule error:", error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  }

  // ✅ HELPER: GET COURSE DETAILS
  private static async getCourseWithDetails(
    courseId: string
  ): Promise<CourseWithDetails | null> {
    try {
      const [courseData] = await db
        .select({
          id: coursesTable.id,
          name: coursesTable.name,
          description: coursesTable.description,
          categories: coursesTable.categories,
          courseCurriculum: coursesTable.courseCurriculum,
          totalSessions: coursesTable.totalSessions,
          offeredByTeacherId: coursesTable.offeredByTeacherId,
          createdAt: coursesTable.createdAt,
          updatedAt: coursesTable.updatedAt,
          teacherFirstName: usersTable.firstName,
          teacherLastName: usersTable.lastName,
          teacherEmail: usersTable.email,
        })
        .from(coursesTable)
        .leftJoin(
          usersTable,
          eq(coursesTable.offeredByTeacherId, usersTable.id)
        )
        .where(eq(coursesTable.id, courseId));

      if (!courseData) return null;
      const schedules = await db
        .select()
        .from(courseSchedulesTable)
        .where(eq(courseSchedulesTable.courseId, courseId));
      const [enrollmentCount] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.courseId, courseId),
            eq(enrollmentsTable.status, "active")
          )
        );

      return {
        id: courseData.id,
        name: courseData.name,
        description: courseData.description,
        categories: courseData.categories,
        courseCurriculum: courseData.courseCurriculum,
        totalSessions: courseData.totalSessions,
        offeredByTeacherId: courseData.offeredByTeacherId,
        createdAt: courseData.createdAt,
        updatedAt: courseData.updatedAt,
        teacher: {
          id: courseData.offeredByTeacherId,
          firstName: courseData.teacherFirstName || "",
          lastName: courseData.teacherLastName || "",
          email: courseData.teacherEmail || "",
        },
        schedules: schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        enrollmentCount: enrollmentCount?.count || 0,
      };
    } catch (error) {
      console.error("Get course with details error:", error);
      return null;
    }
  }

  // ✅ Helper: Check Schedule Conflicts (FIXED ARRAY)
  private static async checkScheduleConflicts(
    teacherId: string,
    newSchedules: any[]
  ): Promise<{ conflict: boolean; message?: string }> {
    try {
      const existingSchedules = await db
        .select({
          courseName: coursesTable.name,
          dayOfWeek: courseSchedulesTable.dayOfWeek,
          startTime: courseSchedulesTable.startTime,
          endTime: courseSchedulesTable.endTime,
        })
        .from(courseSchedulesTable)
        .innerJoin(
          coursesTable,
          eq(courseSchedulesTable.courseId, coursesTable.id)
        )
        .where(eq(coursesTable.offeredByTeacherId, teacherId));

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      for (const newSchedule of newSchedules) {
        for (const existing of existingSchedules) {
          if (Number(existing.dayOfWeek) === Number(newSchedule.dayOfWeek)) {
            const existingStart = getMinutes(existing.startTime);
            const existingEnd = getMinutes(existing.endTime);
            const newStart = getMinutes(newSchedule.startTime);
            const newEnd = getMinutes(newSchedule.endTime);

            if (isOverlap(existingStart, existingEnd, newStart, newEnd)) {
              return {
                conflict: true,
                message: `Schedule conflict on ${
                  dayNames[Number(existing.dayOfWeek)]
                } with course "${existing.courseName}" (${existing.startTime}-${
                  existing.endTime
                })`,
              };
            }
          }
        }
      }
      return { conflict: false };
    } catch (error) {
      console.error("Schedule conflict check error:", error);
      return { conflict: true, message: "Error checking schedule conflicts" };
    }
  }

  // ✅ Helper: Check Schedule Conflicts for Update (FIXED WITH 'ne')
  private static async checkScheduleConflictsForUpdate(
    teacherId: string,
    newSchedules: any[],
    excludeCourseId: string
  ): Promise<{ conflict: boolean; message?: string }> {
    try {
      const existingSchedules = await db
        .select({
          courseName: coursesTable.name,
          dayOfWeek: courseSchedulesTable.dayOfWeek,
          startTime: courseSchedulesTable.startTime,
          endTime: courseSchedulesTable.endTime,
        })
        .from(courseSchedulesTable)
        .innerJoin(
          coursesTable,
          eq(courseSchedulesTable.courseId, coursesTable.id)
        )
        .where(
          and(
            eq(coursesTable.offeredByTeacherId, teacherId),
            ne(coursesTable.id, excludeCourseId) // ✅ Correct Drizzle 'Not Equal' syntax
          )
        );

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      for (const newSchedule of newSchedules) {
        for (const existing of existingSchedules) {
          if (Number(existing.dayOfWeek) === Number(newSchedule.dayOfWeek)) {
            const existingStart = getMinutes(existing.startTime);
            const existingEnd = getMinutes(existing.endTime);
            const newStart = getMinutes(newSchedule.startTime);
            const newEnd = getMinutes(newSchedule.endTime);

            if (isOverlap(existingStart, existingEnd, newStart, newEnd)) {
              return {
                conflict: true,
                message: `Schedule conflict on ${
                  dayNames[Number(existing.dayOfWeek)]
                } with course "${existing.courseName}" (${existing.startTime}-${
                  existing.endTime
                })`,
              };
            }
          }
        }
      }
      return { conflict: false };
    } catch (error) {
      console.error("Schedule conflict check error:", error);
      return { conflict: true, message: "Error checking schedule conflicts" };
    }
  }

  // ✅ Helper: Check Schedule Conflicts for Single Addition (FIXED ARRAY)
  private static async checkScheduleConflictsForAddition(
    teacherId: string,
    newSchedule: { dayOfWeek: number; startTime: string; endTime: string }
  ): Promise<{ conflict: boolean; message?: string }> {
    try {
      const existingSchedules = await db
        .select({
          courseName: coursesTable.name,
          dayOfWeek: courseSchedulesTable.dayOfWeek,
          startTime: courseSchedulesTable.startTime,
          endTime: courseSchedulesTable.endTime,
        })
        .from(courseSchedulesTable)
        .innerJoin(
          coursesTable,
          eq(courseSchedulesTable.courseId, coursesTable.id)
        )
        .where(eq(coursesTable.offeredByTeacherId, teacherId));

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      for (const existing of existingSchedules) {
        if (Number(existing.dayOfWeek) === Number(newSchedule.dayOfWeek)) {
          const existingStart = getMinutes(existing.startTime);
          const existingEnd = getMinutes(existing.endTime);
          const newStart = getMinutes(newSchedule.startTime);
          const newEnd = getMinutes(newSchedule.endTime);

          if (isOverlap(existingStart, existingEnd, newStart, newEnd)) {
            return {
              conflict: true,
              message: `Schedule conflict on ${
                dayNames[Number(existing.dayOfWeek)]
              } with course "${existing.courseName}" (${existing.startTime}-${
                existing.endTime
              })`,
            };
          }
        }
      }
      return { conflict: false };
    } catch (error) {
      console.error("Schedule conflict check error:", error);
      return { conflict: true, message: "Error checking schedule conflicts" };
    }
  }
}
