/** Error conocido que conserva el fallo del test sin generar captura. */
export class MappedApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MappedApplicationError';
  }
}

export function hasUnmappedErrors(errors: readonly { message?: string; stack?: string }[]): boolean {
  return errors.length === 0 || errors.some(error =>
    !/^MappedApplicationError:/.test(error.message ?? '') &&
    !/^MappedApplicationError:/.test(error.stack ?? '')
  );
}
