import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const isZero = ts => {
  if (typeof ts === 'string') {
    return ts === '0001-01-01T00:00:00Z';
  }

  if (typeof ts == 'object' && ts.toISOString) {
    return ts.toISOString() === '0001-01-01T00:00:00.000Z';
  }
};

export const formatTs = (ts, formatStr, tz = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
  if (typeof ts === 'string') {
    ts = parseISO(ts);
  }

  formatStr = formatStr ? formatStr : 'Pp';
  return format(utcToZonedTime(ts, tz), formatStr)
}

export const getLocalDateFormat = () => {
  return format(new Date("1900-11-30T00:00:00Z"), 'P').replace('30', 'dd').replace('11', 'MM').replace('1900', 'y');
}