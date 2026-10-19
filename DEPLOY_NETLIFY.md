# Upload to GitHub and make it live on Netlify

## 1. Extract the ZIP

Extract `Groundwork-Netlify-Source.zip`. Open the `groundwork-netlify` folder. You should see `package.json`, `netlify.toml`, `src`, `server`, and `netlify` directly inside it.

## 2. Upload source to GitHub

Create an empty repository named `groundwork-support` on GitHub.

Using the GitHub website, choose **uploading an existing file** (or **Add file → Upload files**), upload the extracted folder's contents, and commit. Upload source files, not the ZIP itself. `package.json` and `netlify.toml` must be at the repository root. Include `package-lock.json` and the `netlify/functions` folder. Git is preferable for including hidden files such as `.github`, `.gitignore` and `.env.example`.

Or open VS Code in the extracted folder and run these commands after replacing YOUR_GITHUB_USERNAME:

```sh
git init
git add .
git commit -m "Add Groundwork support app for Netlify"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/groundwork-support.git
git push -u origin main
```

If Git says **Author identity unknown**, set your own details and repeat the commit:

```sh
git config user.name "Noman Manzoor"
git config user.email "YOUR_GITHUB_EMAIL"
```

## 3. Connect Netlify

1. Sign in to Netlify and choose the option to add/import a project from Git.
2. Select GitHub and authorize access to your repository.
3. Select `groundwork-support` and the `main` branch.
4. Confirm these settings; `netlify.toml` already supplies them:

| Setting | Value |
|---|---|
| Base directory | Leave empty if source is at repository root |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node.js | `24` |

If you uploaded the enclosing folder instead, set Base directory to `groundwork-netlify`, or move its contents to the repository root.

5. Deploy. Netlify installs dependencies, builds the frontend and deploys the two backend functions.
6. Open the HTTPS URL Netlify returns.

**Use Git-based deployment.** A plain static drag-and-drop upload of `dist` omits the backend functions. A source ZIP is also not an executable website build.

## 4. Optional access code

For a restricted demo, add `DEMO_ACCESS_CODE` through Netlify environment-variable settings, with Functions scope if scopes are shown. Redeploy and enter that code on the account-selection screen.

No AI key is required for the basic policy-search demo. If enabling Claude, add `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `DEMO_ACCESS_CODE`, then redeploy. Use your own valid model ID. Never upload these values to GitHub.

## 5. Check the deployed workflow

- Choose Owner → Northstar Goods.
- Upload `Warranty.md`: `Warranty coverage lasts 12 months. Defective products can be replaced with proof of purchase.`
- Wait for Ready. If the upload remains Processing, use Retry indexing and inspect the background-function logs.
- Switch to Customer and ask `What warranty coverage do you provide?`
- Switch to Agent, review and approve the answer.
- Switch to Customer and confirm the approved reply appears.
- Run Evaluations as Owner.

## Troubleshooting

| Problem | What to check |
|---|---|
| `package.json` missing | Wrong repository root or Base directory |
| Page loads but API does not | Use Git deployment; confirm both functions appear in Netlify |
| Service unavailable | Inspect function logs and check Blobs availability in your project |
| Indexing remains Processing | Check `ingest-background` logs, Background Function availability and Retry indexing |
| Account screen asks for code | Enter the configured `DEMO_ACCESS_CODE` |
| Paid AI configuration error | Add the required demo access code alongside the key |
| Questions use excerpts instead of generated text | Expected unless both Claude variables are configured; Claude is also constrained to verified excerpts |
| Local API fails | Use `npm run dev` and port 8888, not only Vite or Live Server |
| New browser shows sample records | Expected per-browser demo isolation; real account recovery is not implemented |

The source has been built and unit-tested locally. Successful live deployment and Netlify runtime behavior must be confirmed in your account using the checks above.
