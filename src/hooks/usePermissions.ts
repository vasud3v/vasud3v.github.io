import { useMemo } from 'react';
import { useForumContext } from '@/context/ForumContext';
import { UserRole, ROLE_HIERARCHY } from '@/types/forum';

/**
 * Centralized permission hook for role-based access control.
 * Uses the current user's role from ForumContext.
 */
export function usePermissions() {
  const { currentUser } = useForumContext();
  const role = currentUser.role || 'member';

  return useMemo(() => {
    const roleLevel = ROLE_HIERARCHY[role] || 0;

    const isAdmin = role === 'admin';
    const isSuperMod = role === 'super_moderator';
    const isModerator = role === 'moderator';
    const isStaff = isAdmin || isSuperMod || isModerator;
    const isRestricted = role === 'restricted';

    return {
      // Role checks
      role,
      roleLevel,
      isAdmin,
      isSuperMod,
      isModerator,
      isStaff,
      isRestricted,

      // Admin panel access
      canAccessAdmin: isAdmin || isSuperMod,
      canAccessModPanel: isStaff,

      // Category management
      canManageCategories: isAdmin,
      canCreateCategories: isAdmin,
      canEditCategories: isAdmin,
      canDeleteCategories: isAdmin,
      canReorderCategories: isAdmin,

      // Thread management
      canManageThreads: isStaff,
      canCreateThreadsAsAdmin: isStaff,
      canPinThreads: isStaff,
      canLockThreads: isStaff,
      canDeleteThreads: isStaff,
      canMoveThreads: isStaff,
      canMergeThreads: isAdmin || isSuperMod,
      canFeatureThreads: isAdmin || isSuperMod,
      canArchiveThreads: isStaff,

      // Post management
      canManagePosts: isStaff,
      canEditAnyPost: isStaff,
      canDeletePosts: isStaff,
      canApprovePosts: isStaff,

      // User management
      canManageUsers: isAdmin || isSuperMod,
      canChangeRoles: isAdmin,
      canBanUsers: isAdmin || isSuperMod,
      canWarnUsers: isStaff,
      canRestrictUsers: isAdmin || isSuperMod,

      // Reports
      canReport: !isRestricted && currentUser.id !== 'guest',
      canManageReports: isStaff,
      canViewReports: isStaff,

      // Mod log
      canViewModLogs: isAdmin || isSuperMod,

      // Settings
      canManageSettings: isAdmin,

      // Comparison helper
      hasHigherRole: (targetRole: UserRole) => {
        const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
        return roleLevel > targetLevel;
      },
    };
  }, [role, currentUser.id]);
}
