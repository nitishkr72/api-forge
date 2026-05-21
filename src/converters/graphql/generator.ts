/**
 * GraphQL SDL to Postman Collection generator.
 *
 * Converts a GraphQL SDL schema into a Postman Collection v2.1 JSON.
 */

import {
  buildSchema,
  GraphQLSchema,
  GraphQLField,
} from 'graphql';

import {
  buildVariables,
  buildVariableDefinitions,
  buildArgumentsString,
  buildSelectionSet,
} from './helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphQLToPostmanOptions {
  /** The GraphQL SDL content as a string */
  sdlContent: string;
  /** The GraphQL endpoint URL (used as baseUrl variable in collection) */
  endpointUrl?: string;
  /** Collection name */
  collectionName?: string;
  /** Max depth for selection set generation (default: 2) */
  maxDepth?: number;
}

export interface GraphQLToPostmanResult {
  /** The Postman collection JSON object */
  collection: any;
  /** Number of query items generated */
  queryCount: number;
  /** Number of mutation items generated */
  mutationCount: number;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function generateRequestItem(
  operationType: 'query' | 'mutation',
  fieldName: string,
  field: GraphQLField<any, any>,
  schema: GraphQLSchema,
  maxDepth: number,
): any {
  const args = field.args;
  const varDefs = buildVariableDefinitions(args);
  const argsStr = buildArgumentsString(args);
  const selectionSet = buildSelectionSet(field.type, schema, 0, maxDepth);
  const variables = buildVariables(args);

  const opName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  const body = selectionSet
    ? `${operationType} ${opName}${varDefs} {\n  ${fieldName}${argsStr} ${selectionSet}\n}`
    : `${operationType} ${opName}${varDefs} {\n  ${fieldName}${argsStr}\n}`;

  return {
    name: fieldName,
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: { raw: '{{baseUrl}}', host: ['{{baseUrl}}'] },
      body: {
        mode: 'graphql',
        graphql: {
          query: body,
          variables: JSON.stringify(variables, null, 2),
        },
      },
    },
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Generate a Postman collection from a GraphQL SDL string.
 */
export function generatePostmanCollection(
  options: GraphQLToPostmanOptions,
): GraphQLToPostmanResult {
  const {
    sdlContent,
    endpointUrl = 'http://localhost:3000/graphql',
    collectionName = 'GraphQL Collection (Generated from SDL)',
    maxDepth = 2,
  } = options;

  const schema = buildSchema(sdlContent);

  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  const queryItems: any[] = [];
  const mutationItems: any[] = [];

  if (queryType) {
    const fields = queryType.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      if (fieldName.startsWith('_')) continue;
      queryItems.push(
        generateRequestItem('query', fieldName, field, schema, maxDepth),
      );
    }
  }

  if (mutationType) {
    const fields = mutationType.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      if (fieldName.startsWith('_')) continue;
      mutationItems.push(
        generateRequestItem('mutation', fieldName, field, schema, maxDepth),
      );
    }
  }

  const collection = {
    info: {
      name: collectionName,
      _postman_id: `graphql-sdl-${Date.now()}`,
      description: `Auto-generated Postman collection from GraphQL SDL.\nEndpoint: ${endpointUrl}`,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [{ key: 'baseUrl', value: endpointUrl }],
    item: [
      ...(queryItems.length > 0
        ? [{ name: 'Queries', item: queryItems }]
        : []),
      ...(mutationItems.length > 0
        ? [{ name: 'Mutations', item: mutationItems }]
        : []),
    ],
  };

  return {
    collection,
    queryCount: queryItems.length,
    mutationCount: mutationItems.length,
  };
}
