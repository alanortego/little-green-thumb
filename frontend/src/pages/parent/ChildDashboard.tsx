import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { getCurrentStudent } from '../../services/currentStudent';
import { Cookbook } from '../student/Cookbook';
import { DiscoveryGrid, TopBar } from './ChildDashboard.styles';

interface Discovery {
  id: number;
  plant_name: string;
  plant_image_path: string | null;
  last_scanned_at: string;
}

/**
 * T057/T058: parent's view of the active child — discovered plants plus the
 * full Cookbook (reusing the student Cookbook component so add/made/rating
 * behavior stays identical to the child's own view, per FR-012). The
 * "Link another child" entry point re-enters the quick-code screen without
 * signing out (T058).
 */
export function ChildDashboard() {
  const navigate = useNavigate();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const student = getCurrentStudent();

  useEffect(() => {
    if (!student) {
      navigate('/parent');
      return;
    }
    api<Discovery[]>(`/students/${student.id}/discoveries`)
      .then(setDiscoveries)
      .catch(() => setDiscoveries([]));
  }, [student, navigate]);

  return (
    <div>
      <TopBar>
        <Heading>{student ? `${student.displayName}'s Garden` : 'Garden'}</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate('/parent/children')}>
            Switch Child
          </Button>
          <Button variant="secondary" onClick={() => navigate('/parent')}>
            Link Another Child
          </Button>
        </div>
      </TopBar>
      <Heading as="h2">Discovered Plants</Heading>
      <DiscoveryGrid>
        {discoveries.map((d) => (
          <Card key={d.id}>{d.plant_name}</Card>
        ))}
        {discoveries.length === 0 && <p>No plants scanned yet.</p>}
      </DiscoveryGrid>
      <Cookbook basePath="/parent" />
    </div>
  );
}
