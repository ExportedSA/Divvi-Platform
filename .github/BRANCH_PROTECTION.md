# Branch Protection Configuration

This document describes the required branch protection rules for the Divvi repository.

## Required GitHub Settings

### Main Branch (`main`)

Navigate to **Settings → Branches → Add rule** and configure:

#### Branch name pattern
```
main
```

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: `1`
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require approval of the most recent reviewable push

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `CI Success` (from ci.yml workflow)
    - `Lint`
    - `Type Check`
    - `Unit Tests`
    - `Integration Tests`
    - `Build`

- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

- [ ] **Allow force pushes** (DISABLED)

- [ ] **Allow deletions** (DISABLED)

### Develop Branch (`develop`)

Same as main, but with:
- Require approvals: `1` (can be reduced for faster iteration)

## Required Repository Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel API token | Deployments |
| `VERCEL_ORG_ID` | Vercel organization ID | Deployments |
| `VERCEL_PROJECT_ID` | Vercel project ID | Deployments |

### How to Get Vercel Credentials

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Run `vercel link` in the project directory
4. Find credentials in `.vercel/project.json`:
   - `orgId` → `VERCEL_ORG_ID`
   - `projectId` → `VERCEL_PROJECT_ID`
5. Generate token at https://vercel.com/account/tokens → `VERCEL_TOKEN`

## Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR + Push to main/develop | Lint, type-check, test, build |
| `deploy-preview.yml` | PR opened/updated | Deploy preview environment |
| `deploy-production.yml` | Push to main | Deploy to production |

## Merge Requirements

Before a PR can be merged:

1. ✅ All CI checks must pass
2. ✅ At least 1 approval from a reviewer
3. ✅ Branch must be up to date with target
4. ✅ All conversations must be resolved
