#!/usr/bin/env python3
import os
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANSIBLE_DIR = os.path.join(REPO_ROOT, "ansible")


def main():
    os.chdir(ANSIBLE_DIR)
    result = subprocess.run(
        ["ansible-playbook", "playbooks/deploy.yml"]
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
