import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.lg};
  justify-content: center;
  padding: ${({ theme }) => theme.space.xl};
`;

export const AvatarButton = styled(Card)`
  cursor: pointer;
  min-height: ${({ theme }) => theme.tapTarget.childMin};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.font.size.childBody};
  text-align: center;

  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.childBody};
  font-weight: 700;
  background: ${({ theme }) => theme.color.primary};
  color: #fff;

  &:active {
    transform: scale(0.97);
  }
`;
