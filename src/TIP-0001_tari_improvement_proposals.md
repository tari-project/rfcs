# TIP-1: Tari Improvement Proposals

| TIP           | [TIP-1](#tip-1-tari-improvement-proposals)      |
|---------------|-------------------------------------------------|
| Title         | Tari Improvement Proposals                      |
| Last Modified | 2026-05-02                                      |
| Authors       | Fox Piacenti <fox@vulpinity.com>                |
| Arbiter       | TBD                                             |
| Status        | Draft                                           |
| Type          | Process                                         |
| Created       | 2026-05-02                                      |
| Review Period | TBD                                             |
| References    | Based on the Open edX community's [OEP] process |

## Overview

* A Tari Improvement Proposal specifies a best practice, product decision, or community process that the Tari community
  has agreed should be adopted by the project.
* TIPs are not used to dictate decisions made in every-day feature work.
* This document specifies both how to write a TIP and how to get consensus through the community that the TIP should be
  adopted.

## What is a TIP?

TIP stands for Tari Improvement Proposal. A TIP is a document that details a specific decision being made by the Tari
Community, in the form of a best practice, product direction, or process adjustment. A TIP should provide the use cases
and rationales that surround that choice. TIPs are not the only way for a change to be made in Tari, however. The goal
is to create a collection of TIP documents as a repository of knowledge archive of context and community decisions made
for Tari.

## TIP Types

* A **Process** proposal describes a change to how the Tari Community functions.
* A **Best Practice** proposal describes a technology or implementation choice that the Tari community believes all 
  applicable Tari services and/or libraries should use or follow.
* A **Product direction** proposal describes product-level decisions that should be followed by some or all Tari 
  subprojects, as they specify to make a cohesive product experience.

## TIP Roles

### Authors

Each TIP must have at least one Author: Someone who writes the TIP using the style and format described here, shepherds
the discussions in the forum and pull request, and attempts to build community consensus around the idea.

[Step 1. Find an Arbiter](#step-1-find-an-arbiter) lays out ways to get in touch with the community to find an arbiter;
those channels may also be used to find a co-author, which is encouraged.

### Arbiters

Each TIP also has an Arbiter. An Arbiter of a TIP cannot concurrently be the Author of that TIP.

In brief, the Arbiter...

* Is knowledgeable about the contents of the proposal, while also being able to fairly hear all sides of a discussion.
* Helps the Authors move the TIP through the TIP Workflow, namely:
  * As described in [Step 3. Review with Arbiter](#step-3-review-with-arbiter), the Arbiter does a first review pass
     and establishes the length of the review period (see [Review Period](#review-period))
  * During the review period, the Arbiter decides if the TIP should be merged and published (with an Accepted or
    Provisional status), rejected (PR is closed without merge), or remain open for additional discussion.

The Arbiter will be the person making the final decision on whether the TIP should be Accepted, and as such, the Arbiter
should be knowledgeable about the contents of the proposal. The Arbiter should be willing to listen to arguments both
for and against it by the rest of the community.

The Arbiter is also responsible for helping the Authors move the proposal through the TIP process, providing process,
product, or technical expertise as needed. The Arbiter also assists the Authors in soliciting feedback from the
community on the TIP and moving it towards a final decision (whether the pull request is merged as Accepted or closed.)
The Arbiter (in discussion with the Authors) can merge an in-progress TIP (if it has reached a stage of relative
stability) to allow for additional incremental updates.

### Tari Council

The Tari Council (or Tari Labs, until the Council is established) serves as a backstop for the TIP process.
Specifically, the group can assist in finding an Arbiter for a TIP if the Author is having trouble getting one for a
new TIP. They may also assist in finding an arbiter if an old TIP is revived and the original Arbiter is no longer
available.

If there is uncertainty about the choice of Arbiter, it is reasonable to start a discussion with the group. If there is
a conduct issue with the Arbiter, the Author may also raise this with the Council.

The Council may elect to delegate some or all of its responsibilities here to groups of its specification. Should it
choose to do so, it should update this TIP (using the standard processes in this document) to indicate the currently
delegated team.

## TIP Workflow

### Submitting a TIP

#### Step 1. Find an Arbiter

When writing a TIP, you may already have an idea of an Arbiter in mind. If so, reach out to that person and ask them.
They should have the domain expertise needed to be an effective Arbiter and the time to do so. It is best practice for
the Arbiter to be from a different team or group than the Author.

If you're not sure who would make a good Arbiter, you should reach out to the Core Contributors or the Tari Council. Any
community member can feel free to participate in the discussion about the selection of an Arbiter. If you have concerns
about an arbiter that has been chosen for a particular TIP, please share them with the Author first and see if you can
resolve your concerns directly. If you continue to have concerns, please share them on either the Pull Request or the
forums.

Once found, this Arbiter will be recorded in the "Arbiter" header on the TIP.

#### Step 2. Create PR for "Draft" TIP

Draft a TIP using an existing example, and submit a pull request against the [RFCs repository]. To identify the draft
proposal, the Authors should check the numbered list of previous TIP pull requests and select the next available number.

The pull request title should be of the form "TIP-XXXX: <TIP title>" where *XXXX* is the TIP number claimed for the
included proposal.

#### Step 3. Review with Arbiter

Once an Arbiter has been assigned to your TIP, establish begin and end review dates with your Arbiter, making it
officially "Under Review". Once this state is achieved, announce the TIP to the community in the following channels:

* Create a topic in the Governance category
* Announce it in Telegram (or have someone do so)
* Announce it in the Discord (or have someone do so)

The Tari community is given the opportunity to comment on the TIP. The Arbiter serves to keep the discussion on track
and bring the review process to a final resolution.

#### Step 4. Announcing Changes

After merging a pull request - whether it was the addition of a new TIP, a wording/status change to an existing TIP, or
a modification of significance to an existing TIP, please announce the change in the original TIP announcement thread
on the forum.

## TIP Statuses

### Draft

The Authors are working on a TIP and then reviewing it with an assigned Arbiter.

### Under Review

The TIP is under discussion and being reviewed by the Tari community, the Arbiter, and the Authors.

### Accepted

The Arbiter has accepted the TIP after review and discussion within the agreed upon review period.

### Deferred

No further progress is made on the TIP and so it is marked "Deferred". The TIP Authors can change it back to
"Under Review" when it is in progress again.

### Provisional

The TIP is reviewed and generally agreed upon, but not yet fully "Accepted" since it requires some example or
prerequisite work within the community. Once viable reference examples of community/product adoption occurs, the TIP
can transition back to Under Review and be Accepted.

### Replaced

TIPs can be superseded by a different TIP, rendering the original obsolete. In that case, the TIP's status should be
changed to "Replaced" and updated with a link to its superseding TIP.

### Obsolete

Over time some TIPs may become obsolete without being replaced by new guidelines. In this case the TIP's status should
be changed to "Obsolete" and the TIP should be updated with an explanation as to why the TIP is no longer relevant.

### Needs Revision

Over time, some TIPs may stay relevant - for example, they may have many sections or core ideas that are still relevant
to the project - while containing many details that have become stale over time. When we are in agreement that the TIP
needs updating, we can use this status to indicate to those browsing TIPs that this particular one requires some
renewed attention.

When changing status to "Needs Revision", a row titled "Revision Ticket" should be added to the preamble (directly
under the status field.) This field should link the GitHub issue, forum post, or draft pull request in the
[RFCs repository] that describes what about the TIP needs to be revised.

### Rejecting a TIP

Sometimes after all is said and done, it was not a good idea. In this case, the pull request proposing the change is
closed and the description's first line is edited to indicate that the TIP is no longer being pursued, and why.

### Status Changes

When a TIP is Accepted, the TIP should be updated accordingly. In addition to updating the Status field, at the very
least the Resolution header should be added with a link to the appropriate section of the PR, and the Last-Modified
header should be set to the current date.

A TIP that is in a status of Under Review, Provisional, or Deferred can be merged to capture a set of edits and to make
the proposal more visible to the community. From that point, additional pull requests can be opened to edit the TIP,
until it converges to being either "Accepted" or "Obsolete." TIPs that may still expect to be entirely rejected should
not be merged in this fashion.

When a TIP PR calls for significant work after it merges, add a link named "Follow-up Work" to the References section of
the TIP header. Use the linked page to keep readers up-to-date on the plan for completing and/or implementing the
proposal. For TIPs merging with the status of Draft or Provisional, a Follow-up Work link is required.

## TIP Maintenance

### Reporting Errata

While a pull request that contains a proposal is open, comments should be made on that pull request, or by submitting a
new pull request that targets the branch from which the TIP pull request was made.

### TIP Stewardship

Once a TIP is merged to the [RFCs repository] (which can happen when the TIP is in any status, including
"Under Review,") changes can be suggested to it via new pull requests. Whether those changes are included is up to the
Authors of the TIP.

#### Unpublished TIPs

Sometimes a TIP is written but ultimately abandoned before being merged. These can be found in closed, unmerged PRs
(see the list [here](https://github.com/tari-project/rfcs/pulls?q=is%3Apr+is%3Aclosed).)

#### Updating TIPs

A Best Practice or Process TIP may be updated even after it is "Accepted" as it evolves over time. These future
edits/updates may be made by the original Authors of the TIP or by new Authors. A pull request should be created to
update the TIP and go through the following steps:

1. For small changes (e.g. formatting or minor updates reflecting how process has already evolved), finding an Arbiter
   may not be required. Larger changes will benefit from having one. The Arbiter may remain the same as before or a
   new one may be found as detailed in [Step 1. Find an Arbiter](#step-1-find-an-arbiter).
2. Reach out to previous Authors and Arbiters, or comment on the original TIP pull request discussion with your proposed
   update so those central to the original proposal can weigh in on changes.
3. Follow the [Step 3. Review with Arbiter](#step-3-review-with-arbiter) process, with a review period of at least one
   week (for smaller changes.)
4. Finally, please follow [Step 4. Announcing Changes](#step-4-announcing-changes) to inform the community about what
   has been changed in the TIP.

#### Adding Additional Authors or Arbiters

When updates are made beyond those of formatting changes, small corrections, or basic upkeep, the Author(s) who made
the changes, as well as the Arbiter who saw the change through, shall add themselves to the corresponding sections in
the [TIP Header Preamble](#tip-header-preamble).

## TIP Structure and Content

### TIP Format

TIPs are UTF-8 encoded text files that use the [Markdown] format. Markdown is a simple and popular text formatting
language that is easy to read both while rendered and while in source form. TIPs are rendered to HTML using [mdBook].

### TIP Templates

Other than requiring that TIPs have a consistent TIP Header Preamble and a
[Change History Section](#change-history-section), the rest of the TIP document can be customized according to whatever
is needed to capture the decision(s), as deemed appropriate by the Authors and the Arbiter.

To help guide Authors, future ready-made templates may be created. At the time of writing, none are available, but
existing TIPs may be used as an example.

### TIP Header Preamble

Each TIP must begin with a Markdown table with metadata about the TIP. The rows must appear in the following order.
Rows in italics are otional and are described below. All other rows are required.

| TIP             | TIP-XXXX                                                                                                 |
|-----------------|----------------------------------------------------------------------------------------------------------|
| Title           | <TIP Title>                                                                                              |
| Last Modified   | <date string, in YYYY-MM-DD format>                                                                      |
| Authors         | <list of authors' established handles or names, and, optionally, email addresses>                        |
| Arbiter         | <Arbiter's established handle or name and email address>                                                 |
| Status          | <Draft \| Under Review \| Deferred \| Accepted \| Replaced \| Provisional \| Needs Revision \| Obsolete> |
| Type            | <Process \| Best Practice \| Product Direction>                                                          |
| Created         | <date created on, in YYYY-MM-DD format>                                                                  |
| *Review Period* | <start - target end dates for review>                                                                    |
| *Resolution*    | <links to any discussions where the final status was decided>                                            |
| *Replaces*      | <TIP Number>                                                                                             |
| *Replaced-By*   | <TIP Number>                                                                                             |
| *References*    | <links to any other relevant discussions or relevant related materials>                                  |

* The **Authors** header lists the names or community handles, and optionally the email addresses, of all the
  authors/owners of the TIP. The format of the Authors header value must be `Random J. User <address@example.com>` if
  the email address is included, or `Random J. User` if the address is not given. If there are multiple authors, their
  names and addresses should appear in a comma separated list.
* The **Arbiter** field is used to record who has the authority to make the final decision to approve or reject the TIP.
* The **Type** header specifies the type of TIP: Process, Best Practice, or Product Direction
* The **Created** header records the date that the pull request for the **TIP** was opened. It should be in YYYY-MM-DD
  format, e.g. 2026-05-20.
* The **Review Period** header specifies the target dates for reviewing the TIP, as agreed by the Authors and Arbiter.
  The recommended duration of the review is 2 weeks. However, if the review exposes areas of the proposal that need
  further discussion and fleshing out, then the Arbiter may choose to extend the review period.
* TIPs can also have a **Replaced-By** header indicating that a TIP has been rendered obsolete by a later document; the
  value is the number of the TIP that replaces the current document. The newer TIP must have a **Replaces** header that
  contains the number of the TIP it rendered obsolete.
* The **References** header is a useful section to provide quick links to relevant materials and prior discussions
  regarding the proposal.

### Auxillary Files

TIPs may include auxiliary files such as diagrams. Such files must be added to a `TIP-XXXX/` directory, where `XXXX` is
the TIP number. Include original diagrams alongside image files, to make it easy for others to update the TIP in the
future.

### Change History Section

For every change (including the initial document creation), include an entry in a "Change History" section modeled
after the one at the bottom of this document. A Change History entry should include three parts: the date of the change, a very brief summary of
changes made, and a link to the pull request where the discussion and approval took place. The changes should be ordered
such that the most recent change is at the top of the list.

## Acknowledgements and Legal

This proposal draws heavily from [OEP-1] by Axim Collaborative, which is licensed CC-BY-SA.

[TIP-1](#tip-1-tari-improvement-proposals) © 2026 by Fox Piacenti is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
<img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
<img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">
<img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">


## Change History

2026-05-02

* Document Created.
* [Pull Request #164](https://github.com/tari-project/rfcs/pull/164)

[OEP]: https://docs.openedx.org/projects/openedx-proposals/en/latest/processes/oep-0001.html
[RFCs repository]: https://github.com/tari-project/rfcs
[Markdown]: https://www.markdownguide.org/
[mdBook]: https://github.com/rust-lang/mdBook
