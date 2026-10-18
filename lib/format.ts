function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatNumber(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  return `${sign}${String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatTime(ms: number) {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDateTime(ms: number) {
  const date = new Date(ms);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${formatTime(ms)}`;
}
