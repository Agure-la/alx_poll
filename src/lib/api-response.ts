import { NextResponse } from 'next/server';
import { AppError, formatErrorResponse, logError } from './errors';
import { ZodError } from 'zod';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: SuccessResponse<T>['meta']
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
}

export function handleApiError(error: unknown, context?: Record<string, any>): NextResponse {
  // Log the error
  if (error instanceof Error) {
    logError(error, context);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new AppError(
      'Validation failed',
      'VALIDATION_ERROR' as any,
      400,
      true,
      {
        validationErrors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    );
    
    return NextResponse.json(
      formatErrorResponse(validationError),
      { status: validationError.statusCode }
    );
  }

  // Handle our custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      formatErrorResponse(error),
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  const unknownError = new AppError(
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR' as any,
    500,
    false
  );
  
  return NextResponse.json(
    formatErrorResponse(unknownError),
    { status: 500 }
  );
}

export function createApiResponse<T>(
  data: T,
  status: number = 200,
  message?: string,
  meta?: SuccessResponse<T>['meta']
): NextResponse {
  return NextResponse.json(
    createSuccessResponse(data, message, meta),
    { status }
  );
}

// Add the missing ApiResponse class that analytics route expects
export class ApiResponse {
  static success<T>(
    data: T,
    message?: string,
    meta?: SuccessResponse<T>['meta']
  ): NextResponse {
    return NextResponse.json(
      createSuccessResponse(data, message, meta),
      { status: 200 }
    );
  }

  static error(
    message: string,
    statusCode: number = 500,
    code?: string
  ): NextResponse {
    const error = new AppError(
      message,
      (code as any) || 'INTERNAL_SERVER_ERROR',
      statusCode
    );
    
    return NextResponse.json(
      formatErrorResponse(error),
      { status: statusCode }
    );
  }
}