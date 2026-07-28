import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xl};
  max-width: 480px;
`;

export const PlantRow = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
`;
