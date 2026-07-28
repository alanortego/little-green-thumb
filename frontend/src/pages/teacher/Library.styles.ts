import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Layout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xl};
  padding: ${({ theme }) => theme.space.xl};
  flex-wrap: wrap;
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  min-width: 220px;
`;

export const PlantRow = styled(Card)<{ selected?: boolean }>`
  cursor: pointer;
  border-color: ${({ theme, selected }) => (selected ? theme.color.primary : theme.color.border)};
`;
