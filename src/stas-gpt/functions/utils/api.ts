export async function fetchWithCache<T>(url: URL, requestInit: RequestInit): Promise<T> {
    const request = new Request(url, requestInit);
    console.log("fetchWithCache: request:", request);

    const cachedResponse = await caches.default.match(request);

    if (cachedResponse) {
        console.log("fetchWithCache: using cachedResponse:", cachedResponse);
        return cachedResponse.json();
    }

    console.log("fetchWithCache: fetching data from URL:", url.toString());
    const response: Response = await fetch(request);
    console.log("fetchWithCache: received response:", response);

    const clonedResponse = response.clone();
    const data = await response.json();
    const cacheTtl = 86400;

    const cachedDataResponse = new Response(clonedResponse.body, {
        headers: {
            ...Object.fromEntries(clonedResponse.headers),
            "Cache-Control": `public, max-age=${cacheTtl}`,
        },
    });

    globalThis.event.waitUntil(caches.default.put(request, cachedDataResponse));

    return data as T;
}

export function generateVkApiUrl(method: string, params: Record<string, string | number>): URL {
    const url: URL = new URL(`https://api.vk.com/method/${method}`);
    url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
    url.searchParams.append("v", VK_API_VERSION);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value.toString());
    }

    return url;
}
