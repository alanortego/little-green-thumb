import styled from '@emotion/styled';

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.xl};
  max-width: 640px;
  margin: 0 auto;
`;

export const Logo = styled.img`
  width: 120px;
  height: 120px;
`;

export const Tagline = styled.p`
  font-size: ${({ theme }) => theme.font.size.childBody};
  color: ${({ theme }) => theme.color.text};
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  width: 100%;
  max-width: 320px;
`;

export const SecondaryLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  font-size: ${({ theme }) => theme.font.size.body};
`;
