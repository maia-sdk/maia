# Changesets

This folder is managed by [@changesets/cli](https://github.com/changesets/changesets).

To add a changeset for your PR:

```bash
npx changeset
```

This will ask you which packages changed, what kind of bump (major/minor/patch), and a summary. The changeset file is committed with your PR.

When maintainers are ready to release:

```bash
npx changeset version   # bumps versions + updates CHANGELOG
npx changeset publish   # publishes to npm
```