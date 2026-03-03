"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AdminPageSkeleton: () => AdminPageSkeleton,
  AdminUserDetailSkeleton: () => AdminUserDetailSkeleton,
  AnalyticsProvider: () => AnalyticsProvider,
  ApiQuotaSkeleton: () => ApiQuotaSkeleton,
  AuthCheckingSpinner: () => AuthCheckingSpinner,
  AuthErrorAlert: () => AuthErrorAlert,
  AuthLoadingButton: () => AuthLoadingButton,
  Badge: () => Badge,
  BaseProviders: () => BaseProviders,
  BillingPeriodSelector: () => BillingPeriodSelector,
  Button: () => Button,
  Card: () => Card,
  CardContent: () => CardContent,
  CardDescription: () => CardDescription,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardTitle: () => CardTitle,
  Checkbox: () => Checkbox,
  CheckoutForm: () => CheckoutForm,
  CheckoutHeader: () => CheckoutHeader,
  CheckoutLoading: () => CheckoutLoading,
  ConfirmationDialog: () => ConfirmationDialog,
  DashboardSkeleton: () => DashboardSkeleton,
  Dialog: () => Dialog,
  DialogClose: () => DialogClose,
  DialogContent: () => DialogContent,
  DialogDescription: () => DialogDescription,
  DialogFooter: () => DialogFooter,
  DialogHeader: () => DialogHeader,
  DialogOverlay: () => DialogOverlay,
  DialogPortal: () => DialogPortal,
  DialogTitle: () => DialogTitle,
  DialogTrigger: () => DialogTrigger,
  DropdownMenu: () => DropdownMenu,
  DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
  DropdownMenuContent: () => DropdownMenuContent,
  DropdownMenuGroup: () => DropdownMenuGroup,
  DropdownMenuItem: () => DropdownMenuItem,
  DropdownMenuLabel: () => DropdownMenuLabel,
  DropdownMenuPortal: () => DropdownMenuPortal,
  DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
  DropdownMenuRadioItem: () => DropdownMenuRadioItem,
  DropdownMenuSeparator: () => DropdownMenuSeparator,
  DropdownMenuShortcut: () => DropdownMenuShortcut,
  DropdownMenuSub: () => DropdownMenuSub,
  DropdownMenuSubContent: () => DropdownMenuSubContent,
  DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
  DropdownMenuTrigger: () => DropdownMenuTrigger,
  ErrorDetailModal: () => ErrorDetailModal,
  ErrorFilters: () => ErrorFilters,
  ErrorListTable: () => ErrorListTable,
  ErrorState: () => ErrorState,
  ErrorStatsCards: () => ErrorStatsCards,
  IndexNowFormSkeleton: () => IndexNowFormSkeleton,
  Input: () => Input,
  Label: () => Label2,
  LoadingSpinner: () => LoadingSpinner,
  NotFoundPage: () => NotFoundPage,
  OrderDetailSkeleton: () => OrderDetailSkeleton,
  OrderSummary: () => OrderSummary,
  PackageNotFound: () => PackageNotFound,
  PaddleProvider: () => PaddleProvider,
  PasswordInput: () => PasswordInput,
  PaymentErrorBoundary: () => PaymentErrorBoundary,
  ProfileSkeleton: () => ProfileSkeleton,
  Select: () => Select,
  SelectContent: () => SelectContent,
  SelectGroup: () => SelectGroup,
  SelectItem: () => SelectItem,
  SelectLabel: () => SelectLabel,
  SelectScrollDownButton: () => SelectScrollDownButton,
  SelectScrollUpButton: () => SelectScrollUpButton,
  SelectSeparator: () => SelectSeparator,
  SelectTrigger: () => SelectTrigger,
  SelectValue: () => SelectValue,
  Separator: () => Separator3,
  ServerErrorBoundary: () => ServerErrorBoundary,
  SettingsPageSkeleton: () => SettingsPageSkeleton,
  Skeleton: () => Skeleton,
  StatsCardsSkeleton: () => StatsCardsSkeleton,
  Table: () => Table,
  TableBody: () => TableBody,
  TableCaption: () => TableCaption,
  TableCell: () => TableCell,
  TableFooter: () => TableFooter,
  TableHead: () => TableHead,
  TableHeader: () => TableHeader,
  TableRow: () => TableRow,
  TableSkeleton: () => TableSkeleton,
  Textarea: () => Textarea,
  ToastContainer: () => ToastContainer,
  Toaster: () => ToastContainer,
  ToggleSwitch: () => ToggleSwitch,
  badgeVariants: () => badgeVariants,
  buttonVariants: () => buttonVariants,
  cn: () => import_shared.cn,
  useAccountSettings: () => useAccountSettings,
  useActivityLogger: () => useActivityLogger,
  useAdminActivityLogger: () => useAdminActivityLogger,
  useAdminDashboardLogger: () => useAdminDashboardLogger,
  useAdminPageViewLogger: () => useAdminPageViewLogger,
  useApiError: () => useApiError,
  useNotification: () => useNotification,
  usePaddle: () => usePaddle,
  usePageViewLogger: () => usePageViewLogger,
  usePaymentErrorHandler: () => usePaymentErrorHandler,
  useToast: () => useToast,
  useZodForm: () => useZodForm
});
module.exports = __toCommonJS(index_exports);

// src/components/badge.tsx
var import_class_variance_authority = require("class-variance-authority");

// src/lib/utils.ts
var import_shared = require("@indexnow/shared");

// src/components/badge.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority.cva)(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: (0, import_shared.cn)(badgeVariants({ variant }), className), ...props });
}

// src/components/button.tsx
var React = __toESM(require("react"));
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority2 = require("class-variance-authority");
var import_jsx_runtime2 = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority2.cva)(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        info: "bg-info text-info-foreground hover:bg-info/90"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? import_react_slot.Slot : "button";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      Comp,
      {
        className: (0, import_shared.cn)(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/components/card.tsx
var React2 = __toESM(require("react"));
var import_jsx_runtime3 = require("react/jsx-runtime");
var Card = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
  "div",
  {
    ref,
    className: (0, import_shared.cn)(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
  "div",
  {
    ref,
    className: (0, import_shared.cn)("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
  "h3",
  {
    ref,
    className: (0, import_shared.cn)(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
  "p",
  {
    ref,
    className: (0, import_shared.cn)("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref, className: (0, import_shared.cn)("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
  "div",
  {
    ref,
    className: (0, import_shared.cn)("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/checkbox.tsx
var React3 = __toESM(require("react"));
var CheckboxPrimitive = __toESM(require("@radix-ui/react-checkbox"));
var import_lucide_react = require("lucide-react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var Checkbox = React3.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  CheckboxPrimitive.Root,
  {
    ref,
    className: (0, import_shared.cn)(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      CheckboxPrimitive.Indicator,
      {
        className: (0, import_shared.cn)("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react.Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/dialog.tsx
var React4 = __toESM(require("react"));
var DialogPrimitive = __toESM(require("@radix-ui/react-dialog"));
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var Dialog = DialogPrimitive.Root;
var DialogTrigger = DialogPrimitive.Trigger;
var DialogPortal = DialogPrimitive.Portal;
var DialogClose = DialogPrimitive.Close;
var DialogOverlay = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  DialogPrimitive.Overlay,
  {
    ref,
    className: (0, import_shared.cn)(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React4.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(DialogPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(DialogOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    DialogPrimitive.Content,
    {
      ref,
      className: (0, import_shared.cn)(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react2.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  "div",
  {
    className: (0, import_shared.cn)(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  "div",
  {
    className: (0, import_shared.cn)(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  DialogPrimitive.Title,
  {
    ref,
    className: (0, import_shared.cn)(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  DialogPrimitive.Description,
  {
    ref,
    className: (0, import_shared.cn)("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// src/components/dropdown-menu.tsx
var React5 = __toESM(require("react"));
var DropdownMenuPrimitive = __toESM(require("@radix-ui/react-dropdown-menu"));
var import_lucide_react3 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React5.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: (0, import_shared.cn)(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: (0, import_shared.cn)(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React5.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: (0, import_shared.cn)(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React5.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: (0, import_shared.cn)(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React5.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: (0, import_shared.cn)(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React5.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: (0, import_shared.cn)(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react3.Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React5.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: (0, import_shared.cn)(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: (0, import_shared.cn)("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "span",
    {
      className: (0, import_shared.cn)("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/input.tsx
var React6 = __toESM(require("react"));
var import_jsx_runtime7 = require("react/jsx-runtime");
var Input = React6.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "input",
      {
        type,
        className: (0, import_shared.cn)(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// src/components/label.tsx
var React7 = __toESM(require("react"));
var LabelPrimitive = __toESM(require("@radix-ui/react-label"));
var import_class_variance_authority3 = require("class-variance-authority");
var import_jsx_runtime8 = require("react/jsx-runtime");
var labelVariants = (0, import_class_variance_authority3.cva)(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
var Label2 = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  LabelPrimitive.Root,
  {
    ref,
    className: (0, import_shared.cn)(labelVariants(), className),
    ...props
  }
));
Label2.displayName = LabelPrimitive.Root.displayName;

// src/components/loading-spinner.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function LoadingSpinner({ className, size = "md" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: (0, import_shared.cn)("animate-spin rounded-full border-2 border-muted border-t-brand-primary", sizeClasses[size], className), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "sr-only", children: "Loading..." }) });
}

// src/components/select.tsx
var React8 = __toESM(require("react"));
var SelectPrimitive = __toESM(require("@radix-ui/react-select"));
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React8.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
  SelectPrimitive.Trigger,
  {
    ref,
    className: (0, import_shared.cn)(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react4.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: (0, import_shared.cn)(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react4.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: (0, import_shared.cn)(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react4.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React8.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
  SelectPrimitive.Content,
  {
    ref,
    className: (0, import_shared.cn)(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        SelectPrimitive.Viewport,
        {
          className: (0, import_shared.cn)(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: (0, import_shared.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React8.forwardRef(({ className, children, value, ...props }, ref) => {
  const safeValue = value === "" ? "__placeholder__" : value;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    SelectPrimitive.Item,
    {
      ref,
      value: safeValue,
      className: (0, import_shared.cn)(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react4.Check, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectPrimitive.ItemText, { children })
      ]
    }
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: (0, import_shared.cn)("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/separator.tsx
var React9 = __toESM(require("react"));
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"));
var import_jsx_runtime11 = require("react/jsx-runtime");
var Separator3 = React9.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: (0, import_shared.cn)(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator3.displayName = SeparatorPrimitive.Root.displayName;

// src/components/skeleton.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
function Skeleton({ className = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `animate-pulse bg-muted rounded ${className}` });
}
function TableSkeleton({ rows = 5, columns = 4 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "bg-background rounded-lg border border-border overflow-hidden", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "border-b border-border bg-secondary px-6 py-3 flex gap-4", children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 flex-1" }, i)) }),
    Array.from({ length: rows }).map((_, row) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "px-6 py-4 border-b border-border last:border-0 flex gap-4 items-center", children: Array.from({ length: columns }).map((_2, col) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: `h-4 flex-1 ${col === 0 ? "max-w-[200px]" : ""}` }, col)) }, row))
  ] });
}
function StatsCardsSkeleton({ count = 4 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(count, 4)} gap-6`, children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "bg-background rounded-lg border border-border p-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-12 h-12 rounded-lg" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-7 w-16 mb-2" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-24 mb-1" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-32" })
  ] }, i)) });
}
function AdminPageSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-7 w-48 mb-2" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-64" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-28 rounded-lg" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(StatsCardsSkeleton, { count: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(TableSkeleton, { rows: 6, columns: 5 })
  ] });
}
function ProfileSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "grid lg:grid-cols-2 gap-8 items-stretch", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default p-6 rounded-lg flex flex-col", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-48 mb-6" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex-1 space-y-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-20 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-24 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-64 mt-1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-28 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-40" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-32 mt-6" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default p-6 rounded-lg flex flex-col", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-40 mb-6" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex-1 space-y-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-32 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-28 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-36 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-36 mt-6" })
    ] })
  ] });
}
function OrderDetailSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "text-center", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-8 rounded-full mx-auto mb-4" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-32 mx-auto" })
  ] }) });
}
function AdminUserDetailSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex items-center justify-center min-h-96", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-12 rounded-full" }) });
}
function DashboardSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-8", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default rounded-xl p-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-start justify-between mb-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-12 h-12 rounded-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-48 mb-2" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-64" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-20 h-8 rounded-full" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "grid md:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "bg-secondary rounded-lg p-4 border border-border", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-20 mb-2" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-12" })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "grid lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default rounded-xl p-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-8 h-8 rounded-lg" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-32 mb-1" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-24" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex space-x-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-24 rounded-lg" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-20 rounded-lg" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "grid md:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "bg-secondary rounded-lg p-4 border border-border", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-20 mb-2" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-12" })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default rounded-xl p-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-48" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-24" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "space-y-3", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center justify-between p-4 bg-secondary rounded-lg border border-border", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-1/3 mb-2" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-1/2" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-12" })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "space-y-6", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default rounded-xl p-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-24 mb-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-full" }, i)) })
      ] }) })
    ] })
  ] });
}
function ApiQuotaSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "text-center py-8", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-8 rounded-full mx-auto mb-2" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-20 mx-auto" })
  ] });
}
function IndexNowFormSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-32 mb-1" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-80" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "grid lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "lg:col-span-2", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default p-6 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center gap-2 mb-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-5 h-5" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-48" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mb-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-20 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-24 mt-1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "mb-6", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex border border-border rounded-lg p-1 bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "flex-1 h-10 mx-1" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "flex-1 h-10 mx-1" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mb-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-32 mb-2" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-32 w-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex justify-between mt-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-64" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-3 w-16" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mb-6 pt-4 border-t border-border", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-4 h-4" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-16" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "space-y-4", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-20 mb-2" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-full" })
          ] }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "flex-1 h-12" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-12 w-24" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "lg:col-span-1", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default p-6 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-32 mb-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ApiQuotaSkeleton, {})
      ] }) })
    ] })
  ] });
}
function SettingsPageSkeleton() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-8 w-40 mb-2" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-64" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "grid lg:grid-cols-2 xl:grid-cols-4 gap-6", children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "card-default rounded-lg p-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "w-8 h-8 rounded-lg mr-3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-24 mb-1" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-32" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-10 w-full" })
    ] }, i)) })
  ] });
}

// src/components/table.tsx
var React10 = __toESM(require("react"));
var import_jsx_runtime13 = require("react/jsx-runtime");
var Table = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "table",
  {
    ref,
    className: (0, import_shared.cn)("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
var TableHeader = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("thead", { ref, className: (0, import_shared.cn)("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
var TableBody = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "tbody",
  {
    ref,
    className: (0, import_shared.cn)("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
var TableFooter = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "tfoot",
  {
    ref,
    className: (0, import_shared.cn)(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
var TableRow = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "tr",
  {
    ref,
    className: (0, import_shared.cn)(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
var TableHead = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "th",
  {
    ref,
    className: (0, import_shared.cn)(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
var TableCell = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "td",
  {
    ref,
    className: (0, import_shared.cn)("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
var TableCaption = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  "caption",
  {
    ref,
    className: (0, import_shared.cn)("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";

// src/components/textarea.tsx
var React11 = __toESM(require("react"));
var import_jsx_runtime14 = require("react/jsx-runtime");
var Textarea = React11.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      "textarea",
      {
        className: (0, import_shared.cn)(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";

// src/components/toast.tsx
var React12 = __toESM(require("react"));
var import_navigation = require("next/navigation");
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime15 = require("react/jsx-runtime");
var ToastProvider = React12.createContext(null);
function ToastContainer({ children }) {
  const [toasts, setToasts] = React12.useState([]);
  const addToast = React12.useCallback((toast) => {
    const id = typeof window !== "undefined" ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 5e3);
  }, []);
  const removeToast = React12.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const pathname = (0, import_navigation.usePathname)();
  React12.useEffect(() => {
    setToasts((prev) => prev.filter((t) => t.persistent));
  }, [pathname]);
  const contextValue = React12.useMemo(() => ({
    toasts,
    addToast,
    removeToast
  }), [toasts, addToast, removeToast]);
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(ToastProvider.Provider, { value: contextValue, children: [
    children,
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "fixed top-4 right-4 z-50 space-y-2", children: toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      "div",
      {
        className: (0, import_shared.cn)(
          "rounded-lg border p-4 shadow-lg transition-all duration-300",
          "max-w-sm w-full",
          {
            "bg-background border-success text-foreground": toast.type === "success",
            "bg-background border-error text-foreground": toast.type === "error",
            "bg-background border-warning text-foreground": toast.type === "warning",
            "bg-background border-info text-foreground": toast.type === "info" || !toast.type
          }
        ),
        children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex-1", children: [
            toast.title && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "font-semibold text-sm mb-1", children: toast.title }),
            toast.description && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "text-sm text-muted-foreground", children: toast.description }),
            toast.action && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              "button",
              {
                onClick: toast.action.onClick,
                className: "mt-2 text-xs font-medium underline hover:no-underline transition-all",
                children: toast.action.label
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            "button",
            {
              onClick: () => removeToast(toast.id),
              className: "ml-2 text-muted-foreground hover:text-foreground transition-colors",
              children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react5.X, { className: "h-4 w-4" })
            }
          )
        ] })
      },
      toast.id
    )) })
  ] });
}
function useToast() {
  const context = React12.useContext(ToastProvider);
  if (!context) {
    throw new Error("useToast must be used within a ToastContainer");
  }
  return context;
}

// src/components/not-found-page.tsx
var import_link = __toESM(require("next/link"));
var import_jsx_runtime16 = require("react/jsx-runtime");
function NotFoundPage({
  heading = "Page Not Found",
  description = "The page you are looking for does not exist or has been moved.",
  backLabel = "Go to Dashboard",
  backHref = "/"
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "flex items-center justify-center min-h-[60vh]", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "text-center space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "text-7xl font-bold text-gray-200 dark:text-gray-700", children: "404" }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { className: "text-lg font-semibold text-gray-700 dark:text-gray-300", children: heading }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: description }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      import_link.default,
      {
        href: backHref,
        className: "inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors",
        children: backLabel
      }
    )
  ] }) });
}

// src/components/toggle-switch.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
function ToggleSwitch({
  checked,
  onChange,
  testId
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("label", { className: "relative inline-flex cursor-pointer items-center shrink-0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "input",
      {
        type: "checkbox",
        className: "sr-only",
        checked,
        onChange: (e) => onChange(e.target.checked),
        "data-testid": testId
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "div",
      {
        className: `h-[22px] w-10 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`,
        children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          "div",
          {
            className: `mt-[2px] ml-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"}`
          }
        )
      }
    )
  ] });
}

// src/components/error-state.tsx
var import_lucide_react6 = require("lucide-react");
var import_navigation2 = require("next/navigation");

// src/components/alert.tsx
var React13 = __toESM(require("react"));
var import_class_variance_authority4 = require("class-variance-authority");
var import_jsx_runtime18 = require("react/jsx-runtime");
var alertVariants = (0, import_class_variance_authority4.cva)(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = React13.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  "div",
  {
    ref,
    role: "alert",
    className: (0, import_shared.cn)(alertVariants({ variant }), className),
    ...props
  }
));
Alert.displayName = "Alert";
var AlertDescription = React13.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  "div",
  {
    ref,
    className: (0, import_shared.cn)("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";

// src/components/error-state.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  errorId,
  onRetry,
  showHomeButton = false,
  retryLabel = "Try Again",
  variant = "card"
}) {
  const router = (0, import_navigation2.useRouter)();
  const handleCopyErrorId = () => {
    if (errorId && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(errorId).then(() => {
      }).catch(() => {
      });
    }
  };
  if (variant === "inline") {
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Alert, { variant: "destructive", className: "my-4", "data-testid": "error-state-inline", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react6.AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(AlertDescription, { className: "ml-2 flex-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { "data-testid": "error-message", children: message }),
          onRetry && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
            Button,
            {
              onClick: onRetry,
              variant: "outline",
              size: "sm",
              className: "ml-4",
              "data-testid": "button-retry",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react6.RefreshCw, { className: "h-3 w-3 mr-2" }),
                retryLabel
              ]
            }
          )
        ] }),
        errorId && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
          "button",
          {
            onClick: handleCopyErrorId,
            className: "text-xs text-muted-foreground hover:text-foreground mt-2 underline cursor-pointer",
            "data-testid": "button-copy-error-id",
            children: [
              "Error ID: ",
              errorId,
              " (click to copy)"
            ]
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "flex items-center justify-center min-h-[400px] p-4", "data-testid": "error-state-card", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Card, { className: "w-full max-w-md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(CardHeader, { className: "text-center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react6.AlertCircle, { className: "h-6 w-6 text-destructive", "data-testid": "icon-error" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(CardTitle, { className: "text-xl", "data-testid": "error-title", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(CardDescription, { className: "mt-2", "data-testid": "error-message", children: message })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(CardContent, { className: "space-y-4", children: [
      errorId && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rounded-md bg-muted p-3 text-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "text-sm text-muted-foreground", children: "Error ID" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
          "button",
          {
            onClick: handleCopyErrorId,
            className: "text-sm font-mono text-foreground hover:text-primary underline cursor-pointer",
            "data-testid": "button-copy-error-id",
            title: "Click to copy error ID",
            children: errorId
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: "Click to copy" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "flex flex-col gap-2 sm:flex-row sm:justify-center", children: [
        onRetry && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
          Button,
          {
            onClick: onRetry,
            variant: "default",
            className: "w-full sm:w-auto",
            "data-testid": "button-retry",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react6.RefreshCw, { className: "h-4 w-4 mr-2" }),
              retryLabel
            ]
          }
        ),
        showHomeButton && /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
          Button,
          {
            onClick: () => router.push("/"),
            variant: "outline",
            className: "w-full sm:w-auto",
            "data-testid": "button-home",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_lucide_react6.Home, { className: "h-4 w-4 mr-2" }),
              "Go to Dashboard"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { className: "text-xs text-center text-muted-foreground", children: [
        "If this problem persists, please contact support",
        errorId && " with the error ID above",
        "."
      ] })
    ] })
  ] }) });
}

// src/components/modals/ConfirmationDialog.tsx
var import_jsx_runtime20 = require("react/jsx-runtime");
function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onClose
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(DialogContent, { className: "sm:max-w-[425px]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(DialogHeader, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(DialogTitle, { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(DialogDescription, { children: message })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(DialogFooter, { className: "mt-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          disabled: loading,
          children: cancelText
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        Button,
        {
          variant: variant === "destructive" ? "destructive" : "default",
          onClick: onConfirm,
          disabled: loading,
          children: loading ? "Processing..." : confirmText
        }
      )
    ] })
  ] }) });
}

// src/components/checkout/BillingPeriodSelector.tsx
var import_shared2 = require("@indexnow/shared");
var import_jsx_runtime21 = require("react/jsx-runtime");
function BillingPeriodSelector({
  selectedPackage,
  selectedPeriod,
  onPeriodChange
}) {
  if (!selectedPackage || !selectedPackage.pricing_tiers) {
    return null;
  }
  const pricingTiers = selectedPackage.pricing_tiers;
  const periodOrder = ["monthly", "quarterly", "biannual", "annual"];
  const getTierForPeriod = (period) => {
    if (Array.isArray(pricingTiers)) {
      return pricingTiers.find((t) => t.period === period);
    }
    return pricingTiers[period];
  };
  const availablePeriods = periodOrder.filter((period) => getTierForPeriod(period) !== void 0);
  const formatPeriodOptions = () => {
    return availablePeriods.map((period) => {
      const tierData = getTierForPeriod(period);
      return {
        period,
        period_label: tierData.period_label || period.charAt(0).toUpperCase() + period.slice(1),
        regular_price: tierData.regular_price,
        promo_price: tierData.promo_price,
        paddle_price_id: tierData.paddle_price_id
      };
    });
  };
  const periodOptions = formatPeriodOptions();
  const calculateDiscount = (regular, promo) => {
    if (!promo || promo >= regular) return 0;
    return Math.round((regular - promo) / regular * 100);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rounded-xl border border-border bg-background p-2", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "grid gap-2", style: { gridTemplateColumns: `repeat(${Math.min(periodOptions.length, 4)}, 1fr)` }, children: periodOptions.map((option, index) => {
    const discount = calculateDiscount(option.regular_price, option.promo_price);
    const finalPrice = option.promo_price || option.regular_price;
    const isSelected = selectedPeriod === option.period;
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
      "button",
      {
        type: "button",
        className: `relative rounded-lg px-3 py-3 text-center transition-all ${isSelected ? "bg-accent text-white shadow-sm" : "hover:bg-secondary text-foreground"}`,
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (selectedPeriod !== option.period) {
            onPeriodChange(option.period);
          }
        },
        "data-testid": `billing-period-${option.period}`,
        children: [
          discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
            "span",
            {
              className: `absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[10px] font-semibold ${isSelected ? "bg-white text-accent" : "bg-accent/10 text-accent"}`,
              children: [
                "-",
                discount,
                "%"
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: `block text-xs font-medium ${isSelected ? "text-white/80" : "text-muted-foreground"}`, children: option.period_label }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "mt-0.5 block text-sm font-bold", "data-testid": `price-${option.period}`, children: (0, import_shared2.formatCurrency)(finalPrice) }),
          option.promo_price && option.regular_price > 0 && option.regular_price !== option.promo_price && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
            "span",
            {
              className: `block text-[11px] line-through ${isSelected ? "text-white/50" : "text-muted-foreground/60"}`,
              children: (0, import_shared2.formatCurrency)(option.regular_price)
            }
          )
        ]
      },
      `${option.period}-${index}`
    );
  }) }) });
}

// src/components/checkout/OrderSummary.tsx
var import_lucide_react7 = require("lucide-react");
var import_shared3 = require("@indexnow/shared");
var import_jsx_runtime22 = require("react/jsx-runtime");
function OrderSummary({ selectedPackage, billingPeriod, isTrialFlow = false }) {
  if (!selectedPackage) return null;
  const calculatePrice = () => {
    if (selectedPackage.pricing_tiers?.[billingPeriod]) {
      const pricingData = selectedPackage.pricing_tiers[billingPeriod];
      const price2 = pricingData.promo_price || pricingData.regular_price;
      const originalPrice2 = pricingData.regular_price;
      const discount2 = pricingData.promo_price ? Math.round((originalPrice2 - pricingData.promo_price) / originalPrice2 * 100) : 0;
      const periodLabel2 = pricingData.period_label || billingPeriod;
      return { price: price2, discount: discount2, originalPrice: originalPrice2, periodLabel: periodLabel2 };
    }
    return { price: 0, discount: 0, originalPrice: 0, periodLabel: billingPeriod };
  };
  const { price, discount, originalPrice, periodLabel } = calculatePrice();
  const getTrialPricing = () => {
    if (!isTrialFlow) return null;
    const trialAmount = price > 0 ? price : 0;
    const trialDays = 7;
    const futureDate = /* @__PURE__ */ new Date();
    futureDate.setDate(futureDate.getDate() + trialDays);
    const futureDateStr = futureDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    return {
      trialAmount,
      futureBillingDate: futureDateStr,
      futureAmount: price
    };
  };
  const trialInfo = getTrialPricing();
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "sticky top-20 rounded-xl border border-border bg-background", children: [
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "px-5 pt-5 pb-4", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { className: "text-sm font-semibold text-foreground", children: "Order summary" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "mx-5 rounded-lg bg-secondary/50 p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: "font-semibold text-foreground", children: selectedPackage.name }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "mt-0.5 text-xs text-muted-foreground capitalize", children: [
            periodLabel,
            " billing"
          ] })
        ] }),
        discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent", children: [
          "-",
          discount,
          "%"
        ] })
      ] }),
      selectedPackage.features && selectedPackage.features.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "mt-3 space-y-1.5", children: [
        selectedPackage.features.slice(0, 4).map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react7.Check, { className: "h-3.5 w-3.5 shrink-0 text-accent" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-muted-foreground", children: feature })
        ] }, index)),
        selectedPackage.features.length > 4 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "pl-5.5 text-[11px] text-muted-foreground/70", children: [
          "+",
          selectedPackage.features.length - 4,
          " more"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "px-5 py-4 space-y-3", children: isTrialFlow && trialInfo ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-muted-foreground", children: "Today's charge" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "font-medium text-foreground", children: (0, import_shared3.formatCurrency)(trialInfo.trialAmount) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "border-t border-border" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rounded-lg bg-accent/5 border border-accent/10 px-3 py-2.5", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: "text-xs text-muted-foreground", children: [
        "After your 7-day trial, you'll be charged",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "font-medium text-foreground", children: (0, import_shared3.formatCurrency)(trialInfo.futureAmount) }),
        " ",
        "on ",
        trialInfo.futureBillingDate,
        "."
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "border-t border-border" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-sm font-semibold text-foreground", children: "Total today" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-lg font-bold text-foreground", children: (0, import_shared3.formatCurrency)(trialInfo.trialAmount) })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-muted-foreground", children: "Subtotal" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "font-medium text-foreground", children: (0, import_shared3.formatCurrency)(originalPrice) })
      ] }),
      discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "text-muted-foreground", children: [
          "Discount (",
          discount,
          "%)"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "font-medium text-accent", children: [
          "-",
          (0, import_shared3.formatCurrency)(originalPrice - price)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-muted-foreground", children: "Tax" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "font-medium text-foreground", children: (0, import_shared3.formatCurrency)(0) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "border-t border-border" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-sm font-semibold text-foreground", children: "Total" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-lg font-bold text-foreground", children: (0, import_shared3.formatCurrency)(price) })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "border-t border-border px-5 py-3 flex items-center justify-center gap-1.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react7.Shield, { className: "h-3.5 w-3.5 text-muted-foreground/60" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "text-[11px] text-muted-foreground/60", children: "Encrypted & secure checkout" })
    ] })
  ] });
}

// src/components/checkout/PaymentErrorBoundary.tsx
var import_react = __toESM(require("react"));
var import_shared4 = require("@indexnow/shared");
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime23 = require("react/jsx-runtime");
var PaymentErrorBoundary = class extends import_react.Component {
  constructor(props) {
    super(props);
    this.handleRetry = () => {
      this.setState({
        hasError: false,
        error: void 0,
        errorId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      });
    };
    this.handleReload = () => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    };
    this.handleGoHome = () => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    };
    this.state = {
      hasError: false,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
  }
  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      errorId: this.state.errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server"
    };
    this.props.onError?.(error, errorInfo);
    import_shared4.logger.error({ error, errorDetails }, "Payment Error Boundary");
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(Card, { className: "border-destructive bg-destructive/5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(CardTitle, { className: "text-destructive flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react8.AlertTriangle, { className: "h-5 w-5 mr-2" }),
          "Payment System Error"
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { className: "text-muted-foreground", children: "We encountered an unexpected error while processing your payment. This error has been logged and our team has been notified." }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "text-sm text-muted-foreground bg-secondary p-3 rounded border", children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "font-medium text-foreground mb-1", children: "Error Details:" }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
                "Error ID: ",
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("code", { className: "text-xs bg-white px-1 py-0.5 rounded", children: this.state.errorId })
              ] }),
              this.state.error?.name && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
                "Type: ",
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("code", { className: "text-xs bg-white px-1 py-0.5 rounded", children: this.state.error.name })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "flex flex-col sm:flex-row gap-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
              Button,
              {
                onClick: this.handleRetry,
                variant: "outline",
                className: "flex-1 border-accent text-accent hover:bg-accent hover:text-white",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react8.RefreshCw, { className: "h-4 w-4 mr-2" }),
                  "Try Again"
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
              Button,
              {
                onClick: this.handleReload,
                variant: "outline",
                className: "flex-1",
                children: "Reload Page"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
              Button,
              {
                onClick: this.handleGoHome,
                className: "flex-1 bg-primary hover:bg-primary/90",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_lucide_react8.Home, { className: "h-4 w-4 mr-2" }),
                  "Go to Dashboard"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "text-xs text-muted-foreground border-t border-border pt-3", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { children: "If this problem persists, please contact support with the error ID above." }) })
        ] })
      ] });
    }
    return this.props.children;
  }
};
function usePaymentErrorHandler() {
  const handleError = import_react.default.useCallback((error, errorInfo) => {
    const errorDetails = {
      errorId: `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server"
    };
    return errorDetails;
  }, []);
  return { handleError };
}

// src/components/checkout/CheckoutForm.tsx
var import_jsx_runtime24 = require("react/jsx-runtime");
var COUNTRIES = [
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
  { value: "IN", label: "India" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "BR", label: "Brazil" },
  { value: "CA", label: "Canada" },
  { value: "KR", label: "South Korea" }
];
var CheckoutForm = ({ form, setForm }) => {
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rounded-xl border border-border bg-background p-5 space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(Label2, { htmlFor: "first_name", className: "text-xs font-medium text-muted-foreground", children: [
          "First name ",
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          Input,
          {
            id: "first_name",
            type: "text",
            required: true,
            value: form.first_name,
            onChange: update("first_name"),
            className: "mt-1.5 h-10",
            placeholder: "John"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Label2, { htmlFor: "last_name", className: "text-xs font-medium text-muted-foreground", children: "Last name" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          Input,
          {
            id: "last_name",
            type: "text",
            value: form.last_name,
            onChange: update("last_name"),
            className: "mt-1.5 h-10",
            placeholder: "Doe"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(Label2, { htmlFor: "email", className: "text-xs font-medium text-muted-foreground", children: [
        "Email address ",
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "text-destructive", children: "*" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        Input,
        {
          id: "email",
          type: "email",
          required: true,
          value: form.email,
          onChange: update("email"),
          className: "mt-1.5 h-10",
          placeholder: "john@example.com"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "sm:col-span-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(Label2, { htmlFor: "phone", className: "text-xs font-medium text-muted-foreground", children: [
          "Phone number ",
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          Input,
          {
            id: "phone",
            type: "tel",
            required: true,
            value: form.phone,
            onChange: update("phone"),
            className: "mt-1.5 h-10",
            placeholder: "+62 812 3456 7890"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "sm:col-span-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(Label2, { htmlFor: "country", className: "text-xs font-medium text-muted-foreground", children: "Country" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          Select,
          {
            value: form.country,
            onValueChange: (value) => setForm((prev) => ({ ...prev, country: value })),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectTrigger, { className: "mt-1.5 h-10", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectValue, { placeholder: "Select" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectContent, { children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SelectItem, { value: c.value, children: c.label }, c.value)) })
            ]
          }
        )
      ] })
    ] })
  ] });
};

// src/components/checkout/CheckoutHeader.tsx
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime25 = require("react/jsx-runtime");
var CheckoutHeader = ({ selectedPackage, onBack }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: "mb-8", children: [
    /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
      Button,
      {
        variant: "ghost",
        onClick: onBack,
        className: "mb-4 text-muted-foreground hover:text-foreground hover:bg-secondary border-0",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_lucide_react9.ArrowLeft, { className: "h-4 w-4 mr-2" }),
          "Back to Plans"
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("h1", { className: "text-2xl font-bold text-foreground", children: "Complete Your Order" }),
    /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("p", { className: "text-muted-foreground mt-1", children: [
      "Fill in your details to upgrade to ",
      selectedPackage?.name || "selected plan"
    ] })
  ] });
};

// src/components/checkout/LoadingStates.tsx
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime26 = require("react/jsx-runtime");
var CheckoutLoading = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "flex min-h-[60vh] items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "flex flex-col items-center gap-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_lucide_react10.Loader2, { className: "h-6 w-6 animate-spin text-accent" }),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "text-sm text-muted-foreground", children: "Loading checkout\u2026" })
  ] }) });
};
var PackageNotFound = ({ onBack }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "flex min-h-[60vh] items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "text-center", children: [
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("h2", { className: "text-lg font-semibold text-foreground", children: "Package not found" }),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { className: "mt-1 text-sm text-muted-foreground", children: "The selected package could not be found." }),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
      Button,
      {
        onClick: onBack,
        variant: "outline",
        className: "mt-4",
        children: "Back to Billing"
      }
    )
  ] }) });
};

// src/components/admin/errors/ErrorDetailModal.tsx
var import_react_query = require("@tanstack/react-query");
var import_client = require("@indexnow/database/client");
var import_lucide_react11 = require("lucide-react");

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/toDate.mjs
function toDate(argument) {
  const argStr = Object.prototype.toString.call(argument);
  if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
    return new argument.constructor(+argument);
  } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
    return new Date(argument);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/constructFrom.mjs
function constructFrom(date, value) {
  if (date instanceof Date) {
    return new date.constructor(value);
  } else {
    return new Date(value);
  }
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/constants.mjs
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var minutesInMonth = 43200;
var minutesInDay = 1440;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/_lib/defaultOptions.mjs
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.mjs
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/compareAsc.mjs
function compareAsc(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const diff = _dateLeft.getTime() - _dateRight.getTime();
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  } else {
    return diff;
  }
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/constructNow.mjs
function constructNow(date) {
  return constructFrom(date, Date.now());
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/differenceInCalendarMonths.mjs
function differenceInCalendarMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const yearDiff = _dateLeft.getFullYear() - _dateRight.getFullYear();
  const monthDiff = _dateLeft.getMonth() - _dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/_lib/getRoundingMethod.mjs
function getRoundingMethod(method) {
  return (number) => {
    const round = method ? Math[method] : Math.trunc;
    const result = round(number);
    return result === 0 ? 0 : result;
  };
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/differenceInMilliseconds.mjs
function differenceInMilliseconds(dateLeft, dateRight) {
  return +toDate(dateLeft) - +toDate(dateRight);
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/endOfDay.mjs
function endOfDay(date) {
  const _date = toDate(date);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/endOfMonth.mjs
function endOfMonth(date) {
  const _date = toDate(date);
  const month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/isLastDayOfMonth.mjs
function isLastDayOfMonth(date) {
  const _date = toDate(date);
  return +endOfDay(_date) === +endOfMonth(_date);
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/differenceInMonths.mjs
function differenceInMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const sign = compareAsc(_dateLeft, _dateRight);
  const difference = Math.abs(
    differenceInCalendarMonths(_dateLeft, _dateRight)
  );
  let result;
  if (difference < 1) {
    result = 0;
  } else {
    if (_dateLeft.getMonth() === 1 && _dateLeft.getDate() > 27) {
      _dateLeft.setDate(30);
    }
    _dateLeft.setMonth(_dateLeft.getMonth() - sign * difference);
    let isLastMonthNotFull = compareAsc(_dateLeft, _dateRight) === -sign;
    if (isLastDayOfMonth(toDate(dateLeft)) && difference === 1 && compareAsc(dateLeft, _dateRight) === 1) {
      isLastMonthNotFull = false;
    }
    result = sign * (difference - Number(isLastMonthNotFull));
  }
  return result === 0 ? 0 : result;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/differenceInSeconds.mjs
function differenceInSeconds(dateLeft, dateRight, options) {
  const diff = differenceInMilliseconds(dateLeft, dateRight) / 1e3;
  return getRoundingMethod(options?.roundingMethod)(diff);
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US/_lib/formatDistance.mjs
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/_lib/buildFormatLongFn.mjs
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format = args.formats[width] || args.formats[args.defaultWidth];
    return format;
  };
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US/_lib/formatLong.mjs
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US/_lib/formatRelative.mjs
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/_lib/buildLocalizeFn.mjs
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US/_lib/localize.mjs
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/_lib/buildMatchFn.mjs
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/_lib/buildMatchPatternFn.mjs
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US/_lib/match.mjs
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/locale/en-US.mjs
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/formatDistance.mjs
function formatDistance2(date, baseDate, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const minutesInAlmostTwoDays = 2520;
  const comparison = compareAsc(date, baseDate);
  if (isNaN(comparison)) {
    throw new RangeError("Invalid time value");
  }
  const localizeOptions = Object.assign({}, options, {
    addSuffix: options?.addSuffix,
    comparison
  });
  let dateLeft;
  let dateRight;
  if (comparison > 0) {
    dateLeft = toDate(baseDate);
    dateRight = toDate(date);
  } else {
    dateLeft = toDate(date);
    dateRight = toDate(baseDate);
  }
  const seconds = differenceInSeconds(dateRight, dateLeft);
  const offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1e3;
  const minutes = Math.round((seconds - offsetInSeconds) / 60);
  let months;
  if (minutes < 2) {
    if (options?.includeSeconds) {
      if (seconds < 5) {
        return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);
      } else if (seconds < 10) {
        return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);
      } else if (seconds < 20) {
        return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);
      } else if (seconds < 40) {
        return locale.formatDistance("halfAMinute", 0, localizeOptions);
      } else if (seconds < 60) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", 1, localizeOptions);
      }
    } else {
      if (minutes === 0) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", minutes, localizeOptions);
      }
    }
  } else if (minutes < 45) {
    return locale.formatDistance("xMinutes", minutes, localizeOptions);
  } else if (minutes < 90) {
    return locale.formatDistance("aboutXHours", 1, localizeOptions);
  } else if (minutes < minutesInDay) {
    const hours = Math.round(minutes / 60);
    return locale.formatDistance("aboutXHours", hours, localizeOptions);
  } else if (minutes < minutesInAlmostTwoDays) {
    return locale.formatDistance("xDays", 1, localizeOptions);
  } else if (minutes < minutesInMonth) {
    const days = Math.round(minutes / minutesInDay);
    return locale.formatDistance("xDays", days, localizeOptions);
  } else if (minutes < minutesInMonth * 2) {
    months = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("aboutXMonths", months, localizeOptions);
  }
  months = differenceInMonths(dateRight, dateLeft);
  if (months < 12) {
    const nearestMonth = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("xMonths", nearestMonth, localizeOptions);
  } else {
    const monthsSinceStartOfYear = months % 12;
    const years = Math.trunc(months / 12);
    if (monthsSinceStartOfYear < 3) {
      return locale.formatDistance("aboutXYears", years, localizeOptions);
    } else if (monthsSinceStartOfYear < 9) {
      return locale.formatDistance("overXYears", years, localizeOptions);
    } else {
      return locale.formatDistance("almostXYears", years + 1, localizeOptions);
    }
  }
}

// ../../node_modules/.pnpm/date-fns@3.6.0/node_modules/date-fns/formatDistanceToNow.mjs
function formatDistanceToNow(date, options) {
  return formatDistance2(date, constructNow(date), options);
}

// src/components/admin/errors/ErrorDetailModal.tsx
var import_jsx_runtime27 = require("react/jsx-runtime");
function ErrorDetailModal({ errorId, open, onClose }) {
  const { addToast } = useToast();
  const { data, isLoading } = (0, import_react_query.useQuery)({
    queryKey: ["/api/v1/admin/errors", errorId],
    queryFn: async () => {
      return (0, import_client.apiRequest)(`/api/v1/admin/errors/${errorId}`);
    },
    enabled: !!errorId && open
  });
  const acknowledgeMutation = (0, import_react_query.useMutation)({
    mutationFn: async () => {
      return (0, import_client.apiRequest)(`/api/v1/admin/errors/${errorId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "acknowledge" })
      });
    },
    onSuccess: () => {
      import_client.queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/errors"] });
      addToast({
        title: "Error acknowledged",
        description: "The error has been marked as acknowledged.",
        type: "success"
      });
    },
    onError: () => {
      addToast({
        title: "Failed to acknowledge error",
        description: "Please try again.",
        type: "error"
      });
    }
  });
  const resolveMutation = (0, import_react_query.useMutation)({
    mutationFn: async () => {
      return (0, import_client.apiRequest)(`/api/v1/admin/errors/${errorId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "resolve" })
      });
    },
    onSuccess: () => {
      import_client.queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/errors"] });
      addToast({
        title: "Error resolved",
        description: "The error has been marked as resolved.",
        type: "success"
      });
      onClose();
    },
    onError: () => {
      addToast({
        title: "Failed to resolve error",
        description: "Please try again.",
        type: "error"
      });
    }
  });
  if (!errorId) return null;
  const error = data?.error;
  const userInfo = data?.userInfo;
  const relatedErrors = data?.relatedErrors || [];
  const getSeverityBadge = (severity) => {
    const variants = {
      CRITICAL: "destructive",
      HIGH: "default",
      MEDIUM: "secondary",
      LOW: "outline"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Badge, { variant: variants[severity] || "outline", children: severity });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(DialogContent, { className: "max-w-4xl max-h-[90vh]", "data-testid": "modal-error-detail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(DialogHeader, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.AlertCircle, { className: "h-5 w-5" }),
        "Error Details"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(DialogDescription, { children: "View detailed information about this error and take action" })
    ] }),
    isLoading ? /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-8 text-center text-muted-foreground", "data-testid": "detail-loading", children: "Loading error details..." }) : error ? /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "space-y-6 overflow-y-auto max-h-[70vh] pr-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center gap-2", children: [
          getSeverityBadge(error.severity),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("code", { className: "text-xs bg-muted px-2 py-1 rounded", "data-testid": "text-error-type", children: error.error_type })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "text-sm text-muted-foreground", "data-testid": "text-error-time", children: formatDistanceToNow(new Date(error.created_at), { addSuffix: true }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm", children: "User Message" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "text-sm", "data-testid": "text-user-message", children: error.user_message }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mt-4", children: "Technical Message" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("pre", { className: "text-xs bg-muted p-3 rounded overflow-x-auto", "data-testid": "text-technical-message", children: error.message })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "Error ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("code", { className: "text-xs bg-muted px-2 py-1 rounded", "data-testid": "text-error-id", children: error.id })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "Status Code" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "text-sm", "data-testid": "text-status-code", children: error.status_code || "N/A" })
        ] }),
        error.endpoint && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "col-span-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "Endpoint" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("code", { className: "text-xs bg-muted px-2 py-1 rounded", "data-testid": "text-endpoint", children: error.endpoint })
        ] }),
        error.http_method && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "HTTP Method" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Badge, { variant: "outline", "data-testid": "text-http-method", children: error.http_method })
        ] })
      ] }),
      userInfo && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(import_jsx_runtime27.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Separator3, {}),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("h3", { className: "font-semibold text-sm mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.User, { className: "h-4 w-4" }),
            "Affected User"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-sm space-y-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { "data-testid": "text-user-email", children: userInfo.email }),
            userInfo.full_name && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "text-muted-foreground", children: userInfo.full_name })
          ] })
        ] })
      ] }),
      error.stack_trace && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(import_jsx_runtime27.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Separator3, {}),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "Stack Trace" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("pre", { className: "text-xs bg-muted p-3 rounded overflow-x-auto max-h-48", "data-testid": "text-stack-trace", children: error.stack_trace })
        ] })
      ] }),
      relatedErrors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(import_jsx_runtime27.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Separator3, {}),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm mb-2", children: "Related Errors (Last 24h)" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "space-y-2", "data-testid": "list-related-errors", children: relatedErrors.slice(0, 5).map((relError) => /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "text-xs bg-muted p-2 rounded flex justify-between items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "truncate flex-1", children: relError.message }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "text-muted-foreground ml-2", children: formatDistanceToNow(new Date(relError.created_at), { addSuffix: true }) })
          ] }, relError.id)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(Separator3, {}),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { className: "font-semibold text-sm", children: "Resolution Status" }),
        error.resolved_at ? /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center gap-2 text-green-600 dark:text-green-400", "data-testid": "status-resolved", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.CheckCircle2, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: "text-sm", children: [
            "Resolved ",
            formatDistanceToNow(new Date(error.resolved_at), { addSuffix: true })
          ] })
        ] }) : error.acknowledged_at ? /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center gap-2 text-yellow-600 dark:text-yellow-400", "data-testid": "status-acknowledged", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.Clock, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: "text-sm", children: [
            "Acknowledged ",
            formatDistanceToNow(new Date(error.acknowledged_at), { addSuffix: true })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex items-center gap-2 text-red-600 dark:text-red-400", "data-testid": "status-new", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "text-sm", children: "Not yet acknowledged" })
        ] })
      ] }),
      !error.resolved_at && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "flex gap-2", children: [
        !error.acknowledged_at && /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
          Button,
          {
            onClick: () => acknowledgeMutation.mutate(),
            disabled: acknowledgeMutation.isPending,
            "data-testid": "button-acknowledge",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.Clock, { className: "h-4 w-4 mr-2" }),
              "Acknowledge"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
          Button,
          {
            onClick: () => resolveMutation.mutate(),
            disabled: resolveMutation.isPending,
            variant: "default",
            "data-testid": "button-resolve",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_lucide_react11.CheckCircle2, { className: "h-4 w-4 mr-2" }),
              "Mark as Resolved"
            ]
          }
        )
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "p-8 text-center text-muted-foreground", children: "Error not found" })
  ] }) });
}

// src/components/admin/errors/ErrorFilters.tsx
var import_react2 = require("react");
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime28 = require("react/jsx-runtime");
function ErrorFilters({ onFilterChange }) {
  const [search, setSearch] = (0, import_react2.useState)("");
  const [severity, setSeverity] = (0, import_react2.useState)(void 0);
  const [status, setStatus] = (0, import_react2.useState)(void 0);
  const [errorType, setErrorType] = (0, import_react2.useState)(void 0);
  const applyFilters = () => {
    onFilterChange({
      search: search || void 0,
      severity,
      status,
      type: errorType
    });
  };
  const clearFilters = () => {
    setSearch("");
    setSeverity(void 0);
    setStatus(void 0);
    setErrorType(void 0);
    onFilterChange({});
  };
  const hasActiveFilters = search || severity || status || errorType;
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex flex-col md:flex-row gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react12.Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          Input,
          {
            placeholder: "Search error messages...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && applyFilters(),
            className: "pl-9",
            "data-testid": "input-search"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Select, { value: severity, onValueChange: setSeverity, children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectTrigger, { className: "w-full md:w-[180px]", "data-testid": "select-severity", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectValue, { placeholder: "Severity" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(SelectContent, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "CRITICAL", children: "Critical" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "HIGH", children: "High" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "MEDIUM", children: "Medium" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "LOW", children: "Low" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Select, { value: status, onValueChange: setStatus, children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectTrigger, { className: "w-full md:w-[180px]", "data-testid": "select-status", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(SelectContent, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "new", children: "New" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "acknowledged", children: "Acknowledged" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "resolved", children: "Resolved" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Select, { value: errorType, onValueChange: setErrorType, children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectTrigger, { className: "w-full md:w-[200px]", "data-testid": "select-error-type", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectValue, { placeholder: "Error Type" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(SelectContent, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "AUTHENTICATION", children: "Authentication" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "DATABASE", children: "Database" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "EXTERNAL_API", children: "External API" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "VALIDATION", children: "Validation" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "SYSTEM", children: "System" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "PAYMENT", children: "Payment" }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(SelectItem, { value: "NETWORK", children: "Network" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Button, { onClick: applyFilters, "data-testid": "button-apply-filters", children: "Apply Filters" }),
      hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
        Button,
        {
          variant: "outline",
          onClick: clearFilters,
          "data-testid": "button-clear-filters",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_lucide_react12.X, { className: "h-4 w-4 mr-2" }),
            "Clear All"
          ]
        }
      )
    ] })
  ] });
}

// src/components/admin/errors/ErrorListTable.tsx
var import_react3 = require("react");
var import_react_query2 = require("@tanstack/react-query");
var import_client2 = require("@indexnow/database/client");
var import_lucide_react13 = require("lucide-react");
var import_jsx_runtime29 = require("react/jsx-runtime");
var ErrorListTable = (0, import_react3.memo)(function ErrorListTable2({
  filters,
  onErrorClick
}) {
  const [page, setPage] = (0, import_react3.useState)(1);
  const limit = 50;
  const { data, isLoading } = (0, import_react_query2.useQuery)({
    queryKey: ["/api/v1/admin/errors", page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return (0, import_client2.apiRequest)(`/api/v1/admin/errors?${params}`);
    },
    refetchInterval: 3e4
    // Refresh every 30 seconds
  });
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "rounded-lg border", "data-testid": "table-loading", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "text-muted-foreground p-8 text-center", children: "Loading errors..." }) });
  }
  const errors = data?.errors || [];
  const pagination = data?.pagination;
  const getSeverityBadge = (severity) => {
    const variants = {
      CRITICAL: "destructive",
      HIGH: "default",
      MEDIUM: "secondary",
      LOW: "outline"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
      Badge,
      {
        variant: variants[severity] || "outline",
        "data-testid": `badge-severity-${severity.toLowerCase()}`,
        children: severity
      }
    );
  };
  const getStatusBadge = (error) => {
    if (error.resolved_at) {
      return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        Badge,
        {
          variant: "outline",
          className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
          "data-testid": "badge-status-resolved",
          children: "Resolved"
        }
      );
    }
    if (error.acknowledged_at) {
      return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
        Badge,
        {
          variant: "outline",
          className: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
          "data-testid": "badge-status-acknowledged",
          children: "Acknowledged"
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
      Badge,
      {
        variant: "outline",
        className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        "data-testid": "badge-status-new",
        children: "New"
      }
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { className: "rounded-lg border", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(Table, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(TableRow, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Time" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Type" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Message" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Severity" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Status" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { children: "Endpoint" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableBody, { children: errors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { colSpan: 7, className: "text-muted-foreground py-8 text-center", children: "No errors found" }) }) : errors.map((error) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(TableRow, { "data-testid": `row-error-${error.id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { className: "whitespace-nowrap", "data-testid": `text-time-${error.id}`, children: formatDistanceToNow(new Date(error.created_at), { addSuffix: true }) }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
          "code",
          {
            className: "bg-muted rounded px-2 py-1 text-xs",
            "data-testid": `text-type-${error.id}`,
            children: error.error_type
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { className: "max-w-md truncate", "data-testid": `text-message-${error.id}`, children: error.user_message || error.message }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { children: getSeverityBadge(error.severity) }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { children: getStatusBadge(error) }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
          TableCell,
          {
            className: "text-muted-foreground max-w-xs truncate text-sm",
            "data-testid": `text-endpoint-${error.id}`,
            children: error.endpoint || "N/A"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(TableCell, { className: "text-right", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => onErrorClick(error.id),
            "data-testid": `button-view-${error.id}`,
            children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react13.Eye, { className: "h-4 w-4" })
          }
        ) })
      ] }, error.id)) })
    ] }) }),
    pagination && pagination.totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { className: "text-muted-foreground text-sm", "data-testid": "text-pagination-info", children: [
        "Showing page ",
        pagination.page,
        " of ",
        pagination.totalPages,
        " (",
        pagination.total,
        " total errors)"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => setPage(page - 1),
            disabled: !pagination.hasPrevPage,
            "data-testid": "button-prev-page",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react13.ChevronLeft, { className: "h-4 w-4" }),
              "Previous"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => setPage(page + 1),
            disabled: !pagination.hasNextPage,
            "data-testid": "button-next-page",
            children: [
              "Next",
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_lucide_react13.ChevronRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] })
  ] });
});

// src/components/admin/errors/ErrorStatsCards.tsx
var import_react_query3 = require("@tanstack/react-query");
var import_client3 = require("@indexnow/database/client");
var import_lucide_react14 = require("lucide-react");
var import_jsx_runtime30 = require("react/jsx-runtime");
function ErrorStatsCards({ timeRange }) {
  const { data, isLoading } = (0, import_react_query3.useQuery)({
    queryKey: ["/api/v1/admin/errors/stats", timeRange],
    queryFn: async () => {
      return (0, import_client3.apiRequest)(`/api/v1/admin/errors/stats?range=${timeRange}`);
    },
    refetchInterval: 3e4
    // Refresh every 30 seconds
  });
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", "data-testid": "stats-loading", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(Card, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardHeader, { className: "animate-pulse", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "h-4 bg-muted rounded w-24" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "h-8 bg-muted rounded w-16" }) })
    ] }, i)) });
  }
  const stats = data;
  if (!stats) return null;
  const getTrendIcon = () => {
    if (stats.trend.direction === "up") return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.TrendingUp, { className: "h-4 w-4 text-destructive" });
    if (stats.trend.direction === "down") return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.TrendingDown, { className: "h-4 w-4 text-green-500" });
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.Minus, { className: "h-4 w-4 text-muted-foreground" });
  };
  const mostCommonType = Object.entries(stats.distributions.byType || {}).sort(([, a], [, b]) => b - a)[0];
  const errorRate = stats.summary.totalErrors / (timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720);
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(Card, { "data-testid": "card-total-errors", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardTitle, { className: "text-sm font-medium", children: "Total Errors" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.AlertCircle, { className: "h-4 w-4 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardContent, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "text-2xl font-bold", "data-testid": "text-total-errors", children: stats.summary.totalErrors.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "flex items-center text-xs text-muted-foreground mt-1", children: [
          getTrendIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { className: "ml-1", children: [
            Math.abs(stats.trend.value).toFixed(1),
            "% from previous period"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(Card, { "data-testid": "card-critical-errors", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardTitle, { className: "text-sm font-medium", children: "Critical Errors" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.AlertCircle, { className: "h-4 w-4 text-destructive" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardContent, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "text-2xl font-bold text-destructive", "data-testid": "text-critical-errors", children: stats.summary.criticalErrors.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: "Requires immediate attention" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(Card, { "data-testid": "card-error-rate", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardTitle, { className: "text-sm font-medium", children: "Error Rate" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardContent, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "text-2xl font-bold", "data-testid": "text-error-rate", children: [
          errorRate.toFixed(1),
          "/hr"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: "Average errors per hour" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(Card, { "data-testid": "card-most-common", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(CardTitle, { className: "text-sm font-medium", children: "Most Common Type" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_lucide_react14.AlertCircle, { className: "h-4 w-4 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(CardContent, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "text-2xl font-bold", "data-testid": "text-most-common-type", children: mostCommonType?.[0] || "N/A" }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("p", { className: "text-xs text-muted-foreground mt-1", children: [
          mostCommonType?.[1] || 0,
          " occurrences"
        ] })
      ] })
    ] })
  ] });
}

// src/components/auth/auth-form-components.tsx
var import_react4 = require("react");
var import_lucide_react15 = require("lucide-react");
var import_jsx_runtime31 = require("react/jsx-runtime");
function PasswordInput({
  value,
  onChange,
  placeholder = "Enter your password",
  disabled = false,
  id = "password",
  label = "Password",
  className,
  variant = "shadcn"
}) {
  const [showPassword, setShowPassword] = (0, import_react4.useState)(false);
  if (variant === "native") {
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className, children: [
      label && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("label", { htmlFor: id, className: "block text-sm font-medium text-muted-foreground mb-2", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { style: { position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
          "input",
          {
            id,
            type: showPassword ? "text" : "password",
            value,
            onChange: (e) => onChange(e.target.value),
            className: "form-field-default form-field-focus w-full text-base",
            style: { paddingLeft: "1rem", paddingRight: "3rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" },
            placeholder,
            required: true,
            disabled
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
          "button",
          {
            type: "button",
            onClick: () => setShowPassword(!showPassword),
            style: { position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" },
            className: "bg-transparent border-0 text-muted-foreground cursor-pointer text-sm p-1 flex items-center justify-center hover:text-foreground transition-colors",
            disabled,
            children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.Eye, { className: "h-4 w-4" })
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className, children: [
    label && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(Label2, { htmlFor: id, className: "text-foreground font-medium", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "relative", children: [
      /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
        Input,
        {
          id,
          type: showPassword ? "text" : "password",
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder,
          className: "border-border focus:border-accent focus:ring-accent pr-10",
          required: true,
          disabled
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
        "button",
        {
          type: "button",
          onClick: () => setShowPassword(!showPassword),
          className: "absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground",
          disabled,
          children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.Eye, { className: "h-4 w-4" })
        }
      )
    ] })
  ] });
}
function AuthErrorAlert({ error, className, allowSuccessPrefix = false }) {
  if (!error) return null;
  const isSuccess = allowSuccessPrefix && error.startsWith("SUCCESS:");
  const displayMessage = isSuccess ? error.replace("SUCCESS: ", "") : error;
  const friendlyMessage = displayMessage.toLowerCase().includes("email not confirmed") ? "Please verify your email before accessing your account." : displayMessage;
  if (isSuccess) {
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("div", { className: `bg-success/10 text-success border border-success/20 p-3 text-center rounded-lg ${className ?? ""}`, children: friendlyMessage });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: `flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive rounded-md ${className ?? ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.AlertCircle, { className: "h-4 w-4 text-destructive flex-shrink-0" }),
    /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("p", { className: "text-sm text-destructive", children: friendlyMessage })
  ] });
}
function AuthLoadingButton({
  isLoading,
  loadingText = "Signing in...",
  children,
  className,
  disabled = false,
  type = "submit",
  onClick,
  variant = "shadcn"
}) {
  if (variant === "native") {
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
      "button",
      {
        type,
        disabled: isLoading || disabled,
        onClick,
        className: `w-full py-[14px] px-6 bg-brand-primary text-white border-0 rounded-lg text-base font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors flex items-center justify-center ${className ?? ""}`,
        children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "flex items-center justify-center space-x-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.Loader2, { className: "h-4 w-4 animate-spin" }),
          /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { children: loadingText })
        ] }) : children
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
    Button,
    {
      type,
      className: `w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 ${className ?? ""}`,
      disabled: isLoading || disabled,
      onClick,
      children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "flex items-center justify-center space-x-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.Loader2, { className: "h-4 w-4 animate-spin" }),
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { children: loadingText })
      ] }) : children
    }
  );
}
function AuthCheckingSpinner({ message = "Loading..." }) {
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "flex flex-col items-center gap-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react15.Loader2, { className: "h-12 w-12 animate-spin text-brand-primary" }),
    /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("p", { className: "text-muted-foreground text-sm", children: message })
  ] }) });
}

// src/components/providers/ServerErrorBoundary.tsx
var import_react5 = require("react");
var import_analytics = require("@indexnow/analytics");
var import_jsx_runtime32 = require("react/jsx-runtime");
function ServerErrorBoundary({
  error,
  reset
}) {
  (0, import_react5.useEffect)(() => {
    (0, import_analytics.trackError)(error, {
      errorDigest: error.digest || null,
      errorType: "server-component",
      errorName: error.name
    });
  }, [error]);
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "min-h-screen flex items-center justify-center p-4 bg-background", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "text-center max-w-md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "mb-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Something went wrong!" }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("p", { className: "text-muted-foreground", children: "We apologize for the inconvenience. Our team has been notified and is working to fix the issue." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      Button,
      {
        onClick: reset,
        "data-testid": "button-error-retry",
        children: "Try again"
      }
    )
  ] }) });
}

// src/components/BaseProviders.tsx
var import_auth = require("@indexnow/auth");

// src/providers/AnalyticsProvider.tsx
var import_react6 = require("react");
var import_navigation3 = require("next/navigation");
var import_analytics2 = require("@indexnow/analytics");
var import_jsx_runtime33 = require("react/jsx-runtime");
function PageViewTracker() {
  const pathname = (0, import_navigation3.usePathname)();
  const searchParams = (0, import_navigation3.useSearchParams)();
  (0, import_react6.useEffect)(() => {
    if (pathname) {
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      (0, import_analytics2.trackPageView)(url);
    }
  }, [pathname, searchParams]);
  return null;
}
function AnalyticsProvider({ children }) {
  (0, import_react6.useEffect)(() => {
    (0, import_analytics2.initializeAnalytics)();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(import_jsx_runtime33.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_react6.Suspense, { fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(PageViewTracker, {}) }),
    children
  ] });
}

// src/components/query-provider.tsx
var import_react_query4 = require("@tanstack/react-query");
var import_react7 = require("react");
var import_jsx_runtime34 = require("react/jsx-runtime");
function QueryProvider({ children }) {
  const [queryClient2] = (0, import_react7.useState)(() => new import_react_query4.QueryClient({
    defaultOptions: {
      queries: {
        // Stale time of 5 minutes - data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1e3,
        // Cache time of 10 minutes - data stays in cache for 10 minutes after being unused
        gcTime: 10 * 60 * 1e3,
        // (#146) Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1e3 * 2 ** attemptIndex, 3e4),
        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Refetch on reconnect to restore fresh data after network recovery
        refetchOnReconnect: true
      },
      mutations: {
        // Retry failed mutations once (mutations should not retry aggressively)
        retry: 1
      }
    }
  }));
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_react_query4.QueryClientProvider, { client: queryClient2, children });
}

// src/components/BaseProviders.tsx
var import_jsx_runtime35 = require("react/jsx-runtime");
function BaseProviders({
  children,
  outerProviders = []
}) {
  let content = /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(QueryProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_auth.AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(ToastContainer, { children }) }) });
  for (let i = outerProviders.length - 1; i >= 0; i--) {
    const Provider = outerProviders[i];
    content = /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Provider, { children: content });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(AnalyticsProvider, { children: content });
}

// src/hooks/useApiError.ts
var import_react8 = require("react");
function isApiError(error) {
  return typeof error === "object" && error !== null && "message" in error && "code" in error && "statusCode" in error;
}
function useApiError() {
  const { addToast } = useToast();
  const handleApiError = (0, import_react8.useCallback)((error, options) => {
    let message = "An unexpected error occurred";
    let errorId;
    let severity;
    if (isApiError(error)) {
      message = error.message;
      errorId = error.code;
      severity = void 0;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    const toastType = severity === "CRITICAL" || severity === "HIGH" ? "error" : "error";
    addToast({
      title: options?.toastTitle || "Error",
      description: message,
      type: toastType,
      duration: 6e3,
      ...errorId && {
        action: {
          label: "Copy Error ID",
          onClick: () => {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              navigator.clipboard.writeText(errorId).then(() => {
                addToast({
                  title: "Error ID copied",
                  description: "Error ID has been copied to clipboard",
                  type: "success",
                  duration: 3e3
                });
              }).catch(() => {
              });
            }
          }
        }
      }
    });
  }, [addToast]);
  return { handleApiError };
}

// src/hooks/useNotification.ts
var import_react9 = require("react");
function useNotification() {
  const [notifications, setNotifications] = (0, import_react9.useState)([]);
  const timeoutsRef = (0, import_react9.useRef)(/* @__PURE__ */ new Map());
  const generateId = (0, import_react9.useCallback)(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  const removeNotification = (0, import_react9.useCallback)((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);
  const addNotification = (0, import_react9.useCallback)((notification) => {
    const id = generateId();
    const newNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5e3
      // Default 5 seconds
    };
    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
      timeoutsRef.current.set(id, timeout);
    }
    return id;
  }, [generateId, removeNotification]);
  const clearAllNotifications = (0, import_react9.useCallback)(() => {
    setNotifications([]);
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);
  const showSuccess = (0, import_react9.useCallback)((title, message, options) => {
    return addNotification({
      type: "success",
      title,
      message,
      ...options
    });
  }, [addNotification]);
  const showError = (0, import_react9.useCallback)((title, message, options) => {
    return addNotification({
      type: "error",
      title,
      message,
      duration: options?.duration ?? 7e3,
      // Errors stay longer
      ...options
    });
  }, [addNotification]);
  const showWarning = (0, import_react9.useCallback)((title, message, options) => {
    return addNotification({
      type: "warning",
      title,
      message,
      duration: options?.duration ?? 6e3,
      // Warnings stay a bit longer
      ...options
    });
  }, [addNotification]);
  const showInfo = (0, import_react9.useCallback)((title, message, options) => {
    return addNotification({
      type: "info",
      title,
      message,
      ...options
    });
  }, [addNotification]);
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

// src/hooks/use-zod-form.ts
var import_react_hook_form = require("react-hook-form");
var import_zod = require("@hookform/resolvers/zod");
function useZodForm(schema, props) {
  return (0, import_react_hook_form.useForm)({
    resolver: (0, import_zod.zodResolver)(schema),
    mode: "onBlur",
    ...props
  });
}

// src/hooks/useAdminActivityLogger.ts
var import_react10 = require("react");
var import_shared5 = require("@indexnow/shared");
var import_supabase_client = require("@indexnow/supabase-client");
var loggedAdminPageViews = /* @__PURE__ */ new Set();
function useAdminActivityLogger() {
  const logActivity = (0, import_react10.useCallback)(async (request) => {
    try {
      const user = await import_supabase_client.authService.getCurrentUser();
      if (!user) return;
      await (0, import_supabase_client.authenticatedFetch)(import_shared5.ACTIVITY_ENDPOINTS.LOG, {
        method: "POST",
        body: JSON.stringify({
          ...request,
          metadata: {
            adminAction: true,
            ...request.metadata
          }
        })
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        import_shared5.logger.debug(
          { error: err instanceof Error ? err : void 0 },
          "[admin-activity-logger] Failed to log (non-critical)"
        );
      }
    }
  }, []);
  return { logActivity };
}
function useAdminPageViewLogger(section, pageName, metadata) {
  const { logActivity } = useAdminActivityLogger();
  const hasLogged = (0, import_react10.useRef)(false);
  (0, import_react10.useEffect)(() => {
    const key = `admin:${section}:${pageName}`;
    if (hasLogged.current || loggedAdminPageViews.has(key)) return;
    hasLogged.current = true;
    loggedAdminPageViews.add(key);
    logActivity({
      eventType: "admin_page_view",
      actionDescription: `Admin viewed ${pageName}`,
      targetType: "admin_page",
      metadata: {
        section,
        pageName,
        ...metadata
      }
    }).catch(() => {
      hasLogged.current = false;
      loggedAdminPageViews.delete(key);
    });
  }, [logActivity, section, pageName]);
}
function useAdminDashboardLogger() {
  const { logActivity } = useAdminActivityLogger();
  const logStatsRefresh = (0, import_react10.useCallback)(() => {
    logActivity({
      eventType: "admin_stats_refresh",
      actionDescription: "Admin refreshed dashboard statistics",
      targetType: "admin_page",
      metadata: { section: "dashboard" }
    });
  }, [logActivity]);
  return { logStatsRefresh };
}

// src/hooks/useActivityLogger.ts
var import_react11 = require("react");
var import_shared6 = require("@indexnow/shared");
var import_supabase_client2 = require("@indexnow/supabase-client");
var loggedPageViews = /* @__PURE__ */ new Set();
var useActivityLogger = () => {
  const pageViewLogged = (0, import_react11.useRef)(null);
  const logActivity = (0, import_react11.useCallback)(async (request) => {
    try {
      const user = await import_supabase_client2.authService.getCurrentUser();
      if (!user) return;
      await (0, import_supabase_client2.authenticatedFetch)(import_shared6.ACTIVITY_ENDPOINTS.LOG, {
        method: "POST",
        body: JSON.stringify(request)
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        import_shared6.logger.debug(
          { error: err instanceof Error ? err : void 0, request },
          "[activity-logger] Failed to log activity (non-critical)"
        );
      }
    }
  }, []);
  const logPageView = (0, import_react11.useCallback)(
    async (pagePath, pageTitle, metadata) => {
      const currentPage = `${pagePath}-${pageTitle || ""}`;
      if (pageViewLogged.current === currentPage) return;
      if (loggedPageViews.has(currentPage)) return;
      pageViewLogged.current = currentPage;
      loggedPageViews.add(currentPage);
      await logActivity({
        eventType: "page_view",
        actionDescription: `Visited ${pageTitle || pagePath}`,
        targetType: "page",
        metadata: {
          pagePath,
          pageTitle: pageTitle || null,
          pageView: true,
          ...metadata
        }
      });
    },
    [logActivity]
  );
  const logDashboardActivity = (0, import_react11.useCallback)(
    async (eventType, details, metadata) => {
      await logActivity({
        eventType,
        actionDescription: details || eventType,
        targetType: "dashboard",
        metadata: {
          dashboardActivity: true,
          ...metadata
        }
      });
    },
    [logActivity]
  );
  const logBillingActivity = (0, import_react11.useCallback)(
    async (eventType, details, metadata) => {
      await logActivity({
        eventType,
        actionDescription: details,
        targetType: "billing",
        metadata: {
          billingActivity: true,
          ...metadata
        }
      });
    },
    [logActivity]
  );
  const logJobActivity = (0, import_react11.useCallback)(
    async (eventType, jobId, details, metadata) => {
      await logActivity({
        eventType,
        actionDescription: details || eventType,
        targetType: jobId ? "job" : void 0,
        targetId: jobId,
        metadata: {
          jobActivity: true,
          ...metadata
        }
      });
    },
    [logActivity]
  );
  return {
    logActivity,
    logPageView,
    logDashboardActivity,
    logBillingActivity,
    logJobActivity
  };
};
var usePageViewLogger = (pagePath, pageTitle, metadata) => {
  const { logPageView } = useActivityLogger();
  (0, import_react11.useEffect)(() => {
    logPageView(pagePath, pageTitle, metadata);
  }, [pagePath, pageTitle, logPageView]);
  return { logPageView };
};

// src/hooks/settings/useAccountSettings.ts
var import_react12 = require("react");
var import_react_query5 = require("@tanstack/react-query");
var import_shared7 = require("@indexnow/shared");
var import_supabase_client3 = require("@indexnow/supabase-client");
var import_auth2 = require("@indexnow/auth");
function useAccountSettings() {
  const { addToast } = useToast();
  const { user } = (0, import_auth2.useAuth)();
  const { logDashboardActivity } = useActivityLogger();
  const queryClient2 = (0, import_react_query5.useQueryClient)();
  const [savingProfile, setSavingProfile] = (0, import_react12.useState)(false);
  const [savingPassword, setSavingPassword] = (0, import_react12.useState)(false);
  const [profileForm, setProfileForm] = (0, import_react12.useState)({
    full_name: "",
    phone_number: "",
    email_notifications: false
  });
  const [passwordForm, setPasswordForm] = (0, import_react12.useState)({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const { data: profileQueryData, isLoading: profileLoading } = (0, import_react_query5.useQuery)({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await (0, import_supabase_client3.authenticatedFetch)(import_shared7.AUTH_ENDPOINTS.PROFILE);
      if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
      const json = await res.json();
      const data = json?.data ?? json;
      return data;
    }
  });
  (0, import_react12.useEffect)(() => {
    const profile = profileQueryData?.profile;
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        email_notifications: profile.email_notifications || false
      });
    } else if (!profileLoading && !profileQueryData) {
      setProfileForm({
        full_name: user?.email?.split("@")[0] || "",
        phone_number: "",
        email_notifications: false
      });
    }
  }, [profileQueryData, profileLoading, user?.email]);
  const handleSaveProfile = (0, import_react12.useCallback)(async () => {
    try {
      setSavingProfile(true);
      const response = await (0, import_supabase_client3.authenticatedFetch)(import_shared7.AUTH_ENDPOINTS.PROFILE, {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      if (response.ok) {
        addToast({
          title: "Success",
          description: "Profile updated successfully",
          type: "success"
        });
        await logDashboardActivity("profile_update", "Profile information updated");
        queryClient2.invalidateQueries({ queryKey: ["profile"] });
        queryClient2.invalidateQueries({ queryKey: ["dashboard-aggregate"] });
      } else {
        const error = await response.json();
        addToast({
          title: "Failed to update profile",
          description: error.error || "Something went wrong",
          type: "error"
        });
      }
    } catch (error) {
      import_shared7.logger.error({ error: error instanceof Error ? error : void 0 }, "Error saving profile");
      addToast({
        title: "Error",
        description: "Failed to update profile",
        type: "error"
      });
    } finally {
      setSavingProfile(false);
    }
  }, [profileForm, addToast, logDashboardActivity, queryClient2]);
  const handleChangePassword = (0, import_react12.useCallback)(async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        type: "error"
      });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({
        title: "Validation Error",
        description: "New passwords do not match",
        type: "error"
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        type: "error"
      });
      return;
    }
    try {
      setSavingPassword(true);
      if (!user?.email) {
        addToast({
          title: "Error",
          description: "User email not found",
          type: "error"
        });
        return;
      }
      try {
        await import_supabase_client3.authService.signIn(user.email, passwordForm.currentPassword);
      } catch (_err) {
        addToast({
          title: "Authentication Error",
          description: "Current password is incorrect",
          type: "error"
        });
        return;
      }
      try {
        await import_supabase_client3.authService.updateUser({
          password: passwordForm.newPassword
        });
      } catch (updateError) {
        addToast({
          title: "Update Error",
          description: updateError instanceof Error ? updateError.message : "Failed to update password",
          type: "error"
        });
        return;
      }
      addToast({
        title: "Success",
        description: "Password updated successfully",
        type: "success"
      });
      await logDashboardActivity("password_change", "Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      import_shared7.logger.error(
        { error: error instanceof Error ? error : void 0 },
        "Error changing password"
      );
      addToast({
        title: "Error",
        description: "Failed to change password",
        type: "error"
      });
    } finally {
      setSavingPassword(false);
    }
  }, [passwordForm, user?.email, addToast, logDashboardActivity]);
  return {
    loading: profileLoading,
    savingProfile,
    savingPassword,
    profileForm,
    passwordForm,
    userEmail: user?.email ?? void 0,
    setProfileForm,
    setPasswordForm,
    handleSaveProfile,
    handleChangePassword
  };
}

// src/providers/PaddleProvider.tsx
var import_react13 = require("react");
var import_paddle_js = require("@paddle/paddle-js");
var import_shared8 = require("@indexnow/shared");
var import_jsx_runtime36 = require("react/jsx-runtime");
var PaddleContext = (0, import_react13.createContext)({
  paddle: null,
  isLoading: true,
  error: null
});
function PaddleProvider({ children }) {
  const [paddle, setPaddle] = (0, import_react13.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react13.useState)(true);
  const [error, setError] = (0, import_react13.useState)(null);
  (0, import_react13.useEffect)(() => {
    let isMounted = true;
    const initPaddle = async () => {
      try {
        const response = await fetch(import_shared8.ApiEndpoints.PAYMENT.PADDLE_CONFIG);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load Paddle configuration");
        }
        const configResult = await response.json();
        if (!configResult.success || !configResult.data) {
          throw new Error("Invalid Paddle configuration response");
        }
        const { clientToken, environment } = configResult.data;
        if (!clientToken) {
          throw new Error("Paddle client token not available");
        }
        const paddleInstance = await (0, import_paddle_js.initializePaddle)({
          environment: environment || "sandbox",
          token: clientToken,
          eventCallback: (data) => {
            switch (data.name) {
              case "checkout.completed":
                import_shared8.logger.info("Paddle checkout completed");
                break;
              case "checkout.closed":
                import_shared8.logger.info("Paddle checkout overlay closed by user");
                break;
              case "checkout.error":
                import_shared8.logger.warn("Paddle checkout error reported within overlay");
                break;
              default:
                break;
            }
          }
        });
        if (paddleInstance && isMounted) {
          setPaddle(paddleInstance);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize payment system";
        import_shared8.logger.error({ error: err instanceof Error ? err : void 0 }, `Paddle init failed: ${message}`);
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initPaddle();
    return () => {
      isMounted = false;
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(PaddleContext.Provider, { value: { paddle, isLoading, error }, children });
}
var usePaddle = () => (0, import_react13.useContext)(PaddleContext);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminPageSkeleton,
  AdminUserDetailSkeleton,
  AnalyticsProvider,
  ApiQuotaSkeleton,
  AuthCheckingSpinner,
  AuthErrorAlert,
  AuthLoadingButton,
  Badge,
  BaseProviders,
  BillingPeriodSelector,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckoutForm,
  CheckoutHeader,
  CheckoutLoading,
  ConfirmationDialog,
  DashboardSkeleton,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  ErrorDetailModal,
  ErrorFilters,
  ErrorListTable,
  ErrorState,
  ErrorStatsCards,
  IndexNowFormSkeleton,
  Input,
  Label,
  LoadingSpinner,
  NotFoundPage,
  OrderDetailSkeleton,
  OrderSummary,
  PackageNotFound,
  PaddleProvider,
  PasswordInput,
  PaymentErrorBoundary,
  ProfileSkeleton,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  ServerErrorBoundary,
  SettingsPageSkeleton,
  Skeleton,
  StatsCardsSkeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  Textarea,
  ToastContainer,
  Toaster,
  ToggleSwitch,
  badgeVariants,
  buttonVariants,
  cn,
  useAccountSettings,
  useActivityLogger,
  useAdminActivityLogger,
  useAdminDashboardLogger,
  useAdminPageViewLogger,
  useApiError,
  useNotification,
  usePaddle,
  usePageViewLogger,
  usePaymentErrorHandler,
  useToast,
  useZodForm
});
//# sourceMappingURL=index.js.map