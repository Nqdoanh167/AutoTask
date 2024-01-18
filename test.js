const deadlineDate = '2024-12-31T23:59:59.999Z';
const deadlineDateTimestamp = new Date(deadlineDate).getTime();
const now = new Date().getTime();

// return number of days,hours,minutes,seconds between two dates
const diff = deadlineDateTimestamp - now;
const days = Math.floor(diff / (1000 * 60 * 60 * 24));
const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((diff % (1000 * 60)) / 1000);

console.log(days, hours, minutes, seconds);
