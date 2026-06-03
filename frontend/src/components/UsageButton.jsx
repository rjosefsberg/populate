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
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(setData)
            .catch(() => setData(null))
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
                    style={{ position: 'absolute', top: '110%', left: 0, width: 230, zIndex: 1000, fontSize: '0.8rem', color: '#212529' }}
                >
                    {loading ? (
                        <span style={{ color: '#6c757d' }}>Checking…</span>
                    ) : data ? (
                        <>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span
                                    className="rounded-circle"
                                    style={{ width: 8, height: 8, background: data.key_active ? '#198754' : '#dc3545', display: 'inline-block', flexShrink: 0 }}
                                />
                                <span style={{ fontWeight: 600 }}>{data.key_active ? 'Key active' : 'Key inactive'}</span>
                            </div>

                            {data.credits_remaining !== null && data.credits_remaining !== undefined && (
                                <>
                                    <hr style={{ margin: '8px 0', borderColor: '#dee2e6' }} />
                                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6c757d', marginBottom: 4 }}>Credits remaining</div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>${(data.credits_remaining / 100).toFixed(2)}</div>
                                </>
                            )}

                            <hr style={{ margin: '8px 0', borderColor: '#dee2e6' }} />
                            <div style={{ fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6c757d', marginBottom: 4 }}>This session</div>
                            <div className="d-flex justify-content-between"><span>Requests</span><span style={{ fontWeight: 600 }}>{data.request_count}</span></div>
                            <div className="d-flex justify-content-between"><span>Input tokens</span><span style={{ fontWeight: 600 }}>{data.input_tokens.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between"><span>Output tokens</span><span style={{ fontWeight: 600 }}>{data.output_tokens.toLocaleString()}</span></div>
                            <div className="d-flex justify-content-between" style={{ borderTop: '1px solid #dee2e6', marginTop: 8, paddingTop: 8 }}>
                                <span>Total tokens</span><span style={{ fontWeight: 600 }}>{data.total_tokens.toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <span style={{ color: '#dc3545' }}>Failed to load</span>
                    )}
                </div>
            )}
        </div>
    );
}

export default UsageButton;
