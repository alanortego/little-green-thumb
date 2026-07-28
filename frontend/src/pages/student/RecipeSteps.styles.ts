import styled from '@emotion/styled';

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.xl};
`;

export const StepImage = styled.img`
  max-width: 320px;
  max-height: 320px;
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const StepText = styled.p`
  font-size: ${({ theme }) => theme.font.size.childBody};
  text-align: center;
  max-width: 480px;
`;

export const Controls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
`;
