import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Fix double slashes in URL path (but preserve https://)
function fixUrl(url: string): string {
    return url.replace(/(https?:\/\/)|(\/)+/g, (match, protocol) => protocol || '/');
}

async function tryFetchFile(url: string, headers: Record<string, string> = {}): Promise<Response | null> {
    console.log('[AttachmentDownload] Trying:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        if (!response.ok) {
            console.log('[AttachmentDownload] Failed:', response.status, url);
            return null;
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Magento returned HTML login page instead of file — skip
        if (contentType.includes('text/html')) {
            console.log('[AttachmentDownload] Got HTML (login page), skipping:', url);
            return null;
        }

        // Magento returned JSON error instead of file — skip
        if (contentType.includes('application/json')) {
            console.log('[AttachmentDownload] Got JSON error, skipping:', url);
            return null;
        }

        return response;
    } catch (err) {
        console.log('[AttachmentDownload] Fetch error for:', url, err);
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized: Missing customer token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const rawFileUrl = searchParams.get('url');
        const origin = new URL(BASE_URL || 'https://altalayi-demo.btire.com').origin;

        console.log('[AttachmentDownload] ID:', id, 'Raw URL:', rawFileUrl);

        // Build list of URLs to try
        const urlsToTry: string[] = [];

        if (rawFileUrl) {
            // Extract the path portion after /media/
            // file_url example: https://altalayi-demo.btire.com/media//t/y/filename.pdf
            // Working pattern: https://altalayi-demo.btire.com/media/orderupload/t/y/filename.pdf
            const fixedUrl = fixUrl(rawFileUrl);

            const mediaMatch = fixedUrl.match(/\/media\/(.+)$/);
            if (mediaMatch) {
                const mediaPath = mediaMatch[1]; // e.g. "t/y/filename.pdf"
                // Primary: /media/orderupload/<path>
                urlsToTry.push(`${origin}/media/orderupload/${mediaPath}`);
                // Also try the fixed URL directly
                urlsToTry.push(fixedUrl);
                // Fallback variations
                urlsToTry.push(`${origin}/pub/media/orderupload/${mediaPath}`);
            } else {
                // No /media/ in URL — try as-is and with common prefixes
                urlsToTry.push(fixedUrl);
                const clean = fixedUrl.startsWith('http')
                    ? new URL(fixedUrl).pathname.replace(/^\/+/, '')
                    : fixedUrl.replace(/^\/+/, '');
                urlsToTry.push(`${origin}/media/orderupload/${clean}`);
            }
        }

        // Also try the API download endpoint
        urlsToTry.push(`${BASE_URL}/orderupload/download/${id}`);

        // Try each URL
        for (const url of urlsToTry) {
            // Use auth header only for API endpoints, not for media URLs
            const isApiUrl = url.includes('/rest/');
            const headers: Record<string, string> = isApiUrl
                ? { Authorization: authHeader, platform: 'web' }
                : {};

            const res = await tryFetchFile(url, headers);
            if (res) {
                const contentType = res.headers.get('content-type') || 'application/octet-stream';
                const blob = await res.blob();

                if (blob.size === 0) {
                    console.log('[AttachmentDownload] Empty blob, skipping:', url);
                    continue;
                }

                console.log('[AttachmentDownload] Success! URL:', url, 'Type:', contentType, 'Size:', blob.size);
                return new Response(blob, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': blob.size.toString(),
                        'Content-Disposition': 'inline',
                    },
                });
            }
        }

        console.log('[AttachmentDownload] All URLs failed for attachment:', id);
        return NextResponse.json(
            { message: 'Unable to open attachment. File not accessible.' },
            { status: 404 }
        );

    } catch (error: any) {
        console.error('[AttachmentDownload] Catch error:', error);
        return NextResponse.json(
            { message: error.message || 'Server error downloading file' },
            { status: 500 }
        );
    }
}
