# RFC-0323/TariThrottle

## The Tari throttle, or Layer 2 burn rate controller

![status: draft](theme/images/status-draft.svg)

**Maintainer(s)**: [Cayle Sharrock](https://github.com/CjS77)

# Licence

[The 3-Clause BSD Licence](https://opensource.org/licenses/BSD-3-Clause).

Copyright 2022 The Tari Development Community

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
community. The release of this document is intended solely for review and discussion by the community of the
technological merits of the potential system outlined herein.

## Goals

This RFC provides an introductory exploratory analysis into the mechanisms behind a proposed Tari throttle: a Layer 
2 controller for the L2 fee burn rate to control the Tari circulating supply. 

## Related Requests for Comment

* [RFC-0303: The Digital Assets Network Overview](RFC-0303_DanOverview.md)
* [RFC-0320: The turbine model](RFC-0320_TurbineModel.md)
                               
## Table of Contents

- [Summary](#summary)
- [PID controllers](#pid-controllers)
- [Tari throttle](#tari-throttle)
  - [Controller parameters](#controller-parameters)
  - [Controller inputs](#controller-inputs)
    - [Fee models](#fee-models)
    - [Emission model](#emission-model)
    - [Miscellaneous parameters](#miscellaneous-parameters)
    - [Integer control](#integer-control)
  - [The simulations](#the-simulations)
    - [Controller parameters](#controller-parameters-1)
    - [Target supply](#target-supply)
    - [Fee models](#fee-models-1)
  - [Results](#results)
    - [21 billion Tari target supply](#21-billion-tari-target-supply)
    - [18 billion Tari target supply](#18-billion-tari-target-supply)
    - [15 billion Tari target supply](#15-billion-tari-target-supply)
  - [Discussion](#discussion)
    - [Low fees growth](#low-fees-growth)
    - [High fees growth](#high-fees-growth)
    - [Unstable fee revenue](#unstable-fee-revenue)
    - [Slower growth with tapering fees](#slower-growth-with-tapering-fees)
    - [Strong growth with tapering fees](#strong-growth-with-tapering-fees)
  - [Conclusions](#conclusions)

## Summary

TariThrottle is a simple process controller designed to modulate the layer two burn rate in order to achieve two 
goals:

* Primarily, keep the emission and burn rate roughly balanced (ensuring the long-term sustainability of Tari), and
* Secondarily, to maintain the total circulating supply at a target value (satisfying an implicit assumption in 
  cryptocurrencies that token supplies are finite).

A proof-of-concept controller has been implemented and tested in a simulation environment ([repository]). As the 
results below attest, the controller logic is sufficient to achieve these goals, even under highly volatile layer 
two fee conditions. 

However, the controller achieves the goals at the expense of a rapidly changing layer two burn rate, which may be 
detrimental to the sustainability of validator nodes. 

At the risk of the tail wagging the dog, the primary conclusion of this study is that the TariThrottle controller 
should likely _not_ aim to maintain a supply target, but instead to ensure a sustainable layer two ecosystem, to 
whit:

* maintain a constant demand gradient so that under normal circumstances there is _always_ a demand for new Tari and 
  thus Minotari are constantly being burnt to satisfy this demand,
* marginal Validator Nodes are able to operate at or near break-even rates, while maintaining a healthy reserve of 
  capacity for surge demand, 
* minimum transaction fees remain below $0.01 in today's money, and 
* the supply of Minotari is sustainable over the long-term.

Therefore, the conclusion of this study is not to abandon the original targets of the TariThrottle completely, 
but to adjust the priority of the primary goal (a sustainable long-term balance), and make it subservient to the 
primary goal of ensuring a constant demand gradient.

A modified Tari throttle model that seeks to achieve these aims is outside of the scope of this RFC and is left for 
a follow-up study.

## PID controllers

TariThrottle is based on a simple
[PID controller](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller) design.

PID controllers are a type of control system that uses feedback to maintain a system in a desired state.  They are 
widely used in industrial control systems.

The PID controller has three components:
* Proportional: This component is proportional to the error between the setpoint and the current value.  It is
  the primary component of the controller and is used to drive the system towards the setpoint.
* Integral: This component is proportional to the integral of the error over time.  It is used to eliminate
  steady-state error.
* Derivative: This component is proportional to the rate of change of the error.  It is used to reduce overshoot
  and oscillation.

## Tari throttle

The `burn-sim` [repository] was used to generate the results in this exploratory study.

The primary module in the repository is the `TariThrottle` struct.

This struct holds the following data:

* The [controller parameters](#controller-parameters),
* The output variable, `burn_rate`. The burn rate is defined as the fraction of fees collected on the layer 2 that 
  are burnt as exhaust (see the [turbine model]), and
* The three functions that describe how the controller responds to the input variables.

## Controller parameters

The controller parameters are used to tune the controller behaviour. They give operators the ability to fine-tune 
the behaviour of the controller without having to change the underlying code.

Specifically, the controller parameters are:

* `kp`: determines the weight of the net burn component of the controller.  The net burn component is the difference
  between the emission and the current rate of L2 token burn. When emission equals burn, the total supply of Tari
  will remain constant.
* `ki`: determines the weight of the integral component of the controller.  This is calculated as the difference
  between the current total supply and the target supply. If the total circulating supply is at the target value, 
  then this term will be zero.
* `kd`: determines the weight of the derivative component of the controller.  This is currently not used, since the
  controller is able to adequately control supply with just the proportional and integral terms.
* `target_supply`: the target circulating supply of Tari.
* `trigger_at`: the block height at which the controller logic becomes active.
* `max`: the maximum burn rate that the controller will allow.
* `min`: the minimum burn rate that the controller will allow. The maximum and minimum are important parameters to 
  prevent extreme burn rates that could be detrimental to the sustainability of the network.

## Controller inputs
        
The controller operates over `periods`. A period is the number of blocks over which the controller will operate 
without being able to change the burn rate. In practice, this is determined by the epoch length of the Layer two.  

The total quantity of fees collected across the entire network is only known at the end of every epoch. This is a 
key input into the controller, and therefore we are limited to updating the burn rate at the end of each epoch as well.

For this study, the period length is set to 720 blocks, or roughly one day.
                              
### Fee models
Since we don't know what the Tari fees will be in the future, we can only carry out simulations based on various 
_scenarios_ of fee growth. For example, we can model a low fee environment, an exponential fee growth environment, a 
highly volatile fee environment, and so on. 

In this study, we looked at the following fee models:

* `Sigmoidal`: a sigmoidal growth model, which looks like an exponential growth model initially, but then levels off 
  as the fees approach a maximum value. This is the most likely pattern to appear in practice, since it incorporates 
  the idea that as fees become very high, the minimum transaction fee can be reduced so that total fee revenue 
  grows sustainably, even as the network usage (in terms of transactions per second) continues to grow.
* `Exponential`: a simple exponential growth model. This model assumes a constant annual growth rate in network fees.
* `Sinusoidal`: a highly volatile fee environment, where the fees oscillate between a minimum and maximum value. This 
  is the not likely scenario to appear in practice, but it is useful to test the robustness of the controller 
  logic.

### Emission model

The second input to the controller is the number of tokens emitted over the preceding period. This is straightforward 
to model, since the emission curve is known _a priori_. The currently proposed Minotari mainnet emission curve 
parameters were used to generate the emission inputs for this study, including a 30% premine and a 1% tail emission 
inflation rate.

### Miscellaneous parameters

The `trigger_at` parameter was generally set to start the controller after the first year of operation, when we 
expect the layer two to go live on mainnet.

The `target_supply` parameter was set to 15, 18 and 21 billion Tari to determine the effect of different supply 
targets.

The `initital_value`was set to `min` to allow the circulating supply to approach the target supply as quickly as 
possible.

The `min` and `max` parameters were set to 5% and 50% fee burn rates respectively.

THe `period` was set to 720 blocks, or roughly one day. The epoch length for Tari has not been finalised yet, but it 
should not be wildly different from this value.

### Integer-based division

Typical PID controllers use floating-point math in their control algorithms. However, the TariThrottle controller 
will be run on a distributed set of machines that may be operating under different models for floating-point 
operations, since the IEEE leaves some aspects of floating-point math 
[unspecified](https://randomascii.wordpress.com/2013/07/16/floating-point-determinism/).

This is not permissible in Tari, and therefore an integer-based approach to control is implemented in the `tari-sim` 
[repository].

Simply put, this involves scaling the error values by a constant to convert them to integers of roughly the same 
order of magnitude, (via `error_i_scale`). The control parameters are also integers, expressed as "parts per million" 
so that a value of 500,000 corresponds to 0.5 for example, while 10 corresponds to 0.00001. This give sufficient
granularity to the control parameters to allow for effective tuning of the controller.


## The simulations
                         
### Controller parameters

A preliminary batch of simulations was run to set the controller parameters to values that roughly achieve the stated 
goal above. These simulations are omitted for brevity, but the result indicate that the following parameter range 
provide a good balance between robustness and responsiveness of the Tari throttle:

* `kp` = 0.0001 - 0.0003. A value closer to 100ppm gives more weight to achieving the target supply, while a value 
  closer to 300ppm gives more weight to the net burn rate.  The simulations run scenarios for a `ki` values of 100,
  200 and 300 ppm.
* `ki` = -0.00035. This value is negative, since if we're above the target supply, we must increase the burn rate, 
  and vice versa.
* `kd` = 0. This value is not used in the current implementation, since the controller is able to adequately control 
  supply with just the proportional and integral terms.

### Target supply

The simulations were run for target circulating supplies of 15, 18 and 21 billion Tari. 

Target values other than the quoted "initial supply" of 21 billion Tari were used, because it is actually quite 
difficult to achieve the 21 billion target in practice. This is because the earliest it is possible to even reach 
this value (at ZERO burn rate) is after about 15 years. 

This offers very little flexibility to the control logic, and could easily introduce instability into the layer two 
ecosystem.

For this reason, simulations were run with alternative target supplies of 15 and 18 billion Tari to compare how the 
controller reacts with more scope to adjust the burn rate.

### Fee models

Five different fee models scenarios were employed:

1. "Strong growth, tapering fees". This scenario describes strong fee growth in the network, reaching 5,000,000 
   Tari per day around 6 years after the launch of the layer 2. At a minimum fee of 0.01 Tari per transaction, this 
   corresponds to a network activity of around 5,800 tx/s, or roughly double the average activity of the Visa 
   network. The 'tapering fees' part of the scenario refers to the fact that this scenario does allow 
   the network to continue to grow, but that the total fee revenue grows at a modest 100,000 XTR/d per year. This 
   would be achieved by reducing the minimum transaction fee. This also matches the expectation that the price of 
   XMR increases with network activity, and so reducing the transaction fee maintains sub-penny transaction fees in 
   nominal USD terms.
2. "Slower growth, tapering fees". This scenario is identical to "Strong growth, tapering fees", but with a lower 
   maximum fee rate of 1,000,000 Tari per day.
3. "25% annual fee growth". This scenario describes a network that grows at 25% per year, without 
   compensating by decreasing the minimum transaction fee.
4. "10% annual fee growth". This scenario describes a network that grows at 10% per year, without 
   compensating by decreasing the minimum transaction fee.
5. "Unstable fees, low frequency". This scenario describes a network that has volatile fees, 
   oscillating between 0 and 500,000 XTR per day over a 90-day period. This is not a realistic scenario, but it
    is useful to test the robustness of the controller logic.
6. "Unstable fees, high frequency". This scenario describes a network that has extremely volatile fees, 
   oscillating between 0 and 1,000,000 XTR per day over a 14-day period. This is not a very realistic scenario, but it
    is useful to test the robustness of the controller logic under extremely volatile conditions.

## Results

A simulation was run for every combination of the variations in `kp`, `target_supply`, and `fee_model`. The results
of all 50+ simulation runs are given below.

### 21 billion Tari target supply

All of the following simulations were run with a target supply of 21 billion Tari.

### 10% annual fee growth (low fee scenario)

![10% annual fee growth](/assets/rfc-323/throttle_21000000000.000000%20T_10%25%20annual%20fee%20growth_0.000100.svg)

Figure 1. Supply target: 21 billion XTR. 10% annual fee growth fee model. `kp` = 0.000100.

![10% annual fee growth](/assets/rfc-323/throttle_21000000000.000000%20T_10%25%20annual%20fee%20growth_0.000200.svg)

Figure 2. Supply target: 21 billion XTR. 10% annual fee growth fee model. `kp` = 0.000200.

![10% annual fee growth](/assets/rfc-323/throttle_21000000000.000000%20T_10%25%20annual%20fee%20growth_0.000300.svg)

Figure 3. Supply target: 21 billion XTR. 10% annual fee growth fee model. `kp` = 0.000300.

### 10% annual fee growth (high fee scenario)

![25% annual fee growth](/assets/rfc-323/throttle_21000000000.000000%20T_25%25%20annual%20fee%20growth_0.000100.svg)

Figure 4. Supply target: 21 billion XTR. 25% annual fee growth fee model. `kp` = 0.000100.

![25% annual fee growth](/assets/rfc-323/throttle_21000000000.000000%20T_25%25%20annual%20fee%20growth_0.000300.svg)

Figure 5. Supply target: 21 billion XTR. 25% annual fee growth fee model. `kp` = 0.000300.

### Slower growth, tapering fees

![Slower growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 6. Supply target: 21 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000100.

![Slower growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 7. Supply target: 21 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000200.

![Slower growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 8. Supply target: 21 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000300.

### Strong growth, tapering fees

![Strong growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 9. Supply target: 21 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000100.

![Strong growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 10. Supply target: 21 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000200.

![Strong growth, tapering fees](/assets/rfc-323/throttle_21000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 11. Supply target: 21 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000300.

### Unstable fees, high frequency

![Unstable fees, high frequency](/assets/rfc-323/throttle_21000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000100.svg)

Figure 12. Supply target: 21 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000100.

![Unstable fees, high frequency](/assets/rfc-323/throttle_21000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000300.svg)

Figure 13. Supply target: 21 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000300.

### Unstable fees, low frequency

![Unstable fees, low frequency](/assets/rfc-323/throttle_21000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000100.svg)

Figure 14. Supply target: 21 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000100.

![Unstable fees, low frequency](/assets/rfc-323/throttle_21000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000200.svg)

Figure 15. Supply target: 21 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000200.

![Unstable fees, low frequency](/assets/rfc-323/throttle_21000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000300.svg)

Figure 16. Supply target: 21 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000300.

### 18 billion Tari target supply

All of the following simulations were run with a target supply of 18 billion Tari.

### 10% annual fee growth (low fee scenario)

![10% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_10%25%20annual%20fee%20growth_0.000100.svg)

Figure 17. Supply target: 18 billion XTR. 10% annual fee growth fee model. `kp` = 0.000100.

![10% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_10%25%20annual%20fee%20growth_0.000200.svg)

Figure 18. Supply target: 18 billion XTR. 10% annual fee growth fee model. `kp` = 0.000200.

![10% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_10%25%20annual%20fee%20growth_0.000300.svg)

Figure 19. Supply target: 18 billion XTR. 10% annual fee growth fee model. `kp` = 0.000300.

### 10% annual fee growth (high fee scenario)

![25% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_25%25%20annual%20fee%20growth_0.000100.svg)

Figure 20. Supply target: 18 billion XTR. 25% annual fee growth fee model. `kp` = 0.000100.

![25% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_25%25%20annual%20fee%20growth_0.000200.svg)

Figure 21. Supply target: 18 billion XTR. 25% annual fee growth fee model. `kp` = 0.000200.

![25% annual fee growth](/assets/rfc-323/throttle_18000000000.000000%20T_25%25%20annual%20fee%20growth_0.000300.svg)

Figure 22. Supply target: 18 billion XTR. 25% annual fee growth fee model. `kp` = 0.000300.

### Slower growth, tapering fees

![Slower growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 23. Supply target: 18 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000100.

![Slower growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 24. Supply target: 18 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000200.

![Slower growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 25. Supply target: 18 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000300.

### Strong growth, tapering fees

![Strong growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 26. Supply target: 18 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000100.

![Strong growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 27. Supply target: 18 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000200.

![Strong growth, tapering fees](/assets/rfc-323/throttle_18000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 28. Supply target: 18 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000300.

### Unstable fees, high frequency

![Unstable fees, high frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000100.svg)

Figure 29. Supply target: 18 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000100.

![Unstable fees, high frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000200.svg)

Figure 30. Supply target: 18 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000200.

![Unstable fees, high frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000300.svg)

Figure 31. Supply target: 18 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000300.

### Unstable fees, low frequency

![Unstable fees, low frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000100.svg)

Figure 32. Supply target: 18 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000100.

![Unstable fees, low frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000200.svg)

Figure 33. Supply target: 18 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000200.

![Unstable fees, low frequency](/assets/rfc-323/throttle_18000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000300.svg)

Figure 34. Supply target: 18 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000300.

### 15 billion Tari target supply

All of the following simulations were run with a target supply of 15 billion Tari.

### 10% annual fee growth (low fee scenario)

![10% annual fee growth](/assets/rfc-323/throttle_15000000000.000000%20T_10%25%20annual%20fee%20growth_0.000100.svg)

Figure 35. Supply target: 15 billion XTR. 10% annual fee growth fee model. `kp` = 0.000100.

![10% annual fee growth](/assets/rfc-323/throttle_15000000000.000000%20T_10%25%20annual%20fee%20growth_0.000200.svg)

Figure 36. Supply target: 15 billion XTR. 10% annual fee growth fee model. `kp` = 0.000200.

![10% annual fee growth](/assets/rfc-323/throttle_15000000000.000000%20T_10%25%20annual%20fee%20growth_0.000300.svg)

Figure 37. Supply target: 15 billion XTR. 10% annual fee growth fee model. `kp` = 0.000300.

### 10% annual fee growth (high fee scenario)

![25% annual fee growth](/assets/rfc-323/throttle_15000000000.000000%20T_25%25%20annual%20fee%20growth_0.000100.svg)

Figure 38. Supply target: 15 billion XTR. 25% annual fee growth fee model. `kp` = 0.000100.

![25% annual fee growth](/assets/rfc-323/throttle_15000000000.000000%20T_25%25%20annual%20fee%20growth_0.000300.svg)

Figure 39. Supply target: 15 billion XTR. 25% annual fee growth fee model. `kp` = 0.000300.

### Slower growth, tapering fees

![Slower growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 40. Supply target: 15 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000100.

![Slower growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 41. Supply target: 15 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000200.

![Slower growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Slower%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 42. Supply target: 15 billion XTR. Slower growth, tapering fees fee model. `kp` = 0.000300.

### Strong growth, tapering fees

![Strong growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000100.svg)

Figure 43. Supply target: 15 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000100.

![Strong growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000200.svg)

Figure 44. Supply target: 15 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000200.

![Strong growth, tapering fees](/assets/rfc-323/throttle_15000000000.000000%20T_Strong%20growth%2C%20tapering%20fees_0.000300.svg)

Figure 45. Supply target: 15 billion XTR. Strong growth, tapering fees fee model. `kp` = 0.000300.

### Unstable fees, high frequency

![Unstable fees, high frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000100.svg)

Figure 46. Supply target: 15 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000100.

![Unstable fees, high frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000200.svg)

Figure 47. Supply target: 15 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000200.

![Unstable fees, high frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20high%20frequency_0.000300.svg)

Figure 48. Supply target: 15 billion XTR. Unstable fees, high frequency fee model. `kp` = 0.000300.

### Unstable fees, low frequency

![Unstable fees, low frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000100.svg)

Figure 49. Supply target: 15 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000100.

![Unstable fees, low frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000200.svg)

Figure 50. Supply target: 15 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000200.

![Unstable fees, low frequency](/assets/rfc-323/throttle_15000000000.000000%20T_Unstable%20fees%2C%20low%20frequency_0.000300.svg)

Figure 51. Supply target: 15 billion XTR. Unstable fees, low frequency fee model. `kp` = 0.000300.

## Discussion

### Low fees growth

Figures 1-3, 17-19, and 35-37 show the results of the simulations for the 10% annual fee growth scenario. None of
these scenarios produce sufficient fees to reduce the circulating supply to the target within the 33-year simulation
timeframe. The common feature of these simulations is that the controller hits the maximum burn rate of 50% and stays
there for the remainder of the simulation. Increasing the `max` burn rate to a higher value might succeed in achieving
the target supply, but this might mean that validator nodes cannot operate at break-even rates.

Ultimately a poor growth in fee revenue -- in this model, never exceeding 30 tx/s over 30 years of operation, 
represents a failure mode, not just of the controller, but of the network as a whole, since Tari adoption has never 
taken off, and there's nothing a controller can do to fix that.

### High fees growth

At the other end of the spectrum, if Tari achieves runaway success, _and the minimum transaction fee is never 
reduced to compensate_, then the controller will be able to maintain the target circulating supply of Tari during the 
33-year simulation timeframe. 

This is shown in Figures 4 and 5.
In Figures 20-21, and 38-39, the tapering of supply only begins towards the end of the simulation period.

However, it should be noted that indefinite fee growth is not sustainable from a token supply point of view, _unless 
the inflation rate of the emission curve is increased to compensate_. This is not evident in these charts, but if 
the simulation were to continue for several more years, the fee growth would eventually set the burn rate to its 
minimum of 5% and the total circulating supply would eventually fall to zero.

So, a few things to note about this scenario:

* It's very unlikely to happen in practice that 25% network growth is achieved consistently for 30-40 years. 
  Therefore, this scenario is largely illustrative of the controller's ability to handle extreme fee growth. And 
  within fairly wide limits, we demonstrate that the throttle manages this very well.
* The minimum burn rate of 5% could be reduced further without negatively impacting validator node revenues (in fact 
  reducing the burn rate is beneficial for validator nodes).
* In practice, it is not unreasonable to expect that the price of Tari in nominal USD terms would increase as the 
  network usage increases, and so the minimum transaction fee would have to be reduced to maintain sub-penny 
  transaction fees -- keeping the Tari network cheap to use for the average user. This entails that the total fee 
  revenue would taper off, even as the network continues to grow. The Sigmoidal [fee model](#fee-models) is a better 
  representation of this eventuality.

### Unstable fee revenue

Figures 12-16, 29-34, and 46-51 show the controller's response to various scenarios under which the fee revenue is 
oscillating wildly. Under some scenarios, notably Figures 12 and 13, the target supply cannot be achieved even with the 
controller at minimum burn rates. This is symptomatic of the point made previously that a target supply of 21 
billion offers very little room for the controller to maneuver. 

In Figures 14-16, 32-34 and 46-51, the controller is able to maintain the supply target with very 
small amounts of oscillation, by synchronising the fee oscillation with an oscillating burn rate.

While this demonstrates that the throttle is able to achieve its design goals, one must question whether the
wildly oscillating burn rates needed to achieve these goals are healthy for the network. 

To maintain a constant 
supply, as the fees increase, the burn rate _decreases_ to try and match the emission (which is roughly constant 
over the oscillation period). From a validator node perspective, the portion of fees paid to them increases as fees 
increase. That sounds great, but when fees decrease, they receive a _smaller_ percentage of the shrinking pool of 
fees, and so they are doubly disadvantaged. Marginal validator nodes will be hit twice as hard, and be forced off 
the network due to unfavourable economics, reducing the overall network capacity. When fees pick up again, 
additional capacity will come online, but the lag between the increased usage and capacity could well lead to a 
degradation in the user experience.

### Slower growth with tapering fees

The previous scenarios provide valuable insights into the controller's ability to handle extremes in network demand 
in terms of fee growth patterns. However, these scenarios are not likely to play out in reality, at least not for 
extended multi-decade periods.

The scenarios represented in the "tapering fees" series are more indicative of the long-term macro behaviour of the 
Tari fee growth. The two specific scenarios in this category reflect an initial exponential growth period followed 
by a more sustainable linear fee growth rate, corresponding to reducing the minimum transaction fee over time while the 
network continues to grow.

In the "Slower growth" variant, the fee revenue grows from zero to 1,000,000 XTR per day over 5 years, and then 
increases by 100,000 XTR/d per year after that.

Figures 6-8 are all quite similar. These all use 21 billion XTR as a target and differ only in the weighting applied 
to trying to achieve the target supply, vs. balancing burn rate and emission. 

The slow growth rate allows the supply to reach the target value of 21 billion in about 20 years, at which point the 
burn rate adjusts slightly to between 15% and 20% to maintain the target supply.

Figures 23-25 shows what happens with a target supply of 18 billion XTR. Here the target is reached much sooner, 
after around 9 years of mainnet operation. In these simulations, the effect of the controller is more pronounced, 
since an additional 3 billion XTR must be burned to maintain the target supply compared to the scenario with a 21 
billion XTR target.

Figures 40-42 show the scenario with a target supply of 15 billion XTR. The lower target requires several years of 
`max` burn with the supply overshooting the target before being pulled back onto the target. 

### Strong growth with tapering fees

The "Strong growth" variant of the tapering fees scenario assumes a much higher adoption rate, with fees growing to 
5,000,000 XTR/d over 3 years, and then growing by 100,000 XTR/d per year after that.

Figures 9-11 show the results of the simulations with a target supply of 21 billion XTR. Here the controller cannot 
meet the target supply since it would require a burn rate of under 5%. This is illustrated by the purple lines not 
moving off the `min` burn rate level for the entirety of the simulation period.

Figures 26-28 show the results of the simulations with a target supply of 18 billion XTR. Here the controller is 
able to meet the target supply, but only just. The burn rate rises only slightly above the `min` burn rate level
and is essentially "just holding on".

Finally, Figures 43-45 tell a similar but slightly more exaggerated version of the story.

In practice, if the strong growth scenario were to play out, several interventions would be necessary to give the 
controller room to maneuver. These would include reducing the `min` burn rate, and reucing the minimum transaction
fee to maintain sub-penny transaction fees.

## Conclusions

This study shows that the TariThrottle controller is able to maintain a dual mandate of maintaining a target 
circulating supply of Tari as well as a steady net burn rate over a wide range of fee growth scenarios.

Some scenarios are unlikely to play out as described in practice. But they give valuable insights into how the 
controller would respond in stressful situations, short-term shocks and deviations, and offer an indication of the 
robustness of the controller algorithm.

The most common instances of the controller failing to achieve its target was when the fee growth was so low that 
the maximum burn rate was less than the tail emission. 

Under these conditions, the tokens that are emitted exceed the maximum that can be burnt. In practice, this 
mode represents a failure of the Tari ecosystem as a whole and a limiting controller would not be the greatest 
concern at this point.

However, the biggest conclusion to draw from this study is that the stated dual mandate is ill-advised.

There are several scenarios where maintaining a target supply is detrimental to the sustainability of 
validator nodes and to the ability of the network to provide surge capacity during sudden high periods of network demand.

The oscillating fee revenue scenarios are particularly illuminating, since they demonstrate that as fees are falling,
the controller _increases_ the burn rate to try and match the emission. This results in a double loss of revenue for
validator nodes, since they're receiving a smaller slice of a shrinking pie. This will force them offline sooner 
than they otherwise would have. When fees recover, it may take some time for those nodes to come back online, and as 
a result, users experience lags in the network.

Many scenarios illustrate that the controller can effectively do nothing for between 5 and 15 years while it waits 
for the circulating supply to reach its target. This effectively means that the controller is powerless to do 
anything to help with validator node profitability or excessive network fees during this period, because its 
control mandate is misaligned with the health of the network.

It's clear that some additional studies are needed. In particular, we need to identify and maximise for the health of 
the network, rather than a fixed supply target. Sometimes these two goals will be aligned, but it behooves us to 
remember which variables represent the tail, and which represent the dog.

As a minimum, the following factors should be considered, since they directly relate to the health of the ecosystem, 
in that they incentivise validation nodes to remain online and keep the Tari network affordable: 

* There must be a **near-constant** driving force to burn Minotari and redeem them as Tari, similar to how a kite 
  must always have tension in the string for the operator to be able to fly the kite. Brief periods of slack, 
  corresponding to the price of Tari dropping below 1 XTR, are acceptable, since the operator can draw the slack 
  in to regain tension (by continuing to burn Tari with no new redemptions), but if the situation persists, the kite 
  will crash. 
* Marginal validator nodes must be able to operate at break-even rates at approximately 50% utilisation. Marginal 
  VNs are those that can spin up very quickly to meet surge demand, but are more expensive to run because of this. 
  Typically, VNs running on spot EC2 instances fall into this category.
* Long-term validator nodes must be able to operate at break-even rates at approximately 20% utilisation. These 
  nodes are those that are always online, and are typically running on reserved EC2 instances or even cheaper server 
  infrastructure. The 20% value means that they will stay online all the time, whilst keeping 5x surge capacity 
  in reserve.
* The supply of Minotari never goes to zero.
* The minimum transaction fee should be under 1c in USD terms.

A controller model that incorporates these target conditions will be the subject of future work.








[repository]: https://github.com/tari-project/burn-sim "TariThrottle simulation repository"
[turbine model]: /RFC-0320_TurbineModel.html "Turbine model"
