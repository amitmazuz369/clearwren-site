/** Validates manifest.yml against the schema shipped inside @forge/manifest,
 *  so structural mistakes surface here rather than at first deploy. */
import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
const Ajv = AjvModule.default ?? AjvModule;
const addFormats = addFormatsModule.default ?? addFormatsModule;

const schema = JSON.parse(readFileSync('node_modules/@forge/manifest/out/schema/manifest-schema.json', 'utf8'));
const manifest = yaml.load(readFileSync('packages/app-a11y/manifest.yml', 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
addFormats(ajv);
let validate;
try {
  validate = ajv.compile(schema);
} catch (err) {
  console.error('schema failed to compile:', err.message);
  process.exit(2);
}
const ok = validate(manifest);
if (ok) {
  console.log('manifest is valid against the Forge schema');
} else {
  const seen = new Set();
  for (const e of validate.errors ?? []) {
    const line = `${e.instancePath || '/'} ${e.message}${e.params?.allowedValues ? ' → ' + JSON.stringify(e.params.allowedValues).slice(0, 120) : ''}`;
    if (seen.has(line)) continue;
    seen.add(line);
    console.log(line);
  }
  console.log(`\n${seen.size} distinct errors`);
}
