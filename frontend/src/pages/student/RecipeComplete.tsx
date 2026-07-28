import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { enqueueOrSend } from '../../services/offlineQueue';
import { getCurrentStudent } from '../../services/currentStudent';
import { Layout } from './RecipeComplete.styles';

interface CookbookEntry {
  id: number;
  student_id: number;
  recipe_id: number;
}

/**
 * T033/T039: completion celebration screen with the real "Add to My
 * Cookbook" action — idempotent server-side (FR-006), so a duplicate tap
 * just surfaces the existing entry rather than erroring.
 */
export function RecipeComplete() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'added' | 'already-added' | 'queued'>('idle');

  async function addToCookbook() {
    const student = getCurrentStudent();
    if (!student || !recipeId) {
      return; 
    }

    const result = await enqueueOrSend<CookbookEntry>(`/students/${student.id}/cookbook`, 'POST', {
      recipeId: Number(recipeId),
    });

    if (!result) {
      setStatus('queued');
      return;
    }
    setStatus(result.status === 201 ? 'added' : 'already-added');
  }

  return (
    <Layout>
      <Heading kid>You did it! 🎉</Heading>
      <p>Great job following the whole recipe!</p>
      {status === 'idle' && (
        <Button kid onClick={addToCookbook}>
          Add to My Cookbook 📚
        </Button>
      )}
      {status === 'added' && <p>Added to your Cookbook! 🎉</p>}
      {status === 'already-added' && <p>Already in your Cookbook! 📖</p>}
      {status === 'queued' && <p>Saved! It&apos;ll be added once you&apos;re back online. 📶</p>}
      <Button kid variant="secondary" onClick={() => navigate('/student/scan')}>
        Scan Another Plant 📷
      </Button>
    </Layout>
  );
}
