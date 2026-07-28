import styled from '@emotion/styled';

export const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
  align-items: center;
  padding: ${({ theme }) => theme.space.xl};
`;
