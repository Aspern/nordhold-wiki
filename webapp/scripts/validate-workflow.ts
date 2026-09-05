import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requiredJobNames = [
  "infra:validate",
  "app:validate",
  "app:build",
  "infra:plan",
  "app:deploy",
  "infra:verify",
] as const;

const requiredActionPins = [
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
  "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
  "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  "aws-actions/configure-aws-credentials@cbe3b392738ccf3f987d68400dafcf4b0624a56c",
  "hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e",
] as const;

function occurrences(text: string, value: string): number {
  return text.split(value).length - 1;
}

async function main(): Promise<void> {
  const webappRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const workflow = await readFile(
    resolve(webappRoot, "../.github/workflows/wiki-platform.yml"),
    "utf8",
  );
  const issues: string[] = [];
  for (const name of requiredJobNames) {
    if (occurrences(workflow, `name: ${name}`) !== 1) {
      issues.push(`Workflow must contain exact job name '${name}' once.`);
    }
  }
  for (const action of requiredActionPins) {
    if (!workflow.includes(`uses: ${action}`)) {
      issues.push(`Workflow does not use approved action pin '${action}'.`);
    }
  }
  const uses = [...workflow.matchAll(/^\s*- uses: ([^\s]+)$/gmu)].map((match) => match[1]);
  for (const action of uses) {
    if (action === undefined || !/@[a-f0-9]{40}$/u.test(action)) {
      issues.push(`Workflow action '${action ?? "unknown"}' is not pinned to a full commit SHA.`);
    }
  }
  const requiredFragments = [
    "needs: [infra_validate, app_validate]",
    "needs: [app_build, infra_plan]",
    "needs: [app_deploy]",
    "environment: production",
    "github.ref == 'refs/heads/main'",
    "terraform -chdir=infra/production apply -auto-approve production.tfplan",
    "npm audit --json --audit-level=high",
    "npm run bundle:validate",
    "node webapp/scripts/verify-release.ts",
  ];
  for (const fragment of requiredFragments) {
    if (!workflow.includes(fragment)) {
      issues.push(`Workflow is missing required control '${fragment}'.`);
    }
  }
  if (/aws_access_key_id|aws_secret_access_key|AKIA[0-9A-Z]{16}/iu.test(workflow)) {
    issues.push("Workflow contains a static AWS credential pattern.");
  }
  if (issues.length > 0) {
    throw new Error(`Workflow policy validation failed:\n- ${issues.sort().join("\n- ")}`);
  }
  console.log(
    "Workflow policy valid: six exact jobs, immutable actions, staged gates, and OIDC deploy controls.",
  );
}

await main();
