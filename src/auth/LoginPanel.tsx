import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../components/primitives/Button';
import { Input } from '../components/primitives/Input';
import { PillToggle } from '../components/primitives/PillToggle';
import { useAuth } from './AuthProvider';

interface LoginPanelProps {
  onDone: () => void;
}

type AuthMode = 'sign-in' | 'sign-up';

const authModeOptions = [
  { label: 'Sign in', value: 'sign-in' },
  { label: 'Sign up', value: 'sign-up' },
] satisfies Array<{ label: string; value: AuthMode }>;

export function LoginPanel({ onDone }: LoginPanelProps) {
  const { isConfigured, signIn, signInWithGoogle, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (mode === 'sign-up') {
        await signUp(email, password);
        setStatus('Account created. Check your email if confirmation is enabled.');
      } else {
        await signIn(email, password);
        onDone();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : 'Google sign-in failed');
      setIsSubmitting(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="grid gap-[var(--space-md)]">
        <p className="text-body text-[var(--color-text-secondary)]">
          Add Supabase environment variables to enable account sync.
        </p>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-md)] font-mono text-mono text-[var(--color-text-primary)]">
          VITE_SUPABASE_URL
          <br />
          VITE_SUPABASE_ANON_KEY
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-[var(--space-lg)]" onSubmit={handleSubmit}>
      <PillToggle label="Mode" onChange={setMode} options={authModeOptions} value={mode} />

      <div className="grid gap-[var(--space-md)]">
        <Input
          autoComplete="email"
          label="Email"
          name="email"
          onChange={(event) => setEmail(event.currentTarget.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <Input
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          label="Password"
          minLength={6}
          name="password"
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      </div>

      {error ? <p className="text-mono text-[var(--color-accent-amber)]">{error}</p> : null}
      {status ? <p className="text-mono text-[var(--color-accent-teal)]">{status}</p> : null}

      <div className="grid gap-[var(--space-sm)]">
        <Button
          disabled={isSubmitting}
          icon={
            mode === 'sign-up' ? (
              <UserPlus aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
            ) : (
              <LogIn aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
            )
          }
          type="submit"
          variant="primary"
        >
          {mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </Button>
        <Button
          disabled={isSubmitting}
          icon={<KeyRound aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
          onClick={handleGoogleSignIn}
          variant="secondary"
        >
          Continue with Google
        </Button>
      </div>

      <p className="flex items-center gap-[var(--space-sm)] text-mono text-[var(--color-text-secondary)]">
        <Mail aria-hidden className="h-[var(--icon-size-xs)] w-[var(--icon-size-xs)]" />
        Flights sync after sign-in; signed-out use remains local.
      </p>
    </form>
  );
}
