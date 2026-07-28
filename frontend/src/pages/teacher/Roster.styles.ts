import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
`;

export const StudentCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;
