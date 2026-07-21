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

At a minimum, all Core Contributors must have at least six months of history and participation in the Tari project.

## Contributor Powers and Rights

Core Contributors may be appointed and given power to handle any element of the project which is not the exclusive
responsibility of the council. For an example, a core contributor can be granted:

* commit or maintainer rights on a code repository
* access to social media accounts
* forum/chat moderation powers
* DNS administration capabilities
* server and online service access
* seat licenses to software
* signature powers for scoped project/budget wallets (if also approved by supermajority (2/3) council vote)
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
* [Ecosystem](#ecosystem-ccs)
* [Community](#community-ccs)
* [Project](#project-ccs).

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

**Example Evidence of Code CC readiness:**

* Delivering multiple major features at high quality
* Delivering many thoughtful code improvements
* Providing constructive code review with a keen eye for other contributors
* Writing up issues and bugs with clear descriptions and acceptance criteria
* Provides quality tests with code contributed

#### Product CCs

Product CCs guide the holistic implementation of features by providing UI/UX designs that contributors can
implement via code, and by carefully considering the whole impact of a feature for real-world users. They provide review
of new features and may provide art such as iconography which aids in communicating a product's functionality.

Product CCs are expected to review product TIPs and feature requests to assist in their prioritization and
design. They assist the community by rethinking how we meet the needs of the ever-evolving real-world needs of users.

**Example Evidence of Product CC readiness:**

* Delivers multiple quality feature proposals with UI/UX Designs that are accepted for development
* Delivers multiple enhancements to existing features via improved UI/UX designs that are accepted for development
* Demonstrates skill in working with developers and project contributors to verify and validate feature changes against
  designs

#### Ecosystem CCs

Ecosystem CCs grow Tari beyond its own repositories: the integrations, partnerships, and real-world adoption built on
top of the protocol. Ecosystem CCs might do things like:

* Source and support integrations with exchanges, wallets, payment processors, and other protocols
* Source and develop partnerships with businesses and institutions that bring real-world usage to Tari
* Support third-party teams building on Tari with onboarding, technical liaison, and go-to-market help
* Represent Tari with enterprises, at industry events, and in adjacent ecosystems
* Advise the council on ecosystem strategy, deal structure, and market development

**Example Evidence of Ecosystem CC readiness:**

* Demonstrates decorum, clarity, technical acumen and helpfulness in onboarding community members with wallets and other
  Tari software
* Maintains a welcoming attitude toward others
* Performs live presentation demos of technology and products
* Makes quality referrals to and from the Tari community and other teams

#### Infrastructure CCs

Infrastructure CCs run Tari-project managed infrastructure. They are charged with keeping community resources in working
order. Infrastructure CCs might do things like:

* Run and maintain boostrap/seed nodes
* Perform DevOps work on servers and web applications such as the forums
* Maintain mining guides and establish best practices for deploying Tari tools

**Example Evidence of Infrastructure CC readiness:**

* Demonstrated ability to deploy and maintain services
* Assists community members in mining and software setup
* Writes guides and contributes documentation for practical deployments

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

**Example Evidence of Project CC readiness:**

* Self-starts projects and recruits community members to deliver value to the community
* Assists in coordinating workgroup activities
* Gives quality feedback on items like feature and initiative prioritization
* Is able to work amicably with a wide swath of people from varying backgrounds and viewpoints

#### Community CCs

Community CCs help with day-to-day community affairs. Community CCs might do things like:

* Moderate chats and forums
* Run day-to-day community events
* Craft messaging for social media and public announcements, ensuring messaging is tailored for each venue
* Provide art and design for marketing campaigns
* Work with Project CCs to run large-scale events
* Translate resources and run language-specific discussions and community events

**Examples of Community CC Readiness:**

* Conducts themselves in public chats/forums with decorum and a welcoming demeanor
* Assists in mediation when tempers flare, and does not stoke flames
* Helps newcomers and points them in constructive directions
* Brings useful discussion topics to the table
* Assists in running community events

## Nomination

Core Contributors must have a sponsoring nominator. Only existing Core Contributors and current council members may
nominate someone for Core Contributor status. Core Contributor nominations shall be posted in an appropriate forum
category. Any nomination should contain the following:

* Who is being nominated
* What rights and contributor categories they are being nominated for
* Evidence that they meet [the requirements for being a Core Contributor](#requirements), as links and/or testimony
* Evidence that they hold competencies in any categories or for any rights they're being nominated for
* **Any corporate entity which is sponsoring their contributions**
* A date, 10 business days from the date of posting, by which any votes for or against their candidacy must be given

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
> JimBob's contributions are backed by CompanyName Inc.
> 
> Please provide your vote and feedback by August 24th!

Core Contributors should reply to the thread either with affirmative votes or with nos. Nos should be accompanied by
feedback. The attitude of feedback should not be 'never' but 'not yet', explaining what improvements the current Core
Contributors would need to see before approving their addition to the team.

The nomination will be considered approved if five Core Contributors give an affirmative vote and there are not any 'no'
votes by the time the feedback period has ended. In the event (such as when initially starting the program) there are
not five Core Contributors, Tari Council members may vote for the contributor's candidacy.

In the event of an explicit 'no' vote, the candidate may elect to appeal to the Tari Council. The Tari Council will
consider the application of the candidate, and vote on the applicant's candidacy. The candidate will be approved if the
Council decides in their favor with full unanimity. Any override vote must be completed within 10 business days, and
must include publicly published reasoning for the override, and their view of the evidence in light of the standards
in this document. Otherwise, the answer is 'no.'

### Rights Expansion

Expansion of rights is done similar to [nomination](#nomination). A forum post requesting rights or category expansion,
with reason given and evidence of competency supplied, shall be made. If after 5 working days there are at least three
affirmative votes and no negative votes, access shall be granted. Voting rights are the same as described in
[Nomination](#nomination).

## Exiting the Program

A Core Contributor who is either unable or unwilling to continue their work as a core contributor may exit the program.

### Voluntary Exits

Core Contributors are people. They may be called to new projects, may lose interest, or may lose any sponsorship that
assisted their role as contributor. Whatever the reason, a Core Contributor may submit their resignation to the Council
at any time. They will then be offboarded from the program. To leave in good standing, a notice period of at least ten
business days and good faith work to perform clean handoffs are required.

### Involuntary Exits

If a Core Contributor fails to meet the standards of Commitment, Conduct, and Caliber required of the program, and no
remediation is possible or forthcoming (such as a major breach of trust, a refusal to address critical feedback, or
extended lack of contribution) they may be removed from the program by a majority vote of the council and have all
CC rights revoked.

In the event an involuntary removal occurs, a public reason for this removal must be published by the council within
72 hours of the action taken. The removed may appeal to the council within 5 business days, and upon appeal, the council
will consider their evidence and will vote once more, requiring a supermajority (2/3) to maintain removal.
They shall vote and publish their verdict within 5 business days of the appeal being posted.

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