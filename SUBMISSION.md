# XOrders Build X Submission Checklist

## Live Deployment

| Requirement | Status | Details |
| --- | --- | --- |
| Uniswap v4 Hook contract on X Layer | Complete | `0x461332830E361576D7E0A9F2675FD202Ee49C040` |
| v4 Pool using the hook on X Layer | Complete | Pool id `0x3e86941d6d3a4ae9ea7adb16e510d13d987c164fcd554abbff486b060ec60cb3` |
| X Layer chain id | Complete | `196` |
| Real token pair | Complete | WOKB / USDT0 |
| Real onchain order | Complete | Order `3`, partially triggered and filled |
| Frontend app | Complete | Next.js app in `frontend/` |
| Public repo | Pending | Push this monorepo to GitHub/GitLab |
| Project X account/post | Pending | Create XOrders post tagging `@XLayerOfficial`, `@Uniswap`, and `@flapdotsh` |
| Demo video | Recommended | Record 1-3 minute walkthrough |

## Live Addresses

- XOrdersHook: `0x461332830E361576D7E0A9F2675FD202Ee49C040`
- Hook deploy tx: `0x3bf14f47f01472c4ae201606dbe5bcd2c50c9f7470bfbf258de90df1a759b2db`
- Hook deploy block: `61232213`
- Pool id: `0x3e86941d6d3a4ae9ea7adb16e510d13d987c164fcd554abbff486b060ec60cb3`
- Pool initialize tx: `0xb43465180c209148d299e303b97ad97b36fb7bc2362e998effd61a02e0371d67`
- Liquidity mint tx: `0x4b31b7908c755d82d12090d25e13e1876f02c01a9d4970c77896c55b0aff9782`
- OrderPlaced tx: `0x9a8cd5f08ff7cdb1e6d74c00ad871cae27f718c752ec28f4e66b4740469c26e1`
- Triggering swap tx: `0x204599d4fc2a4b76d2b9be38b90d1402b7fecbd2d4a1b54879a8e974ac85553d`
- OrderFilled tx: `0xc5ce7f58d867312b44646fff91bbeaaa305cbcb940d5b0c3effc98d247e28355`
- Live order id: `3`
- Token0 USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1 WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`

## What Judges Can Verify

1. The hook address has the Uniswap v4 `AFTER_SWAP` permission bit.
2. The WOKB/USDT0 pool key includes the XOrders hook address.
3. `OrderPlaced`, `OrderTriggered`, `OrderFilled`, and `OrderCancelled` events are indexable by the frontend.
4. Users place escrow-backed stop-loss, take-profit, or trailing-stop orders from the app.
5. `afterSwap()` scans the configured pool and marks crossed orders as triggered.

## Remaining Before Submission

1. Record the app showing the order lifecycle and explorer events.
2. Publish the X post and add the public repo URL to the hackathon submission form.
