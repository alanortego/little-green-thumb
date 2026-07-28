import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Heading, Input } from '../../components/primitives';
import { ApiError, api } from '../../services/api';
import { formatMissingField } from '../../services/missingFields';
import { Actions, Form } from './PlantDetail.styles';

interface Plant {
  id: number;
  name: string;
  qr_code: string;
  image_path: string | null;
  benefit_text: string | null;
  is_published: 0 | 1;
}

/** Admin plant detail page (create when :id is "new", otherwise edit) — separate route
 *  per traditional config/management app conventions (grid list -> detail page). */
export function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [plant, setPlant] = useState<Plant | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) {
      return; 
    }
    api<Plant>(`/plants/${id}`).then(setPlant).catch(() => setPlant(null));
  }, [id, isNew]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !qrCode) {
      return; 
    }
    const created = await api<Plant>('/plants', { method: 'POST', body: JSON.stringify({ name, qrCode }) });
    navigate(`/admin/plants/${created.id}`, { replace: true });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!plant) {
      return; 
    }
    setStatus(null);
    const updated = await api<Plant>(`/plants/${plant.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: plant.name,
        imagePath: plant.image_path,
        benefitText: plant.benefit_text,
      }),
    });
    setPlant(updated);
    setStatus('Saved.');
  }

  async function handlePublish() {
    if (!plant) {
      return; 
    }
    setMissingFields(null);
    setStatus(null);
    try {
      const published = await api<Plant>(`/plants/${plant.id}/publish`, { method: 'POST' });
      setPlant(published);
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
        <Heading>New Plant</Heading>
        <Form onSubmit={handleCreate}>
          <label>
            Name
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            QR code value
            <Input required value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
          </label>
          <Button type="submit">Create</Button>
        </Form>
      </div>
    );
  }

  if (!plant) {
    return <Heading>Loading…</Heading>;
  }

  return (
    <div>
      <Heading>{plant.name}</Heading>
      <Form onSubmit={handleSave}>
        <label>
          Name
          <Input value={plant.name} onChange={(e) => setPlant({ ...plant, name: e.target.value })} />
        </label>
        <label>
          Image path
          <Input
            value={plant.image_path ?? ''}
            onChange={(e) => setPlant({ ...plant, image_path: e.target.value })}
          />
        </label>
        <label>
          Benefit text
          <Input
            value={plant.benefit_text ?? ''}
            onChange={(e) => setPlant({ ...plant, benefit_text: e.target.value })}
          />
        </label>
        <Actions>
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={handlePublish}>
            {plant.is_published ? 'Published ✅' : 'Publish'}
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
