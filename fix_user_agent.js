const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f === 'route.ts') {
      let c = fs.readFileSync(p, 'utf8');
      // Replace userAgent without || undefined
      // Pattern: userAgent: request.headers.get('user-agent') NOT followed by ||
      // We use a simpler regex and check context manually or just replace all that don't have ||
      
      const regex = /userAgent: request\.headers\.get\('user-agent'\)(?!\s*\|\|)/g;
      
      if (regex.test(c)) {
        console.log('Fixing', p);
        const newC = c.replace(regex, "userAgent: request.headers.get('user-agent') || undefined");
        fs.writeFileSync(p, newC);
      }
    }
  });
}

walk('apps/api/src/app/api/v1');
