import { useState, useRef, useEffect } from 'react';

function UsageButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const ref = useRef(null);

    const toggle = () => {
        if (open) { setOpen(false); return; }
        setLoading(true);
        setOpen(true);
        fetch('/api/usage')
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                className="btn btn-outline-secondary btn-sm w-100 mt-2"
                onClick={toggle}
                style={{ fontSize: '0.75rem' }}
            >
                API Usage
            </button>

            {open && (
                <div
                    className="bg-white border rounded shadow-sm p-3"
                    style={{ position: 'absolute', top: '110%', left: 0, width: 220, zIndex: 1000, fontSize: '0.8rem' }}
                >
                    {loading ? (
                        <span className="text-muted">Checking…</span>
                    ) : data ? (
                        <>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span
                                    className="rounded-circle"
                                    style={{ width: 8, height: 8, background: data.key_active ? '#198754' : '#dc3545', display: 'inline-block', flexShrink: 0 }}
                                />
                                <span className="fw-semibold">{data.key_active ? 'Key active' : 'Key inactive'}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>This session</div>
                            <div className="d-flex justify-content-between"><span>Requests</span><span className="fw-semibold">{data.request_count}</span></div>
                            <div className="d-flex justify-content-between"><span>Input tokens</span><span className="fw-semibold">{data.input_tokens.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between"><span>Output tokens</span><span className="fw-semibold">{data.output_tokens.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between border-top mt-2 pt-2"><span>Total tokens</span><span className="fw-semibold">{data.total_tokens.toLocaleString()}</span></div>
                        </>
                    ) : (
                        <span className="text-danger">Failed to load</span>
                    )}
                </div>
            )}
        </div>
    );
}

export default UsageButton;
