import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Heading, Input } from '../../components/primitives';
import { ApiError, api } from '../../services/api';
import { AssistForm, Grid } from './StudentProfile.styles';

interface CookbookEntry {
  id: number;
  recipe_id: number;
  recipe_name: string;
  is_made: 0 | 1;
  rating: 1 | 2 | 3 | null;
}

/**
 * T047/T048: teacher's view of one student's full Cookbook plus an assist
 * action to add a recipe on the student's behalf (added_by=teacher,
 * enforced server-side by canAccessStudent()).
 */
export function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const [entries, setEntries] = useState<CookbookEntry[]>([]);
  const [recipeId, setRecipeId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function loadCookbook() {
    if (!studentId) {
      return; 
    }
    api<CookbookEntry[]>(`/students/${studentId}/cookbook`)
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  useEffect(loadCookbook, [studentId]);

  async function assistAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!studentId || !recipeId) {
      return; 
    }
    try {
      const res = await api<CookbookEntry & { added_by: string }>(`/students/${studentId}/cookbook`, {
        method: 'POST',
        body: JSON.stringify({ recipeId: Number(recipeId) }),
      });
      setMessage(
        res.added_by === 'teacher' && !entries.some((e) => e.recipe_id === Number(recipeId))
          ? 'Added to their Cookbook!'
          : 'Already in their Cookbook.',
      );
      setRecipeId('');
      loadCookbook();
    } catch (error) {
      setMessage(error instanceof ApiError ? 'Could not add that recipe.' : 'Something went wrong.');
    }
  }

  return (
    <div>
      <Heading>Student Cookbook</Heading>
      <AssistForm onSubmit={assistAdd}>
        <Input
          placeholder="Recipe ID"
          type="number"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
        />
        <Button type="submit">Add to Their Cookbook</Button>
      </AssistForm>
      {message && <p role="status">{message}</p>}
      <Grid>
        {entries.map((entry) => (
          <Card key={entry.id}>
            <strong>{entry.recipe_name}</strong>
            <p>{entry.is_made ? `Made it! ${'⭐'.repeat(entry.rating ?? 0)}` : 'Not made yet'}</p>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
