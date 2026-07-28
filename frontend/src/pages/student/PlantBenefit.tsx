import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading, IconButton } from '../../components/primitives';
import { api } from '../../services/api';
import type { ScannedPlant } from '../../services/qrResolve';
import { BenefitText, Controls, Layout, PlantImage } from './PlantBenefit.styles';

/** T024: plant benefit page — picture and one benefit sentence. */
export function PlantBenefit() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<ScannedPlant | null>(null);

  useEffect(() => {
    if (!plantId) {
      return; 
    }
    api<ScannedPlant>(`/plants/${plantId}`)
      .then(setPlant)
      .catch(() => setPlant(null));
  }, [plantId]);

  if (!plant) {
    return <Heading kid>Loading… 🌱</Heading>;
  }

  return (
    <Layout>
      <Heading kid>{plant.name}</Heading>
      {plant.image_path && <PlantImage alt={plant.name} src={plant.image_path} />}
      <BenefitText>{plant.benefit_text}</BenefitText>
      <Controls>
        <IconButton kid aria-label="Back" onClick={() => navigate(-1)}>
          ⬅️
        </IconButton>
        <Button kid variant="secondary" onClick={() => navigate(`/student/plant/${plant.id}/recipes`)}>
          See Recipes 🍽️
        </Button>
      </Controls>
    </Layout>
  );
}
