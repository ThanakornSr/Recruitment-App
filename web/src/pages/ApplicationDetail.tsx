import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, API_BASE } from '../api';
import { Button, Group, Textarea, Title, Stack, TextInput } from '@mantine/core';

export default function ApplicationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [interviewAt, setInterviewAt] = useState('');

  const load = async () => {
    const res = await api.get(`/admin/applications/${id}`);
    setItem(res.data);
    setNotes(res.data.notes || '');
    setInterviewAt(res.data.interviewAt || '');
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    await api.put(`/admin/applications/${id}/approve`, { notes });
    await load();
  };
  const reject = async () => {
    await api.put(`/admin/applications/${id}/reject`, { notes });
    await load();
  };
  const schedule = async () => {
    await api.put(`/admin/applications/${id}/schedule`, { interviewAt, notes });
    await load();
  };
  const pass = async () => {
    await api.put(`/admin/applications/${id}/interview-result`, { result: 'pass', notes });
    await load();
  };
  const fail = async () => {
    await api.put(`/admin/applications/${id}/interview-result`, { result: 'fail', notes });
    await load();
  };

  if (!item) return null;

  return (
    <Stack>
      <Title order={3}>Application #{item.id}</Title>
      <div>
        <p><strong>Name:</strong> {item.fullName}</p>
        <p><strong>Email:</strong> {item.email}</p>
        <p><strong>Phone:</strong> {item.phone || '-'}</p>
        <p><strong>Position:</strong> {item.position}</p>
        <p><strong>Status:</strong> {item.status}</p>
        <p><strong>Applied At:</strong> {new Date(item.appliedAt).toLocaleString()}</p>
        <p><strong>Last Updated:</strong> {new Date(item.updatedAt).toLocaleString()}</p>
        <p><strong>Interview at:</strong> {item.interviewAt ? new Date(item.interviewAt).toLocaleString() : '-'}</p>
        <p><strong>Photo:</strong> {item.photoPath ? <img src={`${API_BASE}/uploads/photos/${item.photoPath.split('/').pop()}`} width={80} alt="Applicant" /> : '-'}</p>
        <p><strong>CV:</strong> {item.cvPath ? <a href={`${API_BASE}/admin/applications/${item.id}/cv`} target="_blank" rel="noopener noreferrer">Download CV</a> : '-'}</p>
      </div>

      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />

      <Group>
        <Button onClick={approve}>Approve</Button>
        <Button variant="outline" color="red" onClick={reject}>Reject</Button>
      </Group>

      <TextInput 
        label="Interview datetime (ISO)" 
        placeholder="2025-08-21T10:00:00" 
        value={interviewAt} 
        onChange={(e) => setInterviewAt(e.currentTarget.value)}
        description="Format: YYYY-MM-DDTHH:MM:SS"
      />
      <Button onClick={schedule}>Schedule Interview</Button>

      <Group>
        <Button color="green" onClick={pass}>Mark PASS</Button>
        <Button color="red" variant="outline" onClick={fail}>Mark FAIL</Button>
      </Group>

      <Button variant="light" onClick={() => nav(-1)}>Back</Button>
    </Stack>
  );
}
