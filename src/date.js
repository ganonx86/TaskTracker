// Valide et normalise une date au format YYYY-MM-DD.
export function parseDeadline(input) {
  if (!input) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) {
    throw new Error(`Date invalide "${input}". Utilisez le format AAAA-MM-JJ.`);
  }
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Date invalide "${input}". Utilisez le format AAAA-MM-JJ.`);
  }
  return input;
}

export function isOverdue(deadline, completed) {
  if (!deadline || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${deadline}T00:00:00`) < today;
}
