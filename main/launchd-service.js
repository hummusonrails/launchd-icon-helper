// core service for reading, writing and managing launchd plists
const { execFile, exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const plist = require("plist");

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// three domains we scan for launchd jobs
const DOMAINS = {
  user: path.join(os.homedir(), "Library/LaunchAgents"),
  "system-agents": "/Library/LaunchAgents",
  "system-daemons": "/Library/LaunchDaemons",
};

// run a shell command and return stdout
const runCmd = async (cmd) => {
  const { stdout } = await execAsync(cmd);
  return stdout.trim();
};

// run a command with admin privileges via osascript
const sudoExec = async (cmd) => {
  const escaped = cmd.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const script = `do shell script "${escaped}" with administrator privileges`;
  const { stdout } = await execFileAsync("osascript", ["-e", script]);
  return stdout.trim();
};

// get set of currently running launchd labels
const getRunningLabels = async () => {
  try {
    const output = await runCmd("launchctl list");
    const labels = new Set();
    for (const line of output.split("\n").slice(1)) {
      const parts = line.split("\t");
      if (parts.length >= 3) labels.add(parts[2]);
    }
    return labels;
  } catch {
    return new Set();
  }
};

// turn schedule fields into a readable string
const describeSchedule = (config) => {
  if (config.StartInterval) {
    const mins = Math.round(config.StartInterval / 60);
    return mins >= 1 ? `every ${mins}m` : `every ${config.StartInterval}s`;
  }
  if (config.StartCalendarInterval) {
    const cal = config.StartCalendarInterval;
    const parts = [];
    if (cal.Weekday !== undefined) parts.push(`weekday ${cal.Weekday}`);
    if (cal.Hour !== undefined) parts.push(`hour ${cal.Hour}`);
    if (cal.Minute !== undefined) parts.push(`min ${cal.Minute}`);
    return parts.length ? parts.join(", ") : "calendar";
  }
  if (config.WatchPaths) return "on file change";
  if (config.RunAtLoad) return "at load";
  return "manual";
};

// turn a reverse-dns label into a friendly name
// turn a reverse-dns label into a friendly name, keeping the org/app prefix
const makeDisplayName = (label) => {
  const parts = label.split(".");
  if (parts.length <= 2) return label;
  const meaningful = parts.slice(1);
  return meaningful
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
};

// extract the program path from a plist config
const extractProgram = (config) => {
  if (config.Program) return config.Program;
  if (config.ProgramArguments && config.ProgramArguments.length > 0) {
    return config.ProgramArguments[0];
  }
  return "";
};

// read and parse a single plist file safely
const readPlist = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return plist.parse(raw);
  } catch {
    return null;
  }
};

// get the plist path for a label in a given domain
const plistPath = (label, domain) => {
  const dir = DOMAINS[domain];
  if (!dir) throw new Error(`unknown domain: ${domain}`);
  return path.join(dir, `${label}.plist`);
};

// list all agents across all three domains
const getAllAgents = async () => {
  const running = await getRunningLabels();
  const agents = [];

  for (const [domain, dir] of Object.entries(DOMAINS)) {
    let files;
    try {
      files = await fs.readdir(dir);
    } catch {
      // directory may not exist or not be readable
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".plist")) continue;
      const filePath = path.join(dir, file);
      const config = await readPlist(filePath);
      if (!config || !config.Label) continue;

      agents.push({
        label: config.Label,
        displayName: makeDisplayName(config.Label),
        domain,
        status: running.has(config.Label) ? "running" : "stopped",
        enabled: !config.Disabled,
        program: extractProgram(config),
        schedule: describeSchedule(config),
      });
    }
  }

  return agents;
};

// read full plist detail for one agent
const getAgentDetail = async (label, domain) => {
  const filePath = plistPath(label, domain);
  const config = await readPlist(filePath);
  if (!config) throw new Error(`could not read plist for ${label}`);

  return {
    label: config.Label,
    domain,
    program: extractProgram(config),
    args: config.ProgramArguments || [],
    runAtLoad: !!config.RunAtLoad,
    keepAlive: !!config.KeepAlive,
    interval: config.StartInterval || null,
    calendarInterval: config.StartCalendarInterval || null,
    watchPaths: config.WatchPaths || [],
    stdoutPath: config.StandardOutPath || "",
    stderrPath: config.StandardErrorPath || "",
    disabled: !!config.Disabled,
  };
};

// load or unload an agent via launchctl
const toggleAgent = async (label, domain, enabled) => {
  const filePath = plistPath(label, domain);
  const cmd = enabled
    ? `launchctl load -w "${filePath}"`
    : `launchctl unload -w "${filePath}"`;

  if (domain === "user") {
    await runCmd(cmd);
  } else {
    await sudoExec(cmd);
  }
};

// build plist xml from a config object
const buildPlist = (config) => {
  const obj = {
    Label: config.label,
  };

  if (config.program) obj.Program = config.program;
  if (config.args && config.args.length) obj.ProgramArguments = config.args;
  if (config.runAtLoad) obj.RunAtLoad = true;
  if (config.keepAlive) obj.KeepAlive = true;
  if (config.interval) obj.StartInterval = config.interval;
  if (config.calendarInterval) obj.StartCalendarInterval = config.calendarInterval;
  if (config.watchPaths && config.watchPaths.length) obj.WatchPaths = config.watchPaths;
  if (config.stdoutPath) obj.StandardOutPath = config.stdoutPath;
  if (config.stderrPath) obj.StandardErrorPath = config.stderrPath;

  return plist.build(obj);
};

// save a plist file and load it into launchd
const saveAgent = async (config) => {
  const domain = config.domain || "user";
  const filePath = plistPath(config.label, domain);
  const xml = buildPlist(config);

  // unload first if it already exists
  try {
    if (domain === "user") {
      await runCmd(`launchctl unload "${filePath}"`);
    } else {
      await sudoExec(`launchctl unload "${filePath}"`);
    }
  } catch {
    // may not be loaded yet
  }

  if (domain === "user") {
    await fs.writeFile(filePath, xml, "utf8");
    await runCmd(`launchctl load -w "${filePath}"`);
  } else {
    // write via sudo for system domains
    const escaped = xml.replace(/'/g, "'\\''");
    await sudoExec(`echo '${escaped}' > "${filePath}" && launchctl load -w "${filePath}"`);
  }
};

// unload and delete a plist
const removeAgent = async (label, domain) => {
  const filePath = plistPath(label, domain);

  try {
    if (domain === "user") {
      await runCmd(`launchctl unload "${filePath}"`);
    } else {
      await sudoExec(`launchctl unload "${filePath}"`);
    }
  } catch {
    // might not be loaded
  }

  if (domain === "user") {
    await fs.unlink(filePath);
  } else {
    await sudoExec(`rm "${filePath}"`);
  }
};

module.exports = {
  getAllAgents,
  getAgentDetail,
  toggleAgent,
  saveAgent,
  removeAgent,
};
