import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
  width: 100%;
`;

export const PlantCard = styled(Card)`
  cursor: pointer;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.font.size.childBody};
  text-align: center;

  &:active {
    transform: scale(0.97);
  }

  > span {
    margin-top: auto;
  }
`;

export const PlantImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
`;
