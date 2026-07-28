import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Heading, Input } from '../../components/primitives';
import { ApiError, api } from '../../services/api';
import { setCurrentTeacher } from '../../services/currentTeacher';
import { Layout } from './Login.styles';

interface LoginResponse {
  id: number;
  name: string;
  role: 'teacher' | 'admin';
  classId: number | null;
}

/** T045: teacher/admin credential login (FR-022), shared by T062 (admin reuses this). */
export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setCurrentTeacher(user);
      navigate(user.role === 'admin' ? '/admin' : '/teacher/roster');
    } catch (error_) {
      setError(error_ instanceof ApiError ? 'Incorrect email or password.' : 'Could not sign in.');
    }
  }

  return (
    <Layout onSubmit={handleSubmit}>
      <Heading>Teacher / Admin Sign In</Heading>
      <Input
        required
        autoComplete="username"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        required
        autoComplete="current-password"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <Button type="submit">Sign In</Button>
    </Layout>
  );
}
