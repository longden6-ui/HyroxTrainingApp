'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { getAthleteCalendar, getSessionDetails } from '@/src/lib/actions/calendar';
import { completeTrainingSession, updateSessionNotes, updateCompletionDetails } from '@/src/lib/actions/session-update';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { Card } from '@/src/components/layout/Card';
import { CalendarView } from '@/src/components/athlete/CalendarView';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editRPE, setEditRPE] = useState<number | null>(null);
  const [editActualDuration, setEditActualDuration] = useState<number | null>(null);
  const [isEditingCompletionDetails, setIsEditingCompletionDetails] = useState(false);

  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

  useEffect(() => {
    const loadCalendar = async () => {
      setLoading(true);
      setError(null);

      const result = await getAthleteCalendar(month, year);

      if (result.success) {
        setCalendarData(result.calendar);
      } else {
        setError(result.error || 'Unable to load calendar');
      }

      setLoading(false);
    };

    loadCalendar();
  }, [month, year]);

  const handleNavigate = (newMonth: number, newYear: number) => {
    router.push(`/dashboard/calendar?month=${newMonth}&year=${newYear}`);
  };

  const handleSessionClick = async (sessionId: string) => {
    setSessionDetailsLoading(true);
    setSessionNotes('');
    try {
      const result = await getSessionDetails(sessionId);
      if (result.success) {
        setSelectedSession(result.session);
        setSessionNotes(result.session.lastCheckIn?.notes || '');
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setSessionDetailsLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;

    setIsUpdating(true);
    try {
      const result = await completeTrainingSession(selectedSession.id, sessionNotes);
      if (result.success) {
        setSelectedSession({ ...selectedSession, completed: true });
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession) return;

    setIsUpdating(true);
    try {
      const result = await updateSessionNotes(selectedSession.id, sessionNotes);
      if (result.success) {
        setSelectedSession({
          ...selectedSession,
          lastCheckIn: { ...selectedSession.lastCheckIn, notes: sessionNotes },
        });
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateCompletionDetails = async () => {
    if (!selectedSession) return;

    if (editRPE === null || editActualDuration === null) {
      alert('Please fill in all fields');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateCompletionDetails(
        selectedSession.id,
        editRPE,
        editActualDuration
      );
      if (result.success) {
        setSelectedSession({
          ...selectedSession,
          lastCheckIn: {
            ...selectedSession.lastCheckIn,
            rpe: result.rpe,
            actualMinutes: result.actualMinutes,
          },
        });
        setIsEditingCompletionDetails(false);
        setEditRPE(null);
        setEditActualDuration(null);
      } else {
        alert(result.error || 'Failed to update completion details');
      }
    } catch (error) {
      console.error('Failed to update completion details:', error);
      alert('An error occurred while updating completion details');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditCompletionDetails = () => {
    if (selectedSession?.lastCheckIn) {
      setEditRPE(selectedSession.lastCheckIn.rpe);
      setEditActualDuration(selectedSession.lastCheckIn.actualMinutes);
      setIsEditingCompletionDetails(true);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Training Calendar" subtitle="View your personalized HYROX training plan by week">
        <Card>
          <p style={{ color: '#6b7280', margin: 0 }}>Loading calendar...</p>
        </Card>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Training Calendar" subtitle="View your personalized HYROX training plan by week">
        <Card variant="warning">
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{error}</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Generate a training plan to see your schedule.</p>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Training Calendar" subtitle="View your personalized HYROX training plan by week">
      {calendarData && (
        <>
          <CalendarView
            monthName={calendarData.monthName}
            weeks={calendarData.weeks}
            onSessionClick={handleSessionClick}
          />

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                const prevMonth = month === 0 ? 11 : month - 1;
                const prevYear = month === 0 ? year - 1 : year;
                handleNavigate(prevMonth, prevYear);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            >
              ← Previous Month
            </button>

            <span style={{ color: '#6b7280' }}>
              {new Date(year, month).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>

            <button
              onClick={() => {
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                handleNavigate(nextMonth, nextYear);
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            >
              Next Month →
            </button>
          </div>
        </>
      )}

      {selectedSession && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '42rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, background: 'linear-gradient(to right, #9333ea, #6b21a8)', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{selectedSession.title}</h2>
              <button
                onClick={() => setSelectedSession(null)}
                style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Purpose</h3>
                <p style={{ color: '#111827', margin: 0 }}>{selectedSession.purpose}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Duration</h3>
                  <p style={{ color: '#111827', margin: 0 }}>{Math.round(selectedSession.duration / 60)} minutes</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Intensity</h3>
                  <p style={{ color: '#111827', margin: 0 }}>{selectedSession.intensity || 'Not specified'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Focus</h3>
                  <p style={{ color: '#111827', margin: 0 }}>{selectedSession.primaryFocus || 'General'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Status</h3>
                  <p style={{ color: '#111827', margin: 0 }}>{selectedSession.completed ? '✓ Completed' : 'Scheduled'}</p>
                </div>
              </div>

              {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Equipment</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedSession.equipment.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSession.safetyNotes && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Safety Notes</h3>
                  <p style={{ color: '#111827', margin: 0 }}>{selectedSession.safetyNotes}</p>
                </div>
              )}

              {selectedSession.lastCheckIn && (
                <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', margin: 0 }}>Completion Details</h3>
                    <button
                      onClick={handleEditCompletionDetails}
                      disabled={isUpdating || isEditingCompletionDetails}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  {isEditingCompletionDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                          RPE (1-10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editRPE || ''}
                          onChange={(e) => setEditRPE(Math.max(1, Math.min(10, parseInt(e.target.value) || 0)))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #dcfce7',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                          Actual Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="600"
                          value={editActualDuration || ''}
                          onChange={(e) => setEditActualDuration(Math.max(0, parseInt(e.target.value) || 0))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #dcfce7',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleUpdateCompletionDetails}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: isUpdating ? '#9ca3af' : '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontWeight: 500,
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setIsEditingCompletionDetails(false)}
                          disabled={isUpdating}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#e5e7eb',
                            color: '#111827',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#15803d' }}>
                      <p style={{ margin: 0 }}>RPE: {selectedSession.lastCheckIn.rpe}/10</p>
                      <p style={{ margin: 0 }}>Actual Duration: {selectedSession.lastCheckIn.actualMinutes} minutes</p>
                      {selectedSession.lastCheckIn.notes && (
                        <p style={{ margin: 0 }}>Notes: {selectedSession.lastCheckIn.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Session Notes</h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Add your thoughts, how you felt, any observations..."
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    minHeight: '72px',
                    boxSizing: 'border-box',
                  }}
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
                {!selectedSession.completed && (
                  <button
                    onClick={handleCompleteSession}
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      background: isUpdating ? '#9ca3af' : '#16a34a',
                      color: 'white',
                      fontWeight: 500,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => !isUpdating && (e.currentTarget.style.background = '#15803d')}
                    onMouseOut={(e) => !isUpdating && (e.currentTarget.style.background = '#16a34a')}
                  >
                    {isUpdating ? 'Marking...' : '✓ Mark as Completed'}
                  </button>
                )}
                <button
                  onClick={handleSaveNotes}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    background: isUpdating ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    fontWeight: 500,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => !isUpdating && (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseOut={(e) => !isUpdating && (e.currentTarget.style.background = '#2563eb')}
                >
                  {isUpdating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
