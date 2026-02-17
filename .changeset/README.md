# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Adding a changeset

When you make a change that should be noted in the changelog, run:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the semver bump type (patch, minor, major)
3. Write a summary of the change

## Versioning

To consume all changesets and bump versions:

```bash
pnpm changeset version
```

This updates `package.json` versions and writes to `CHANGELOG.md` files.
