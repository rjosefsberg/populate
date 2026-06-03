// All API calls go through here so credentials and 401 handling are consistent.
let _onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
    _onUnauthorized = fn;
}

export function apiFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
    }).then(res => {
        if (res.status === 401 && _onUnauthorized) {
            _onUnauthorized();
            return Promise.reject(new Error("Unauthorized"));
        }
        return res;
    });
}

export const login = (username, password) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) })
        .then(res => res.json());

export const logout = () =>
    apiFetch("/api/auth/logout", { method: "POST" }).then(res => res.json());

export const getMe = () =>
    apiFetch("/api/auth/me").then(res => res.json());
