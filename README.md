# wacky.pics

An image and video hosting site built with [Bun](https://bun.sh), [Fastify](https://fastify.dev), and [Nginx](https://nginx.org).

## Prerequisites

- [Bun](https://bun.sh)
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
- A Linux server with root SSH access
- A domain name with an A record pointing to the server

## Local development

Install dependencies:

```sh
bun install
```

The app requires three environment variables:

- `SITE_NAME` - displayed in the page title and heading
- `AUTH_USER` - basic auth username
- `AUTH_PASS` - basic auth password

Start the dev server (watches for changes):

```sh
SITE_NAME=wacky.pics AUTH_USER=user AUTH_PASS=pass bun run dev
```

Run type checking:

```sh
bun run check
```

## Server setup

The setup script provisions a fresh server from scratch. It prompts for configuration values, installs Ansible dependencies, then runs the full playbook (preflight checks, server configuration, and initial deploy).

```sh
scripts/setup.py
```

You will be prompted for:

| Variable | Description |
|---|---|
| `domain_name` | Domain name for the site |
| `certbot_email` | Email for TLS certificate alerts |
| `server_ip` | IP address of the server |
| `auth_user` | Username to sign into the site |
| `auth_pass` | Password to sign into the site |

These are saved to `ansible/inventory/group_vars/all/vars.yml` (git-ignored).

## Deploying changes

After the server is set up, deploy code changes with:

```sh
scripts/deploy.py
```

This syncs the app code to the server, installs npm dependencies, and restarts the service.
