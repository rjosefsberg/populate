import { useState } from "react";
import { login } from "../api/client";

function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        login(username, password)
            .then(data => {
                if (data.ok) {
                    onLogin();
                } else {
                    setError("Invalid credentials");
                }
            })
            .catch(() => setError("Invalid credentials"))
            .finally(() => setLoading(false));
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-dark">
            <div className="bg-white rounded shadow p-4" style={{ width: 340 }}>
                <h4 className="fw-semibold mb-1">Populate</h4>
                <p className="text-muted mb-4" style={{ fontSize: "0.85rem" }}>Sign in to continue.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Username"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError(""); }}
                            autoFocus
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="password"
                            className={`form-control ${error ? "is-invalid" : ""}`}
                            placeholder="Password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            disabled={loading}
                            autoComplete="current-password"
                        />
                        {error && <div className="invalid-feedback">{error}</div>}
                    </div>
                    <button className="btn btn-primary w-100" type="submit" disabled={loading || !username || !password}>
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
