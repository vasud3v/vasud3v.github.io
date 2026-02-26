import { Shield, Sword, Star } from 'lucide-react';
import { UserRole, ROLE_LABELS, ROLE_COLORS, ROLE_BG_COLORS } from '@/types/forum';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
}

const ROLE_ICONS: Partial<Record<UserRole, typeof Shield>> = {
  admin: Shield,
  super_moderator: Sword,
  moderator: Star,
};

export default function RoleBadge({ role, size = 'sm', showIcon = true, showLabel = true }: RoleBadgeProps) {
  // Don't show badge for regular members or restricted
  if (role === 'member' || role === 'restricted') return null;

  const Icon = ROLE_ICONS[role];
  const label = ROLE_LABELS[role];
  const colorClass = ROLE_COLORS[role];
  const bgClass = ROLE_BG_COLORS[role];

  const sizeClasses = size === 'sm'
    ? 'text-[8px] px-1.5 py-[1px] gap-0.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  const iconSize = size === 'sm' ? 8 : 10;

  return (
    <span
      className={`inline-flex items-center rounded-sm border font-mono font-semibold uppercase tracking-wider ${colorClass} ${bgClass} ${sizeClasses}`}
      title={label}
    >
      {showIcon && Icon && <Icon size={iconSize} />}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
