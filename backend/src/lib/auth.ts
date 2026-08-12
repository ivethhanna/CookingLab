import { APIGatewayProxyEvent } from 'aws-lambda';

type CognitoClaims = {
  [key: string]: string | string[] | undefined;
};

function getClaims(event: APIGatewayProxyEvent): CognitoClaims {
  return (event.requestContext.authorizer?.claims ?? {}) as CognitoClaims;
}

export function isAdmin(event: APIGatewayProxyEvent): boolean {
  const groups = getClaims(event)['cognito:groups'];

  if (Array.isArray(groups)) {
    return groups.includes('admin');
  }

  return typeof groups === 'string' && groups.split(',').map((group) => group.trim()).includes('admin');
}

export function getUserId(event: APIGatewayProxyEvent): string {
  const sub = getClaims(event).sub;

  if (typeof sub !== 'string' || !sub) {
    throw new Error('Missing Cognito sub claim');
  }

  return sub;
}
