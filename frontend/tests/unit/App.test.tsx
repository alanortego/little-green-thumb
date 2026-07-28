import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@emotion/react';
import { theme } from '../../src/styles/theme';
import App from '../../src/App';

describe('App routing shell', () => {
  it('shows the home page at /', () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    );
    expect(screen.getByText(/little green thumb/i)).toBeInTheDocument();
  });
});
