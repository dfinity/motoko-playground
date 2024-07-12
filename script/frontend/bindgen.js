const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const glob = require('glob');
const util = require('util');

const globPromise = util.promisify(glob);

async function bindgen(templatePath, outputPath, data) {
  try {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const renderedContent = template(data);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, renderedContent, 'utf-8');
    console.log(`Generated ${outputPath}`);
  } catch (err) {
    console.error(err);
  }
}
async function processAllHbsFiles(templateDir, outputDir, dataFile) {
  const dataContent = await fs.readFile(dataFile, 'utf-8');
  const data = JSON.parse(dataContent);
  const files = await globPromise(`${templateDir}/**/*.hbs`);
  await Promise.all(files.map(file => {
    const relativePath = path.relative(templateDir, file);
    const outputPath = path.join(outputDir, relativePath.replace(/\.hbs$/, ''));
    return bindgen(file, outputPath, data);
  }));
}

if (process.argv.length < 5) {
  console.error('Usage: node bindgen.js <template_dir> <output_dir> <data>');
  process.exit(1);
}

const [, , templateDir, outputDir, dataFile] = process.argv;
processAllHbsFiles(templateDir, outputDir, dataFile);
