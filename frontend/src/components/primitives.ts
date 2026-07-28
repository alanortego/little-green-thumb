import styled from '@emotion/styled';

/**
 * Base tappable button. Enforces the 44px minimum tap target (constitution
 * Principle II, FR-014) by default; student-facing screens should use
 * `<Button kid />` for the larger 88px target.
 */
export const Button = styled.button<{ kid?: boolean; variant?: 'primary' | 'secondary' }>`
  min-height: ${({ theme, kid }) => (kid ? theme.tapTarget.childMin : theme.tapTarget.min)};
  min-width: ${({ theme, kid }) => (kid ? theme.tapTarget.childMin : theme.tapTarget.min)};
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.lg}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme, kid }) => (kid ? theme.font.size.childBody : theme.font.size.body)};
  font-weight: 700;
  background: ${({ theme, variant }) =>
    variant === 'secondary' ? theme.color.surface : theme.color.primary};
  color: ${({ theme, variant }) => (variant === 'secondary' ? theme.color.primary : '#fff')};
  border: ${({ theme, variant }) =>
    variant === 'secondary' ? `2px solid ${theme.color.primary}` : 'none'};
  transition: transform 0.1s ease;

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Large, icon-only button for the student flow (e.g. replay, back, next). */
export const IconButton = styled(Button)`
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: ${({ theme }) => theme.space.md};
  aspect-ratio: 1;
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space.md};
`;

/** Text input for the (rare) non-child screens — teacher/admin login, parent code entry. */
export const Input = styled.input`
  min-height: ${({ theme }) => theme.tapTarget.min};
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.md}`};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.body};
`;

export const Heading = styled.h1<{ kid?: boolean }>`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme, kid }) => (kid ? theme.font.size.childHeading : theme.font.size.heading)};
  color: ${({ theme }) => theme.color.text};
  margin: 0 0 ${({ theme }) => theme.space.md} 0;
`;
