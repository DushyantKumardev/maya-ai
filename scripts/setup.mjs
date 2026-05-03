import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const LOGO = `
${COLORS.cyan}${COLORS.bright}
   __  ___                 ___   ____
  /  |/  /__ ___ _____ _  / _ | /  _/
 / /|_/ / _ \`/ // / _ \`/ / __ | _/ /  
/_/  /_/\\_,_/\\_, /\\_,_/ /_/ |_/___/   
            /___/                     
${COLORS.reset}
${COLORS.magenta}✨ High-performance, privacy-first agentic AI assistant ✨${COLORS.reset}
`;

async function setup() {
  console.log(LOGO);
  console.log(`${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);

  // 1. Environment Variables
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  if (!fs.existsSync(envPath)) {
    console.log(`${COLORS.yellow}📡 Initializing environment variables...${COLORS.reset}`);
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(`${COLORS.green}✅ Created .env from .env.example${COLORS.reset}\n`);
    } catch (err) {
      console.log(`${COLORS.yellow}⚠️  Could not find .env.example. Please create .env manually.${COLORS.reset}\n`);
    }
  } else {
    console.log(`${COLORS.green}✅ .env file already exists.${COLORS.reset}\n`);
  }

  // 2. Directory Checks
  const dirs = ['uploads', 'storage', 'certificates'];
  dirs.forEach(dir => {
    const p = path.join(rootDir, dir);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
      console.log(`${COLORS.green}✅ Created ${dir}/ directory${COLORS.reset}`);
    }
  });
  console.log('');

  // 3. Final Message
  console.log(`${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`\n${COLORS.bright}${COLORS.green}🚀 Setup Complete!${COLORS.reset}`);
  console.log(`\n${COLORS.cyan}Next steps:${COLORS.reset}`);
  console.log(`1. Edit ${COLORS.bright}.env${COLORS.reset} with your API keys.`);
  console.log(`2. Ensure ${COLORS.bright}MongoDB${COLORS.reset} is running.`);
  console.log(`3. Run ${COLORS.bright}npm run dev${COLORS.reset} to start Maya.\n`);
  console.log(`${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

setup().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
