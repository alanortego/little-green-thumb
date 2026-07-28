import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { StudentLayout } from './pages/student/StudentLayout';
import { StudentPicker } from './pages/student/StudentPicker';
import { ScanScreen } from './pages/student/ScanScreen';
import { PlantFork } from './pages/student/PlantFork';
import { PlantBenefit } from './pages/student/PlantBenefit';
import { ScanNotFound } from './pages/student/ScanNotFound';
import { PlantLibrary } from './pages/student/PlantLibrary';
import { RecipeList } from './pages/student/RecipeList';
import { RecipeSteps } from './pages/student/RecipeSteps';
import { RecipeComplete } from './pages/student/RecipeComplete';
import { Cookbook } from './pages/student/Cookbook';
import { CookbookEntryDetail } from './pages/student/CookbookEntryDetail';
import { TeacherHome } from './pages/teacher/TeacherHome';
import { ParentHome } from './pages/parent/ParentHome';
import { AdminHome } from './pages/admin/AdminHome';

/**
 * Role-based route groups per plan.md Project Structure: student/, teacher/,
 * parent/, admin/. Only the student group needs the Switch-Student +
 * idle-timeout shell (FR-013a) — the other roles use normal session expiry.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<StudentLayout />} path="/student">
          <Route index element={<StudentPicker />} />
          <Route element={<ScanScreen />} path="scan" />
          <Route element={<ScanNotFound />} path="scan/not-found" />
          <Route element={<PlantLibrary />} path="library" />
          <Route element={<PlantFork />} path="plant/fork/:qrCode" />
          <Route element={<PlantBenefit />} path="plant/:plantId/benefit" />
          <Route element={<RecipeList />} path="plant/:plantId/recipes" />
          <Route element={<RecipeSteps />} path="recipe/:recipeId/steps" />
          <Route element={<RecipeComplete />} path="recipe/:recipeId/complete" />
          <Route element={<Cookbook />} path="cookbook" />
          <Route element={<CookbookEntryDetail />} path="cookbook/:entryId" />
        </Route>
        <Route element={<TeacherHome />} path="/teacher/*" />
        <Route element={<ParentHome />} path="/parent/*" />
        <Route element={<AdminHome />} path="/admin/*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
