import styled from '@emotion/styled';

export const Shell = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.color.background};
  font-family: ${({ theme }) => theme.font.family};
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.primary};

  a {
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }
`;

export const NavLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
`;
