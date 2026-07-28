import styled from '@emotion/styled';

export const DiscoveryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.space.sm};
  padding: 0 ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl} 0;
`;
