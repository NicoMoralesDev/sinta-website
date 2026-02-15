export class AdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminValidationError";
  }
}

export class AdminAuthError extends Error {
  constructor(message = "Unauthorized.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export class AdminForbiddenError extends Error {
  constructor(message = "Forbidden.") {
    super(message);
    this.name = "AdminForbiddenError";
  }
}

export class AdminNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminNotFoundError";
  }
}
