import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heading } from '../../components/primitives';
import { api } from '../../services/api';
import { Layout } from '../../styles/styles';
import { Grid, RecipeCard, RecipeImage } from './RecipeList.styles';

interface RecipeSummary {
  id: number;
  name: string;
  image_path: string | null;
}

/** T031: recipe list for a plant — picture + name cards (the "See Recipes" pathway). */
export function RecipeList() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);

  useEffect(() => {
    if (!plantId) {
      return;
    }
    api<RecipeSummary[]>(`/plants/${plantId}/recipes`)
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, [plantId]);

  return (
    <Layout>
      <Heading kid>Recipes 🍽️</Heading>
      {recipes.length === 0 && <p>No recipes for this plant yet — check back soon!</p>}
      <Grid>
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} onClick={() => navigate(`/student/recipe/${recipe.id}/steps`)}>
            {recipe.image_path && <RecipeImage alt={recipe.name} src={recipe.image_path} />}
            <span>{recipe.name}</span>
          </RecipeCard>
        ))}
      </Grid>
    </Layout>
  );
}
