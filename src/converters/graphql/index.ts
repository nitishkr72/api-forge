/**
 * GraphQL converter module.
 *
 * Handles conversion from GraphQL SDL to Postman Collection.
 * Future: could also support GraphQL → OpenAPI, etc.
 */

export {
  generatePostmanCollection,
  type GraphQLToPostmanOptions,
  type GraphQLToPostmanResult,
} from './generator';

export { ConverterDescriptor } from '../../types';

import { generatePostmanCollection } from './generator';
import { ConverterDescriptor } from '../../types';

/**
 * Converter descriptor for registry registration.
 */
export const graphqlToPostmanDescriptor: ConverterDescriptor = {
  id: 'graphql-to-postman',
  name: 'GraphQL SDL → Postman Collection',
  inputFormat: 'graphql-sdl',
  outputFormat: 'postman',
  supportedExtensions: ['.sdl', '.graphql', '.gql'],
  convert: generatePostmanCollection,
};
