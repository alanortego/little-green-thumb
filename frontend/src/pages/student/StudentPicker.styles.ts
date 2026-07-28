import styled from '@emotion/styled';
import { Button } from '../../components/primitives';

export const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.lg};
  justify-content: center;
  padding: ${({ theme }) => theme.space.xl};
`;

export const AvatarButton = styled(Button)`
  flex-direction: column;
  height: 140px;
  width: 140px;
  font-size: 48px;
`;
