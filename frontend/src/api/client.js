// All API calls go through here so request options stay consistent.
export function apiFetch(url, options = {}) {
    // FormData sets its own multipart Content-Type (with boundary) — let the browser handle it.
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    return fetch(url, {
        ...options,
        headers: isFormData ? { ...options.headers } : { "Content-Type": "application/json", ...options.headers },
    });
}
