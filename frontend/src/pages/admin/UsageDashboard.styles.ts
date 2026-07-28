import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Filters = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  align-items: flex-end;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.xl} 0;
`;

export const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
  flex-wrap: wrap;
`;

export const StatCard = styled(Card)`
  min-width: 180px;
  text-align: center;
`;
