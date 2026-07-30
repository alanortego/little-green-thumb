import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { Filters, Grid, RecipeCard, Status } from './RecipeList.styles';

interface Plant {
  id: number;
  name: string;
}

interface Recipe {
  id: number;
  name: string;
  is_published: boolean;
}

/** Admin recipe library — pick a plant, browse its recipes as a grid, manage details on a
 *  separate page (recipes are scoped to a plant in this data model). */
export function RecipeList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantId, setPlantId] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    api<Plant[]>('/plants?includeDrafts=1').then(setPlants).catch(() => setPlants([]));
  }, []);

  useEffect(() => {
    if (plantId === null) {
      setRecipes([]);
      return;
    }
    api<Recipe[]>(`/plants/${plantId}/recipes?includeDrafts=1`).then(setRecipes).catch(() => setRecipes([]));
  }, [plantId]);

  return (
    <div>
      <Heading>Recipe Library</Heading>
      <Filters>
        <label>
          <span>Plant</span>
          <select value={plantId ?? ''} onChange={(e) => setPlantId(Number(e.target.value) || null)}>
            <option value="">Choose a plant…</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {plantId !== null && (
          <Link to={`/admin/recipes/new?plantId=${plantId}`}>
            <Button type="button">+ New Recipe</Button>
          </Link>
        )}
      </Filters>
      <Grid>
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} to={`/admin/recipes/${recipe.id}`}>
            <strong>{recipe.name}</strong>
            <div>
              <Status published={!!recipe.is_published}>
                {recipe.is_published ? '✅ Published' : '📝 Draft'}
              </Status>
            </div>
          </RecipeCard>
        ))}
      </Grid>
    </div>
  );
}
