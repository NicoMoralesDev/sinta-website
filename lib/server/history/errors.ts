export class HistoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryValidationError";
  }
}

export class HistoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryNotFoundError";
  }
}

