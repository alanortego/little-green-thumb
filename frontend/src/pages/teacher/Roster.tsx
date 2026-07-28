import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { getCurrentTeacher } from '../../services/currentTeacher';
import { Grid, StudentCard } from './Roster.styles';

interface RosterStudent {
  id: number;
  display_name: string;
  avatar_key: string;
  cookbookCount: number;
  madeCount: number;
  plantsDiscovered: number;
}

/** T046: class roster with each student's Cookbook activity summary (FR-009). */
export function Roster() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const teacher = getCurrentTeacher();
    if (!teacher) {
      navigate('/teacher/login');
      return;
    }
    if (teacher.classId == null) {
      setError('No class is assigned to your account yet.');
      return;
    }
    api<RosterStudent[]>(`/classes/${teacher.classId}/students`)
      .then(setStudents)
      .catch(() => setError('Could not load your roster.'));
  }, [navigate]);

  return (
    <div>
      <Heading>My Class</Heading>
      <div style={{ padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate('/teacher/library')}>
          Browse Plant & Recipe Library
        </Button>
        <Button variant="secondary" onClick={() => navigate('/teacher/garden')}>
          Garden Setup &amp; QR Labels
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <Grid>
        {students.map((s) => (
          <StudentCard key={s.id}>
            <Link to={`/teacher/students/${s.id}`}>{s.display_name}</Link>
            <span>{s.cookbookCount} recipes in Cookbook</span>
            <span>{s.madeCount} made</span>
            <span>{s.plantsDiscovered} plants discovered</span>
          </StudentCard>
        ))}
      </Grid>
    </div>
  );
}
