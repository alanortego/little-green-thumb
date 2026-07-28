import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { adminTheme } from '../../styles/theme';
import { Login } from '../teacher/Login';
import { clearCurrentTeacher, getCurrentTeacher } from '../../services/currentTeacher';
import { Button } from '../../components/primitives';
import { PlantList } from './PlantList';
import { PlantDetail } from './PlantDetail';
import { RecipeList } from './RecipeList';
import { RecipeDetail } from './RecipeDetail';
import { UsageDashboard } from './UsageDashboard';
import { Nav, NavLinks, Shell } from './AdminHome.styles';

/**
 * Admin route group (US6) — distinct "back office" theme (adminTheme) from the
 * playful kid-facing app, and the nav is only shown once an admin is signed in
 * (mirrors the getCurrentTeacher() guard pattern already used by teacher pages).
 */
export function AdminHome() {
  const navigate = useNavigate();
  const admin = getCurrentTeacher();
  const isAdmin = admin?.role === 'admin';

  function handleSignOut() {
    clearCurrentTeacher();
    navigate('/admin/login');
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <Shell>
        {isAdmin && (
          <Nav>
            <NavLinks>
              <Link to="/admin/plants">Plants</Link>
              <Link to="/admin/recipes">Recipes</Link>
              <Link to="/admin/usage">Usage</Link>
            </NavLinks>
            <Button type="button" variant="secondary" onClick={handleSignOut}>
              Sign Out
            </Button>
          </Nav>
        )}
        <Routes>
          <Route element={<Login />} path="login" />
          {isAdmin ? (
            <>
              <Route element={<PlantList />} path="plants" />
              <Route element={<PlantDetail />} path="plants/:id" />
              <Route element={<RecipeList />} path="recipes" />
              <Route element={<RecipeDetail />} path="recipes/:id" />
              <Route element={<UsageDashboard />} path="usage" />
              <Route element={<Navigate replace to="/admin/plants" />} path="*" />
            </>
          ) : (
            <Route element={<Navigate replace to="/admin/login" />} path="*" />
          )}
        </Routes>
      </Shell>
    </ThemeProvider>
  );
}
