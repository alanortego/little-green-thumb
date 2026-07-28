import styled from '@emotion/styled';
import { Card } from '../../components/primitives';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  max-width: 520px;
  padding: ${({ theme }) => theme.space.xl};
`;

export const StepCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
`;
