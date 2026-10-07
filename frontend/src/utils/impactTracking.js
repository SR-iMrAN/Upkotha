// Creates a unique ID for one customer task/session.
export function createImpactSessionId(task) {
  return `${task}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// Calculates how many milliseconds the customer spent on the task.
export function getElapsedMs(startTime) {
  if (!startTime) return null;

  const elapsed = Date.now() - startTime;

  return elapsed >= 0 ? elapsed : null;
}