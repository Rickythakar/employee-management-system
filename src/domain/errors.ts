export class ValidationError extends Error {
  override readonly name = 'ValidationError';
}

export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
}

export class ConflictError extends Error {
  override readonly name = 'ConflictError';
}

export class DependencyError extends Error {
  override readonly name = 'DependencyError';
}
