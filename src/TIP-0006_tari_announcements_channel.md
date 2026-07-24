# P-TIP-PROC-6: Tari Announcements Channel

| TIP           | P-TIP-PROC-6                                        |
|---------------|-----------------------------------------------------|
| Title         | Tari Announcements Channel                          |
| Last Modified | 2026-06-19                                          |
| Authors       | Zhao Xi                                             |
| Status        | Proposed                                            |
| Type          | Process                                             |
| Created       | 2026-06-19                                          |

## Overview

This TIP proposes establishing a dedicated, read-only "Tari Announcements" channel for structured official
updates, kept separate from the main community group. Announcements would be organized by category (for example:
product progress, ecosystem partnerships, security notices) and posted on a fixed cadence such as a weekly update.
The main group remains the venue for daily discussion, Q&A, and community interaction.

## Background

Today, official updates are interleaved with thousands of day-to-day messages in the main community channels. This
creates two problems:

* New members cannot quickly understand project status without scrolling through a high-volume chat.
* Media, partners, and researchers citing Tari have no single authoritative, low-noise source to reference,
  increasing the risk of misinformation.

A read-only, categorized announcement feed addresses both: it provides a clean, chronological record of what the
project has officially communicated, while preserving the main group for open conversation.

## Proposed Change

Establish a read-only "Tari Announcements" channel with the following properties:

* **Read-only**: posting is restricted to a small set of designated official posters; the community cannot post,
  keeping the channel noise-free.
* **Organized by category**: each post is tagged, for example — Product Progress, Ecosystem & Partnerships,
  Security Notices, Governance, Events. The category set can evolve over time.
* **Fixed cadence**: a regular update such as a weekly roundup, plus immediate posts for time-sensitive items
  (especially security notices).
* **Linked to a source**: each post carries a category tag, a date, and a link back to the primary source (blog,
  GitHub, RFC/TIP, docs) where one exists.
* **Main group unchanged**: the existing main group remains the place for daily discussion, Q&A, and interaction;
  announcement posts can link there for discussion.

The benefit of this model is that new members can quickly browse past announcements without digging through
thousands of messages, and media or partners citing information can more easily locate an authoritative source.

## Considerations

* This is a community-process change only; it introduces no protocol, consensus, or code changes.
* A separate channel is preferred over pinned messages, which are limited in number and still buried in a busy
  group.
* Keeping the channel read-only is intentional: its value is a clean, citable record, while community replies
  belong in the main group.
* The category set and posting cadence should be reviewed after an initial trial period.

## Change History

### 2026-06-19

* Document Created.
