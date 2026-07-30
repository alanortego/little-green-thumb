import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { setCurrentStudent } from '../../services/currentStudent';
import { Layout } from '../../styles/styles';
import { AvatarButton, Grid } from './StudentPicker.styles';

interface PickerStudent {
  id: number;
  display_name: string;
  avatar_key: string;
}

/** Emoji stand-ins for avatar art — swappable for illustrated assets later. */
const AVATAR_EMOJI: Record<string, string> = {
  fox: '🦊',
  frog: '🐸',
  owl: '🦉',
  rabbit: '🐰',
  turtle: '🐢',
  bee: '🐝',
};

/** T021: tap-your-avatar picker — the entire "login" a child needs (FR-013). */
export function StudentPicker() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<PickerStudent[]>([]);

  useEffect(() => {
    api<PickerStudent[]>('/auth/students-picker').then(setStudents).catch(() => setStudents([]));
  }, []);

  async function pick(student: PickerStudent) {
    const result = await api<{ id: number; displayName: string; avatarKey: string }>(
      '/auth/select-student',
      { method: 'POST', body: JSON.stringify({ studentId: student.id }) },
    );
    setCurrentStudent(result);
    navigate('/student/scan');
  }

  return (
    <Layout>
      <Heading kid>Who&apos;s cooking today? 🌱</Heading>
      <Grid>
        {students.map((student) => (
          <AvatarButton key={student.id} onClick={() => pick(student)}>
            <span>{AVATAR_EMOJI[student.avatar_key] ?? '🌟'}</span>
            <span>{student.display_name}</span>
          </AvatarButton>
        ))}
      </Grid>
    </Layout>
  );
}
