import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface AuthProps {
  children: (session: Session) => ReactNode;
}

export function AuthGate({ children }: AuthProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) return <AuthSetupNotice />;
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-500">Cargando...</div>;
  if (!session) return <AuthForm />;

  return (
    <>
      <div className="fixed right-4 top-4 z-10 flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
        <span className="max-w-48 truncate text-slate-600">{session.user.email}</span>
        <button
          type="button"
          title="Cerrar sesión"
          onClick={() => void supabase?.auth.signOut()}
          className="text-slate-500 transition-colors hover:text-red-600"
        >
          <LogOut size={18} />
        </button>
      </div>
      {children(session)}
    </>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    const result = mode === 'login'
      ? await supabase!.auth.signInWithPassword({ email, password })
      : await supabase!.auth.signUp({ email, password });

    setSubmitting(false);
    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === 'signup') {
      setMessage('Cuenta creada. Revisa tu correo si la confirmación está activada.');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">Nutri Recetas</h1>
          <p className="mt-1 text-sm text-slate-500">{mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta profesional'}</p>
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-600">
            Correo electrónico
            <input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-sky-400" />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Contraseña
            <input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-sky-400" />
          </label>
        </div>
        {message && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
        <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 font-medium text-white transition-colors hover:bg-sky-600 disabled:bg-slate-300">
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="mt-4 w-full text-sm text-sky-600 hover:text-sky-800">
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </main>
  );
}

function AuthSetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">Configura Supabase</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env.local para activar el inicio de sesión.
        </p>
      </section>
    </main>
  );
}
