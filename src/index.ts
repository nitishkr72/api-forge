/**
 * api-reforge — Core Library
 *
 * Public API surface. Re-exports all converters and registry utilities.
 */

// Shared types
export { type BaseConvertOptions, type BaseConvertResult, type ConverterDescriptor } from './types';

// Registry utilities
export {
  getAllConverters,
  findConverter,
  findConvertersByExtension,
  getSupportedInputFormats,
  getSupportedOutputFormats,
} from './converters';

// GraphQL converter (direct access for backward compatibility)
export {
  generatePostmanCollection,
  type GraphQLToPostmanOptions,
  type GraphQLToPostmanResult,
} from './converters/graphql';

// Legacy type aliases for backward compatibility
export type GenerateOptions = import('./converters/graphql').GraphQLToPostmanOptions;
export type GenerateResult = import('./converters/graphql').GraphQLToPostmanResult;
