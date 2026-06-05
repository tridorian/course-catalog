# Jules Integration & Triggering Guide

How Jules handles repository issues and comments depends on whether you want to use its native out-of-the-box settings or customize it to respond to explicit tag mentions.

---

## 1. The Native Way: Use the `jules` Label (For Issues)

Natively, the Jules GitHub app listens for **labels** on standard issues rather than comment tags.

* **The Setup:** Ensure the Jules GitHub App is authorized to access your repository.
* **The Trigger:** Open your issue, click the gear icon next to **Labels**, and add the label `jules` (case-insensitive).
* **The Result:** Jules will automatically post an introductory comment on the issue, spin up a secure cloud VM to parse your codebase, address the issue, and reply with a link to a generated Pull Request.

> 💡 **Note on Pull Requests:** If Jules has *already* opened a Pull Request, it handles comment tracking differently. If you toggle on **Reactive Mode** in your global Jules UI settings, it will ignore general review chatter and only respond to PR feedback when you explicitly tag `@jules`.

---

## 2. The Custom Way: Triggering Jules via `@jules` Issue Tags

If your team's workflow relies on typing `@jules` directly into an issue comment to kick off a coding session, you can configure a custom automation using the official `jules-action` workflow suite.

Create a file in your repository at `.github/workflows/jules-issue-trigger.yml`:

```yaml
name: Trigger Jules on Issue Comment Mention

on:
  issue_comment:
    types: [created]

jobs:
  trigger-jules:
    # ⚠️ CRITICAL SECURITY: Only run if '@jules' is tagged AND the user is trusted.
    # Leaving this wide open allows anyone to open an issue and burn your compute/API credits.
    if: |
      contains(github.event.comment.body, '@jules') && 
      contains(fromJSON('["your-github-username", "trusted-team-member"]'), github.event.comment.user.login)
    
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write

    steps:
      - name: Invoke Jules Autonomous Agent
        uses: google-labs-code/jules-invoke@v1
        with:
          prompt: |
            You have been invoked via a comment tag inside a GitHub Issue.
            
            Issue Title: ${{ github.event.issue.title }}
            Original Issue Specification:
            ${{ github.event.issue.body }}
            
            Specific User Comment/Instruction:
            ${{ github.event.comment.body }}
        env:
          JULES_API_KEY: ${{ secrets.JULES_API_KEY }}
```

### How to wire this up:

1. **Generate your Key:** Head to the Jules web platform (`jules.google.com`), authenticate with GitHub, and generate an API key from your account settings.
2. **Save to Secrets:** In your GitHub repository, navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**. Click **New repository secret**, name it `JULES_API_KEY`, and paste your key.

Once active, typing a comment containing `@jules` (provided you are on the blocklist/allowlist filter) will instantly trigger a GitHub Actions runner that hands the task context off to the Jules agent.
