import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading, IconButton } from '../../components/primitives';
import { api } from '../../services/api';
import { Controls, Layout, StepImage, StepText } from './RecipeSteps.styles';

interface RecipeStep {
  id: number;
  step_order: number;
  image_path: string | null;
  step_text: string | null;
}

interface RecipeDetail {
  id: number;
  name: string;
  steps: RecipeStep[];
}

/** T032: one picture + step text + "next" per step, ending in RecipeComplete. */
export function RecipeSteps() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!recipeId) {
      return; 
    }
    api<RecipeDetail>(`/recipes/${recipeId}`)
      .then(setRecipe)
      .catch(() => setRecipe(null));
  }, [recipeId]);

  if (!recipe) {
    return <Heading kid>Loading recipe… 🍲</Heading>;
  }

  const step = recipe.steps[stepIndex];
  const isLastStep = stepIndex === recipe.steps.length - 1;

  function goNext() {
    if (isLastStep) {
      navigate(`/student/recipe/${recipe!.id}/complete`);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <Layout>
      <Heading kid>
        {recipe.name} — Step {stepIndex + 1} of {recipe.steps.length}
      </Heading>
      {step.image_path && <StepImage alt={`Step ${stepIndex + 1}`} src={step.image_path} />}
      <StepText>{step.step_text}</StepText>
      <Controls>
        <IconButton
          kid
          aria-label="Previous step"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          ⬅️
        </IconButton>
        <Button kid onClick={goNext}>
          {isLastStep ? 'Finish! 🎉' : 'Next ➡️'}
        </Button>
      </Controls>
    </Layout>
  );
}
