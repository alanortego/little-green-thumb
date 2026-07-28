import { Route, Routes } from 'react-router-dom';
import { Login } from './Login';
import { Roster } from './Roster';
import { StudentProfile } from './StudentProfile';
import { Library } from './Library';
import { GardenSetup } from './GardenSetup';

/** Teacher route group (US4) — login, roster, per-student profile, and library browse. */
export function TeacherHome() {
  return (
    <Routes>
      <Route element={<Login />} path="login" />
      <Route element={<Roster />} path="roster" />
      <Route element={<StudentProfile />} path="students/:studentId" />
      <Route element={<Library />} path="library" />
      <Route element={<GardenSetup />} path="garden" />
    </Routes>
  );
}
