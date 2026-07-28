import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { setCurrentStudent } from '../../services/currentStudent';
import { AvatarCard, Grid } from './ChildPicker.styles';

interface LinkedStudent {
  id: number;
  display_name: string;
  avatar_key: string;
}

/** T056: shown when a parent has more than one linked child (FR-011a). */
export function ChildPicker() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<LinkedStudent[]>([]);

  useEffect(() => {
    api<LinkedStudent[]>('/parents/me/students')
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  async function pick(student: LinkedStudent) {
    await api('/parents/select-student', {
      method: 'POST',
      body: JSON.stringify({ studentId: student.id }),
    });
    setCurrentStudent({ id: student.id, displayName: student.display_name, avatarKey: student.avatar_key });
    navigate('/parent/dashboard');
  }

  return (
    <div>
      <Heading>Which child?</Heading>
      <Grid>
        {students.map((student) => (
          <AvatarCard key={student.id} onClick={() => pick(student)}>
            {student.display_name}
          </AvatarCard>
        ))}
      </Grid>
    </div>
  );
}
