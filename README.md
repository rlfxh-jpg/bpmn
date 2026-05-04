# BPMN Frontend

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Build the project:

```bash
pnpm build
```

## Commit Convention

This project enforces Conventional Commits through a Git `commit-msg` hook powered by `husky` and `commitlint`.

Required format:

```text
type(scope): subject
```

`scope` is required and should describe the affected area, for example `editor`, `validation`, or `docs`.

Examples:

```text
feat(editor): add approval task palette entry
fix(validation): prevent empty process submission
docs(readme): document commit message rules
refactor(nodes): simplify custom node registry
chore(deps): upgrade bpmn-js
```

Allowed commit types:

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `build`
- `ci`
- `chore`
- `revert`

If the message does not match the rule, the commit will be rejected locally.

## Hook Setup

After `pnpm install`, the `prepare` script runs `husky` and enables the repository hooks automatically.

If hooks were not enabled for an existing clone, run:

```bash
pnpm run prepare
```

To test the rule manually:

```bash
git commit -m "feat(editor): add save action"
git commit -m "update code"
```

The first example should pass. The second example should be rejected.
