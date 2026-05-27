import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authModalOpen) {
      setError('');
      setName('');
      setEmail('');
      setPassword('');
      setMode('login');
      setBusy(false);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBusy(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) closeAuthModal();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fade-in 0.15s ease',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--surface)', color: 'var(--text)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          padding: '2rem 2rem 1.75rem',
          animation: 'slide-up 0.2s ease',
        }}
      >
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 6 }}>🍅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              {mode === 'login' ? 'Inicia sesión para guardar' : 'Crea tu cuenta'}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.5, margin: '4px 0 0' }}>
              {mode === 'login'
                ? 'Tus tareas se guardarán en la nube'
                : 'Es gratis y solo toma un momento'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, color: 'var(--text3)',
              padding: '2px 6px', borderRadius: 6,
              transition: 'color 0.1s, background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--hover2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <Field label="Nombre" type="text" value={name} onChange={setName}
              placeholder="Tu nombre" autoComplete="name" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail}
            placeholder="correo@ejemplo.com" autoComplete="email" />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword}
            placeholder="••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {error && (
            <p style={{ fontSize: 13, color: '#e53e3e', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 4, padding: '10px 0', borderRadius: 8,
              background: 'var(--accent)', color: '#fff',
              fontWeight: 600, fontSize: 14,
              border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {busy ? '...' : mode === 'login' ? 'Entrar y guardar' : 'Registrarme y guardar'}
          </button>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, opacity: 0.55, margin: '16px 0 0' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: 13,
            }}
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, opacity: 0.65 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required
        style={{
          padding: '9px 12px', borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg)', color: 'var(--text)',
          fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
