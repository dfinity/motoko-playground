const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const glob = require('glob');
const util = require('util');
const { exec } = require('child_process');

const globPromise = util.promisify(glob);

async function didc(didPath, outputPath) {
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const jsPath = path.join(outputPath, 'backend.did.js');
    await exec(`didc bind ${didPath} -t js > ${jsPath}`);
    console.log(`Generated ${jsPath}`);
    const tsPath = path.join(outputPath, 'backend.did.d.ts');
    await exec(`didc bind ${didPath} -t ts > ${tsPath}`);
    console.log(`Generated ${tsPath}`);
  } catch (err) {
    console.error(err);
  }
}
async function render(templatePath, outputPath, data) {
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
  try {
    const dataContent = await fs.readFile(dataFile, 'utf-8');
    const data = JSON.parse(dataContent);
    const files = await globPromise(`${templateDir}/**/*.hbs`);
    await Promise.all(files.map(file => {
      const relativePath = path.relative(templateDir, file);
      const outputPath = path.join(outputDir, relativePath.replace(/\.hbs$/, ''));
      return render(file, outputPath, data);
    }));
  } catch (err) {
    console.error(err);
  }
}

if (process.argv.length < 5) {
  console.error('Usage: node bindgen.js <did_file> <output_dir> <hbs_data.json>');
  process.exit(1);
}

const [, , didFile, outputDir, dataFile] = process.argv;
processAllHbsFiles('templates', outputDir, dataFile);
didc(didFile, outputDir);
