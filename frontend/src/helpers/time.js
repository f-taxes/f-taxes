import { format } from 'date-fns';

export const isZero = ts => {
  if (typeof ts === 'string') {
    return ts === '0001-01-01T00:00:00Z';
  }

  if (typeof ts == 'object' && ts.toISOString) {
    return ts.toISOString() === '0001-01-01T00:00:00.000Z';
  }
};

export const formatTs = (ts, formatStr) => {
  if (typeof ts === 'string') {
    ts = new Date(ts);
  }

  formatStr = formatStr ? formatStr : 'Pp';
  return format(ts, formatStr)
}