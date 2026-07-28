import styled from '@emotion/styled';
import { IconButton } from '../../components/primitives';

export const Video = styled.video`
  width: 100%;
  max-width: 480px;
  border-radius: ${({ theme }) => theme.radius.lg};
  display: block;
  margin: 0 auto;
`;

export const ExitButton = styled(IconButton)`
  position: fixed;
  top: ${({ theme }) => theme.space.md};
  left: ${({ theme }) => theme.space.md};
`;
