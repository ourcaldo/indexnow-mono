// Type declarations for @analytics packages
// These packages don't ship with TypeScript types

declare module 'analytics' {
    interface AnalyticsPlugin {
        name: string;
        [key: string]: unknown;
    }

    interface AnalyticsConfig {
        app: string;
        debug?: boolean;
        plugins?: AnalyticsPlugin[];
    }

    interface AnalyticsInstance {
        track: (event: string, properties?: Record<string, unknown>) => void;
        page: (properties?: Record<string, unknown>) => void;
        identify: (userId: string, traits?: Record<string, unknown>) => void;
        reset: () => void;
    }

    function Analytics(config: AnalyticsConfig): AnalyticsInstance;
    export default Analytics;
}

declare module '@analytics/google-analytics' {
    interface GoogleAnalyticsConfig {
        measurementIds: string[];
    }

    interface GoogleAnalyticsPlugin {
        name: string;
        [key: string]: unknown;
    }

    function googleAnalytics(config: GoogleAnalyticsConfig): GoogleAnalyticsPlugin;
    export default googleAnalytics;
}

declare module '@analytics/google-tag-manager' {
    interface GTMConfig {
        containerId: string;
    }

    interface GTMPlugin {
        name: string;
        [key: string]: unknown;
    }

    function googleTagManager(config: GTMConfig): GTMPlugin;
    export default googleTagManager;
}

declare module '@analytics/customerio' {
    interface CustomerIOConfig {
        siteId: string;
    }

    interface CustomerIOPlugin {
        name: string;
        [key: string]: unknown;
    }

    function customerio(config: CustomerIOConfig): CustomerIOPlugin;
    export default customerio;
}
