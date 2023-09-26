import chalk from "chalk"
import inquirer from "inquirer"
import * as fs from "fs/promises"
// import { stdin as input, stdout as output } from "node:process"
// import * as readline from "node:readline/promises"
import * as path from "path"
import * as url from "url"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))
const root = path.join(__dirname, "..")

type IRuntime = {
  npm: string
  npx: string
}

const basicFiles = [
  {
    path: "package.json",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      content = content.replaceAll(`${oldRuntime.npx} `, `${newRuntime.npx} `)
      return content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
    },
  },
  {
    path: "scripts/package.json",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      content = content.replaceAll(`${oldRuntime.npx} `, `${newRuntime.npx} `)
      return content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
    },
  },
  {
    path: "README.md",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      return content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
    },
  },
  {
    path: ".devcontainer/devcontainer.json",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      return content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
    },
  },
  {
    path: ".github/workflows/check.yml",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      content = content.replaceAll(`${oldRuntime.npm} ci`, `${newRuntime.npm} install --production`)
      content = content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
      return content.replaceAll(
        `      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
          cache: "npm"`,
        `      - name: Install bun
        uses: oven-sh/setup-bun@v1`
      )
    },
  },
  {
    path: ".github/workflows/nextjs_bundle_analysis.yml",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      content = content.replaceAll(`${oldRuntime.npm} ci`, `${newRuntime.npm} install --production`)
      content = content.replaceAll(`${oldRuntime.npm} `, `${newRuntime.npm} `)
      content = content.replaceAll(`${oldRuntime.npx} `, `${newRuntime.npx} `)
      return content.replaceAll(
        `      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
          cache: "npm"`,
        `      - name: Install bun
        uses: oven-sh/setup-bun@v1`
      )
    },
  },
  {
    path: ".github/workflows/release.yml",
    replace: (oldRuntime: IRuntime, newRuntime: IRuntime, content: string) => {
      content = content.replaceAll(`${oldRuntime.npm} ci`, `${newRuntime.npm} install --production`)
      return content.replaceAll(`${oldRuntime.npx} `, `${newRuntime.npx} `)
    },
  },
]

const processBasicFiles = async (currentRuntime: IRuntime, newRuntime: IRuntime) => {
  for (const file of basicFiles) {
    const filePath = path.join(root, file.path)
    const fileContent = await fs.readFile(filePath, "utf8")
    const newFileContent = file.replace(currentRuntime, newRuntime, fileContent)
    await fs.writeFile(filePath, newFileContent, "utf8")
    console.log(chalk.blue(`Done for ${filePath}`))
  }
}

export const runtime = async () => {
  const projectInfo = await fs.readFile(path.join(root, "scripts", ".pinfo.json"), "utf8")
  const projectInfoJson = JSON.parse(projectInfo) as { runtime: IRuntime }
  const currentRuntime = projectInfoJson.runtime
  //? Ask for the runtime
  const res = await inquirer.prompt([
    {
      type: "list",
      name: "runtime",
      message: `What runtime do you want to use? (current: ${currentRuntime.npm})`,
      choices: ["node (npm)", "bun"],
    },
  ])

  //? Replace the runtime
  const newRuntime = res.runtime === "node (npm)" ? { npm: "npm", npx: "npx" } : { npm: "bun", npx: "bunx" }
  await processBasicFiles(currentRuntime, newRuntime)

  //? Save the new runtime
  projectInfoJson.runtime = newRuntime
  await fs.writeFile(path.join(root, "scripts", ".pinfo.json"), JSON.stringify(projectInfoJson, null, 2) + "\n", "utf8")
  console.log(chalk.blue(`Done for .pinfo.json`))
}
