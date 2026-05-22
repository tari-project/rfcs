# UR-TIP-PROC-1: Tari Improvement Proposals

| TIP             | [P-TIP-PROC-1](#tip-1-tari-improvement-proposals)                         |
|-----------------|---------------------------------------------------------------------------|
| Title           | Tari Improvement Proposals                                                |
| Last Modified   | 2026-05-17                                                                |
| Authors         | Fox Piacenti <fox@vulpinity.com>                                          |
| Expert Reviewer | Blackwolfsa                                                               |
| Status          | Proposed                                                                  |
| Type            | Process                                                                   |
| Created         | 2026-05-02                                                                |
| References      | Based on the Open edX community's [OEP] process. Forum discussion thread. |

## Overview

* A Tari Improvement Proposal specifies a best practice, product decision, technical architecture, or community process
  that the Tari community has agreed should be adopted by the project.
* TIPs are not used to dictate decisions made in every-day feature work, but can be used to inform decision-making on
  the ground.
* This document specifies both how to write a TIP and how to get consensus through the community that the TIP should be
  adopted.

## What is a TIP?

TIP stands for Tari Improvement Proposal. A TIP is a document that details a specific decision being made by the Tari
Community, in the form of a best practice, product direction, or process adjustment. A TIP should provide the use cases
and rationales that surround that choice. TIPs are not the only way for a change to be made in Tari, however. The goal
is to create a collection of TIP documents as a repository of knowledge archive of context and community decisions made
for Tari.

## TIP Types

* A **Process** (`PROC`) proposal describes a change to how the Tari Community functions.
* A **Best Practice** (`BPRA`) proposal describes a technology or implementation choice that the Tari community believes all 
  applicable Tari services and/or libraries should use or follow.
* A **Product direction** (`DIR`) proposal describes product-level decisions that should be followed by some or all Tari 
  subprojects, as they specify to make a cohesive product experience.
* An **Architecture** (`RFC`) proposal describes a technical implementation decision, such as a chain feature, proof design, or
  other critical technical improvement to Tari.

### TIP Naming

TIPs are named with the following format:

`S-TIP-TYP-SUB-X`

Where:


|            |                                                                                                                      |
|------------|----------------------------------------------------------------------------------------------------------------------|
| S          | Status flag (see [TIP Statuses](#tip-statuses))                                                                      |
| TIP        | Literally 'TIP'                                                                                                      |
| TYP        | Type indicator (see [TIP Types](#tip-types))                                                                         |
| SUB        | Subtype indicator, if a TIP defining subtypes has codified these. Otherwise, this and the following `-` are omitted. |
| X          | An unique integer (sequential) for the TIP of this type and subtype                                                  |

TIPs change their names (due to the status flag) as their status progresses. However, they do NOT change their URLs.
Once a file has been created for a tip, that file is kept with its name in perpetuity.

## TIP Roles

### Authors

Each TIP must have at least one Author: Someone who writes the TIP using the style and format described here, shepherds
the discussions in the forum and pull request, and attempts to build community consensus around the idea.

[Step 2. Find an Expert Reviewer](#step-2-find-an-expert-reviewer) lays out ways to get in touch with the community to
find an Expert Reviewer; those channels may also be used to find a co-author, which is encouraged.

### Expert Reviewers

Each TIP also has an Expert Reviewer. An Expert Reviewer of a TIP cannot concurrently be the Author of that TIP.

In brief, the Expert Reviewer...

* Is knowledgeable about the contents of the proposal, and has specific expertise in the problems it addresses.
* Helps the Authors prepare the TIP for vote by the Council as described in
  [Step 5. Review with Council](#step-5-review-with-council).

### Tari Council

The Tari Council (or Tari Labs, until the Council is established) serves as a backstop for the TIP process.
Specifically, the group can assist in finding an Expert Reviewer for a TIP if the Author is having trouble getting one
for a new TIP. They may also assist in finding an Expert Reviewer if an old TIP is revived and the original Expert
Reviewer is no longer available.

If there is uncertainty about the choice of Expert Reviewer, it is reasonable to start a discussion with the group.
If there is a conduct issue with the Expert Reviewer, the Author may also raise this with the Council.

The Council may elect to delegate some or all of its responsibilities here to groups of its specification. Should it
choose to do so, it should update this TIP (using the standard processes in this document) to indicate the currently
delegated team.

## TIP Workflow

### Submitting a TIP

#### Step 1. Initial Discussion

No proposal should be put forward without a basic gut-check from others in the community. If you have an idea, start by
bringing it up in the forum, your preferred Tari chat group (I.E., Discord, Telegram) or your in-person Tari meetup.

#### Step 2. Find an Expert Reviewer

After the initial discussion, you will need to find an Expert Reviewer to collaborate with. An expert Reviewer is an
expert in the subject your proposal addresses, known by the community.

When writing a TIP, you may already have an idea for an Expert Reviewer in mind. If so, reach out to that person and ask
them. They should have the domain expertise needed to be an Expert Reviewer and the time to do so. It is best practice
for the Expert Reviewer to be from a different team or group than the Author, though this may not always be possible.

If you're not sure who would make a good Expert Reviewer, you should reach out to the Core Contributors or the Tari
Council. Any community member can feel free to participate in the discussion about the selection of an Expert Reviewer.
If you have concerns about an Expert Reviewer that has been chosen for a particular TIP, please share them with the
Author first and see if you can resolve your concerns directly. If you continue to have concerns, please share them on
either the Pull Request or the forums.

#### Step 3. Initial PR for TIP

Draft a TIP using an existing example, and submit a pull request against the [RFCs repository]. To identify the new
proposal, the Authors should check the numbered list of previous TIPs that match their type and subtype, and select the
next available sequence number.

The pull request title should be of the form "TIP-XXXX: <TIP title>" where *XXXX* is the TIP number claimed for the
included proposal. The status should be 'Proposed.'

Once created, the PR goes through initial review by the Expert Reviewer. After review is completed, the PR is merged.

#### Step 4. Community Review

Once the TIP PR has been merged, announce the TIP to the community in the following channels:

* Create a topic in the Governance category
* Announce it in Telegram (or have someone do so)
* Announce it in the Discord (or have someone do so)

Begin discussions and create follow-up PRs to be reviewed by your Expert Reviewer and the community as concerns are
raised. Once consensus has been reached, notify the Council that the TIP is ready for their review.

#### Step 5. Review with Council

The Tari Council reviews the TIP. They check for:

1. Has the TIP had a competent reviewer to perform the initial vetting
2. Has the community had a chance to weigh in on the proposal and its changes
3. Has consensus been reached
4. Are there any other outstanding reasons why this proposal should not pass?

The council then votes. If a majority of the council approves of the TIP, its status is updated to "Accepted" in a new
PR and merged. Any implied changes this accepted proposal creates for previous proposals (that is, any information it
deprecates) must be addressed in a follow-up PR immediately.

If the TIP is rejected, the Council will provide a reason for the rejection. If the rejection reason cannot or will not
be remedied, update the proposal status to "Rejected" and include the reasoning from the council at the top of the
proposal text.

#### Step 6. Announcing Changes

Once a TIP has graduated to Approved status, or a modification of significance to an existing TIP, please announce
the change in the original TIP announcement thread on the forum.

## TIP Statuses

### Proposed (P)

The TIP is under discussion and being reviewed by the Tari community but has yet to be Accepted or Rejected by the
Council.

### Accepted (A)

The Council has accepted the TIP after review and discussion.

### Rejected (R)

The Council rejected the TIP after review and discussion, or it has been withdrawn by the author.

### Deprecated (D)

Over time some TIPs may become deprecated. They may be replaced by new guidelines, or they may become entirely
irrelevant. In this case the TIP's status should be changed to "Deprecated" and the TIP should be updated with an
explanation as to why the TIP is no longer relevant.

### Rejecting a TIP

Sometimes after all is said and done, it was not a good idea. In this case, the status is updated to 'Rejected', and
an introductory line is added to indicate that the TIP is no longer being pursued, and why.

### Status Changes

When a TIP is Accepted, the TIP should be updated accordingly. In addition to updating the Status field and flag, at
the very least the Resolution header should be added with a link to the appropriate section of the PR, and the
Last-Modified header should be set to the current date.

TIPs that have passed their initial review should be merged with a status of Proposed. From that point,
additional pull requests can be opened to edit the TIP, until it converges to being "Accepted", "Rejected", or
"Deprecated."

When a TIP PR calls for significant work after it merges, add a link named "Follow-up Work" to the References section of
the TIP header. Use the linked page to keep readers up-to-date on the plan for completing and/or implementing the
proposal.

## TIP Maintenance

### Reporting Errata

While a pull request that contains a proposal is open, comments should be made on that pull request, or by submitting a
new pull request that targets the branch from which the TIP pull request was made.

### TIP Stewardship

Once a TIP is merged to the [RFCs repository], changes can be suggested to it via new pull requests. Whether those
changes are included is up to the Authors of the TIP.

#### Unpublished TIPs

Sometimes a TIP is written but ultimately abandoned before being merged. These can be found in closed, unmerged PRs
(see the list [here](https://github.com/tari-project/rfcs/pulls?q=is%3Apr+is%3Aclosed).) The only time this should
happen is if the TIP cannot pass initial review.

#### Updating TIPs

A Best Practice or Process TIP may be updated even after it is "Accepted" as it evolves over time. These future
edits/updates may be made by the original Authors of the TIP or by new Authors. A pull request should be created to
update the TIP and go through the following steps:

1. For small changes (e.g. formatting or minor updates reflecting how process has already evolved), finding an Expert
   Reviewer may not be required. Larger changes will benefit from having one. The Expert Reviewer may remain the same as
   before or a new one may be found as detailed in [Step 2. Find an Expert Reviewer](#step-2-find-an-expert-reviewer).
2. Reach out to previous Authors, or comment on the original TIP pull request discussion with your
   proposed update so those central to the original proposal can weigh in on changes.
3. Follow the [Step 5. Review with Council](#step-5-review-with-Council) process.
4. Finally, please follow [Step 6. Announcing Changes](#step-6-announcing-changes) to inform the community about what
   has been changed in the TIP.

#### Adding Additional Authors or Reviewers

When updates are made beyond those of formatting changes, small corrections, or basic upkeep, the Author(s) who made
the changes shall add themselves to the corresponding sections
in the [TIP Header Preamble](#tip-header-preamble).

## TIP Structure and Content

### TIP Format

TIPs are UTF-8 encoded text files that use the [Markdown] format. Markdown is a simple and popular text formatting
language that is easy to read both while rendered and while in source form. TIPs are rendered to HTML using [mdBook].

### TIP Templates

Other than requiring that TIPs have a consistent TIP Header Preamble and a
[Change History Section](#change-history-section), the rest of the TIP document can be customized according to whatever
is needed to capture the decision(s), as deemed appropriate by the Authors, the Expert Reviewer, and the Tari Council.

To help guide Authors, future ready-made templates may be created. At the time of writing, none are available, but
existing TIPs may be used as an example.

### TIP Header Preamble

Each TIP must begin with a Markdown table with metadata about the TIP. The rows must appear in the following order.
Rows in italics are otional and are described below. All other rows are required.

| TIP           | S-TIP-TYP-SUB-X                                                                   |
|---------------|-----------------------------------------------------------------------------------|
| Title         | <TIP Title>                                                                       |
| Last Modified | <date string, in YYYY-MM-DD format>                                               |
| Authors       | <list of authors' established handles or names, and, optionally, email addresses> |
| Status        | <Proposed \| Accepted \| Rejected \| Deprecated>                                  |
| Type          | <Process \| Best Practice \| Product Direction \| Architecture>                   |
| Created       | <date created on, in YYYY-MM-DD format>                                           |
| *Resolution*  | <links to any discussions where the final status was decided>                     |
| *Replaces*    | <TIP Number>                                                                      |
| *Replaced-By* | <TIP Number>                                                                      |
| *References*  | <links to any other relevant discussions or relevant related materials>           |

* The **Authors** header lists the names or community handles, and optionally the email addresses, of all the
  authors/owners of the TIP. The format of the Authors header value must be `Random J. User <address@example.com>` if
  the email address is included, or `Random J. User` if the address is not given. If there are multiple authors, their
  names and addresses should appear in a comma separated list.
* The **Type** header specifies the type of TIP: Process, Best Practice, Product Direction, or Architecture.
* The **Created** header records the date that the pull request for the **TIP** was opened. It should be in YYYY-MM-DD
  format, e.g. 2026-05-20.
* TIPs can also have a **Replaced-By** header indicating that a TIP has been deprecated by a later document; the
  value is the number of the TIP that replaces the current document. The newer TIP must have a **Replaces** header that
  contains the number of the TIP that deprecated it.
* The **References** header is a useful section to provide quick links to relevant materials and prior discussions
  regarding the proposal.

### Auxillary Files

TIPs may include auxiliary files such as diagrams. Such files must be added to a subdirectory within `src/assets/` named
the same as the file. Include original diagrams alongside image files, to make it easy for others to update the TIP in
the future.

### Change History Section

For every change (including the initial document creation), include an entry in a "Change History" section modeled
after the one at the bottom of this document. A Change History entry should include three parts: the date of the change, a very brief summary of
changes made, and a link to the pull request where the discussion and approval took place. The changes should be ordered
such that the most recent change is at the top of the list.

## Housekeeping

In order to transition existing RFCs (and TIPS which may have been created while this process is finalized), each will
need to be updated with the standard header in follow-up PRs to this repository. Their URLs shall not change.

## Acknowledgements and Legal

This proposal draws heavily from [OEP-1] by Axim Collaborative, which is licensed CC-BY-SA.

[P-TIP-PROC-1](#) © 2026 by Fox Piacenti is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
<img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
<img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
<img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">


## Change History

### 2026-05-02

* Document Created.
* [Pull Request #164](https://github.com/tari-project/rfcs/pull/164)

### 2026-05-07

* Concept of Arbiter replaced with lower-powered but higher-knowledge Expert Reviewer
* Council Votes to accept TIPs
* All TIPs past the draft stage are Merged, for historical record.

### 2026-05-14

* TIP Naming schema redefined to make quick recognition of status and domain possible.
* Changelog dates made into headers
* Housekeeping section completed

### 2026-05-16

* Rename 'Under Review' to 'Proposed', and change its status flag to `P`
* Remove the 'Deferred' and 'Provisional' statuses. 
* Remove the 'Draft' status as a separate thing-- pull requests are already a draft state.

### 2026-05-18

* Remove redundant 'Replaced' status in favor of 'Deprecated.'
* Remove persistent 'Reviewer' field in favor of relying on git history.
* Remove 'Needs Revision' status in favor of immediate follow-up PRs.

[OEP]: https://docs.openedx.org/projects/openedx-proposals/en/latest/processes/oep-0001.html
[RFCs repository]: https://github.com/tari-project/rfcs
[Markdown]: https://www.markdownguide.org/
[mdBook]: https://github.com/rust-lang/mdBook
