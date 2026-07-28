import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SwitchStudentControl } from '../../components/SwitchStudentControl';
import { startIdleTimer } from '../../services/idleTimer';
import { clearCurrentStudent } from '../../services/currentStudent';
import { Nav, NavItem } from './StudentLayout.styles';

/**
 * Wraps every student-facing route with simple always-visible navigation
 * (Scan / Library / Cookbook), the "Switch Student" control, and the
 * 30-minute idle timer (FR-013a).
 */
export function StudentLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    return startIdleTimer(() => {
      clearCurrentStudent();
      navigate('/student', { replace: true });
    });
  }, [navigate]);

  return (
    <>
      <SwitchStudentControl />
      <Nav>
        <NavItem to="/student/scan">📷 Scan</NavItem>
        <NavItem to="/student/library">📖 Library</NavItem>
        <NavItem to="/student/cookbook">📔 Cookbook</NavItem>
      </Nav>
      <Outlet />
    </>
  );
}
