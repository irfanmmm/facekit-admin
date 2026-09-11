// A face photo is stored under a filename tied to the employee_code, and an
// edit overwrites that same filename rather than creating a new one - so the
// URL never changes even when the underlying content does, and the browser
// has no reason to know it needs to refetch. CACHE_BUST is computed once
// per page load (module evaluation), so every photo URL on a fresh load is
// guaranteed unique and can never be served from a stale cache, regardless
// of which caching layer (browser, proxy) would otherwise have served it.
const CACHE_BUST = Date.now();

export function employeePhotoUrl(filename?: string | null): string | undefined {
    if (!filename) return undefined;
    return `http://facekit.officekithr.net/facekit/uploads/${filename}?v=${CACHE_BUST}`;
}
