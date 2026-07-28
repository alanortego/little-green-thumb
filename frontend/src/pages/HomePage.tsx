import { Link, useNavigate } from 'react-router-dom';
import { Button, Heading } from '../components/primitives';
import logo from '../assets/logo.svg';
import { Actions, Layout, Logo, SecondaryLinks, Tagline } from './HomePage.styles';

/**
 * "/" landing page — explains the app's purpose to students and teachers,
 * then routes each into their own flow. Parent/admin logins stay reachable
 * but secondary, matching the student+teacher-first framing.
 */
export function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Logo alt="Little Green Thumb logo" src={logo} />
      <Heading kid>Little Green Thumb 🌱</Heading>
      <Tagline>
        Scan plant tags in the garden, learn what healthy food does for your body, and cook
        fun recipes — all in your own Cookbook!
      </Tagline>
      <Actions>
        <Button kid onClick={() => navigate('/student')}>
          I&apos;m a Student 🧒
        </Button>
        <Button kid variant="secondary" onClick={() => navigate('/teacher/login')}>
          I&apos;m a Teacher 🍎
        </Button>
      </Actions>
      <SecondaryLinks>
        <Link to="/parent">Parent Login</Link>
        <Link to="/admin">Admin Login</Link>
      </SecondaryLinks>
    </Layout>
  );
}
