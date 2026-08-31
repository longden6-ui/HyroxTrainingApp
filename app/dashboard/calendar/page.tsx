import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getAthleteCalendar } from '@/lib/actions/calendar';
import { CalendarView } from '@/components/athlete/CalendarView';

export const metadata = {
  title: 'Training Calendar | HYROX Coach',
  description: 'View your personalized HYROX training plan calendar',
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getSession();
  if (!session?.athleteId) {
    redirect('/signin');
  }

  const now = new Date();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

  const calendarResult = await getAthleteCalendar(month, year);

  if (!calendarResult.success) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Training Calendar</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900">{calendarResult.error || 'Unable to load calendar'}</p>
          <p className="text-amber-800 text-sm mt-2">
            Generate a training plan to see your schedule.
          </p>
        </div>
      </div>
    );
  }

  const handleNavigate = (newMonth: number, newYear: number) => {
    window.location.href = `/dashboard/calendar?month=${newMonth}&year=${newYear}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Calendar</h1>
          <p className="text-gray-600">View your personalized HYROX training plan by week</p>
        </div>

        {calendarResult.calendar && (
          <>
            <CalendarView
              monthName={calendarResult.calendar.monthName}
              weeks={calendarResult.calendar.weeks}
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
