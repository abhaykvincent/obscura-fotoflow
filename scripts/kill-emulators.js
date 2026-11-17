const { execFileSync } = require("child_process");

const PORTS = [8081, 9099, 5000, 5001, 5002, 9199, 4400];

function findPids(port) {
  try {
    if (process.platform === "win32") {
      const output = execFileSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess`,
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      );
      return output.split(/\s+/).filter(Boolean).map(Number);
    }

    const output = execFileSync("lsof", ["-ti", `tcp:${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.split(/\s+/).filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(pid), "/F", "/T"], {
        stdio: "ignore",
      });
    } else {
      process.kill(pid, "SIGKILL");
    }
  } catch {
    // Process already exited.
  }
}

const seen = new Set();
for (const port of PORTS) {
  for (const pid of findPids(port)) {
    if (!pid || pid === process.pid || seen.has(pid)) {
      continue;
    }
    seen.add(pid);
    console.log(`Stopping process on port ${port} (PID ${pid})`);
    killProcess(pid);
  }
}
