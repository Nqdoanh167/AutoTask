const defaultFormatter = {
  d: (date: Date) => date.getDate(),
  dd: (date: Date) => date.getDate().toString().padStart(2, '0'),
  h: (date: Date) => date.getHours().toString().padStart(2, '0'),
  mm: (date: Date) => date.getMinutes().toString().padStart(2, '0'),
  ss: (date: Date) => date.getSeconds().toString().padStart(2, '0'),
  MM: (date: Date) => (date.getMonth() + 1).toString().padStart(2, '0'),
  Y: (date: Date) => date.getFullYear(),
  YY: (date: Date) => date.getFullYear() % 100,
  yyyy: (date: Date) => date.getFullYear().toString().padStart(2, '0'),
};
export const formatDate = (
  date: any,
  format: string,
  formatter: any = defaultFormatter,
) => {
  date = new Date(date);
  // sort keys by length, then value
  const keys = Object.keys(formatter)
    .sort((a, b) => {
      if (a.length > b.length) {
        return -1;
      }
      if (a.length < b.length) {
        return 1;
      }
      if (a > b) {
        return -1;
      }
      if (a < b) {
        return 1;
      }
      return 0;
    })
    .join('|');
  return format.replace(new RegExp(`${keys}`, 'g'), (m) => {
    return formatter[m](date);
  });
};
