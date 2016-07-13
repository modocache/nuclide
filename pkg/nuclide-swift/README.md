# nuclide-swift

Swift package manager integration with Nuclide. Build Swift packages, run their
test suites, and view the results, all from within your favorite editor.

## Internals

nuclide-swift makes use of several Nuclide services:

- `nuclide.build-system-registry`: Used in order to display Swift build options
  from the toolbar.
- `nuclide-current-working-directory`: Used to detect whether the current
  working directory is the root of a Swift package (it has a `Package.swift`
  file).
- `nuclide-output`: Used to pipe output from `swift build` and `swift test` to
  the console.
- `nuclide-side-bar`: Used to display a list of tests defined in the Swift
  package in the side bar.

The `lib/buildsystem` directory implements the toolbar integration. It also
parses test output in order display test successes and failures inline.
