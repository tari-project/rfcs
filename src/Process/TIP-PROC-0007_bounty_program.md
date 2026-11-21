# P-TIP-PROC-7: Bounty Program

| TIP           | [P-TIP-PROC-7](#p-tip-proc-7-bounty-program) |
|---------------|--------------------------------------------------------|
| Title         | Bounty Program                               |
| Last Modified | 2026-07-11                                             |
| Authors       | Fox Piacenti &lt;fox@vulpinity.com&gt;                 |
| Status        | Proposed                                               |
| Type          | Process                                                |
| Created       | 2026-11-21                                             |

## Overview

The Tari Bounty program exists as a means to cultivate community participation in development, widen the pool of capable developers and contributors, and incentivize responsible reporting of security issues. It comes in four distinct forms: Bug and Feature Bounties, Retro Bounties, Special Contribution Bounties, and Security bounties. This document lays out the overall scope of the program, and the rules surrounding its budgeting. The [mechanics of payouts and day-to-day administration][Administration] are documented elsewhere.

## Bounty Program Forms

The bounty program comes in four forms, enumerated and detailed here.

### Bug and Feature Bounties

Code [Core Contributors] are empowered to issue bounties for bugs found in [Tari Project] repositories they maintain. They may also issue bounties for desired features.

### Retro Bounties

Code [Core Contributors] may, at their discretion, award retro bounties for community submitted code work that they find exceptional. They are at no time required to award retro bounties, and their judgment on what is worth rewarding with a retro bounty is subjective, sacrosanct, and final.

### Special Contribution Bounties

Special contributions bounties are bounties that are general-purpose and for work that is not code-specific. They may be applied retroactively or prescriptively as decided by those charged with their awarding.

### Security Bounties

Security bounties are a standing promise to the wider developer community to reward responsible disclosure of bugs. Unlike other bounty types, security bounties do not have a specific budget cap, but instead rely on rules, requirements, iterative improvements in processes, and reporting to keep their spending under control. See [Restrictions](#restrictions) and [Appendix: Tari Vulnerability Disclosure Policy](#appendix-tari-vulnerability-disclosure-policy) for details of the restrictions, and visit the [Security Bounty Budget](#security-bounty-budget) section for budget process considerations.

## Bounty Sizing

Bounties may be awarded in the following sizes:

* Small
* Medium
* Large/High
* Extra Large/Critical

Bounty sizes are to be determined and [published][Bounty Size Publication] by the council, and announced conspicuously and publicly. Bounty sizes may be adjusted to account for changing budget conditions or market conditions. Bounty submissions initiated two weeks before a published change will be honored at the previous value upon a submitter's explicit request.

Bounties whose submissions are earlier than this two-week window may, with approval of the Core Contributor responsible for the bounty's budget, petition the council for an exception.

## Budgeting

The following sections detail how budgeting is to be handled for bounties.

### Repository Allocations

The council will approve and publish a budget with a list of repositories and a budget of XTM for each to use for Bug and Feature and/or Retro bounties. The amount will be one pool that can be subdivided between the types and sizes as needed. The budget will cover a specified time period, such as a year or quarter. Any repositories not included in the budget shall be assumed to have no budget for these bounty types during that period.

The Code Core Contributor who is chiefly responsible for a repository's maintenance is responsible for the bounty budget on that repository, including which issues are labeled as bounties and which contributions are awarded for a retro bounty.

### Special Contribution Budgets

The council will approve and publish a budget of XTM to award toward special contributions. They will name one or more Core Contributors who will be responsible for determining what efforts are to be awarded with these bounties, whether in retroactive or prescribed form. The council may allocate zero (0) XTM if they do not want to budget special contributions during a specific period.

### Security Bounty Budget

The council will budget a forecasted security budget for bounties over a period. Contributors in charge of managing bounty payouts will monitor payouts for security vulnerabilities and report, at an interval the council requests, on the payouts made verses the budget allocated.

The council may, at its discretion, suspend the security bounty program for a repository or the project generally to verify the integrity of the program or adjust its parameters.

## Restrictions

Core Contributors and council members are generally ineligible for bounties, except in cases where the council has made a majority vote to allow this. Exception reasoning must be published in a conspicuous and public place.

## Appendix: Tari Vulnerability Disclosure Policy

### Introduction

[The Tari Council](../TIP-0002_tari_community_charter.md) guides the development of the [Tari open source project](https://tari.com). As the stewards of Tari, we welcome feedback from security researchers and the general public. If you believe you have discovered a vulnerability, privacy issue, exposed data, or other security issues in Tari software or Tari project infrastructure, we want to hear from you. This policy outlines steps for reporting vulnerabilities to us, what we expect, and what you can expect from us.

### Scope

This policy applies to:

- Code implementation as seen in the `tari-project` [GitHub repositories](https://github.com/tari-project). This includes code in the `development` branches and any release branch.
- Written research from Tari Labs which dictates the above-referenced Tari code implementation. This includes [Tari RFCs](https://rfc.tari.com/) and any published academic or journal articles.
- Infrastructure owned, operated, or maintained by the Tari Council, the Tari Foundation, or Core Contributors to the Tari project as part of their duties. This includes websites and public-facing applications.

#### Out of Scope

This policy does not apply to:

- Archived repositories;
- End-user documentation and educational or "help" materials (e.g., [The Tari Ootle Playground](https://ootle.tari.com/));
- Example or test code.
- Proof-of-concept or demonstration applications.
- Code clearly marked as "NOT READY FOR PRODUCTION", "HEAVILY UNDER DEVELOPMENT", or similar wording. An exception is code that is marked as such, but is demonstrably used in production applications covered by the scope anyway.
- Support, marketing, and social media channels (e.g., Telegram or Discord);
- Social engineering of Tari users and Tari Labs staff or contractors;
- Services, applications, and mix networks run by volunteers (e.g., Tor hidden services);
- Attacks which require more than 50% of network hash rate (or equivalent luck for enough blocks to execute);
- Assets, equipment, and systems not controlled by the Tari Council or the Tari Foundation; and
- [Commonplace Reports](#commonplace-reports) as described in this policy.

Vulnerabilities discovered or suspected in systems not controlled by the Tari Council or Tari Foundation should be reported to the appropriate owner, vendor, or applicable authority. We emphasize that researchers should not engage in Denial of Service, active exploits against networks, or any physical or electronic attempts against property and/or data centers.

### Disclosure

Please report any **non-sensitive** issue **unrelated to security** as a Github issue in the relevant repository.

Security issues must be disclosed as a Private Security Advisory on GitHub.

Please follow the [requirements](#submission-requirements) below when making your submission.

### Our Commitments

When disclosing a security issue according to this policy, you can expect us to:

- Respond to your report promptly, and work with you to understand and validate your report;
- Let you know if your report qualifies for a bounty reward;
- Strive to keep you informed about the progress of a vulnerability as it is processed;
- Work to remediate discovered vulnerabilities in a timely manner, within our operational constraints;
- Extend [Safe Harbor](#safe-harbor) for your vulnerability research that is related to this policy; and

If your report qualifies for a bounty reward, we will:

- Set a risk level of severity and the reward size;
- Notify you once an issue has been resolved; and
- Provide a time window for the lifting of restrictions around public disclosure.

### Our Expectations

When disclosing a security issue, we ask that you:

- Play by the rules, including following this policy and any other relevant agreements. If there is any inconsistency between this policy and any other applicable terms, the terms of this policy will prevail;
- Report any vulnerability you’ve discovered promptly and in good faith;
- Avoid violating the privacy of others, disrupting our systems, destroying data, and/or harming user experience;
- Use only the [Official Channels](#disclosure) to discuss vulnerability information with us;
- Provide us a reasonable amount of time (**at least 60 days** from the initial report) to resolve the issue before you disclose it publicly;
- Perform testing only on in-scope systems, and respect systems and activities which are [Out of Scope](#out-of-scope);
- You should only interact with test accounts you own or with explicit permission from the account holder; and
- Do not engage in extortion.

If a vulnerability provides unintended access to data, we ask that you:

- Limit the amount of data you access to the minimum required for effectively demonstrating a proof-of-concept (PoC); and
- Cease testing and submit a report immediately if you encounter any user data during testing, such as Personally Identifiable Information (PII), Personal Healthcare Information (PHI), credit card data, or proprietary information.

### Safe Harbor

We consider research conducted under this policy to be:

- Authorized concerning any applicable anti-hacking laws, and we will not initiate or support legal action against you for accidental, good-faith violations of this policy;

- Authorized concerning any relevant anti-circumvention laws, and we will not bring a claim against you for circumvention of technology controls;

- Exempt from restrictions in our terms of service and/or usage policies that would interfere with conducting security research, and we waive those restrictions on a limited basis; and

- Lawful, helpful to the overall security of the Internet, and conducted in good faith.

You are expected, as always, to comply with all applicable laws. If legal action is initiated by a third party against you, and you have complied with this policy, we will take steps to make it known that your actions were conducted in compliance with this policy.

If at any time you have concerns or are uncertain whether your security research is consistent with this policy, please submit a report through one of our [Disclosure Channels](#disclosure) before going any further.

- **IMPORTANT:** Please note that Safe Harbor applies only to legal claims under the control of the organization participating in this policy, and that the policy does not bind independent third parties.

### Bounty Rewards

**Note:** Multiple vulnerabilities caused by one underlying issue will be awarded one bounty.

#### Token-based bounties

The [current Bounty sizes and values][Bounty Size Publication] are detailed, with history of changes, on the Tari project wiki.

##### Notes and conditions for token bounty rewards:

- Minotari earned through the bounty program will unencumbered and can be spent or traded immediately after conversion.
- Researchers will have to provide a valid Tari wallet emoji id in order to receive their Minotari tokens. The Tari Council and Tari Foundation will not custody any tokens on behalf of researchers.
- The Tari Council reserves the right to adjust the bounty reward amounts from time to time.

Our rewards are based on severity per CVSS (the Common Vulnerability Scoring Standard) as determined by the Core Contributor in charge of maintenance of operation of the vulnerable system in question. Please note these are general guidelines, and reward decisions are up to the discretion of the Core Contributor and the Tari Council.

Please allow up to one week from the time the report was approved and validated to receive your bounty reward payment.

#### Submission Requirements

Please adhere to the following requirements when making a submission.

1. **Report format:** For any report to be considered, you must provide clear instructions on how to reproduce the issue, as well as how it could be exploited (i.e., attack scenario), and what you think the security impact is. This information helps us assess eligibility and appropriate bounty reward amounts. The following format can be used as a rough, outline:
    - A description of the issue;
    - A proof-of-concept (PoC) or steps you took to create the issue;
    - Screenshots and/or a video demonstration.

2. Whenever possible, please include:
   _ Affected software versions; and
   _ If known, mitigations for the issue.
   The more detail you provide, the easier it will be for us to triage and fix the issue.

3. **Submit one vulnerability per report**, unless you need to chain vulnerabilities to provide impact.

4. **First come, first served:** Only the first person to identify a particular vulnerability will qualify for a bounty reward. Any additional reports will be considered as duplicates and will not qualify.

5. **Play it safe:** All testing must be performed on test accounts under your control. Any attacks against other users without provable express consent are not allowed. If a particular issue is severe enough that a proof-of-concept (PoC) in itself may expose sensitive data (e.g., data of other users), please ask us for help first so we can work together on how to safely demonstrate the bug.

6. **Don't disclose too early:** To protect our users, please keep all identified vulnerability details between you and us until we've had a chance to fix the issue. This includes things like posting an obscured video of an issue on social media prior to confirmation of a deployed fix. Though you may think you have concealed critical details, doing so at minimum alerts potentially malicious actors that an issue exists and at worst unintentionally creates early disclosure.

7. **No social engineering:** Bugs that require social engineering to exploit (e.g., tricking someone into clicking a link) may qualify, but please do not actually attempt to socially engineer another user, Tari Labs staff, Tari open source volunteers, etc. during your testing. Providing a clear explanation of how social engineering could be used in conjunction with an identified vulnerability is sufficient.

#### Commonplace Reports

In addition to the areas defined as [Out of Scope](#out-of-scope) in this policy, the following non-exhaustive commonplace reports do not qualify for a bounty reward. Such issues may be disclosed as a [GitHub issue here](https://github.com/tari-project/tari/issues/new?assignees=&labels=bug-report&template=bug_report.md&title=%5BThanks%20for%20making%20Tari%20better%5D).

- Lack of a security feature that is not critical to the system's operation
- Configuration issues that are not relevant to the network or application
- Application Denial of Service by locking user accounts
- Descriptive error messages or headers (e.g., stack traces, banner grabbing, debug information on a production site)
- Purely technical, public, and non-sensitive network, application, or API information unrelated to a specific exploit
- Disclosure of known public files or directories, (e.g., `robots.txt`)
- Outdated software/library versions
- Lack of security headers, such as the `X-Content-Type-Options` or `X-Frame-Options` headers
- OPTIONS/TRACE HTTP method enabled
- Subdomain takeover, such as a subdomain pointing to a service that is no longer in use
- DNS Zone transfer and configuration issues
- CSRF on logout
- CSRF on forms that are available to anonymous users
- Cookies with missing or incomplete flags such as `HTTP Only` or `Secure`
- Self-XSS and issues exploitable only through Self-XSS
- XSS that does not allow for the execution of arbitrary code, such as reflected or non-persistent XSS
- Reports resulting from automated scanning utilities without additional details or a PoC demonstrating a specific exploit
- Attacks requiring physical access to a user’s device, or access to an already unlocked user session on it
- Attacks that depend on a script being pasted or run by hand inside the app's webview. A webview vector qualifies only when the report shows how the script gets into the window without the user's help
- Attacks dependent upon social engineering of Core Contributors, Tari Foundation Officers, Tari Council Members, or their vendors
- Attacks dependent upon social engineering of Tari open source volunteers
- Attacks dependent upon social engineering of Tari users
- Username enumeration based on login or "forgot password" pages
- Enforcement policies for brute force, rate limiting, or account lockout
- SSL/TLS best practices
- SSL/TLS attacks such as BEAST, BREACH, Renegotiation attack
- Clickjacking, without additional details demonstrating a specific exploit
- Mail configuration issues including SPF, DKIM, DMARC settings
- Use of a known-vulnerable library without a description of an exploit specific to our implementation
- Password and account recovery policies
- Presence of autocomplete functionality in form fields
- Publicly-accessible login panels
- Lack of email address verification during account registration or account invitation
- Lack of email address verification password restore
- Session control during email/password changes

Thank you for helping keep Tari and our users safe!

[Administration]: https://wiki.tari.com/processes:bounties
[Core Contributors]: ./TIP-PROC-0006_core_contributor_program
[Tari Project]: https://github.com/tari-project/
[Bounty Size Publication]: https://wiki.tari.com/processes:bounty_sizes
