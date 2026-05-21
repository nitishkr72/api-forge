/**
 * GraphQL-specific helper utilities for type resolution,
 * placeholder generation, and selection set building.
 */

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLArgument,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLType,
  GraphQLNamedType,
  GraphQLUnionType,
} from 'graphql';

// ─── Type Resolution ─────────────────────────────────────────────────────────

export function getNamedType(type: GraphQLType): GraphQLNamedType {
  if (type instanceof GraphQLNonNull) return getNamedType(type.ofType);
  if (type instanceof GraphQLList) return getNamedType(type.ofType);
  return type as GraphQLNamedType;
}

export function formatGraphQLType(type: GraphQLType): string {
  if (type instanceof GraphQLNonNull) {
    return `${formatGraphQLType(type.ofType)}!`;
  }
  if (type instanceof GraphQLList) {
    return `[${formatGraphQLType(type.ofType)}]`;
  }
  return (type as GraphQLNamedType).name;
}

// ─── Placeholder Values ──────────────────────────────────────────────────────

/**
 * Generate a placeholder value for a given GraphQL type.
 */
export function getPlaceholderValue(type: GraphQLType, depth = 0): any {
  if (depth > 3) return null;

  if (type instanceof GraphQLNonNull) {
    return getPlaceholderValue(type.ofType, depth);
  }
  if (type instanceof GraphQLList) {
    const inner = getPlaceholderValue(type.ofType, depth + 1);
    return inner !== null ? [inner] : [];
  }

  const named = type as GraphQLNamedType;

  if (named instanceof GraphQLScalarType) {
    switch (named.name) {
      case 'String':
      case 'ID':
        return '';
      case 'Int':
        return 0;
      case 'Float':
        return 0.0;
      case 'Boolean':
        return false;
      case 'DateTime':
        return '2024-01-01T00:00:00Z';
      case 'JSON':
        return {};
      default:
        return '';
    }
  }

  if (named instanceof GraphQLEnumType) {
    const values = named.getValues();
    return values.length > 0 ? values[0].name : '';
  }

  if (named instanceof GraphQLInputObjectType) {
    const fields = named.getFields();
    const obj: Record<string, any> = {};
    for (const [fieldName, field] of Object.entries(fields)) {
      obj[fieldName] = getPlaceholderValue(field.type, depth + 1);
    }
    return obj;
  }

  return null;
}

// ─── Variables & Arguments ───────────────────────────────────────────────────

export function buildVariables(args: readonly GraphQLArgument[]): Record<string, any> {
  const variables: Record<string, any> = {};
  for (const arg of args) {
    variables[arg.name] = getPlaceholderValue(arg.type);
  }
  return variables;
}

export function buildVariableDefinitions(args: readonly GraphQLArgument[]): string {
  if (args.length === 0) return '';
  const defs = args.map((arg) => {
    const typeStr = formatGraphQLType(arg.type);
    return `$${arg.name}: ${typeStr}`;
  });
  return `(${defs.join(', ')})`;
}

export function buildArgumentsString(args: readonly GraphQLArgument[]): string {
  if (args.length === 0) return '';
  const argStrings = args.map((arg) => `${arg.name}: $${arg.name}`);
  return `(${argStrings.join(', ')})`;
}

// ─── Selection Set ───────────────────────────────────────────────────────────

export function buildSelectionSet(
  type: GraphQLType,
  schema: GraphQLSchema,
  depth = 0,
  maxDepth = 2,
): string {
  if (depth > maxDepth) return '';

  const named = getNamedType(type);

  if (named instanceof GraphQLScalarType || named instanceof GraphQLEnumType) {
    return '';
  }

  if (named instanceof GraphQLUnionType) {
    const types = named.getTypes();
    const fragments = types
      .map((unionType) => {
        const fields = unionType.getFields();
        const fieldSelections = Object.values(fields)
          .filter((f) => {
            const ft = getNamedType(f.type);
            return (
              ft instanceof GraphQLScalarType || ft instanceof GraphQLEnumType
            );
          })
          .map((f) => `      ${f.name}`)
          .slice(0, 5)
          .join('\n');
        return `    ... on ${unionType.name} {\n${fieldSelections}\n    }`;
      })
      .join('\n');
    return `{\n${fragments}\n  }`;
  }

  if (named instanceof GraphQLObjectType) {
    const fields = named.getFields();
    const indent = '  '.repeat(depth + 2);
    const selections: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const fieldNamedType = getNamedType(field.type);

      if (
        fieldNamedType instanceof GraphQLScalarType ||
        fieldNamedType instanceof GraphQLEnumType
      ) {
        selections.push(`${indent}${fieldName}`);
      } else if (
        fieldNamedType instanceof GraphQLObjectType &&
        depth < maxDepth
      ) {
        const nested = buildSelectionSet(
          field.type,
          schema,
          depth + 1,
          maxDepth,
        );
        if (nested) {
          selections.push(`${indent}${fieldName} ${nested}`);
        }
      }
    }

    if (selections.length === 0) return '';
    const closingIndent = '  '.repeat(depth + 1);
    return `{\n${selections.join('\n')}\n${closingIndent}}`;
  }

  return '';
}
