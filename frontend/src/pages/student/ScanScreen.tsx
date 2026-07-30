import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { Button, Heading } from '../../components/primitives';
import { Layout } from '../../styles/styles';
import { ExitButton, Video } from './ScanScreen.styles';

/** T022: full-screen camera scanner (native BarcodeDetector where available). */
export function ScanScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        scanner.stop();
        navigate(`/student/plant/fork/${encodeURIComponent(result.data)}`);
      },
      { highlightScanRegion: true, highlightCodeOutline: true },
    );

    scanner.start().catch(() => setCameraError(true));
    return () => scanner.destroy();
  }, [navigate]);

  return (
    <Layout>
      <ExitButton kid aria-label="Exit scanning" onClick={() => navigate('/student')}>
        ⬅️
      </ExitButton>
      <Heading kid>Scan a plant tag! 📷</Heading>
      {cameraError ? (
        <div>
          <p>We couldn&apos;t open the camera. You can still browse the plants below.</p>
          <Button kid onClick={() => navigate('/student/library')}>
            Browse Plants
          </Button>
        </div>
      ) : (
        <Video ref={videoRef} />
      )}
    </Layout>
  );
}
