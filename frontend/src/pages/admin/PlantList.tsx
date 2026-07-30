import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { Grid, PlantCard, Status, Toolbar } from './PlantList.styles';

interface Plant {
  id: number;
  name: string;
  qr_code: string;
  image_path: string | null;
  benefit_text: string | null;
  is_published: boolean;
}

/** Admin plant library — grid list; select a plant to manage its details on a separate page. */
export function PlantList() {
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    api<Plant[]>('/plants?includeDrafts=1').then(setPlants).catch(() => setPlants([]));
  }, []);

  return (
    <div>
      <Heading>Plant Library</Heading>
      <Toolbar>
        <Link to="/admin/plants/new">
          <Button type="button">+ New Plant</Button>
        </Link>
      </Toolbar>
      <Grid>
        {plants.map((plant) => (
          <PlantCard key={plant.id} to={`/admin/plants/${plant.id}`}>
            <strong>{plant.name}</strong>
            <div>
              <Status published={!!plant.is_published}>
                {plant.is_published ? '✅ Published' : '📝 Draft'}
              </Status>
            </div>
          </PlantCard>
        ))}
      </Grid>
    </div>
  );
}
