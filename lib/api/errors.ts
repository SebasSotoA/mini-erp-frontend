/**
 * Clases de error personalizadas para el manejo de errores de la API
 */

export interface ApiErrorResponse {
  success: false
  statusCode: number
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
  timestamp: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>,
    public timestamp?: string,
  ) {
    super(message)
    this.name = "ApiError"
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  static fromResponse(response: ApiErrorResponse): ApiError {
    return new ApiError(
      response.statusCode,
      response.message,
      response.errors,
      response.timestamp,
    )
  }

  isValidationError(): boolean {
    return this.statusCode === 400 && !!this.errors && this.errors.length > 0
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404
  }

  isConflictError(): boolean {
    return this.statusCode === 409
  }

  isServerError(): boolean {
    return this.statusCode >= 500
  }

  getValidationErrors(): Record<string, string> {
    if (!this.isValidationError() || !this.errors) {
      return {}
    }

    return this.errors.reduce(
      (acc, error) => {
        acc[error.field] = error.message
        return acc
      },
      {} as Record<string, string>,
    )
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(400, message, errors)
    this.name = "ValidationError"
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message)
    this.name = "NotFoundError"
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message)
    this.name = "ConflictError"
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Error de conexión con el servidor") {
    super(message)
    this.name = "NetworkError"
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

