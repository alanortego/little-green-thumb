import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
`;

export const RecipeCard = styled(Card)`
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

export const RecipeImage = styled.img`
  max-width: 120px;
  max-height: 120px;
  border-radius: ${({ theme }) => theme.radius.md};
`;
