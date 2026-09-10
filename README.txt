TOIL Tracker v3

Fixes:
- Pending TOIL is now listed on the Home screen.
- Tapping a pending TOIL card opens it for editing.
- TOIL history entries have an Edit button and can be tapped to edit.
- Status can be changed to Requested / Approved / Rejected / Cancelled.
- History defaults to newest first and includes sort/filter/search.
- Added pending 30m TOIL for 18 Sep 2026.
- Pending total is therefore 8h and After pending is 2h 30m with the current seeded data.
- Data & updates includes Download data / Upload data.
- Service worker cache bumped so the new build actually replaces the old cached build.

When updating:
1. Download data from the old app first.
2. Replace the GitHub repository files with this build.
3. Wait for GitHub Pages to redeploy.
4. In Safari, refresh the site. If the Home Screen app still shows the old version, remove it from Home Screen and add it again after opening the updated site in Safari.
5. Upload your data backup if needed.
