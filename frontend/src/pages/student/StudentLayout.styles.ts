import styled from '@emotion/styled';
import { NavLink } from 'react-router-dom';

export const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
`;

export const NavItem = styled(NavLink)`
  min-height: ${({ theme }) => theme.tapTarget.childMin};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.lg}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.font.size.childBody};
  font-weight: 700;
  text-decoration: none;
  color: ${({ theme }) => theme.color.text};

  &.active {
    background: ${({ theme }) => theme.color.primary};
    color: #fff;
  }
`;
