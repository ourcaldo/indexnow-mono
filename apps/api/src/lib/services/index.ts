import { RankTrackingService, UserManagementService } from '@indexnow/services';
import { createEmailServiceFromEnv } from './external/EmailService';

export { createEmailServiceFromEnv };

// Singletons
export const rankTrackingService = new RankTrackingService();
export const userManagementService = new UserManagementService();
