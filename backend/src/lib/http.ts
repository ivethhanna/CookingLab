import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiProblemDetails } from '../../../shared/types';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/**
 * Respuesta exitosa en JSON con headers CORS
 */
export function ok<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Respuesta de error basada en el estándar RFC 7807 (Problem Details)
 */
export function problem(details: ApiProblemDetails): APIGatewayProxyResult;
export function problem(
  statusCode: number,
  title: string,
  detail: string,
  instance?: string,
  invalidParams?: ApiProblemDetails['invalidParams']
): APIGatewayProxyResult;
export function problem(
  detailsOrStatusCode: ApiProblemDetails | number,
  title?: string,
  detail?: string,
  instance?: string,
  invalidParams?: ApiProblemDetails['invalidParams']
): APIGatewayProxyResult {
  const details: ApiProblemDetails =
    typeof detailsOrStatusCode === 'number'
      ? {
          type: 'about:blank',
          title: title ?? '',
          status: detailsOrStatusCode,
          detail: detail ?? '',
          ...(instance ? { instance } : {}),
          ...(invalidParams ? { invalidParams } : {}),
        }
      : detailsOrStatusCode;

  return {
    statusCode: details.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/problem+json',
    },
    body: JSON.stringify(details),
  };
}
