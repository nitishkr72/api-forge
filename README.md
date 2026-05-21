# api-reforge

> *"Equivalent exchange — reforge your API schemas into any form."* ⚔️🔥

An interactive CLI tool that converts API schemas between formats. Auto-detects input format from file extension and lets you choose the output format.

## Installation

```bash
npm install -g api-reforge
```

## Usage

### Interactive mode (recommended)

Just run the command — it will guide you through:

```bash
api-reforge
```

```
⚔️  api-reforge — schema conversion tool

? Enter the path to your schema file: ./schema.sdl
  ✓ Detected input format: graphql-sdl (from .sdl extension)
? Select output format:
  ❯ Postman Collection (JSON)
    OpenAPI 3.0 (YAML) — coming soon
    OpenAPI 3.0 (JSON) — coming soon

  ✅ Reforged successfully!
   Output:  schema_postman_collection.json
   Queries: 5
   Mutations: 3
   Total:   8
```

### Non-interactive mode (with flags)

```bash
# Provide source file — it will still ask for output format
api-reforge --from=schema.sdl

# Fully non-interactive
api-reforge --from=schema.sdl --to=postman

# Custom endpoint URL
api-reforge --from=schema.sdl --to=postman --url=http://localhost:3000/graphql

# Custom output file
api-reforge --from=schema.sdl --to=postman --output=my-collection.json

# Custom collection name and depth
api-reforge --from=schema.sdl --to=postman --name="My API" --depth=3
```

## Supported Input Formats

Auto-detected from file extension:

| Extension | Detected Format |
|-----------|----------------|
| `.sdl` | GraphQL SDL |
| `.graphql` | GraphQL SDL |
| `.gql` | GraphQL SDL |
| `.json` | JSON Schema |
| `.yaml` | OpenAPI |
| `.yml` | OpenAPI |

If the extension is not recognized, the CLI will error out with a list of supported extensions.

## Supported Output Formats

| Format | Status |
|--------|--------|
| Postman Collection (JSON) | ✅ Available |
| OpenAPI 3.0 (YAML) | 🔜 Coming soon |
| OpenAPI 3.0 (JSON) | 🔜 Coming soon |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from <file>` | Path to the source schema file | _(interactive prompt)_ |
| `--to <format>` | Output format (`postman`, `openapi`) | _(interactive prompt)_ |
| `--url <endpoint>` | GraphQL endpoint URL | `http://localhost:3000/graphql` |
| `--output <file>` | Output file path | `<filename>_postman_collection.json` |
| `--name <name>` | Collection name | `API Collection (from <filename>)` |
| `--depth <number>` | Max depth for nested selection sets | `2` |
| `--version` | Show version | - |
| `--help` | Show help | - |

## Programmatic Usage

```typescript
import { generatePostmanCollection } from 'api-reforge';

const result = generatePostmanCollection({
  sdlContent: `
    type Query {
      getUser(id: ID!): User
    }
    type User {
      id: ID!
      name: String!
    }
  `,
  endpointUrl: 'http://localhost:3000/graphql',
  collectionName: 'My API',
  maxDepth: 2,
});

console.log(JSON.stringify(result.collection, null, 2));
// result.queryCount, result.mutationCount also available
```

## What it generates

- Groups queries and mutations into separate Postman folders
- Generates proper GraphQL variable definitions and argument passing
- Creates placeholder values for all input types (scalars, enums, input objects)
- Handles nested object types, enums, unions, and scalars
- Produces a valid Postman Collection v2.1 format ready to import

## Roadmap

- [x] GraphQL SDL → Postman Collection
- [ ] JSON Schema → OpenAPI
- [ ] OpenAPI → Postman Collection
- [ ] GraphQL SDL → OpenAPI

## Publishing

```bash
npm run build
npm login
npm publish
```

## License

MIT
