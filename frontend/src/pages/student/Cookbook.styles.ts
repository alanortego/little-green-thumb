import styled from '@emotion/styled';
import { Card, IconButton } from '../../components/primitives';

export const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  padding: 0 ${({ theme }) => theme.space.xl};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
`;

export const EntryCard = styled(Card)`
  position: relative;
  cursor: pointer;
  min-height: ${({ theme }) => theme.tapTarget.childMin};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.xs};
  text-align: center;

  &:active {
    transform: scale(0.97);
  }
`;

export const RemoveButton = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => theme.space.xs};
  right: ${({ theme }) => theme.space.xs};
  min-height: ${({ theme }) => theme.tapTarget.min};
  min-width: ${({ theme }) => theme.tapTarget.min};
`;
