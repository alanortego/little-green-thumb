import styled from '@emotion/styled';

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
  text-align: center;
`;

export const Stars = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
`;
