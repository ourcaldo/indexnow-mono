import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser } from '@indexnow/auth';
import { rankTrackingService } from '@/lib/services';
import { logger } from '@indexnow/shared';

/**
 * GET /api/v1/rank-tracking/keywords
 * Fetch user's tracked keywords with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      domain: searchParams.get('domain') || undefined,
      country: searchParams.get('country') || undefined,
      device: searchParams.get('device') || undefined,
      searchEngine: searchParams.get('searchEngine') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await rankTrackingService.getUserKeywords(user.id, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching keywords');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/rank-tracking/keywords
 * Create a new keyword for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, domain, country, device, searchEngine, targetUrl, tags } = body;

    if (!keyword || !domain || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await rankTrackingService.createKeyword(user.id, {
      keyword,
      domain,
      country,
      device,
      searchEngine,
      targetUrl,
      tags,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating keyword');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/rank-tracking/keywords
 * Bulk delete keywords
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds)) {
      return NextResponse.json({ error: 'Invalid keywordIds' }, { status: 400 });
    }

    const count = await rankTrackingService.deleteKeywords(keywordIds, user.id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting keywords');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
