import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
`;

export const AvatarCard = styled(Card)`
  cursor: pointer;
  min-height: ${({ theme }) => theme.tapTarget.min};
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &:active {
    transform: scale(0.97);
  }
`;
