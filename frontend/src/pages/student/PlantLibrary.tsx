import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { getCachedPlants } from '../../services/offlineCache';
import { Layout } from '../../styles/styles';
import { Grid, PlantCard, PlantImage } from './PlantLibrary.styles';

interface LibraryPlant {
  id: number;
  name: string;
  image_path: string | null;
  benefit_text: string | null;
}

/** T026: indoor/offline entry point — browse the plant library without scanning. */
export function PlantLibrary() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<LibraryPlant[]>([]);

  useEffect(() => {
    api<LibraryPlant[]>('/plants')
      .then(setPlants)
      .catch(() => getCachedPlants().then(setPlants));
  }, []);

  return (
    <Layout>
      <Heading kid>Plant Library 📖</Heading>
      <Grid>
        {plants.map((plant) => (
          <PlantCard key={plant.id} onClick={() => navigate(`/student/plant/${plant.id}/benefit`)}>
            {plant.image_path && <PlantImage alt={plant.name} src={plant.image_path} />}
            <span>{plant.name}</span>
          </PlantCard>
        ))}
      </Grid>
    </Layout>
  );
}
