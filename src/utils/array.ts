export function randomSelect<T>(items: T[]): T {
   return items[Math.floor(Math.random() * items.length)];
}
