import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { LucideIcon } from 'lucide-react';
import {
  LogIn, UserPlus, Apple, Banana, Carrot, Cherry,
  Citrus, Grape, Leaf, LeafyGreen, Salad, Sprout, Wheat,
} from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import logoSrc from '../assets/logo.png';

interface FloatingItem {
  Icon: LucideIcon;
  top: string;
  left: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotate: number;
  dy: number;
}

const FLOATING_ITEMS: FloatingItem[] = [
  { Icon: Apple,      top: '8%',  left: '10%', size: 44, color: '#ef4444', duration: 9,  delay: 0,   rotate: -12, dy: -18 },
  { Icon: Carrot,     top: '18%', left: '82%', size: 40, color: '#f97316', duration: 8,  delay: 1.2, rotate: 15,  dy: -14 },
  { Icon: Grape,      top: '68%', left: '6%',  size: 46, color: '#a855f7', duration: 10, delay: 0.6, rotate: -8,  dy: -20 },
  { Icon: Citrus,     top: '75%', left: '88%', size: 42, color: '#eab308', duration: 7,  delay: 2,   rotate: 10,  dy: -16 },
  { Icon: LeafyGreen, top: '5%',  left: '48%', size: 36, color: '#22c55e', duration: 11, delay: 0.3, rotate: -6,  dy: -12 },
  { Icon: Cherry,     top: '38%', left: '92%', size: 34, color: '#dc2626', duration: 8.5,delay: 1.6, rotate: 18,  dy: -14 },
  { Icon: Banana,     top: '85%', left: '38%', size: 40, color: '#eab308', duration: 9.5,delay: 0.9, rotate: -14, dy: -18 },
  { Icon: Sprout,     top: '45%', left: '3%',  size: 38, color: '#16a34a', duration: 10.5,delay: 2.4, rotate: 8,  dy: -16 },
  { Icon: Leaf,       top: '92%', left: '12%', size: 30, color: '#65a30d', duration: 7.5,delay: 1.8, rotate: -10, dy: -12 },
  { Icon: Wheat,      top: '25%', left: '20%', size: 32, color: '#d97706', duration: 9,  delay: 3,   rotate: 12,  dy: -14 },
  { Icon: Salad,      top: '60%', left: '78%', size: 40, color: '#15803d', duration: 8,  delay: 0.5, rotate: -9,  dy: -18 },
];

function FloatingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="floating-blob absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="floating-blob absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-lime-200/40 blur-3xl" style={{ animationDelay: '3s' }} />
      <div className="floating-blob absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" style={{ animationDelay: '6s' }} />
      {FLOATING_ITEMS.map(({ Icon, top, left, size, color, duration, delay, rotate, dy }, i) => (
        <Icon
          key={i}
          size={size}
          className="floating-icon absolute drop-shadow-sm"
          style={{
            top, left, color, opacity: 0.28,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            ['--r' as string]: `${rotate}deg`,
            ['--dy' as string]: `${dy}px`,
          }}
        />
      ))}
    </div>
  );
}

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

  return <>{children(session)}</>;
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 px-4">
      <FloatingBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <img src={logoSrc} alt="Lic. Nutrición" className="h-28 w-28 rounded-full bg-white object-cover shadow-md ring-4 ring-white/70" />
        </div>
        <form onSubmit={submit} className="w-full rounded-2xl bg-white/90 p-8 shadow-lg backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-slate-800">Nutri Recetas</h1>
            <p className="mt-1 text-sm text-slate-500">{mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta profesional'}</p>
          </div>
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-600">
              Correo electrónico
              <input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-emerald-400" />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Contraseña
              <input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-emerald-400" />
            </label>
          </div>
          {message && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
          <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:bg-slate-300">
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="mt-4 w-full text-sm text-emerald-600 hover:text-emerald-800">
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
      </div>
    </main>
  );
}

function AuthSetupNotice() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 px-4">
      <FloatingBackground />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-4 flex justify-center">
          <img src={logoSrc} alt="Lic. Nutrición" className="h-24 w-24 rounded-full bg-white object-cover shadow-md ring-4 ring-white/70" />
        </div>
        <section className="w-full rounded-2xl bg-white/90 p-8 shadow-lg backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-slate-800">Configura Supabase</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env.local para activar el inicio de sesión.
          </p>
        </section>
      </div>
    </main>
  );
}
