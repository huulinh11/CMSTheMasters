import { addMinutes, format } from 'date-fns';

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m} (${minutes} phút)`;
}

export function calculateTimeline(
  items: { duration_minutes: number }[],
  baseTime: string = '08:00'
): string[] {
  const startTimes: string[] = [];
  if (!/^\d{2}:\d{2}$/.test(baseTime)) {
    return items.map(() => "Invalid Time");
  }
  
  let currentTime = new Date(`1970-01-01T${baseTime}:00`);

  items.forEach(() => {
    startTimes.push(format(currentTime, 'HH:mm'));
    const item = items[startTimes.length - 1];
    if (item) {
      currentTime = addMinutes(currentTime, item.duration_minutes);
    }
  });

  return startTimes;
}