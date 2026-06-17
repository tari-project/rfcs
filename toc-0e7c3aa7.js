// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="about.html">About the Tari RFC documents</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="TIP-0001_tari_improvement_proposals.html"><strong aria-hidden="true">1.</strong> P-TIP-PROC-1: Tari Improvement Proposals</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="TIP-0002_tari_community_charter.html"><strong aria-hidden="true">2.</strong> A-TIP-PROC-2: The Tari Community Charter</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="TIP-0003_community_forums.html"><strong aria-hidden="true">3.</strong> P-TIP-PROC-3: Community Forums</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0001_overview.html"><strong aria-hidden="true">4.</strong> RFC-0001: An overview of the Tari network</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="base_layer.html"><strong aria-hidden="true">5.</strong> The Tari Base Layer</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0110_BaseNodes.html"><strong aria-hidden="true">5.1.</strong> RFC-0110: Base nodes</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0111_BaseNodeArchitecture.html"><strong aria-hidden="true">5.2.</strong> RFC-0111: Base node architecture</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0120_Consensus.html"><strong aria-hidden="true">5.3.</strong> RFC-0120: Consensus rules</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0131_Mining.html"><strong aria-hidden="true">5.4.</strong> RFC-0131: Mining</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0132_Merge_Mining_Monero.html"><strong aria-hidden="true">5.5.</strong> RFC-0132: Merge Mining Monero</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0140_Syncing_and_seeding.html"><strong aria-hidden="true">5.6.</strong> RFC-0140: Synchronizing the Blockchain: Archival and Pruned modes</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0150_Wallets.html"><strong aria-hidden="true">5.7.</strong> RFC-0150: Wallets</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0154_DeepLinksConvencion.html"><strong aria-hidden="true">5.8.</strong> RFC-0154: Deep Links</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0155_TariAddress.html"><strong aria-hidden="true">5.9.</strong> RFC-0155: TariAddress</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0160_BlockSerialization.html"><strong aria-hidden="true">5.10.</strong> RFC-0160: Block Binary Serialization</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0170_NetworkCommunicationProtocol.html"><strong aria-hidden="true">5.11.</strong> RFC-0170: Network Communication Protocol</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0171_MessageSerialisation.html"><strong aria-hidden="true">5.11.1.</strong> RFC-0171: Message Serialisation</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0172_PeerToPeerMessagingProtocol.html"><strong aria-hidden="true">5.11.2.</strong> RFC-0172: Peer to Peer Messaging Protocol</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0173_Versioning.html"><strong aria-hidden="true">5.11.3.</strong> RFC-0173: Versioning</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0174_Chat_Metadata.html"><strong aria-hidden="true">5.11.4.</strong> RFC-0174: Chat Metadata</a></span></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0181_BulletproofsPlus.html"><strong aria-hidden="true">5.12.</strong> RFC-0181: Bulletproofs+ range proving</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0182_CommitmentSignatures.html"><strong aria-hidden="true">5.13.</strong> RFC-0182: Commitment signatures</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0190_Mempool.html"><strong aria-hidden="true">5.14.</strong> RFC-0190: Mempool</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="BaseLayerExtensions.html"><strong aria-hidden="true">5.15.</strong> Tari-specific extensions to Mimblewimble</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0201_TariScript.html"><strong aria-hidden="true">5.15.1.</strong> RFC-0201: TariScript</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0202_TariScriptOpcodes.html"><strong aria-hidden="true">5.15.2.</strong> RFC-0202: TariScript Opcodes</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0204_TariScriptExamples.html"><strong aria-hidden="true">5.15.3.</strong> RFC-0204: TariScript Examples</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0203_StealthAddresses.html"><strong aria-hidden="true">5.15.4.</strong> RFC-0203: Stealth Addresses</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0205_HardwareTransactions.html"><strong aria-hidden="true">5.15.5.</strong> RFC-0205: Hardware Transactions</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0250_Covenants.html"><strong aria-hidden="true">5.15.6.</strong> RFC-0250: Covenants</a></span></li></ol></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0303_DanOverview.html"><strong aria-hidden="true">6.</strong> RFC-0303: The Tari Digital Assets Network</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0313_VNRegistration.html"><strong aria-hidden="true">6.1.</strong> RFC-0313: Validator Node Registration</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0320_TurbineModel.html"><strong aria-hidden="true">6.2.</strong> RFC-0320: The turbine model</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0350_TariVM.html"><strong aria-hidden="true">6.3.</strong> RFC-0350: The Tari Virtual Machine</a></span></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0305_Consensus.html"><strong aria-hidden="true">7.</strong> RFC-0305: The Tari Network Consensus Layer</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0314_VNCSelection.html"><strong aria-hidden="true">7.1.</strong> RFC-0314: Validator node committee selection</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0321_ProcessingForeignProposals.html"><strong aria-hidden="true">7.2.</strong> RFC-0321: Processing foreign proposals</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0325_DanTimeManagement.html"><strong aria-hidden="true">7.3.</strong> RFC-0325: Epochs and time management</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0330_Cerberus.html"><strong aria-hidden="true">7.4.</strong> RFC-0330: The Cerberus-Hotstuff consensus algorithm</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0331_Indexers.html"><strong aria-hidden="true">7.5.</strong> RFC-0331: Indexers</a></span></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="proposals.html"><strong aria-hidden="true">8.</strong> Proposals and Applications</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0123_One_sided_replay_attacks.html"><strong aria-hidden="true">8.1.</strong> RFC-0123: Mitigating One-sided payment replay attacks</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0141_Sparse_Merkle_Trees.html"><strong aria-hidden="true">8.2.</strong> RFC-0141: Sparse Merkle Tees</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0153_StagedWalletSecurity.html"><strong aria-hidden="true">8.3.</strong> RFC-0153: Staged Wallet Security</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0230_HTLC.html"><strong aria-hidden="true">8.4.</strong> RFC-0230: Hash time locked contracts</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0240_AtomicSwap.html"><strong aria-hidden="true">8.5.</strong> RFC-0240: Atomic swap</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0241_AtomicSwapXMR.html"><strong aria-hidden="true">8.6.</strong> RFC-0241: XMR Atomic swap</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0310_SubmarineSwaps.html"><strong aria-hidden="true">8.7.</strong> RFC-0310: Submarine swaps</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0388_BearerTokens.html"><strong aria-hidden="true">8.8.</strong> RFC-0388: Bearer tokens</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-8001_MultiPartyTransactions.html"><strong aria-hidden="true">8.9.</strong> RFC-8001: Multi-party transactions</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-8002_TransactionProtocol.html"><strong aria-hidden="true">8.10.</strong> RFC-8002: Transaction protocol</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-8003_TariUseCases.html"><strong aria-hidden="true">8.11.</strong> RFC-8003: Tari Use Cases</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0385_StableCoins.html"><strong aria-hidden="true">8.12.</strong> RFC-0385: Privacy-enabled Stablecoin contract design</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC-0323_TariThrottle.html"><strong aria-hidden="true">8.13.</strong> RFC-0323: Tari throttle exploratory analysis</a></span></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="deprecated.html"><strong aria-hidden="true">9.</strong> Deprecated RFCs</a></span><ol class="section"><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0010_CodeStructure.html"><strong aria-hidden="true">9.1.</strong> RFC-0010: Tari code structure and organization</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0121_ConsensusEncoding.html"><strong aria-hidden="true">9.2.</strong> RFC-0121: Consensus encoding</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0130_Mining.html"><strong aria-hidden="true">9.3.</strong> RFC-0130: Mining</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0152_EmojiId.html"><strong aria-hidden="true">9.4.</strong> RFCD-0152: Emoji ID</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0180_BulletproofRewinding.html"><strong aria-hidden="true">9.5.</strong> RFC-0180: Bulletproof range proof rewinding</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0300_DAN.html"><strong aria-hidden="true">9.6.</strong> RFC-0300: The Digital Assets Network</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0301_NamespaceRegistration.html"><strong aria-hidden="true">9.7.</strong> RFC-0301: Namespace Registration</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0302_ValidatorNodes.html"><strong aria-hidden="true">9.8.</strong> RFC-0302: Validator Nodes</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0304_VNCommittees.html"><strong aria-hidden="true">9.9.</strong> RFC-0304: Validator Node committee selection</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0306_DANTemplateRegistration.html"><strong aria-hidden="true">9.10.</strong> RFC-0306: DAN Template Registration</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0311_AssetTemplates.html"><strong aria-hidden="true">9.11.</strong> RFC-0311: Digital Asset templates</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0312_DANHighLevelSpecification.html"><strong aria-hidden="true">9.12.</strong> RFC-0312: High level Digital Asset Network Specification</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0322_VNRegistration.html"><strong aria-hidden="true">9.13.</strong> RFC-0322: Validator Node Registration</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0340_VNConsensusOverview.html"><strong aria-hidden="true">9.14.</strong> RFC-0340: Validator Node Consensus</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0341_AssetRegistration.html"><strong aria-hidden="true">9.15.</strong> RFC-0341: Asset registration</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0345_AssetLifeCycle.html"><strong aria-hidden="true">9.16.</strong> RFC-0345: Asset Life cycle</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0360_NFTInvoices.html"><strong aria-hidden="true">9.17.</strong> RFC-0360: NFT sale using MimbleWimble Invoice</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFCD-0500_PaymentChannels.html"><strong aria-hidden="true">9.18.</strong> RFC-0500: Tari payment channels</a></span></li></ol><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="RFC_template.html"><strong aria-hidden="true">10.</strong> RFC template</a></span></li><li class="chapter-item expanded "><span class="chapter-link-wrapper"><a href="Glossary.html"><strong aria-hidden="true">11.</strong> Glossary</a></span></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split('#')[0].split('?')[0];
        if (current_page.endsWith('/')) {
            current_page += 'index.html';
        }
        const links = Array.prototype.slice.call(this.querySelectorAll('a'));
        const l = links.length;
        for (let i = 0; i < l; ++i) {
            const link = links[i];
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The 'index' page is supposed to alias the first chapter in the book.
            if (link.href === current_page
                || i === 0
                && path_to_root === ''
                && current_page.endsWith('/index.html')) {
                link.classList.add('active');
                let parent = link.parentElement;
                while (parent) {
                    if (parent.tagName === 'LI' && parent.classList.contains('chapter-item')) {
                        parent.classList.add('expanded');
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                const clientRect = e.target.getBoundingClientRect();
                const sidebarRect = this.getBoundingClientRect();
                sessionStorage.setItem('sidebar-scroll-offset', clientRect.top - sidebarRect.top);
            }
        }, { passive: true });
        const sidebarScrollOffset = sessionStorage.getItem('sidebar-scroll-offset');
        sessionStorage.removeItem('sidebar-scroll-offset');
        if (sidebarScrollOffset !== null) {
            // preserve sidebar scroll position when navigating via links within sidebar
            const activeSection = this.querySelector('.active');
            if (activeSection) {
                const clientRect = activeSection.getBoundingClientRect();
                const sidebarRect = this.getBoundingClientRect();
                const currentOffset = clientRect.top - sidebarRect.top;
                this.scrollTop += currentOffset - parseFloat(sidebarScrollOffset);
            }
        } else {
            // scroll sidebar to current active section when navigating via
            // 'next/previous chapter' buttons
            const activeSection = document.querySelector('#mdbook-sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        const sidebarAnchorToggles = document.querySelectorAll('.chapter-fold-toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(el => {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define('mdbook-sidebar-scrollbox', MDBookSidebarScrollbox);


// ---------------------------------------------------------------------------
// Support for dynamically adding headers to the sidebar.

(function() {
    // This is used to detect which direction the page has scrolled since the
    // last scroll event.
    let lastKnownScrollPosition = 0;
    // This is the threshold in px from the top of the screen where it will
    // consider a header the "current" header when scrolling down.
    const defaultDownThreshold = 150;
    // Same as defaultDownThreshold, except when scrolling up.
    const defaultUpThreshold = 300;
    // The threshold is a virtual horizontal line on the screen where it
    // considers the "current" header to be above the line. The threshold is
    // modified dynamically to handle headers that are near the bottom of the
    // screen, and to slightly offset the behavior when scrolling up vs down.
    let threshold = defaultDownThreshold;
    // This is used to disable updates while scrolling. This is needed when
    // clicking the header in the sidebar, which triggers a scroll event. It
    // is somewhat finicky to detect when the scroll has finished, so this
    // uses a relatively dumb system of disabling scroll updates for a short
    // time after the click.
    let disableScroll = false;
    // Array of header elements on the page.
    let headers;
    // Array of li elements that are initially collapsed headers in the sidebar.
    // I'm not sure why eslint seems to have a false positive here.
    // eslint-disable-next-line prefer-const
    let headerToggles = [];
    // This is a debugging tool for the threshold which you can enable in the console.
    let thresholdDebug = false;

    // Updates the threshold based on the scroll position.
    function updateThreshold() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // The number of pixels below the viewport, at most documentHeight.
        // This is used to push the threshold down to the bottom of the page
        // as the user scrolls towards the bottom.
        const pixelsBelow = Math.max(0, documentHeight - (scrollTop + windowHeight));
        // The number of pixels above the viewport, at least defaultDownThreshold.
        // Similar to pixelsBelow, this is used to push the threshold back towards
        // the top when reaching the top of the page.
        const pixelsAbove = Math.max(0, defaultDownThreshold - scrollTop);
        // How much the threshold should be offset once it gets close to the
        // bottom of the page.
        const bottomAdd = Math.max(0, windowHeight - pixelsBelow - defaultDownThreshold);
        let adjustedBottomAdd = bottomAdd;

        // Adjusts bottomAdd for a small document. The calculation above
        // assumes the document is at least twice the windowheight in size. If
        // it is less than that, then bottomAdd needs to be shrunk
        // proportional to the difference in size.
        if (documentHeight < windowHeight * 2) {
            const maxPixelsBelow = documentHeight - windowHeight;
            const t = 1 - pixelsBelow / Math.max(1, maxPixelsBelow);
            const clamp = Math.max(0, Math.min(1, t));
            adjustedBottomAdd *= clamp;
        }

        let scrollingDown = true;
        if (scrollTop < lastKnownScrollPosition) {
            scrollingDown = false;
        }

        if (scrollingDown) {
            // When scrolling down, move the threshold up towards the default
            // downwards threshold position. If near the bottom of the page,
            // adjustedBottomAdd will offset the threshold towards the bottom
            // of the page.
            const amountScrolledDown = scrollTop - lastKnownScrollPosition;
            const adjustedDefault = defaultDownThreshold + adjustedBottomAdd;
            threshold = Math.max(adjustedDefault, threshold - amountScrolledDown);
        } else {
            // When scrolling up, move the threshold down towards the default
            // upwards threshold position. If near the bottom of the page,
            // quickly transition the threshold back up where it normally
            // belongs.
            const amountScrolledUp = lastKnownScrollPosition - scrollTop;
            const adjustedDefault = defaultUpThreshold - pixelsAbove
                + Math.max(0, adjustedBottomAdd - defaultDownThreshold);
            threshold = Math.min(adjustedDefault, threshold + amountScrolledUp);
        }

        if (documentHeight <= windowHeight) {
            threshold = 0;
        }

        if (thresholdDebug) {
            const id = 'mdbook-threshold-debug-data';
            let data = document.getElementById(id);
            if (data === null) {
                data = document.createElement('div');
                data.id = id;
                data.style.cssText = `
                    position: fixed;
                    top: 50px;
                    right: 10px;
                    background-color: 0xeeeeee;
                    z-index: 9999;
                    pointer-events: none;
                `;
                document.body.appendChild(data);
            }
            data.innerHTML = `
                <table>
                  <tr><td>documentHeight</td><td>${documentHeight.toFixed(1)}</td></tr>
                  <tr><td>windowHeight</td><td>${windowHeight.toFixed(1)}</td></tr>
                  <tr><td>scrollTop</td><td>${scrollTop.toFixed(1)}</td></tr>
                  <tr><td>pixelsAbove</td><td>${pixelsAbove.toFixed(1)}</td></tr>
                  <tr><td>pixelsBelow</td><td>${pixelsBelow.toFixed(1)}</td></tr>
                  <tr><td>bottomAdd</td><td>${bottomAdd.toFixed(1)}</td></tr>
                  <tr><td>adjustedBottomAdd</td><td>${adjustedBottomAdd.toFixed(1)}</td></tr>
                  <tr><td>scrollingDown</td><td>${scrollingDown}</td></tr>
                  <tr><td>threshold</td><td>${threshold.toFixed(1)}</td></tr>
                </table>
            `;
            drawDebugLine();
        }

        lastKnownScrollPosition = scrollTop;
    }

    function drawDebugLine() {
        if (!document.body) {
            return;
        }
        const id = 'mdbook-threshold-debug-line';
        const existingLine = document.getElementById(id);
        if (existingLine) {
            existingLine.remove();
        }
        const line = document.createElement('div');
        line.id = id;
        line.style.cssText = `
            position: fixed;
            top: ${threshold}px;
            left: 0;
            width: 100vw;
            height: 2px;
            background-color: red;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(line);
    }

    function mdbookEnableThresholdDebug() {
        thresholdDebug = true;
        updateThreshold();
        drawDebugLine();
    }

    window.mdbookEnableThresholdDebug = mdbookEnableThresholdDebug;

    // Updates which headers in the sidebar should be expanded. If the current
    // header is inside a collapsed group, then it, and all its parents should
    // be expanded.
    function updateHeaderExpanded(currentA) {
        // Add expanded to all header-item li ancestors.
        let current = currentA.parentElement;
        while (current) {
            if (current.tagName === 'LI' && current.classList.contains('header-item')) {
                current.classList.add('expanded');
            }
            current = current.parentElement;
        }
    }

    // Updates which header is marked as the "current" header in the sidebar.
    // This is done with a virtual Y threshold, where headers at or below
    // that line will be considered the current one.
    function updateCurrentHeader() {
        if (!headers || !headers.length) {
            return;
        }

        // Reset the classes, which will be rebuilt below.
        const els = document.getElementsByClassName('current-header');
        for (const el of els) {
            el.classList.remove('current-header');
        }
        for (const toggle of headerToggles) {
            toggle.classList.remove('expanded');
        }

        // Find the last header that is above the threshold.
        let lastHeader = null;
        for (const header of headers) {
            const rect = header.getBoundingClientRect();
            if (rect.top <= threshold) {
                lastHeader = header;
            } else {
                break;
            }
        }
        if (lastHeader === null) {
            lastHeader = headers[0];
            const rect = lastHeader.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top >= windowHeight) {
                return;
            }
        }

        // Get the anchor in the summary.
        const href = '#' + lastHeader.id;
        const a = [...document.querySelectorAll('.header-in-summary')]
            .find(element => element.getAttribute('href') === href);
        if (!a) {
            return;
        }

        a.classList.add('current-header');

        updateHeaderExpanded(a);
    }

    // Updates which header is "current" based on the threshold line.
    function reloadCurrentHeader() {
        if (disableScroll) {
            return;
        }
        updateThreshold();
        updateCurrentHeader();
    }


    // When clicking on a header in the sidebar, this adjusts the threshold so
    // that it is located next to the header. This is so that header becomes
    // "current".
    function headerThresholdClick(event) {
        // See disableScroll description why this is done.
        disableScroll = true;
        setTimeout(() => {
            disableScroll = false;
        }, 100);
        // requestAnimationFrame is used to delay the update of the "current"
        // header until after the scroll is done, and the header is in the new
        // position.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Closest is needed because if it has child elements like <code>.
                const a = event.target.closest('a');
                const href = a.getAttribute('href');
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    threshold = targetElement.getBoundingClientRect().bottom;
                    updateCurrentHeader();
                }
            });
        });
    }

    // Takes the nodes from the given head and copies them over to the
    // destination, along with some filtering.
    function filterHeader(source, dest) {
        const clone = source.cloneNode(true);
        clone.querySelectorAll('mark').forEach(mark => {
            mark.replaceWith(...mark.childNodes);
        });
        dest.append(...clone.childNodes);
    }

    // Scans page for headers and adds them to the sidebar.
    document.addEventListener('DOMContentLoaded', function() {
        const activeSection = document.querySelector('#mdbook-sidebar .active');
        if (activeSection === null) {
            return;
        }

        const main = document.getElementsByTagName('main')[0];
        headers = Array.from(main.querySelectorAll('h2, h3, h4, h5, h6'))
            .filter(h => h.id !== '' && h.children.length && h.children[0].tagName === 'A');

        if (headers.length === 0) {
            return;
        }

        // Build a tree of headers in the sidebar.

        const stack = [];

        const firstLevel = parseInt(headers[0].tagName.charAt(1));
        for (let i = 1; i < firstLevel; i++) {
            const ol = document.createElement('ol');
            ol.classList.add('section');
            if (stack.length > 0) {
                stack[stack.length - 1].ol.appendChild(ol);
            }
            stack.push({level: i + 1, ol: ol});
        }

        // The level where it will start folding deeply nested headers.
        const foldLevel = 3;

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const level = parseInt(header.tagName.charAt(1));

            const currentLevel = stack[stack.length - 1].level;
            if (level > currentLevel) {
                // Begin nesting to this level.
                for (let nextLevel = currentLevel + 1; nextLevel <= level; nextLevel++) {
                    const ol = document.createElement('ol');
                    ol.classList.add('section');
                    const last = stack[stack.length - 1];
                    const lastChild = last.ol.lastChild;
                    // Handle the case where jumping more than one nesting
                    // level, which doesn't have a list item to place this new
                    // list inside of.
                    if (lastChild) {
                        lastChild.appendChild(ol);
                    } else {
                        last.ol.appendChild(ol);
                    }
                    stack.push({level: nextLevel, ol: ol});
                }
            } else if (level < currentLevel) {
                while (stack.length > 1 && stack[stack.length - 1].level > level) {
                    stack.pop();
                }
            }

            const li = document.createElement('li');
            li.classList.add('header-item');
            li.classList.add('expanded');
            if (level < foldLevel) {
                li.classList.add('expanded');
            }
            const span = document.createElement('span');
            span.classList.add('chapter-link-wrapper');
            const a = document.createElement('a');
            span.appendChild(a);
            a.href = '#' + header.id;
            a.classList.add('header-in-summary');
            filterHeader(header.children[0], a);
            a.addEventListener('click', headerThresholdClick);
            const nextHeader = headers[i + 1];
            if (nextHeader !== undefined) {
                const nextLevel = parseInt(nextHeader.tagName.charAt(1));
                if (nextLevel > level && level >= foldLevel) {
                    const toggle = document.createElement('a');
                    toggle.classList.add('chapter-fold-toggle');
                    toggle.classList.add('header-toggle');
                    toggle.addEventListener('click', () => {
                        li.classList.toggle('expanded');
                    });
                    const toggleDiv = document.createElement('div');
                    toggleDiv.textContent = '❱';
                    toggle.appendChild(toggleDiv);
                    span.appendChild(toggle);
                    headerToggles.push(li);
                }
            }
            li.appendChild(span);

            const currentParent = stack[stack.length - 1];
            currentParent.ol.appendChild(li);
        }

        const onThisPage = document.createElement('div');
        onThisPage.classList.add('on-this-page');
        onThisPage.append(stack[0].ol);
        const activeItemSpan = activeSection.parentElement;
        activeItemSpan.after(onThisPage);
    });

    document.addEventListener('DOMContentLoaded', reloadCurrentHeader);
    document.addEventListener('scroll', reloadCurrentHeader, { passive: true });
})();

