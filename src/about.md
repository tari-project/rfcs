# Tari Project Proposals

Tari is a community-driven project. This repository contains technical RFCs as well as Tari Improvement Proposals,
which are more general and may involve community standards and governance practices.

## RFCs

The documents presented in this collection have typically gone through several
iterations before reaching this point:

* Ideas and questions are posted in the [Tari Discord](https://discord.gg/hPABK5WV). This is typically short-form
  content with rapid feedback. Often, these conversations will lead to someone posting an [issue] or RFC [pull request].
* RFCs are "Requests for Comment", so although the proposals in these documents are usually well-thought out, they are
  not cast in stone. RFCs can, and should, undergo further evaluation and discussion by the community. RFC comments are
  best made using Github [issue]s.
* New RFCs should be posted to the [community forums] for visibility and community review, and should follow the format 
  given in the [RFC template](RFC_template.md).

### Lifecycle

RFCs go through the following lifecycle, which roughly corresponds to the [COSS](https://github.com/unprotocols/rfc/blob/master/2/README.md):

| Status      |                                                   | Description                                                                                                                                                                                                         |
|:------------|:--------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Draft       | ![draft](theme/images/status-draft.svg)           | New ideas and proposals. These are not yet accepted; changes, additions, and revisions can be expected.                                                                                                              |
| Stable      | ![stable](theme/images/status-stable.svg)         | Typographical and cosmetic changes aside, no further changes should be made. Changes to the Tari codebase will lead to the RFC becoming out of date, deprecated, or retired.                                   |
| Out of date | ![out of date](theme/images/status-outofdate.svg) | This RFC has become stale due to changes in the codebase. Contributions will be accepted to make it stable again if the changes are relatively minor; otherwise it should eventually become deprecated or retired. |
| Deprecated  | ![deprecated](theme/images/status-deprecated.svg) | This RFC has been replaced by a newer RFC document, but is still in use in some places and/or versions of Tari.                                                                                                     |
| Retired     | ![retired](theme/images/status-retired.svg)       | This RFC is no longer in use by the Tari network.                                                                                                                                                                   |


## Tari Improvement Proposals (TIP)

Tari Improvement Proposals are proposals for improving the Tari project generally. They are distinct from RFCs in that
they are product, practice, and community improvement proposals rather than protocol or algorithm proposals.

The format and standards of Tari Improvement Proposals will be covered in [TIP-1].

[pull request]: https://github.com/tari-project/tari/pulls?q=is%3Aopen+is%3Apr+label%3ARFC 'Tari RFC pull requests'
[issue]: https://github.com/tari-project/tari/issues?q=is%3Aissue+label%3ARFC 'Tari RFC Issues'
[community forums]: https://community.tari.com/ 'Tari Community Forums'
[TIP-1]: TIP-0001_tari_improvement_proposals.md 'TIP-1: Tari Improvement Proposals'