import { NextRequest } from 'next/server';
import { getRequestInfo } from '@/lib/utils/ip-device-utils';
import { publicApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

/**
 * GET /api/v1/auth/detect-location
 * Detect user location from IP address
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
    try {
        const requestInfo = await getRequestInfo(request);

        return formatSuccess({
            ip: requestInfo.ipAddress,
            country: requestInfo.locationData?.country || null,
            region: requestInfo.locationData?.region || null,
            city: requestInfo.locationData?.city || null,
        });
    } catch {
        // Return empty data on error to not break the client
        return formatSuccess({
            ip: null,
            country: null,
            countryCode: null,
            region: null,
            city: null,
        });
    }
});

