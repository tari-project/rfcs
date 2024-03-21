# RFC-1103/CommunicationWithProvider

## Tari Universe Communication with Provider

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Maciej Kożuszek](https://github.com/MCozhusheck)

# Licence

[ The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2024 The Tari Development Community

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of this document must retain the above copyright notice, this list of conditions and the following
   disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
   disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS DOCUMENT IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS", AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Language

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",
"NOT RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in
[BCP 14](https://tools.ietf.org/html/bcp14) (covering RFC2119 and RFC8174) when, and only when, they appear in all capitals, as
shown here.

## Disclaimer

This document and its content are intended for information purposes only and may be subject to change or update
without notice.

This document may include preliminary concepts that may or may not be in the process of being developed by the Tari
community. The release of this document is intended solely for review and discussion by the community regarding the
technological merits of the potential system outlined herein.

## Goals

This RFC propose the model of communication between a wallet daemon and tapplets in Tari Universe.

## Introduction

Tari Universe should be built using with [Tauri](https://tauri.app/) which will include a OS process with wallet daemon and root frame which hosts dashboard and has TypeScript provider for communication with wallet. This root frame also hosts tapplets in _\<iframe /\>_ as it's own children and serves as a intermediary between those tapplets and wallet daemon.

![Tari Universe Communication Graph](assets/Tari_Universe_communication_with_provider.svg)

## Wallet daemon

A normal wallet daemon requires a webRTC communication which is establish through a signaling server that connect incoming requests with matching requests IDs. In this case communication will happen on the same host so we can simplify by utilizing inter process communication (IPC).

**Wallet daemon IPC** entity that holds a reference to initialized wallet daemon running in background will server as mediatory between chromium and wallet daemon.

## Root Frame - Tapplet Communication

Root frame and it's child tapplets should communicate through **window.postMessage(request, targetOrigin)** and **window.addEventListener("message",handler)**.

**request** should be an object of type:

```Typescript
interface Request {
   methodName: keyof TariProvider,
   args: unknown[]
   id: number
}
```

Id is an unique identifier for tapplets requests to distinguish incoming requests.

Response should be raw object from Tari provider.

## Root frame

Root frame initialize it's own provider that implements **TariProvider** which should look like as follow:

```Typescript
interface TariProvider {
  providerName: string;
  isConnected(): boolean;
  getAccount(): Promise<Account>;
  getSubstate(substate_address: string): Promise<Substate>;
  submitTransaction(
    req: SubmitTransactionRequest
  ): Promise<SubmitTransactionResponse>;
  getTransactionResult(transactionId: string): Promise<TransactionResult>;
  getTemplateDefinition(template_address: string): Promise<Template>;
}
```

This provider should now communicate with wallet daemon.

To receive requests from tapplet, root frame should register an event listener for incoming requests, the rough implementation for React app should look like this:

```Typescript
useEffect(() => {
    const handleMessage = async (event) => {
      const result = await provider[event.methodName](event.args);
      event.source.postMessage({ id: event.id, result }, event.origin);
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
```

## Tapplets

Tapplet should communicate with it's root frame with **window.parent.postMessage(request,windowParentOrigin)** but typing this every request would a hassle so my suggestion is to use some wrapper that handles communication to the root frame:

```Typescript
let __id = 0; // global sequence

async function providerWrapper(req: Omit<Request, "id">) {
  return new Promise(function(resolve, reject) {
    const id = ++__id;

    const event_ref = function (resp) {
      if (resp && resp.data && resp.data.id && resp.data.id == id) {
        window.removeEventListener("message", event_ref);
        resolve(resp.data);
      }
    };
    window.addEventListener("message", event_ref, false);

    window.parent.postMessage({...req, id}, rootFrameOrigin);
  });
}
```

`rootFrameOrigin` should be a variable that hold it's root frame origin. Best practice is to get it from another `postMessage(..)` call and cache it.

Now tapplet simply needs to call this wrapper and as bonus we get correct typing for all the methods available in the Tari provider.

```Typescript
async function getAccountData() {
   const res = await providerWrapper({methodName: "getAccount", args: []});
   return res;
}
```

# Change Log

| Date        | Change | Author      |
| :---------- | :----- | :---------- |
| 21 mar 2024 | Draft  | MCozhusheck |
