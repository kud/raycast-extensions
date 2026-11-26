## [Containers] - {PR_MERGE_DATE}

- Targets can name a Firefox container: focusing looks for the tab there and opens the URL in it when none is found (requires a foxhop CLI and Fox Hop Firefox extension with container support)
- The list shows each target's container, and Add/Edit Target gain a Container field

## [New icon] - 2026-10-05

- New extension icon
- Added a banner image to the README

## [Fix target ids] - 2026-10-04

- Target ids are generated from the title and no longer editable
- The id is shown read-only as `Raycast: focus-<id>`
- Adding never overwrites a different target, and re-adding a saved site updates it
- Edit Target can change Match again and gains a Navigate checkbox (requires foxhop CLI 2.0.0 or later)

## [Initial Version] - 2026-06-25

- List Tabs: list, focus, favourite, add, edit, and delete saved Firefox tab targets, and generate or delete per-tab hotkey scripts
