import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Heading, Input } from '../../components/primitives';
import { ApiError, api } from '../../services/api';
import { setCurrentStudent } from '../../services/currentStudent';
import { Layout } from './QuickLogin.styles';

interface ParentCodeResponse {
  linkedStudentIds: number[];
  activeStudentId: number;
}

/** T055: parent quick-code login — meaningfully fewer steps than teacher/admin (FR-011). */
export function QuickLogin() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api<ParentCodeResponse>('/auth/parent-code', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.linkedStudentIds.length > 1) {
        navigate('/parent/children');
      } else {
        const student = await api<{ id: number; display_name: string; avatar_key: string }[]>(
          '/parents/me/students',
        );
        const active = student.find((s) => s.id === res.activeStudentId);
        if (active) {
          setCurrentStudent({ id: active.id, displayName: active.display_name, avatarKey: active.avatar_key });
        }
        navigate('/parent/dashboard');
      }
    } catch (error_) {
      setError(error_ instanceof ApiError ? 'That code was not found.' : 'Could not sign in.');
    }
  }

  return (
    <Layout onSubmit={handleSubmit}>
      <Heading>Parent Quick Login</Heading>
      <p>Enter the code from your child&apos;s teacher.</p>
      <Input
        autoFocus
        required
        placeholder="Quick code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <Button type="submit">Continue</Button>
    </Layout>
  );
}
