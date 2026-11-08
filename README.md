# ServerDash
A web dashboard for managing and accessing a Linux server.

## Build a single-file server executable

Build the Linux x64 executable with Bun 1.4.3:

```sh
bun install --frozen-lockfile
bun run build:binary
```

The release is `release/serverdash`: one executable containing the Bun launcher, backend, Next.js standalone runtime, and static assets. Copy that file to a Linux x64 server and run it directly; it needs no command-line arguments and does not require Bun or Node.js to be installed. Build on Linux x64. Linux PAM and terminal support still depend on the host's native/system libraries.

On its first run, it creates a random 256-bit session secret and stores it at `$XDG_DATA_HOME/serverdash/auth-secret` (or `~/.local/share/serverdash/auth-secret` when `XDG_DATA_HOME` is unset), with owner-only file permissions. It reuses that secret on later runs, so existing sessions remain verifiable across restarts. Run the executable as the account that should own the secret and dashboard processes:

```sh
./serverdash
```

When launched from a Linux desktop without a terminal attached, it opens the executable itself in an available terminal emulator. Keep that window open; press `Ctrl+C` or close it to stop the frontend and backend together.

No `.env` file is included or needed. Optional runtime settings are environment variables:

- `PORT` sets the web listener port (default `3000`).
- `HOSTNAME` sets the web listener address (default `0.0.0.0`).
- `BACKEND_PORT` sets the internal tRPC listener port (default `3001`).
- `PAM_SERVICE` selects the PAM service (default `login`).
- `DOCKER_SOCKET` selects the Docker Engine Unix socket (default `/var/run/docker.sock`).
- `SERVERDASH_DATA_DIR` selects the directory where the generated secret is stored.

The tRPC listener is internal and defaults to `127.0.0.1` for the web proxy. Put the web listener behind your chosen firewall or reverse proxy.

## Linux PAM login

The web app authenticates Linux accounts through PAM using the `login` service by default. Install the PAM runtime library on the server (Debian/Ubuntu: `libpam0g`; RHEL/Fedora: the PAM runtime package). The build machine also needs the PAM development package before installing dependencies (Debian/Ubuntu: `libpam0g-dev`; RHEL/Fedora: the PAM development package).

Set `PAM_SERVICE` to another configured PAM service name if needed. The account must be allowed by that PAM service, and the app process must have the permissions required by its PAM stack. Sessions expire after 12 hours and are stored in an HTTP-only cookie.
