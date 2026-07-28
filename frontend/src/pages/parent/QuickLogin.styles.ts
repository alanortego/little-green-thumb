import styled from '@emotion/styled';

export const Layout = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
  max-width: 360px;
  margin: 0 auto;
`;
