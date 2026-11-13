import fs from 'fs';

async function main() {
  try {
    const tailwindNode = await import('@tailwindcss/node');
    const compile = tailwindNode.compile;
    console.log('Compiling Tailwind CSS with @tailwindcss/node...');
    const css = fs.readFileSync('src/index.css', 'utf8');
    const result = await compile(css, {
      base: process.cwd(),
      onDependency: (d) => console.log('Dependency:', d),
    });
    
    const files = fs.readdirSync('src', { recursive: true });
    const candidates = new Set();
    for (const f of files) {
      if (typeof f === 'string' && (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.html'))) {
        const content = fs.readFileSync(`src/${f}`, 'utf8');
        const words = content.match(/[a-zA-Z0-9_\-\/\[\]\:\.\%]+/g) || [];
        words.forEach(w => candidates.add(w));
      }
    }
    const compiled = result.build([...candidates]);
    fs.writeFileSync('src/compiled.css', compiled);
    console.log(`Successfully compiled CSS (${compiled.length} bytes) to src/compiled.css!`);
  } catch (err) {
    if (fs.existsSync('src/compiled.css')) {
      const stats = fs.statSync('src/compiled.css');
      console.log(`Using existing pre-compiled src/compiled.css (${stats.size} bytes).`);
      process.exit(0);
    } else {
      console.error('Tailwind compiler error and no fallback compiled.css found:', err);
      process.exit(1);
    }
  }
}

main();
