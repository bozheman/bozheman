---
name: "cli-anything-list"
description: "List all available CLI-Anything tools (installed via pip/cli-hub and locally generated in agent-harness)."
metadata:
  author: "HKUDS/CLI-Anything"
  source: "cli-anything-plugin/commands/list.md"
---

# cli-anything:list Command

List all available CLI-Anything tools (installed and generated).

## Usage

```bash
/cli-anything-list [--path <directory>] [--depth <n>] [--json]
```

## Options

- `--path <directory>` - Directory to search for generated CLIs (default: current directory)
- `--depth <n>` - Maximum recursion depth for scanning (default: unlimited). Use `0` for current directory only, `1` for one level deep, etc.
- `--json` - Output in JSON format for machine parsing

## Implementation Steps

When this command is invoked, the agent should:

1. **Parse arguments**
   - Extract `--path` value (default: `.`)
   - Extract `--depth` value (default: `None` for unlimited recursion)
   - Extract `--json` flag (default: false)

2. **Scan installed CLIs**
   - Use `importlib.metadata.distributions()` to find all packages starting with `cli-anything-`
   - Extract software name, version, and find executable path via `shutil.which`

3. **Scan generated CLIs**
   - Search for `**/agent-harness/cli_anything/*/__init__.py` (respecting `--depth`)
   - Extract software name, version from `setup.py`, and relative source path

4. **Merge and display results**
   - Deduplicate by software name (prefer `installed` status when both exist, preserving `source`)
   - Output as an aligned table or JSON (`--json`)
