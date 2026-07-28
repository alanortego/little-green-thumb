import styled from '@emotion/styled';

export const FixedWrapper = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.space.md};
  right: ${({ theme }) => theme.space.md};
  z-index: 1000;
`;
