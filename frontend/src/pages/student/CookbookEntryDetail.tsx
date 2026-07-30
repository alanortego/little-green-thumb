import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading, IconButton } from '../../components/primitives';
import { enqueueOrSend } from '../../services/offlineQueue';
import { api } from '../../services/api';
import { getCurrentStudent } from '../../services/currentStudent';
import { Layout, Stars } from './CookbookEntryDetail.styles';

interface CookbookEntry {
  id: number;
  recipe_id: number;
  recipe_name: string;
  recipe_image_path: string | null;
  is_made: boolean;
  rating: 1 | 2 | 3 | null;
}

/** T041: Cookbook entry detail — "I made it!" + 3-icon rating (hidden until made). */
export function CookbookEntryDetail({ basePath = '/student' }: { basePath?: string }) {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<CookbookEntry | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);

  useEffect(() => {
    // No single-entry GET in the contract; the list endpoint carries
    // recipe_name/image, so fetch it once and pick out this entry.
    const student = getCurrentStudent();
    if (!entryId || !student) {
      return; 
    }
    api<CookbookEntry[]>(`/students/${student.id}/cookbook`)
      .then((entries) => setEntry(entries.find((e) => e.id === Number(entryId)) ?? null))
      .catch(() => setEntry(null));
  }, [entryId]);

  async function markMade() {
    if (!entryId) {
      return; 
    }
    const result = await enqueueOrSend<Partial<CookbookEntry>>(`/cookbook/${entryId}/made`, 'POST', {});
    if (result) {
      setEntry((prev) => (prev ? { ...prev, ...result.body } : prev)); 
    } else {
      setSavedOffline(true); 
    }
  }

  async function rate(rating: 1 | 2 | 3) {
    if (!entryId) {
      return; 
    }
    const result = await enqueueOrSend<Partial<CookbookEntry>>(`/cookbook/${entryId}/rating`, 'POST', {
      rating,
    });
    if (result) {
      setEntry((prev) => (prev ? { ...prev, ...result.body } : prev)); 
    } else {
      setSavedOffline(true); 
    }
  }

  return (
    <Layout>
      <Heading kid>{entry?.recipe_name ?? 'Your Recipe'}</Heading>
      {savedOffline && <p>Saved! It&apos;ll sync once you&apos;re back online. 📶</p>}
      {!entry?.is_made && (
        <Button kid onClick={markMade}>
          I Made It! ✅
        </Button>
      )}
      {(entry?.is_made || savedOffline) && (
        <Stars>
          {([1, 2, 3] as const).map((n) => (
            <IconButton
              key={n}
              kid
              aria-label={`Rate ${n} stars`}
              variant={entry?.rating === n ? 'primary' : 'secondary'}
              onClick={() => rate(n)}
            >
              ⭐
            </IconButton>
          ))}
        </Stars>
      )}
      <Button kid variant="secondary" onClick={() => navigate(`${basePath}/cookbook`)}>
        Back to My Cookbook 📚
      </Button>
    </Layout>
  );
}
