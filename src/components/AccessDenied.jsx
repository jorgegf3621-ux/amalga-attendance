import { ShieldX } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          <ShieldX style={{ color: '#ef4444' }} size={32} />
        </div>
        <h1 className="text-2xl font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>Access Required</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          This dashboard requires a valid access token. Please use the link provided by your team lead.
        </p>
        <div className="card p-4">
          <code className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            https://your-domain.vercel.app<span style={{ color: 'var(--accent)' }}>?access=your-token</span>
          </code>
        </div>
      </div>
    </div>
  );
}
