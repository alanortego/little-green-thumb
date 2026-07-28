import { useEffect, useState } from 'react';
import { Card, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { Layout, List, PlantRow } from './Library.styles';

interface LibraryPlant {
  id: number;
  name: string;
  benefit_text: string | null;
}

interface LibraryRecipe {
  id: number;
  name: string;
}

/** T049: read-only plant/recipe library browse for teachers (assist context for T048). */
export function Library() {
  const [plants, setPlants] = useState<LibraryPlant[]>([]);
  const [selected, setSelected] = useState<LibraryPlant | null>(null);
  const [recipes, setRecipes] = useState<LibraryRecipe[]>([]);

  useEffect(() => {
    api<LibraryPlant[]>('/plants').then(setPlants).catch(() => setPlants([]));
  }, []);

  useEffect(() => {
    if (!selected) {
      setRecipes([]);
      return;
    }
    api<LibraryRecipe[]>(`/plants/${selected.id}/recipes`)
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, [selected]);

  return (
    <div>
      <Heading>Plant &amp; Recipe Library</Heading>
      <Layout>
        <List>
          {plants.map((plant) => (
            <PlantRow key={plant.id} selected={selected?.id === plant.id} onClick={() => setSelected(plant)}>
              {plant.name}
            </PlantRow>
          ))}
        </List>
        {selected && (
          <List>
            <Heading as="h2">{selected.name}&apos;s Recipes</Heading>
            {selected.benefit_text && <p>{selected.benefit_text}</p>}
            {recipes.length === 0 && <p>No published recipes yet.</p>}
            {recipes.map((recipe) => (
              <Card key={recipe.id}>{recipe.name}</Card>
            ))}
          </List>
        )}
      </Layout>
    </div>
  );
}
