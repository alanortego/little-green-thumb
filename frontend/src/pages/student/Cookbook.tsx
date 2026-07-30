import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { getCurrentStudent } from '../../services/currentStudent';
import { Layout } from '../../styles/styles';
import { Controls, EntryCard, EntryName, EntryStatus, Grid, RemoveButton } from './Cookbook.styles';

interface CookbookEntry {
  id: number;
  recipe_id: number;
  recipe_name: string;
  recipe_image_path: string | null;
  is_made: boolean;
  rating: 1 | 2 | 3 | null;
  created_at: string;
}

type SortKey = 'newest' | 'alphabetical' | 'rating';

/** T040/T057: Cookbook list with filter (made/not-made) and sort controls (FR-007).
 *  `basePath` lets parent/teacher screens reuse this without hardcoding /student routes. */
export function Cookbook({ basePath = '/student' }: { basePath?: string }) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CookbookEntry[]>([]);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filterMade, setFilterMade] = useState<'all' | 'made' | 'not-made'>('all');
  const [entryToRemove, setEntryToRemove] = useState<CookbookEntry | null>(null);
  const [removalError, setRemovalError] = useState<string | null>(null);

  useEffect(() => {
    const student = getCurrentStudent();
    if (!student) {
      return;
    }

    const params = new URLSearchParams({ sort });
    if (filterMade !== 'all') {
      params.set('filterMade', String(filterMade === 'made'));
    }

    api<CookbookEntry[]>(`/students/${student.id}/cookbook?${params}`)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [sort, filterMade]);

  async function remove(entryId: number) {
    try {
      await api(`/cookbook/${entryId}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      setEntryToRemove(null);
    } catch {
      setRemovalError('Could not remove that recipe. Please try again.');
    }
  }

  return (
    <Layout>
      <Heading kid>My Cookbook 📚</Heading>
      <Controls>
        <Button
          variant={sort === 'newest' ? 'primary' : 'secondary'}
          onClick={() => setSort('newest')}
        >
          Newest
        </Button>
        <Button
          variant={sort === 'alphabetical' ? 'primary' : 'secondary'}
          onClick={() => setSort('alphabetical')}
        >
          A-Z
        </Button>
        <Button
          variant={sort === 'rating' ? 'primary' : 'secondary'}
          onClick={() => setSort('rating')}
        >
          Top Rated
        </Button>
        <Button
          variant={filterMade === 'made' ? 'primary' : 'secondary'}
          onClick={() => setFilterMade(filterMade === 'made' ? 'all' : 'made')}
        >
          I Made It ✅
        </Button>
      </Controls>
      {removalError && <p role="alert">{removalError}</p>}
      {entries.length === 0 && <p>No recipes in your Cookbook yet — go scan a plant!</p>}
      <Grid>
        {entries.map((entry) => (
          <EntryCard key={entry.id} onClick={() => navigate(`${basePath}/cookbook/${entry.id}`)}>
            <RemoveButton
              data-remove-button
              type="button"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                setRemovalError(null);
                setEntryToRemove(entry);
              }}
            >
              Remove
            </RemoveButton>
            {entry.recipe_image_path && (
              <img alt={entry.recipe_name} src={entry.recipe_image_path} />
            )}
            <EntryName>{entry.recipe_name}</EntryName>
            {entry.is_made ? (
              <EntryStatus>Made it! {'⭐'.repeat(entry.rating ?? 0)}</EntryStatus>
            ) : (
              <EntryStatus>Not made yet</EntryStatus>
            )}
          </EntryCard>
        ))}
      </Grid>
      <ConfirmDialog
        confirmLabel="Remove"
        description={`Remove ${entryToRemove?.recipe_name ?? 'this recipe'} from your Cookbook?`}
        onCancel={() => setEntryToRemove(null)}
        onConfirm={() => {
          if (entryToRemove) {
            void remove(entryToRemove.id);
          }
        }}
        open={entryToRemove !== null}
        title="Remove recipe?"
      />
    </Layout>
  );
}
