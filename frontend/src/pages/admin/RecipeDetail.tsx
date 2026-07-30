import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Heading, Input } from '../../components/primitives';
import { ApiError, api } from '../../services/api';
import { formatMissingField } from '../../services/missingFields';
import { Actions, Form, StepCard } from './RecipeDetail.styles';

interface RecipeStep {
  step_order: number;
  image_path: string | null;
  step_text: string | null;
}

interface Recipe {
  id: number;
  name: string;
  is_published: boolean;
  plantIds: number[];
  steps: RecipeStep[];
}

/** Admin recipe detail page (create when :id is "new", otherwise edit) — separate route
 *  per traditional config/management app conventions (grid list -> detail page). */
export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const plantIdForNew = Number(searchParams.get('plantId'));

  const [name, setName] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) {
      return; 
    }
    api<Recipe>(`/recipes/${id}`).then(setRecipe).catch(() => setRecipe(null));
  }, [id, isNew]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !plantIdForNew) {
      return; 
    }
    const created = await api<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify({ name, plantIds: [plantIdForNew], steps: [{ stepOrder: 1 }] }),
    });
    navigate(`/admin/recipes/${created.id}`, { replace: true });
  }

  function updateStep(index: number, patch: Partial<RecipeStep>) {
    if (!recipe) {
      return; 
    }
    const steps = recipe.steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setRecipe({ ...recipe, steps });
  }

  function addStep() {
    if (!recipe) {
      return; 
    }
    setRecipe({
      ...recipe,
      steps: [...recipe.steps, { step_order: recipe.steps.length + 1, image_path: null, step_text: null }],
    });
  }

  function removeStep(index: number) {
    if (!recipe) {
      return; 
    }
    const steps = recipe.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 }));
    setRecipe({ ...recipe, steps });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!recipe) {
      return; 
    }
    setStatus(null);
    const updated = await api<Recipe>(`/recipes/${recipe.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: recipe.name,
        plantIds: recipe.plantIds,
        steps: recipe.steps.map((s) => ({
          stepOrder: s.step_order,
          imagePath: s.image_path,
          stepText: s.step_text,
        })),
      }),
    });
    setRecipe(updated);
    setStatus('Saved.');
  }

  async function handlePublish() {
    if (!recipe) {
      return; 
    }
    setMissingFields(null);
    setStatus(null);
    try {
      const published = await api<Recipe>(`/recipes/${recipe.id}/publish`, { method: 'POST' });
      setRecipe(published);
      setStatus('Published!');
    } catch (error) {
      if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'missingFields' in error.body) {
        setMissingFields((error.body as { missingFields: string[] }).missingFields);
      } else {
        setStatus('Could not publish.');
      }
    }
  }

  if (isNew) {
    return (
      <div>
        <Heading>New Recipe</Heading>
        <Form onSubmit={handleCreate}>
          <label>
            Name
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <Button type="submit">Create</Button>
        </Form>
      </div>
    );
  }

  if (!recipe) {
    return <Heading>Loading…</Heading>;
  }

  return (
    <div>
      <Heading>{recipe.name}</Heading>
      <Form onSubmit={handleSave}>
        <label>
          Name
          <Input value={recipe.name} onChange={(e) => setRecipe({ ...recipe, name: e.target.value })} />
        </label>
        {recipe.steps.map((step, index) => (
          <StepCard key={index}>
            <strong>Step {step.step_order}</strong>
            <label>
              Image path
              <Input
                value={step.image_path ?? ''}
                onChange={(e) => updateStep(index, { image_path: e.target.value })}
              />
            </label>
            <label>
              Step text
              <Input
                value={step.step_text ?? ''}
                onChange={(e) => updateStep(index, { step_text: e.target.value })}
              />
            </label>
            <Button type="button" variant="secondary" onClick={() => removeStep(index)}>
              Remove step
            </Button>
          </StepCard>
        ))}
        <Button type="button" variant="secondary" onClick={addStep}>
          + Add step
        </Button>
        <Actions>
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={handlePublish}>
            {recipe.is_published ? 'Published ✅' : 'Publish'}
          </Button>
        </Actions>
        {status && <p role="status">{status}</p>}
        {missingFields && (
          <p role="alert">
            Can&apos;t publish yet — still missing: {missingFields.map(formatMissingField).join(', ')}.
          </p>
        )}
      </Form>
    </div>
  );
}
