'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { getAthleteCalendar, getSessionDetails } from '@/src/lib/actions/calendar';
import { completeTrainingSession, updateSessionNotes } from '@/src/lib/actions/session-update';
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Training Calendar</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900">{error}</p>
          <p className="text-amber-800 text-sm mt-2">
            Generate a training plan to see your schedule.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Calendar</h1>
          <p className="text-gray-600">View your personalized HYROX training plan by week</p>
        </div>

        {calendarData && (
          <>
            <CalendarView
              monthName={calendarData.monthName}
              weeks={calendarData.weeks}
              onSessionClick={handleSessionClick}
            />

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => {
                  const prevMonth = month === 0 ? 11 : month - 1;
                  const prevYear = month === 0 ? year - 1 : year;
                  handleNavigate(prevMonth, prevYear);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-900 transition-colors"
              >
                ← Previous Month
              </button>

              <span className="text-gray-600">
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
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-900 transition-colors"
              >
                Next Month →
              </button>
            </div>
          </>
        )}

        {selectedSession && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '42rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedSession.title}</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-2xl font-bold hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Purpose</h3>
                  <p className="text-gray-900">{selectedSession.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Duration</h3>
                    <p className="text-gray-900">{Math.round(selectedSession.duration / 60)} minutes</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Intensity</h3>
                    <p className="text-gray-900">{selectedSession.intensity || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Focus</h3>
                    <p className="text-gray-900">{selectedSession.primaryFocus || 'General'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Status</h3>
                    <p className="text-gray-900">{selectedSession.completed ? '✓ Completed' : 'Scheduled'}</p>
                  </div>
                </div>

                {selectedSession.equipment && selectedSession.equipment.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Equipment</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.equipment.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession.safetyNotes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Safety Notes</h3>
                    <p className="text-gray-900">{selectedSession.safetyNotes}</p>
                  </div>
                )}

                {selectedSession.lastCheckIn && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">Completion Details</h3>
                    <div className="space-y-2 text-sm text-green-700">
                      <p>RPE: {selectedSession.lastCheckIn.rpe}/10</p>
                      <p>Actual Duration: {selectedSession.lastCheckIn.actualMinutes} minutes</p>
                      {selectedSession.lastCheckIn.notes && (
                        <p>Notes: {selectedSession.lastCheckIn.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Session Notes</h3>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add your thoughts, how you felt, any observations..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-sans"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {!selectedSession.completed && (
                    <button
                      onClick={handleCompleteSession}
                      disabled={isUpdating}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {isUpdating ? 'Marking...' : '✓ Mark as Completed'}
                    </button>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {isUpdating ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
