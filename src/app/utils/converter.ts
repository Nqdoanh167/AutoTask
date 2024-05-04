import moment from 'moment';

export const convertDateToYMD = (value: Date) => {
  return moment(value).format('YYYY-MM-DD');
};

function convertDateToDMY(value: string): string {
  const datePart = value.match(/\d+/g),
    year = datePart?.[0],
    month = datePart?.[1],
    day = datePart?.[2];
  return day + '/' + month + '/' + year;
}
