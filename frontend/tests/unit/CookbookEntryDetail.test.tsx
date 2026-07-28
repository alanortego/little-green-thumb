import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@emotion/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { theme } from '../../src/styles/theme';
import { CookbookEntryDetail } from '../../src/pages/student/CookbookEntryDetail';
import { setCurrentStudent } from '../../src/services/currentStudent';

const notMadeEntry = {
  id: 7,
  recipe_id: 3,
  recipe_name: 'Carrot Soup',
  recipe_image_path: null,
  is_made: 0,
  rating: null,
};

function renderEntry() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/student/cookbook/7']}>
        <Routes>
          <Route element={<CookbookEntryDetail />} path="/student/cookbook/:entryId" />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('CookbookEntryDetail rating gate', () => {
  beforeEach(() => {
    setCurrentStudent({ id: 1, displayName: 'Alex', avatarKey: 'fox' });
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/made')) {
          return Promise.resolve(
            new Response(JSON.stringify({ ...notMadeEntry, is_made: 1 }), { status: 200 }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([notMadeEntry]), { status: 200 }));
      }),
    );
  });

  it('hides the star rating until the student marks the recipe made', async () => {
    renderEntry();

    // Recipe name loads from the list endpoint, rating stars start hidden
    await screen.findByText('Carrot Soup');
    expect(screen.queryByLabelText(/rate 1 stars/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /i made it/i }));

    await waitFor(() => expect(screen.getByLabelText(/rate 1 stars/i)).toBeInTheDocument());
  });
});
