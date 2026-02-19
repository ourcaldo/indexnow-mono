import {
  Activity,
  LogIn,
  LogOut,
  User,
  Zap,
  Settings,
  XCircle,
  CheckCircle,
  Shield,
  Server,
  Key,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  type LucideIcon,
} from 'lucide-react';

export interface EventConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

export interface DeviceInfo {
  icon: LucideIcon;
  text: string;
}

const EVENT_CONFIG_MAP: Record<string, (success: boolean) => EventConfig> = {
  login: (success) => ({
    color: success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
    icon: LogIn,
    label: 'Sign In',
  }),
  logout: () => ({
    color: 'bg-muted/10 text-muted-foreground',
    icon: LogOut,
    label: 'Sign Out',
  }),
  register: (success) => ({
    color: success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
    icon: User,
    label: 'Registration',
  }),
  job_create: () => ({
    color: 'bg-accent/10 text-accent',
    icon: Zap,
    label: 'Job Created',
  }),
  job_update: () => ({
    color: 'bg-warning/10 text-warning',
    icon: Settings,
    label: 'Job Updated',
  }),
  job_delete: () => ({
    color: 'bg-destructive/10 text-destructive',
    icon: XCircle,
    label: 'Job Deleted',
  }),
  job_start: () => ({
    color: 'bg-success/10 text-success',
    icon: CheckCircle,
    label: 'Job Started',
  }),
  profile_update: () => ({
    color: 'bg-accent/10 text-accent',
    icon: User,
    label: 'Profile Updated',
  }),
  admin_login: () => ({
    color: 'bg-warning/10 text-warning',
    icon: Shield,
    label: 'Admin Access',
  }),
  user_management: () => ({
    color: 'bg-accent/10 text-accent',
    icon: Settings,
    label: 'User Management',
  }),
  api_call: () => ({
    color: 'bg-muted/10 text-muted-foreground',
    icon: Server,
    label: 'API Call',
  }),
  settings_change: () => ({
    color: 'bg-warning/10 text-warning',
    icon: Settings,
    label: 'Settings Changed',
  }),
  user_password_reset: () => ({
    color: 'bg-destructive/10 text-destructive',
    icon: Key,
    label: 'Password Reset',
  }),
  user_profile_update: () => ({
    color: 'bg-accent/10 text-accent',
    icon: User,
    label: 'Profile Updated',
  }),
  user_role_change: () => ({
    color: 'bg-warning/10 text-warning',
    icon: Shield,
    label: 'Role Changed',
  }),
  user_security_view: () => ({
    color: 'bg-muted/10 text-muted-foreground',
    icon: Shield,
    label: 'Security Analysis',
  }),
  user_activity_view: () => ({
    color: 'bg-muted/10 text-muted-foreground',
    icon: Activity,
    label: 'Activity Review',
  }),
  page_view: () => ({
    color: 'bg-accent/10 text-accent',
    icon: Globe,
    label: 'Page Visit',
  }),
  dashboard_view: () => ({
    color: 'bg-accent/10 text-accent',
    icon: Monitor,
    label: 'Dashboard',
  }),
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  color: 'bg-muted/10 text-muted-foreground',
  icon: Activity,
  label: 'Unknown',
};

export function getEventTypeBadge(eventType: string, success: boolean): EventConfig {
  const configFn = EVENT_CONFIG_MAP[eventType];
  if (configFn) return configFn(success);
  return {
    ...DEFAULT_EVENT_CONFIG,
    label: eventType.replace('_', ' ').toUpperCase(),
  };
}

export function getDeviceInfo(userAgent?: string | null): DeviceInfo {
  if (!userAgent) return { icon: Monitor, text: 'Desktop' };

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile') || ua.includes('iphone')) {
    return { icon: Smartphone, text: 'Mobile' };
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return { icon: Tablet, text: 'Tablet' };
  }
  if (ua.includes('android')) {
    return ua.includes('mobile')
      ? { icon: Smartphone, text: 'Mobile' }
      : { icon: Tablet, text: 'Tablet' };
  }

  return { icon: Monitor, text: 'Desktop' };
}
