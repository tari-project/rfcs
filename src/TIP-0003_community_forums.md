# P-TIP-PROC-3: Tari Community Forums

| TIP           | [P-TIP-PROC-3](#p-tip-proc-3-tari-community-forums) |
|---------------|-----------------------------------------------------|
| Title         | Tari Community Forums                               |
| Last Modified | 2026-05-28                                          |
| Authors       | Fox Piacenti <fox@vulpinity.com>                    |
| Status        | Proposed                                            |
| Type          | Process                                             |
| Created       | 2026-05-03                                          |
| References    | [Community Forum Link]                              |

## Overview

The Tari Community Forums play a central role in project discussions and direction. This TIP provides guidance on the
role of [the forum][Community Forum Link] in the larger context of community discussion and governance.

## Background

Since the early days of the Internet, there have been two major methods of text-based communication:
synchronous/real-time chat protocols and asynchronous posting services. Both forms complement each other and have their
strengths. The Tari community remains somewhat fragmented between different synchronous chat protocols: Telegram,
Discord, and IRC each have their own bastions of users.

By contrast, no asynchronous hub has gained traction until now with the community forums. A previous attempt with Reddit
exists, but no critical mass has been gathered, and the need for digital sovereignty has become ever greater. Now
established, this document seeks to clarify best practices with regard to the forums and how community members should
use them.

## When to use the Forums

The forums are best used for discussions that...

* ...affect the wider community.
* ...should be preserved for long-term record keeping.
* ...may be useful for future users of the project looking for advice or support.

In practice, nearly any kind of discussion could go on the forums, and any can. The best topics, however, are those
which have archival value or benefit from deliberate long-form discussion.

For example, imagine you have an idea that would improve the Tari project. Let's say it's for a standard smart contract
feature. Your idea might initially surface on Discord. However, it would be best to move it to the forums for more
discussion.

As another example, say you've had difficulty finding help with a technical issue on Telegram or Discord, or your
technical issue is quite involved. Posting it on the forums makes it more visible to the entire community and has the
side benefit of helping anyone else in the future who might have the same problem, as it will come up in search.

## Forums as an announcement channel

The forums act as a non-exclusive announcement channel. When [creating TIPs][TIP-1],
for instance, it is best practice to announce them on the forums, alongside synchronous communications channels as
applicable.

Changes of significance to Tari protocols, features, algorithms, and governance procedures should always be announced
on the forums. These announcements can link to the primary place of discussion if it is not the forum itself. For
instance, this TIP is included as a PR against the RFCs repository. An announcement should be made on the forum about
its creation, but the discussion of this TIP's contents would be on that Pull Request directly. Thus, a link to the
Pull Request should be provided.

Not every action requires on-forum community consensus-- for instance, not every code change or closed issue requires
a forum announcement, but a forum announcement is an excellent way to request additional visibility on a proposed
change, or a way to do a victory-lap after a feature you're proud of has been merged in.

## Forum Living Structure

The forums have several categories that have been pre-created, and some of these categories have subcategories. Always
post in the category or subcategory most relevant to your discussion topic.

The categories of the forum may change over time in response to the community's needs and the volume of posts around
specific topics. Moderators are empowered to move threads between categories if they judge the category to be set
incorrectly and administrators of the forum may elect to reorganize categories as they deem necessary to facilitate
orderly and relevant discussion.

### International Categories

Tari is for everyone. To facilitate discussions in other languages, an International category shall be provisioned,
with a subcategory for each language that has established a subcommunity. To determine if a subcommunity is established,
first establish that there are known community members who use that specific language, and that at least one has
established trust[^1] sufficient to become a moderator so that the language subcategory is not left unmoderated.

For each language which has an established subcommunity, a subcategory named after that langauge shall be created,
a moderator group established, and moderator permissions granted to that group.

While the International subcategories may not have the full category structure of the rest of the forum, these
subcategories still serve as a venue for discussion in other languages.

## Change History

### 2026-05-03

* Document Created.
* [Pull Request #165](https://github.com/tari-project/rfcs/pull/165)

### 2026-05-22

* Header and name revised to current standards.

### 2026-05-28

* Added section on International categories.

[^1]: In this case, trust is meant in the common definition rather than referring to the Discourse feature.
    Moderator trust levels in Discourse cannot be earned automatically but have to be set manually by an administrator.
[Community Forum Link]: https://community.tari.com/
[TIP-1]: ./TIP-0001_tari_improvement_proposals.md
