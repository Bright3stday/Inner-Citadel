export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}
