import { Route, Routes } from 'react-router-dom';
import { CookbookEntryDetail } from '../student/CookbookEntryDetail';
import { QuickLogin } from './QuickLogin';
import { ChildPicker } from './ChildPicker';
import { ChildDashboard } from './ChildDashboard';

/** Parent route group (US5) — quick login, multi-child picker, and dashboard. */
export function ParentHome() {
  return (
    <Routes>
      <Route index element={<QuickLogin />} />
      <Route element={<ChildPicker />} path="children" />
      <Route element={<ChildDashboard />} path="dashboard" />
      <Route element={<CookbookEntryDetail basePath="/parent" />} path="cookbook/:entryId" />
    </Routes>
  );
}
