import { useEffect, useState } from 'react';
import { Button, Heading } from '../../components/primitives';
import { api, apiUrl } from '../../services/api';
import { getCurrentTeacher } from '../../services/currentTeacher';
import { Actions, List, PlantRow } from './GardenSetup.styles';

interface Plant {
  id: number;
  name: string;
}

/**
 * T069/T070: garden setup — teacher/admin checks off which published
 * plants are physically in their garden, saves the selection, then opens
 * a printable QR label sheet (browser print-to-PDF) for exactly those
 * plants. Printing is disabled while the selection is empty (Edge Cases).
 */
export function GardenSetup() {
  const teacher = getCurrentTeacher();
  const classId = teacher?.classId ?? null;
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api<Plant[]>('/plants').then(setPlants).catch(() => setPlants([]));
  }, []);

  useEffect(() => {
    if (classId === null) {
      return; 
    }
    api<Plant[]>(`/classes/${classId}/garden-selection`)
      .then((current) => setSelectedIds(new Set(current.map((p) => p.id))))
      .catch(() => setSelectedIds(new Set()));
  }, [classId]);

  function toggle(plantId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) {
        next.delete(plantId); 
      } else {
        next.add(plantId); 
      }
      return next;
    });
  }

  async function handleSave() {
    if (classId === null) {
      return; 
    }
    setStatus(null);
    await api(`/classes/${classId}/garden-selection`, {
      method: 'PUT',
      body: JSON.stringify({ plantIds: Array.from(selectedIds) }),
    });
    setStatus('Garden selection saved.');
  }

  function handlePrint() {
    if (classId === null) {
      return; 
    }
    window.open(apiUrl(`/classes/${classId}/garden-labels.pdf`), '_blank');
  }

  if (classId === null) {
    return <Heading>No class assigned to this account.</Heading>;
  }

  return (
    <List>
      <Heading>Garden Setup</Heading>
      <p>Check off which plants are physically in your garden.</p>
      {plants.map((plant) => (
        <PlantRow key={plant.id}>
          <input
            checked={selectedIds.has(plant.id)}
            id={`plant-${plant.id}`}
            type="checkbox"
            onChange={() => toggle(plant.id)}
          />
          <label htmlFor={`plant-${plant.id}`}>{plant.name}</label>
        </PlantRow>
      ))}
      <Actions>
        <Button type="button" onClick={handleSave}>
          Save Selection
        </Button>
        <Button disabled={selectedIds.size === 0} type="button" variant="secondary" onClick={handlePrint}>
          Print QR Labels
        </Button>
      </Actions>
      {status && <p role="status">{status}</p>}
    </List>
  );
}
