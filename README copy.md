# Admin GUI: Popular Destinations Warmup (Next.js)

Purpose: Present warmup scheduling and job status in admin UI so searches return fast from DB cache.

## API Endpoints
- Schedule warmup (simple): POST /api/v1/admin/jobs/recurring/popular-destinations/schedule?cron=0%203%20*%20*%20*&maxCount=50
- Schedule warmup (Hangfire UI route): PUT /api/v1/admin/hangfire/recurring-jobs/popular-destinations-warmup/schedule
  - Body JSON: `{ "cronExpression": "0 3 * * *", "timeZone": "Europe/Istanbul", "maxCount": 50 }`
- Trigger recurring: POST /api/v1/admin/jobs/recurring/{jobId}/trigger (jobId: popular-destinations-warmup)
- Cleanup recurring: DELETE /api/v1/admin/jobs/recurring/cleanup
- Job status: GET /api/v1/admin/jobs/sunhotels/status

Note: When admin creates/updates a featured destination, warmup enqueues automatically.

## Setup
- Env: NEXT_PUBLIC_API_BASE=https://your-api-host
- Auth: Send Authorization: Bearer <token> with admin role.

## UI Flow
- Schedule Nightly: form with cron and maxCount → schedule endpoint
- Job Status: table of processing/scheduled/enqueued
- Trigger: button for jobId popular-destinations-warmup
- Cleanup: button to remove recurring jobs

## Client Helpers (TypeScript)
```ts
export async function apiFetch(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers||{}) }
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export const scheduleWarmup = (cron: string, maxCount: number) =>
  apiFetch(`/api/v1/admin/jobs/recurring/popular-destinations/schedule?cron=${encodeURIComponent(cron)}&maxCount=${maxCount}`, { method: 'POST' });

export const getJobStatus = () =>
  apiFetch('/api/v1/admin/jobs/sunhotels/status');

export const triggerRecurring = (jobId: string) =>
  apiFetch(`/api/v1/admin/jobs/recurring/${encodeURIComponent(jobId)}/trigger`, { method: 'POST' });

export const cleanupRecurring = () =>
  apiFetch('/api/v1/admin/jobs/recurring/cleanup', { method: 'DELETE' });
```

## Page Skeleton (Next.js Client Component)
```tsx
'use client';
import { useEffect, useState } from 'react';
import { scheduleWarmup, getJobStatus, triggerRecurring, cleanupRecurring } from './api';

export default function PopularWarmupAdmin() {
  const [cron, setCron] = useState('0 3 * * *');
  const [maxCount, setMaxCount] = useState(50);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const refreshStatus = async () => {
    setLoading(true);
    try { setStatus(await getJobStatus()); } catch (e:any) { setMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => { refreshStatus(); }, []);

  const onSchedule = async () => {
    setLoading(true);
    try { const r = await scheduleWarmup(cron, maxCount); setMsg(r.message || 'Scheduled'); }
    catch(e:any){ setMsg(e.message); }
    finally{ setLoading(false); refreshStatus(); }
  };

  const onTrigger = async () => {
    setLoading(true);
    try { const r = await triggerRecurring('popular-destinations-warmup'); setMsg(r.message || 'Triggered'); }
    catch(e:any){ setMsg(e.message); }
    finally{ setLoading(false); refreshStatus(); }
  };

  const onCleanup = async () => {
    setLoading(true);
    try { const r = await cleanupRecurring(); setMsg(r.message || 'Cleaned'); }
    catch(e:any){ setMsg(e.message); }
    finally{ setLoading(false); refreshStatus(); }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Popular Destinations Warmup</h1>

      <section style={{ marginBottom: 16 }}>
        <h3>Schedule Nightly Warmup</h3>
        <label>Cron: <input value={cron} onChange={e=>setCron(e.target.value)} /></label>
        <label style={{ marginLeft: 12 }}>Max Count: <input type="number" value={maxCount} onChange={e=>setMaxCount(parseInt(e.target.value||'0'))} /></label>
        <button onClick={onSchedule} disabled={loading}>Schedule</button>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>Actions</h3>
        <button onClick={onTrigger} disabled={loading}>Trigger Now</button>
        <button onClick={onCleanup} disabled={loading} style={{ marginLeft: 8 }}>Cleanup Recurring</button>
      </section>

      <section>
        <h3>Status</h3>
        {loading && <p>Loading...</p>}
        {msg && <p>{msg}</p>}
        {status && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <h4>Processing</h4>
              <pre>{JSON.stringify(status.processingJobs, null, 2)}</pre>
            </div>
            <div>
              <h4>Scheduled</h4>
              <pre>{JSON.stringify(status.scheduledJobs, null, 2)}</pre>
            </div>
            <div>
              <h4>Enqueued</h4>
              <pre>{JSON.stringify(status.enqueuedJobs, null, 2)}</pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

## UX Tips
- Provide cron presets (03:00, 04:00, every 6h).
- Use toasts for success/error.
- Auto-refresh status after actions.

## Security
- Restrict to admin role.
- Store tokens securely (cookies/headers).