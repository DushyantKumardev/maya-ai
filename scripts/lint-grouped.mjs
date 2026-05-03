import { execSync } from "child_process"

let output
try {
  output = execSync("npx eslint --format json", { encoding: "utf-8" })
} catch (e) {
  output = e.stdout // eslint exits with code 1 when errors exist
}

const results = JSON.parse(output)

const grouped = {}

for (const file of results) {
  for (const msg of file.messages) {
    const rule = msg.ruleId || "unknown"
    if (!grouped[rule]) grouped[rule] = []
    grouped[rule].push({
      file: file.filePath.replace(process.cwd(), ""),
      line: msg.line,
      col: msg.column,
      message: msg.message,
      severity: msg.severity === 2 ? "error" : "warning",
    })
  }
}

for (const [rule, issues] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
  const severity = issues[0].severity
  const icon = severity === "error" ? "🔴" : "🟡"
  console.log(`\n${icon} ${rule} (${issues.length})`)
  console.log("─".repeat(60))
  for (const i of issues) {
    console.log(`  ${i.file}:${i.line}:${i.col}`)
    console.log(`    ${i.message}`)
  }
}

const totalErrors = Object.values(grouped).flat().filter(i => i.severity === "error").length
const totalWarnings = Object.values(grouped).flat().filter(i => i.severity === "warning").length
console.log(`\n✖ ${totalErrors} errors, ${totalWarnings} warnings across ${Object.keys(grouped).length} rules\n`)