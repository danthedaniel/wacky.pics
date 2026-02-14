#!/usr/bin/env python3
import os
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANSIBLE_DIR = os.path.join(REPO_ROOT, "ansible")
GROUP_VARS_DIR = os.path.join(ANSIBLE_DIR, "inventory", "group_vars", "all")


def read_example(path):
    """Parse a YAML example file into a list of (key, hint) tuples."""
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, hint = line.partition(":")
            hint = hint.strip().strip('"')
            entries.append((key.strip(), hint))
    return entries


def prompt_file(example_path):
    """Prompt the user for each key in an example file and write the result.
    Returns the target path, or None if the target file already exists."""
    target_path = example_path.removesuffix(".example")
    rel_path = os.path.relpath(target_path, REPO_ROOT)

    if os.path.exists(target_path):
        print(f"Skipping {rel_path} (already exists)")
        return None

    entries = read_example(example_path)

    print(f"\n--- {rel_path} ---\n")

    lines = []
    for key, hint in entries:
        value = input(f"  {key} ({hint}): ")
        lines.append(f'{key}: "{value}"')

    with open(target_path, "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"\nWrote {rel_path}")

    return target_path


def main():
    os.chdir(ANSIBLE_DIR)

    prompt_file(os.path.join(GROUP_VARS_DIR, "vars.yml.example"))

    # Install collections
    print("\nInstalling Ansible collections...")
    result = subprocess.run(
        ["ansible-galaxy", "collection", "install", "-r", "requirements.yml"]
    )
    if result.returncode != 0:
        print("Failed to install collections.", file=sys.stderr)
        sys.exit(1)

    # Run init playbook
    print("\nRunning init playbook...")
    result = subprocess.run(["ansible-playbook", "playbooks/init.yml"])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
