'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { getAthleteCalendar } from '@/src/lib/actions/calendar';
import { CalendarView } from '@/src/components/athlete/CalendarView';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any>(null);

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
              onSessionClick={(week: string, day: string) => {
                console.log(`Clicked ${day} in ${week}`);
              }}
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
      </div>
    </main>
  );
}
