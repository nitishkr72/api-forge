#!/usr/bin/env node

/**
 * api-reforge CLI
 *
 * Interactive schema conversion tool.
 * Auto-detects input format from file extension, asks for output format.
 *
 * Usage:
 *   api-reforge
 *   api-reforge --from=schema.sdl
 *   api-reforge --from=schema.sdl --to=postman
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import {
  findConverter,
  findConvertersByExtension,
  getAllConverters,
} from './converters';

const packageJson = require('../package.json');

// ─── Supported formats (derived from registry) ──────────────────────────────

const SUPPORTED_INPUT_EXTENSIONS: Record<string, string> = {
  '.sdl': 'graphql-sdl',
  '.graphql': 'graphql-sdl',
  '.gql': 'graphql-sdl',
  '.json': 'json-schema',
  '.yaml': 'openapi',
  '.yml': 'openapi',
};

const OUTPUT_FORMATS = [
  { name: 'Postman Collection (JSON)', value: 'postman' },
  { name: 'OpenAPI 3.0 (YAML) — coming soon', value: 'openapi', disabled: 'coming soon' },
  { name: 'OpenAPI 3.0 (JSON) — coming soon', value: 'openapi-json', disabled: 'coming soon' },
];

// ─── CLI Setup ───────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('api-reforge')
  .description('⚔️  Reforge your API schemas into any form')
  .version(packageJson.version)
  .option('--from <file>', 'Path to the source schema file')
  .option('--to <format>', 'Output format (postman, openapi)')
  .option('--url <endpoint>', 'GraphQL endpoint URL', 'http://localhost:3000/graphql')
  .option('--output <file>', 'Output file path')
  .option('--name <name>', 'Collection name')
  .option('--depth <number>', 'Max depth for selection sets', '2')
  .parse(process.argv);

const opts = program.opts();

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(chalk.bold.cyan('\n⚔️  api-reforge') + chalk.gray(' — schema conversion tool\n'));

  // Step 1: Ask for source file if not provided
  let fromFile = opts.from;

  if (!fromFile) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'from',
        message: 'Enter the path to your schema file:',
        validate: (input: string) => {
          if (!input.trim()) return 'File path is required';
          const resolved = path.resolve(input.trim());
          if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
          return true;
        },
      },
    ]);
    fromFile = answer.from.trim();
  }

  // Resolve and validate file
  const filePath = path.resolve(fromFile);

  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`\n✖ Error: File not found at "${filePath}"`));
    process.exit(1);
  }

  // Step 2: Detect input format from extension
  const ext = path.extname(filePath).toLowerCase();
  const inputFormat = SUPPORTED_INPUT_EXTENSIONS[ext];

  if (!inputFormat) {
    console.error(
      chalk.red(`\n✖ Error: Unsupported file extension "${ext}"`) +
      chalk.gray(`\n  Supported extensions: ${Object.keys(SUPPORTED_INPUT_EXTENSIONS).join(', ')}\n`)
    );
    process.exit(1);
  }

  console.log(chalk.green(`  ✓ Detected input format: `) + chalk.bold(inputFormat) + chalk.gray(` (from ${ext} extension)`));

  // Step 3: Ask for output format if not provided
  let outputFormat = opts.to;

  if (!outputFormat) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'to',
        message: 'Select output format:',
        choices: OUTPUT_FORMATS,
        default: 'postman',
      },
    ]);
    outputFormat = answer.to;
  }

  // Validate output format
  const validFormats = OUTPUT_FORMATS.map((f) => f.value);
  if (!validFormats.includes(outputFormat)) {
    console.error(
      chalk.red(`\n✖ Error: Unknown output format "${outputFormat}"`) +
      chalk.gray(`\n  Available: ${validFormats.join(', ')}\n`)
    );
    process.exit(1);
  }

  // Check if format is available
  const selectedFormat = OUTPUT_FORMATS.find((f) => f.value === outputFormat);
  if (selectedFormat?.disabled) {
    console.error(chalk.yellow(`\n⚠ "${selectedFormat.name}" is not yet available. Coming soon!`));
    process.exit(1);
  }

  // Step 4: Find the appropriate converter from the registry
  const converter = findConverter(inputFormat, outputFormat);

  if (!converter) {
    console.error(
      chalk.yellow(`\n⚠ Conversion from "${inputFormat}" to "${outputFormat}" is not yet supported.`) +
      chalk.gray('\n  Currently supported: graphql-sdl → postman\n')
    );
    process.exit(1);
  }

  // Step 5: Run the conversion
  console.log(chalk.gray(`\n  Converting ${inputFormat} → ${outputFormat} (using: ${converter.name})...\n`));

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  handleConversion(converter.id, fileContent, filePath);
}

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleConversion(converterId: string, fileContent: string, filePath: string) {
  try {
    const converter = findConverter(
      converterId.includes('graphql') ? 'graphql-sdl' : '',
      converterId.includes('postman') ? 'postman' : '',
    );

    if (!converter) {
      console.error(chalk.red(`\n✖ Error: Converter "${converterId}" not found.\n`));
      process.exit(1);
    }

    const collectionName = opts.name || `API Collection (from ${path.basename(filePath)})`;

    const result = converter.convert({
      sdlContent: fileContent,
      endpointUrl: opts.url,
      collectionName,
      maxDepth: parseInt(opts.depth, 10),
    });

    // Determine output path
    const defaultOutput = path.basename(filePath, path.extname(filePath)) + '_postman_collection.json';
    const outputPath = opts.output
      ? path.resolve(opts.output)
      : path.resolve(defaultOutput);

    // Write output
    fs.writeFileSync(outputPath, JSON.stringify(result.collection, null, 2), 'utf-8');

    console.log(chalk.bold.green(`  ✅ Reforged successfully!\n`));
    console.log(`   ${chalk.gray('Output:')}  ${outputPath}`);
    console.log(`   ${chalk.gray('Queries:')} ${result.queryCount}`);
    console.log(`   ${chalk.gray('Mutations:')} ${result.mutationCount}`);
    console.log(`   ${chalk.gray('Total:')}  ${result.queryCount + result.mutationCount}`);
    console.log(chalk.gray(`\n   Import this file into Postman to use.\n`));
  } catch (err: any) {
    console.error(chalk.red(`\n✖ Error generating collection: ${err.message}\n`));
    process.exit(1);
  }
}

main();
