import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearCurrentStudent } from '../services/currentStudent';
import { IconButton } from './primitives';
import { FixedWrapper } from './SwitchStudentControl.styles';

/**
 * Always-visible control on every student-facing screen (FR-013a). Ends
 * the current student session immediately and returns to the picker —
 * the primary, explicit way a shared tablet gets handed to the next
 * student (the 30-minute idle timeout in idleTimer.ts is the safety net).
 */
export function SwitchStudentControl() {
  const navigate = useNavigate();

  async function handleSwitch() {
    await api('/auth/logout', { method: 'POST' });
    clearCurrentStudent();
    navigate('/student', { replace: true });
  }

  return (
    <FixedWrapper>
      <IconButton kid aria-label="Switch student" onClick={handleSwitch}>
        🔄
      </IconButton>
    </FixedWrapper>
  );
}
