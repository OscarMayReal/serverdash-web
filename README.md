# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Linux PAM login

The web app authenticates Linux accounts through PAM using the `login` service by default. Install the PAM development library before installing dependencies (Debian/Ubuntu: `libpam0g-dev`; RHEL/Fedora: the PAM development package), then set the same session secret for the web and backend processes:

```sh
export AUTH_SECRET="$(openssl rand -hex 32)"
```

`AUTH_SECRET` must be at least 32 characters. Set `PAM_SERVICE` to another configured PAM service name if needed. The account must be allowed by that PAM service, and the app process must have the permissions required by its PAM stack. Sessions expire after 12 hours and are stored in an HTTP-only cookie.
