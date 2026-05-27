import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '2.5rem',
          borderRadius: 16,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍅</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>PomodoroFlow</h1>
          <p style={{ fontSize: 14, opacity: 0.55 }}>
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <Field
              label="Nombre"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p style={{ fontSize: 13, color: 'var(--accent-red, #e53e3e)', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '10px 0',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, opacity: 0.6 }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: 13,
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
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          padding: '9px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
