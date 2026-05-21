/**
 * Shared types for api-reforge converters.
 */

/**
 * Base options that all converters accept.
 */
export interface BaseConvertOptions {
  /** The raw schema content as a string */
  schemaContent: string;
  /** Target endpoint URL */
  endpointUrl?: string;
  /** Collection/output name */
  collectionName?: string;
}

/**
 * Base result that all converters return.
 */
export interface BaseConvertResult {
  /** The generated output object (Postman collection, OpenAPI doc, etc.) */
  output: any;
  /** Summary stats about the conversion */
  stats: Record<string, number>;
}

/**
 * Describes a converter module so the CLI and registry can discover it.
 */
export interface ConverterDescriptor {
  /** Unique identifier for this converter (e.g., 'graphql-to-postman') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Input format identifier */
  inputFormat: string;
  /** Output format identifier */
  outputFormat: string;
  /** File extensions this converter handles */
  supportedExtensions: string[];
  /** The conversion function */
  convert: (options: any) => any;
}
