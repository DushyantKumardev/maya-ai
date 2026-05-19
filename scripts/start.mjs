import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
${COLORS.magenta}🚀 Production Server Starting...${COLORS.reset}
`;

function startServer() {
  console.log(LOGO);
  console.log(
    `${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`,
  );
  console.log(
    `${COLORS.green}🌍 Maya AI is initializing on http://localhost:3000${COLORS.reset}`,
  );
  console.log(
    `${COLORS.yellow}🛡️  Privacy Mode: Active | Encryption: AES-256-GCM${COLORS.reset}`,
  );
  console.log(
    `${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`,
  );

  const nextStart = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    shell: true,
  });

  nextStart.on("close", (code) => {
    if (code !== 0) {
      console.log(
        `\n${COLORS.magenta}Maya AI server stopped with code ${code}${COLORS.reset}`,
      );
    }
  });
}

startServer();
