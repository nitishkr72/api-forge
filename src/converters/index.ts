/**
 * Converter registry.
 *
 * Central place to register all available converters.
 * When adding a new converter, import its descriptor and add it to the registry.
 */

import { ConverterDescriptor } from '../types';
import { graphqlToPostmanDescriptor } from './graphql';

// ─── Registry ────────────────────────────────────────────────────────────────

const converters: ConverterDescriptor[] = [
  graphqlToPostmanDescriptor,
  // Future converters go here:
  // openApiToPostmanDescriptor,
  // protobufToPostmanDescriptor,
  // jsonSchemaToOpenApiDescriptor,
];

/**
 * Get all registered converters.
 */
export function getAllConverters(): ConverterDescriptor[] {
  return converters;
}

/**
 * Find a converter by input format and output format.
 */
export function findConverter(
  inputFormat: string,
  outputFormat: string,
): ConverterDescriptor | undefined {
  return converters.find(
    (c) => c.inputFormat === inputFormat && c.outputFormat === outputFormat,
  );
}

/**
 * Find all converters that support a given file extension.
 */
export function findConvertersByExtension(ext: string): ConverterDescriptor[] {
  return converters.filter((c) => c.supportedExtensions.includes(ext));
}

/**
 * Get all unique input formats supported.
 */
export function getSupportedInputFormats(): string[] {
  return [...new Set(converters.map((c) => c.inputFormat))];
}

/**
 * Get all unique output formats supported.
 */
export function getSupportedOutputFormats(): string[] {
  return [...new Set(converters.map((c) => c.outputFormat))];
}

// Re-export individual converters for direct access
export { graphqlToPostmanDescriptor } from './graphql';
export {
  generatePostmanCollection,
  type GraphQLToPostmanOptions,
  type GraphQLToPostmanResult,
} from './graphql';
