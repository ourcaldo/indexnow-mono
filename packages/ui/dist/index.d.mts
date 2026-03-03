import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React$1 from 'react';
import React__default, { Component, ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as react_hook_form from 'react-hook-form';
import { FieldValues, UseFormProps } from 'react-hook-form';
import { ZodSchema, z } from 'zod';
import { Json } from '@indexnow/shared';
export { cn } from '@indexnow/shared';
import { Paddle } from '@paddle/paddle-js';

declare const badgeVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React$1.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): react_jsx_runtime.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "default" | "secondary" | "destructive" | "outline" | "link" | "ghost" | "success" | "info" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React$1.ForwardRefExoticComponent<ButtonProps & React$1.RefAttributes<HTMLButtonElement>>;

declare const Card: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLHeadingElement> & React$1.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLParagraphElement> & React$1.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLDivElement> & React$1.RefAttributes<HTMLDivElement>>;

declare const Checkbox: React$1.ForwardRefExoticComponent<Omit<CheckboxPrimitive.CheckboxProps & React$1.RefAttributes<HTMLButtonElement>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;

declare const Dialog: React$1.FC<DialogPrimitive.DialogProps>;
declare const DialogTrigger: React$1.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & React$1.RefAttributes<HTMLButtonElement>>;
declare const DialogPortal: React$1.FC<DialogPrimitive.DialogPortalProps>;
declare const DialogClose: React$1.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & React$1.RefAttributes<HTMLButtonElement>>;
declare const DialogOverlay: React$1.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DialogContent: React$1.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DialogHeader: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DialogFooter: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};
declare const DialogTitle: React$1.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React$1.RefAttributes<HTMLHeadingElement>, "ref"> & React$1.RefAttributes<HTMLHeadingElement>>;
declare const DialogDescription: React$1.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React$1.RefAttributes<HTMLParagraphElement>, "ref"> & React$1.RefAttributes<HTMLParagraphElement>>;

declare const DropdownMenu: React$1.FC<DropdownMenuPrimitive.DropdownMenuProps>;
declare const DropdownMenuTrigger: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & React$1.RefAttributes<HTMLButtonElement>>;
declare const DropdownMenuGroup: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuPortal: React$1.FC<DropdownMenuPrimitive.DropdownMenuPortalProps>;
declare const DropdownMenuSub: React$1.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
declare const DropdownMenuRadioGroup: React$1.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuRadioGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubTrigger: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSubContent: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuContent: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuCheckboxItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuRadioItem: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuRadioItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuLabel: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuLabelProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuSeparator: React$1.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const DropdownMenuShortcut: {
    ({ className, ...props }: React$1.HTMLAttributes<HTMLSpanElement>): react_jsx_runtime.JSX.Element;
    displayName: string;
};

interface InputProps extends React$1.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React$1.ForwardRefExoticComponent<InputProps & React$1.RefAttributes<HTMLInputElement>>;

declare const Label: React$1.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React$1.RefAttributes<HTMLLabelElement>, "ref"> & VariantProps<(props?: class_variance_authority_types.ClassProp | undefined) => string> & React$1.RefAttributes<HTMLLabelElement>>;

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}
declare function LoadingSpinner({ className, size }: LoadingSpinnerProps): react_jsx_runtime.JSX.Element;

declare const Select: React$1.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: React$1.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectValue: React$1.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & React$1.RefAttributes<HTMLSpanElement>>;
declare const SelectTrigger: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & React$1.RefAttributes<HTMLButtonElement>, "ref"> & React$1.RefAttributes<HTMLButtonElement>>;
declare const SelectScrollUpButton: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollUpButtonProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectScrollDownButton: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectScrollDownButtonProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectContent: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectLabel: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectItem: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;
declare const SelectSeparator: React$1.ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

declare const Separator: React$1.ForwardRefExoticComponent<Omit<SeparatorPrimitive.SeparatorProps & React$1.RefAttributes<HTMLDivElement>, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

interface SkeletonProps {
    className?: string;
}
declare function Skeleton({ className }: SkeletonProps): react_jsx_runtime.JSX.Element;
/**
 * (#110) Generic table skeleton for data table loading states.
 * @param rows Number of placeholder rows (default 5)
 * @param columns Number of columns (default 4)
 */
declare function TableSkeleton({ rows, columns }: {
    rows?: number;
    columns?: number;
}): react_jsx_runtime.JSX.Element;
/**
 * (#110) Stat card grid skeleton for admin dashboards.
 * @param count Number of stat cards (default 4)
 */
declare function StatsCardsSkeleton({ count }: {
    count?: number;
}): react_jsx_runtime.JSX.Element;
/**
 * (#110) Full admin page loading skeleton with header, stats, and content area.
 */
declare function AdminPageSkeleton(): react_jsx_runtime.JSX.Element;
declare function ProfileSkeleton(): react_jsx_runtime.JSX.Element;
declare function OrderDetailSkeleton(): react_jsx_runtime.JSX.Element;
declare function AdminUserDetailSkeleton(): react_jsx_runtime.JSX.Element;
declare function DashboardSkeleton(): react_jsx_runtime.JSX.Element;
declare function ApiQuotaSkeleton(): react_jsx_runtime.JSX.Element;
declare function IndexNowFormSkeleton(): react_jsx_runtime.JSX.Element;
declare function SettingsPageSkeleton(): react_jsx_runtime.JSX.Element;

declare const Table: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableElement> & React$1.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableFooter: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableRowElement> & React$1.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React$1.ForwardRefExoticComponent<React$1.ThHTMLAttributes<HTMLTableCellElement> & React$1.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React$1.ForwardRefExoticComponent<React$1.TdHTMLAttributes<HTMLTableCellElement> & React$1.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableCaptionElement> & React$1.RefAttributes<HTMLTableCaptionElement>>;

interface TextareaProps extends React$1.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
declare const Textarea: React$1.ForwardRefExoticComponent<TextareaProps & React$1.RefAttributes<HTMLTextAreaElement>>;

interface Toast {
    id: string;
    title?: string;
    description?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    /** (#115) If true, toast persists across route navigation */
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}
declare function ToastContainer({ children }: {
    children: React$1.ReactNode;
}): react_jsx_runtime.JSX.Element;
declare function useToast(): {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
};

/**
 * Shared 404 page component.
 * Use as the default export from `app/not-found.tsx`.
 */
declare function NotFoundPage({ heading, description, backLabel, backHref, }: {
    heading?: string;
    description?: string;
    backLabel?: string;
    backHref?: string;
}): react_jsx_runtime.JSX.Element;

/**
 * Accessible toggle switch with dark mode support.
 * Uses a real hidden checkbox for screen reader compatibility.
 */
declare function ToggleSwitch({ checked, onChange, testId, }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    testId?: string;
}): react_jsx_runtime.JSX.Element;

interface ErrorStateProps {
    /**
     * Error title displayed prominently
     */
    title?: string;
    /**
     * Detailed error message
     */
    message?: string;
    /**
     * Optional error ID for tracking/support
     */
    errorId?: string;
    /**
     * Callback function when user clicks retry button
     */
    onRetry?: () => void;
    /**
     * Show home button to navigate back
     */
    showHomeButton?: boolean;
    /**
     * Custom retry button label
     */
    retryLabel?: string;
    /**
     * Display variant - 'card' for full card layout, 'inline' for compact display
     */
    variant?: 'card' | 'inline';
}
/**
 * ErrorState Component
 *
 * Standardized error display component for consistent error UX across the application.
 * Supports both full-page card layout and inline compact display.
 */
declare function ErrorState({ title, message, errorId, onRetry, showHomeButton, retryLabel, variant }: ErrorStateProps): react_jsx_runtime.JSX.Element;

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'primary';
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}
declare function ConfirmationDialog({ isOpen, title, message, confirmText, cancelText, variant, loading, onConfirm, onClose }: ConfirmationDialogProps): react_jsx_runtime.JSX.Element;

interface PaymentPackage$1 {
    id: string;
    name: string;
    slug: string;
    description?: string;
    features: string[];
    quota_limits: {
        max_keywords?: number;
        max_domains?: number;
    };
    is_popular?: boolean;
    is_current?: boolean;
    pricing_tiers: Record<string, {
        regular_price: number;
        promo_price?: number;
        paddle_price_id?: string;
        discount_percentage?: number;
    }>;
}
interface Transaction {
    id: string;
    transaction_type: string;
    transaction_status: string;
    amount: number;
    currency: string;
    payment_method: string;
    gateway_transaction_id: string;
    created_at: string;
    processed_at: string | null;
    verified_at: string | null;
    notes: string | null;
    package_name?: string;
    package?: {
        name: string;
        slug: string;
    };
    gateway?: {
        name: string;
        slug: string;
    };
    subscription?: {
        billing_period: string;
        started_at: string;
        expires_at: string;
    } | null;
}
interface BillingHistoryData {
    transactions: Transaction[];
    summary: {
        total_transactions: number;
        completed_transactions: number;
        pending_transactions: number;
        failed_transactions: number;
        total_amount_spent: number;
    };
    pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        items_per_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
interface BillingData {
    currentSubscription: {
        package_name: string;
        package_slug: string;
        subscription_status: string;
        expires_at: string | null;
        subscribed_at: string | null;
        amount_paid: number;
        billing_period: string;
    } | null;
    billingStats: {
        total_payments: number;
        total_spent: number;
        next_billing_date: string | null;
        days_remaining: number | null;
    };
}
interface KeywordUsageData {
    keywords: {
        used: number;
        limit: number;
        is_unlimited: boolean;
        remaining: number;
    };
    domains: {
        used: number;
        limit: number;
        is_unlimited: boolean;
        remaining: number;
    };
}
interface RefundWindowInfo {
    daysActive: number;
    daysRemaining: number;
    refundEligible: boolean;
    refundWindowDays: number;
    createdAt: string;
}

interface BillingPeriodSelectorProps {
    selectedPackage: PaymentPackage$1 | null;
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
}
declare function BillingPeriodSelector({ selectedPackage, selectedPeriod, onPeriodChange, }: BillingPeriodSelectorProps): react_jsx_runtime.JSX.Element | null;

interface PricingTier {
    regular_price: number;
    promo_price?: number;
    period_label?: string;
    paddle_price_id?: string;
}
interface PaymentPackage {
    id: string;
    name: string;
    features: string[];
    pricing_tiers?: Record<string, PricingTier>;
}
interface OrderSummaryProps {
    selectedPackage: PaymentPackage | null;
    billingPeriod: string;
    isTrialFlow?: boolean;
}
declare function OrderSummary({ selectedPackage, billingPeriod, isTrialFlow }: OrderSummaryProps): react_jsx_runtime.JSX.Element | null;

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React__default.ErrorInfo) => void;
}
interface State {
    hasError: boolean;
    error?: Error;
    errorId: string;
}
declare class PaymentErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidCatch(error: Error, errorInfo: React__default.ErrorInfo): void;
    private handleRetry;
    private handleReload;
    private handleGoHome;
    render(): string | number | bigint | boolean | react_jsx_runtime.JSX.Element | Iterable<React__default.ReactNode> | Promise<string | number | bigint | boolean | React__default.ReactPortal | React__default.ReactElement<unknown, string | React__default.JSXElementConstructor<any>> | Iterable<React__default.ReactNode> | null | undefined> | null | undefined;
}
declare function usePaymentErrorHandler(): {
    handleError: (error: Error, errorInfo?: React__default.ErrorInfo) => {
        errorId: string;
        error: {
            name: string;
            message: string;
            stack: string | undefined;
        };
        errorInfo: React__default.ErrorInfo | undefined;
        timestamp: string;
        userAgent: string;
        url: string;
    };
};

interface CheckoutFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
}
interface CheckoutFormProps {
    form: CheckoutFormData;
    setForm: React__default.Dispatch<React__default.SetStateAction<CheckoutFormData>>;
}
declare const CheckoutForm: ({ form, setForm }: CheckoutFormProps) => react_jsx_runtime.JSX.Element;

interface CheckoutHeaderProps {
    selectedPackage: {
        name: string;
    } | null;
    onBack: () => void;
}
declare const CheckoutHeader: ({ selectedPackage, onBack }: CheckoutHeaderProps) => react_jsx_runtime.JSX.Element;

declare const CheckoutLoading: () => react_jsx_runtime.JSX.Element;
interface PackageNotFoundProps {
    onBack: () => void;
}
declare const PackageNotFound: ({ onBack }: PackageNotFoundProps) => react_jsx_runtime.JSX.Element;

interface ErrorDetailModalProps {
    errorId: string | null;
    open: boolean;
    onClose: () => void;
}
declare function ErrorDetailModal({ errorId, open, onClose }: ErrorDetailModalProps): react_jsx_runtime.JSX.Element | null;

interface ErrorFiltersProps {
    onFilterChange: (filters: Record<string, string | undefined>) => void;
}
declare function ErrorFilters({ onFilterChange }: ErrorFiltersProps): react_jsx_runtime.JSX.Element;

interface ErrorListTableProps {
    filters: Record<string, string | undefined>;
    onErrorClick: (errorId: string) => void;
}
declare const ErrorListTable: React$1.NamedExoticComponent<ErrorListTableProps>;

interface ErrorStatsProps {
    timeRange: '24h' | '7d' | '30d';
}
declare function ErrorStatsCards({ timeRange }: ErrorStatsProps): react_jsx_runtime.JSX.Element | null;

/**
 * Shared auth form sub-components — issue #151
 *
 * These are composable building blocks for auth pages. Both the admin and
 * user-dashboard login pages use different layouts and logic, so we extract
 * the shared UI primitives rather than creating a monolithic LoginForm.
 */
interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    label?: string;
    className?: string;
    /** Use the native HTML input styling (for user-dashboard) vs shadcn Input (for admin) */
    variant?: 'shadcn' | 'native';
}
/**
 * Password input field with show/hide toggle button.
 * Used by both admin and user-dashboard login pages.
 */
declare function PasswordInput({ value, onChange, placeholder, disabled, id, label, className, variant, }: PasswordInputProps): react_jsx_runtime.JSX.Element;
interface AuthErrorAlertProps {
    error: string | null;
    className?: string;
    /** Treat messages starting with "SUCCESS:" as success alerts */
    allowSuccessPrefix?: boolean;
}
/**
 * Error/success alert for auth forms.
 * Renders nothing when error is null.
 */
declare function AuthErrorAlert({ error, className, allowSuccessPrefix }: AuthErrorAlertProps): react_jsx_runtime.JSX.Element | null;
interface AuthLoadingButtonProps {
    isLoading: boolean;
    loadingText?: string;
    children: React__default.ReactNode;
    className?: string;
    disabled?: boolean;
    type?: 'submit' | 'button';
    onClick?: () => void;
    /** Use the native HTML button styling (for user-dashboard) vs shadcn Button (for admin) */
    variant?: 'shadcn' | 'native';
}
/**
 * Submit button with loading spinner state for auth forms.
 */
declare function AuthLoadingButton({ isLoading, loadingText, children, className, disabled, type, onClick, variant, }: AuthLoadingButtonProps): react_jsx_runtime.JSX.Element;
interface AuthCheckingSpinnerProps {
    message?: string;
}
/**
 * Full-screen loading spinner shown while checking existing auth state.
 */
declare function AuthCheckingSpinner({ message }: AuthCheckingSpinnerProps): react_jsx_runtime.JSX.Element;

/**
 * Server Error Boundary Component
 * Handles errors from Server Components and tracks them in analytics
 */
declare function ServerErrorBoundary({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): react_jsx_runtime.JSX.Element;

interface BaseProvidersProps {
    children: React__default.ReactNode;
    /**
     * Additional providers to wrap around the core stack.
     * Rendered between AnalyticsProvider and QueryProvider.
     * Example: PaddleProvider for user-dashboard.
     */
    outerProviders?: React__default.ComponentType<{
        children: React__default.ReactNode;
    }>[];
}
/**
 * Shared provider stack for all apps.
 * Wraps: AnalyticsProvider > [outerProviders] > QueryProvider > AuthProvider > ToastContainer > [FaviconProvider]
 *
 * Usage in admin:
 *   <BaseProviders>{children}</BaseProviders>
 *
 * Usage in user-dashboard:
 *   <BaseProviders outerProviders={[PaddleProvider]}>{children}</BaseProviders>
 */
declare function BaseProviders({ children, outerProviders, }: BaseProvidersProps): react_jsx_runtime.JSX.Element;

/**
 * Hook for consistent API error handling with toast notifications
 *
 * Integrates with standardized ApiResponse format from Phase 2 error handling
 * Automatically extracts error details (message, ID, severity) and displays
 * user-friendly toast notifications with optional error ID copying.
 */
interface HandleApiErrorOptions {
    context?: string;
    toastTitle?: string;
}
interface UseApiErrorReturn {
    handleApiError: (error: unknown, options?: HandleApiErrorOptions) => void;
}
declare function useApiError(): UseApiErrorReturn;

type NotificationType = 'success' | 'error' | 'warning' | 'info';
interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
    timestamp: number;
}
interface UseNotificationReturn {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
    showSuccess: (title: string, message?: string, options?: Partial<Notification>) => string;
    showError: (title: string, message?: string, options?: Partial<Notification>) => string;
    showWarning: (title: string, message?: string, options?: Partial<Notification>) => string;
    showInfo: (title: string, message?: string, options?: Partial<Notification>) => string;
}
declare function useNotification(): UseNotificationReturn;

/**
 * useZodForm - Convenience wrapper around react-hook-form with Zod schema validation.
 *
 * Combines useForm + zodResolver in a single call for consistent form handling.
 *
 * @example
 * ```tsx
 * const form = useZodForm(loginSchema, { defaultValues: { email: '', password: '' } })
 *
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <input {...form.register('email')} />
 *   {form.formState.errors.email && <span>{form.formState.errors.email.message}</span>}
 * </form>
 * ```
 */
declare function useZodForm<T extends FieldValues>(schema: ZodSchema<T>, props?: Omit<UseFormProps<T>, 'resolver'>): react_hook_form.UseFormReturn<T, any, T>;
/**
 * Type helper to extract the inferred type from a Zod schema.
 * Useful for typing form submit handlers.
 */
type FormData<S extends ZodSchema> = z.infer<S>;

interface ActivityLogRequest$1 {
    eventType: string;
    actionDescription: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, Json>;
}
/**
 * Core hook — thin wrapper around POST /api/v1/activity with admin context.
 */
declare function useAdminActivityLogger(): {
    logActivity: (request: ActivityLogRequest$1) => Promise<void>;
};
/**
 * Auto-fires a single admin_page_view event when the component mounts.
 * Deduplicates by `section + pageName` at both instance and module level.
 */
declare function useAdminPageViewLogger(section: string, pageName: string, metadata?: Record<string, Json>): void;
/**
 * Dashboard-specific logger for stats refresh (an observable read action).
 */
declare function useAdminDashboardLogger(): {
    logStatsRefresh: () => void;
};

/**
 * Frontend Activity Logging Hook
 * Provides convenient methods to log user activities from client-side
 */

interface ActivityLogRequest {
    eventType: string;
    actionDescription: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, Json>;
}
interface UseActivityLoggerReturn {
    logActivity: (request: ActivityLogRequest) => Promise<void>;
    logPageView: (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => Promise<void>;
    logDashboardActivity: (eventType: string, details?: string, metadata?: Record<string, Json>) => Promise<void>;
    logBillingActivity: (eventType: string, details: string, metadata?: Record<string, Json>) => Promise<void>;
    logJobActivity: (eventType: string, jobId?: string, details?: string, metadata?: Record<string, Json>) => Promise<void>;
}
declare const useActivityLogger: () => UseActivityLoggerReturn;
/**
 * Hook to automatically log page views when component mounts
 */
declare const usePageViewLogger: (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => {
    logPageView: (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => Promise<void>;
};

interface ProfileFormData {
    full_name: string;
    phone_number: string;
    email_notifications: boolean;
}
interface PasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
interface UseAccountSettingsReturn {
    loading: boolean;
    savingProfile: boolean;
    savingPassword: boolean;
    profileForm: ProfileFormData;
    passwordForm: PasswordFormData;
    userEmail: string | undefined;
    setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormData>>;
    setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormData>>;
    handleSaveProfile: () => Promise<void>;
    handleChangePassword: () => Promise<void>;
}
/**
 * Shared hook for account settings (profile + password management).
 * Used by ProfileContent and SecurityContent.
 *
 * Profile data is loaded via React Query (query key: ['profile']) — the SAME
 * cache used by useProfile() in the sidebar. This means:
 * - No duplicate /v1/auth/user/profile fetch on settings pages
 * - Instant data on tab switch (served from cache)
 * - Sidebar automatically updates after profile save
 */
declare function useAccountSettings(): UseAccountSettingsReturn;

interface PaddleContextType {
    paddle: Paddle | null;
    isLoading: boolean;
    error: string | null;
}
declare function PaddleProvider({ children }: {
    children: React__default.ReactNode;
}): react_jsx_runtime.JSX.Element;
declare const usePaddle: () => PaddleContextType;

/**
 * Analytics Provider Component
 * Initializes analytics on mount and tracks page views on navigation
 */
declare function AnalyticsProvider({ children }: {
    children: React__default.ReactNode;
}): react_jsx_runtime.JSX.Element;

export { AdminPageSkeleton, AdminUserDetailSkeleton, AnalyticsProvider, ApiQuotaSkeleton, AuthCheckingSpinner, type AuthCheckingSpinnerProps, AuthErrorAlert, type AuthErrorAlertProps, AuthLoadingButton, type AuthLoadingButtonProps, Badge, type BadgeProps, BaseProviders, type BillingData, type BillingHistoryData, BillingPeriodSelector, Button, type ButtonProps, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, CheckoutForm, type CheckoutFormData, type CheckoutFormProps, CheckoutHeader, type CheckoutHeaderProps, CheckoutLoading, ConfirmationDialog, DashboardSkeleton, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, ErrorDetailModal, ErrorFilters, ErrorListTable, ErrorState, ErrorStatsCards, type FormData, type HandleApiErrorOptions, IndexNowFormSkeleton, Input, type InputProps, type KeywordUsageData, Label, LoadingSpinner, NotFoundPage, type NotificationType, OrderDetailSkeleton, OrderSummary, PackageNotFound, type PackageNotFoundProps, PaddleProvider, type PasswordFormData, PasswordInput, type PasswordInputProps, PaymentErrorBoundary, type PaymentPackage$1 as PaymentPackage, type ProfileFormData, ProfileSkeleton, type RefundWindowInfo, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, ServerErrorBoundary, SettingsPageSkeleton, Skeleton, StatsCardsSkeleton, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, TableSkeleton, Textarea, type TextareaProps, ToastContainer, ToastContainer as Toaster, ToggleSwitch, type Transaction, type UseAccountSettingsReturn, type UseActivityLoggerReturn, type UseApiErrorReturn, badgeVariants, buttonVariants, useAccountSettings, useActivityLogger, useAdminActivityLogger, useAdminDashboardLogger, useAdminPageViewLogger, useApiError, useNotification, usePaddle, usePageViewLogger, usePaymentErrorHandler, useToast, useZodForm };
