# RFCs

This repository contains requests for comment (RFCs) for Tari protocols.

These documents are in the form of an [`mdbook`](https://rust-lang.github.io/mdBook/). The rendered version of the main branch of the repository is deployed to https://rfc.tari.com.

## Building

You can build and serve the RFCs locally while working on them, and navigate the resulting `mdbook` site as if it were deployed.

To do so:
- Navigate to the repository directory in a terminal
- Install the `mdbook` tool: `cargo install mdbook`
- Serve the site: `mdbook serve`
- View the rendered versions in a browser using the link provided in your terminal: `http://localhost:3000`

The server will detect changes you make to files and rebuild automatically, but you will need to manually refresh pages in your browser to see the updates.
