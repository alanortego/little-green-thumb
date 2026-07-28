import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { type ScannedPlant, resolveQrCode } from '../../services/qrResolve';
import { Choices } from './PlantFork.styles';

/** T023: the two-choice fork after a successful scan (Learn / Recipes). */
export function PlantFork() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<ScannedPlant | null>(null);

  useEffect(() => {
    if (!qrCode) {
      return; 
    }
    resolveQrCode(qrCode)
      .then(setPlant)
      .catch(() => navigate('/student/scan/not-found', { replace: true, state: { qrCode } }));
  }, [qrCode, navigate]);

  if (!plant) {
    return <Heading kid>Looking that up… 🔍</Heading>;
  }

  return (
    <Choices>
      <Heading kid>You found: {plant.name}! 🌿</Heading>
      <Button kid onClick={() => navigate(`/student/plant/${plant.id}/benefit`)}>
        Learn About This Plant 🧠
      </Button>
      <Button kid variant="secondary" onClick={() => navigate(`/student/plant/${plant.id}/recipes`)}>
        See Recipes 🍽️
      </Button>
    </Choices>
  );
}
