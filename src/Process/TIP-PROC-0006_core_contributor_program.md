# P-TIP-PROC-6: Core Contributor Program

| TIP           | [P-TIP-PROC-6](#p-tip-proc-6-core-contributor-program) |
|---------------|--------------------------------------------------------|
| Title         | Core Contributor Program                               |
| Last Modified | 2026-07-11                                             |
| Authors       | Fox Piacenti &lt;fox@vulpinity.com&gt;                 |
| Status        | Proposed                                               |
| Type          | Process                                                |
| Created       | 2026-07-11                                             |

## Overview

The Core Contributor (CC) program enables community members who have demonstrated the three Cs-- Conduct, Caliber, and
Commitment, to take ownership and responsibility of elements of the Tari project.

Core Contributors (CCs) are empowered to make on-the-ground decisions about the project,
and [elect the Tari Council][CouncilElection].

## Motivation

Tari is for everyone. It is a community project. To better distribute the work of the project, improve governance,
reduce silos, and set standards, the core contributor program enables community members with demonstrated Commitment,
Conduct, and Caliber ([the three Cs](#requirements)) to have greater stake in the project's success and say in the
project's direction.

## Requirements

All Core Contributors are expected to meet the three Cs:

* Commitment: Core Contributors must demonstrate a firm commitment to the project, maintaining continuous contribution.
* Conduct: Core Contributors must be welcoming, helpful, and able to disagree without resorting to attacks. They must
  demonstrate good judgment and give other community members a fair shake. They must not disparage others for personal
  attributes beyond their control, should retain a polite demeanor, and should give feedback constructively.
* Caliber: Core Contributors must demonstrate competence in their domain. They must demonstrate excellence in their
  community work, and must hold their fellow core contributors to high standards, mentoring prospective Core
  Contributors and new contributors.

Core Contributors may have additional requirements based on their [category](#categories) or
[rights](#contributor-powers-and-rights).

Core Contributors are expected to maintain the three Cs and other requirements before and during their tenure. Core
Contributors who lapse in their commitment, conduct, and caliber [may be removed](#involuntary-exits).

## Contributor Powers and Rights

Core Contributors may be appointed and given power to handle any element of the project which is not the exclusive
responsibility of the council. For an example, a core contributor can be granted:

* commit or maintainer rights on a code repository
* access to social media accounts
* forum/chat moderation powers
* DNS administration capabilities
* server and online service access
* seat licenses to software
* signature powers for specific wallets
* project management responsibilities
* ...or other assets which the Tari Foundation and Council hold in trust by the community.

For counterexample, a core contributor may not be granted:

* the right to vote on behalf of a council member
* the ability to bind the community, Tari Council, or the Tari Foundation to contract
* final say on high-level budgetary decisions, though they may advise them

### Scoping

As part of [their nomination](#nomination), a list of requested grants shall be made. Acceptance of nomination will be
acceptance of the requested grants, and only those grants unless further grants can be directly inferred. For example, 
if all code CCs are given access to a specific Continuing Integration service or code assistance tool, then granting
committer access to a repository grants this as well. It would not, however, grant access to all other repositories.

### Categories

Core Contributors are organized into categories for administrative convenience. Categories may be granted access or
licenses to specific resources en masse, and may have categorical expectations and responsibilities as part of their
work. Core Contributors may be part of multiple categories, or may have no category. Core Contributors are permitted to
contribute in areas outside their category, but may not be granted specific rights and responsibilities of those
categories without membership.

For example, Code CCs have merge rights over their respective repositories, and may be required to triage
and/or review pull requests on their repositories. A design contributor or project manager can still contribute pull
requests, review, and may assist in triage, but they would not be required to, nor would they have merge rights.

The current categories are:

* [Code](#code-ccs)
* [Product](#product-ccs)
* [Community](#community-ccs)
* [Project](#product-ccs).

A brief overview of each category is below. Further refinement of expectations and requirements for each may be
submitted in subsequent TIPs.

To distinguish between, for instance, all code contributors and specifically Core Contributors in the Code Category, we
will use 'code contributors' for the former and 'Code CCs' for the latter.

#### Code CCs

Code CCs are community members with demonstrated software engineering skills who have consistently delivered
high quality code contributions to the Tari project. Code CCs are inducted with commit rights to one or more
repositories. Commit rights involve the right and responsibility to commit high quality code to the official public
repositories of the project.

Code CCs are expected to follow best practices in software engineering. These include, but are not limited to:

1. Not committing directly to special branches (such as 'main') but using a pull request instead
2. Having all code reviewed by at least one human reviewer
3. Reviewing code of other contributors
4. Writing automated tests for code whenever reasonable automated tests can be written, and providing detailed testing
   instructions when not
5. Including documentation and testing instructions with changes

Code CCs may elect to use code generation tools according to their judgment. They must, however, bear
responsibility for generated code, and must review any code generated before requesting another contributor to review
their pull requests. They must not commit code they do not understand to their respective repositories, and are expected
to guard their repositories from code which does not follow best practices via the review process.

#### Product CCs

Product CCs guide the holistic implementation of features by providing UI/UX designs that contributors can
implement via code, and by carefully considering the whole impact of a feature for real-world users. They provide review
of new features and may provide art such as iconography which aids in communicating a product's functionality.

Product CCs are expected to review product TIPs and feature requests to assist in their prioritization and
design. They assist the community by rethinking how we meet the needs of the ever-evolving real-world needs of users.

#### Project CCs

Project CCs are team members who are in charge of large community-wide projects and/or who perform critical
metawork that helps the Tari project run smoothly. Project CCs may do things like:

* Coordinating work between contributors to deliver strategic objectives set by the council
* Assisting with administration of the project, such as managing access to resources, or onboarding/offboarding
  Core Contributors and council members
* Coordinating dates, schedules, and other resources to ensure project delivery
* Ensure that TIP-defined processes are followed and contribute updates and new processes where appropriate
* Flesh out day-to-day processes implied but not explicitly defined by TIPs
* Run large-scale events beyond the scope of what Community CCs handle on their own

#### Community CCs

Community CCs help with day-to-day community affairs. Community CCs might do things like:

* Moderate chats and forums
* Run day-to-day community events
* Craft messaging for social media and public announcements, ensuring messaging is tailored for each venue
* Provide art and design for marketing campaigns
* Work with Project CCs to run large-scale events
* Translate resources and run language-specific discussions and community events

## Nomination

Any member of the community may be nominated by a Core Contributor or may nominate themselves. Core Contributor
nominations shall be posted in an appropriate forum category. Any nomination should contain the following:

* Who is being nominated
* What rights and contributor categories they are being nominated for
* Evidence that they meet [the requirements for being a Core Contributor](#requirements)
* Evidence that they hold competencies in any categories or for any rights they're being nominated for
* A date, 14 business days from the date of posting, by which any votes for or against their candidacy must be given

For example:

> I am nominating JimBob for the Core Contributor program as a Code CC, with commit rights to the simulations
> repository.
> 
> JimBob has been a contributor of code to our repositories for several months, and proved his excellence when
> implementing spline reticulation. He is very helpful on the forums, always has a good attitude, and contributes
> quality code. You can review some of his pull requests here:
> 
> Link 1
> Link 2
> Link 3
> 
> Please provide your vote and feedback by August 24th!

Core Contributors should reply to the thread either with affirmative votes or with nos. Nos should be accompanied by
feedback. The attitude of feedback should not be 'never' but 'not yet', explaining what improvements the current Core
Contributors would need to see before approving their addition to the team.

The nomination will be considered approved if five Core Contributors give an affirmative vote and there are not any 'no'
votes by the time the feedback period has ended. In the event (such as when initially starting the program) there are
not five Core Contributors, Tari Council members may vote for the contributor's candidacy.

### Rights Expansion

Expansion of rights is done similar to [nomination](#nomination). A forum post requesting rights or category expansion,
with reason given and evidence of competency supplied, shall be made. If after 7 working days there are at least three
affirmative votes and no negative votes, access shall be granted. Voting rights are the same as described in
[Nomination](#nomination).

## Exiting the Program

A Core Contributor who is either unable or unwilling to continue their work as a core contributor may exit the program.

### Voluntary Exits

Core Contributors are people. They may be called to new projects, may lose interest, or may lose any sponsorship that
assisted their role as contributor. Whatever the reason, a Core Contributor may submit their resignation to the Council
at any time. They will then be offboarded from the program. To leave in good standing, a notice period of at least two
weeks and good faith work to perform clean handoffs are required.

### Involuntary Exits

If a Core Contributor fails to meet the standards of Commitment, Conduct, and Caliber required of the program, and no
remediation is possible or forthcoming (such as a major breach of trust, a refusal to address critical feedback, or
extended lack of contribution) they may be removed from the program and have all access revoked by the
council.

In the event an involuntary removal occurs, a public reason for this removal must be published by the council within
72 hours of the action taken.

## Council Voting

Core Contributors are the exclusive electors of the council. Council members who are not core contributors do not have
voting rights for council membership, as the core contributors are the workers who choose their leaders. Councilors are
encouraged to become Core Contributors either before or during their tenure, but this is not a requirement.

Two months before a Councilor's term is up, nominations shall be solicited from the community for any who would like to
hold the position. The current incumbent must affirmatively and publicly indicate they wish to continue their tenure
during this time. Nomination closes one month plus one week before the councilor's term ends.

After one week of setup for voting, elections shall begin, with two weeks for each Core Contributor to submit their
ranked choice (AKA 'instant run-off') ballot. The final two weeks between terms will be used for onboarding and
hand-off, with decision-making power only manifesting when the new electee's term begins.

[CouncilElection]: ../TIP-0002_tari_community_charter.md#article-vii-nomination-and-selection