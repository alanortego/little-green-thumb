import { useState } from 'react';
import { Button, Heading, Input } from '../../components/primitives';
import { api } from '../../services/api';
import { Filters, StatCard, Stats } from './UsageDashboard.styles';

interface UsageStats {
  from: string | null;
  to: string | null;
  plantsScanned: number;
  recipesAdded: number;
  recipesMade: number;
}

/** T065: super admin usage dashboard (FR-019) — date-range filter, aggregate counts. */
export function UsageDashboard() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState<UsageStats | null>(null);

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (from) {
      params.set('from', from); 
    }
    if (to) {
      params.set('to', to); 
    }
    const query = params.toString();
    const data = await api<UsageStats>(`/admin/usage${query ? `?${query}` : ''}`);
    setStats(data);
  }

  return (
    <div>
      <Heading>Usage Dashboard</Heading>
      <Filters onSubmit={load}>
        <label>
          From
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <Button type="submit">Apply</Button>
      </Filters>
      {stats && (
        <Stats>
          <StatCard>
            <Heading as="h2">{stats.plantsScanned}</Heading>
            <p>Plants scanned</p>
          </StatCard>
          <StatCard>
            <Heading as="h2">{stats.recipesAdded}</Heading>
            <p>Recipes added to a Cookbook</p>
          </StatCard>
          <StatCard>
            <Heading as="h2">{stats.recipesMade}</Heading>
            <p>Recipes marked &quot;I made it!&quot;</p>
          </StatCard>
        </Stats>
      )}
    </div>
  );
}
