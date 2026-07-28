import { useNavigate } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { Layout } from './ScanNotFound.styles';

/** T025: friendly unrecognized-QR error screen with retry/browse fallback. */
export function ScanNotFound() {
  const navigate = useNavigate();

  return (
    <Layout>
      <Heading kid>Hmm, we don&apos;t know that tag yet! 🤔</Heading>
      <Button kid onClick={() => navigate('/student/scan')}>
        Try Again 📷
      </Button>
      <Button kid variant="secondary" onClick={() => navigate('/student/library')}>
        Browse Plants Instead 📖
      </Button>
    </Layout>
  );
}
