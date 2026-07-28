import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Card } from '../../components/primitives';

export const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl} 0;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
`;

export const PlantCard = styled(Card.withComponent(Link))`
  display: block;
  text-decoration: none;
  color: inherit;

  &:hover {
    border-color: ${({ theme }) => theme.color.primary};
  }
`;

export const Status = styled.span<{ published: boolean }>`
  color: ${({ theme, published }) => (published ? theme.color.success : theme.color.accent)};
`;
