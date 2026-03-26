import { db } from '@/lib/db';

/**
 * Check if a user can modify a specific golf course
 * - Super admins can modify any course
 * - Course admins can modify their assigned courses
 * - Regular admins cannot modify courses (only view)
 */
export async function canModifyCourse(userId: string, courseId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, isAdmin: true },
  });

  if (!user) return false;

  // Super admins can modify any course
  if (user.isSuperAdmin) return true;

  // Check if user is the assigned admin for this course
  const course = await db.golfCourse.findUnique({
    where: { id: courseId },
    select: { adminId: true },
  });

  return course?.adminId === userId;
}

/**
 * Check if a user can create courses
 * - Super admins can create courses
 * - Regular admins cannot create courses (only super admins)
 */
export async function canCreateCourse(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  return user?.isSuperAdmin ?? false;
}

/**
 * Check if a user can delete courses
 * - Only super admins can delete courses
 */
export async function canDeleteCourse(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  return user?.isSuperAdmin ?? false;
}

/**
 * Get list of course IDs a user can modify
 * - Super admins can modify all courses
 * - Course admins can only modify their assigned courses
 */
export async function getModifiableCourseIds(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (!user) return [];

  // Super admins can modify all courses
  if (user.isSuperAdmin) {
    const allCourses = await db.golfCourse.findMany({
      select: { id: true },
    });
    return allCourses.map(c => c.id);
  }

  // Course admins can only modify their assigned courses
  const assignedCourses = await db.golfCourse.findMany({
    where: { adminId: userId },
    select: { id: true },
  });

  return assignedCourses.map(c => c.id);
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  return user?.isSuperAdmin ?? false;
}

/**
 * Check if the super admin status can be modified
 * - NO ONE can remove super admin status from a super admin
 * - Super admin status can only be granted, never removed
 */
export async function canModifySuperAdminStatus(
  targetUserId: string,
  newIsSuperAdminValue: boolean
): Promise<{ allowed: boolean; reason?: string }> {
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { isSuperAdmin: true },
  });

  if (!targetUser) {
    return { allowed: false, reason: 'User not found' };
  }

  // If trying to REMOVE super admin status, DENY
  if (targetUser.isSuperAdmin && !newIsSuperAdminValue) {
    return { 
      allowed: false, 
      reason: 'Super admin status cannot be removed. This power is permanent.' 
    };
  }

  return { allowed: true };
}
