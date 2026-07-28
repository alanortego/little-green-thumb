import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
`;

export const PlantCard = styled(Card)`
  cursor: pointer;
  min-height: ${({ theme }) => theme.tapTarget.childMin};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.font.size.childBody};
  text-align: center;

  &:active {
    transform: scale(0.97);
  }
`;

export const PlantImage = styled.img`
  max-width: 220px;
  max-height: 220px;
  border-radius: ${({ theme }) => theme.radius.md};
`;
