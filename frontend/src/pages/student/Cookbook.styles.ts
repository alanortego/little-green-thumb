import styled from '@emotion/styled';
import { Button, Card } from '../../components/primitives';

export const Controls = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  padding: 0 ${({ theme }) => theme.space.xl};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 360px));
  justify-content: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
  width: 100%;
`;

export const RemoveButton = styled(Button)`
  position: absolute;
  top: ${({ theme }) => theme.space.sm};
  right: ${({ theme }) => theme.space.sm};
  min-height: ${({ theme }) => theme.tapTarget.min};
  min-width: auto;
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.md}`};
  background: ${({ theme }) => `color-mix(in srgb, ${theme.color.error} 12%, white)`};
  color: ${({ theme }) => theme.color.error};
  font-size: ${({ theme }) => theme.font.size.body};
  transition:
    opacity 0.15s ease,
    transform 0.1s ease;
`;

export const EntryName = styled.span`
  font-size: ${({ theme }) => theme.font.size.childHeading};
  font-weight: 700;
  line-height: 1.1;
`;

export const EntryStatus = styled.span`
  margin-top: auto;
  color: ${({ theme }) => `color-mix(in srgb, ${theme.color.text} 65%, white)`};
  font-size: ${({ theme }) => theme.font.size.body};
`;

export const EntryCard = styled(Card)`
  position: relative;
  cursor: pointer;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.xs};
  text-align: center;

  &:active {
    transform: scale(0.97);
  }

  @media (hover: hover) {
    & [data-remove-button] {
      opacity: 0;
      pointer-events: none;
    }

    &:hover [data-remove-button],
    &:focus-within [data-remove-button] {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;
