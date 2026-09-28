# SUN Holdings Live Portal — guide for the Seamless FM team

The portal is what Sun Holdings sees, live, at any time. Anything you save shows on their screen within about 15 seconds.

## Signing in

- Open the portal address. It opens read-only, as the client sees it, with a green **Live** light.
- Click **Seamless FM sign-in** in the top bar and enter your name and the Seamless FM admin code (ask Jordan for it). You only do this once per browser.
- The top bar then shows your name and a switch between two views:
  - **SFM admin** is your editing view.
  - **Client view** shows exactly what Sun Holdings sees.
- To sign out of editing, click your name in the top bar twice.
- Sun Holdings needs no sign-in: send them the link (and the viewer code, if one has been set up).

## Every week

1. **Upload the tracker.** Go to **Manage** → **Upload tracker** and drop in this week's `SUN Holdings Tracking.xlsx`.
   - The file needs its usual columns. **WO #** and **STATUS** are required.
   - The new data replaces last week's for everyone straight away.
   - **Activity** shows who uploaded it and when.
2. **Check the approvals** (Section 1). Approvals are grouped by who has to sign off, highest authority first:
   - Level 2, $2,000 and over: James (ultimate approval).
   - Level 1, under $2,000: the brand's store WO manager, taken from the **WO MGR** column and checked against that brand's approver list.

   Items with the status "Awaiting Advice" go to level 1. The **Who approves what** cards under the ladder list each brand's approvers and what is waiting on each of them. Click a name to open their items. Watch for these flags:
   - **Not on the list:** the tracker names a WO manager who isn't on that brand's approver list. Confirm who should approve it.
   - **Not confirmed:** the brand has no approver list yet (currently Applebee's, Papa John's, Arby's and Freebirds).
3. **Post updates** (Section 2, **Our updates**). Write the update and pick a type, then click **Post**:

   | Type | Use it for |
   |---|---|
   | Update | General progress |
   | Win / completed | Good news |
   | Heads-up | Delays or risks |
   | We need from you | Decisions or info the client owes us |

   You can link a WO # and pin important posts to the top. Sun Holdings sees the posts as coming from "Seamless FM"; only admins see who wrote each one.
4. **Add notes on work orders.** Open any work order and use the **Seamless FM note** box. The client sees that note on the work order.
   - **Hide from client** removes a work order from their view, e.g. a duplicate or an internal item. You still see it, marked "Hidden".
5. **Preview.** Switch to **Client view** before the meeting to check what they will see.

## Settings (Manage)

- **Chain of command:** each level's title, the approver's name and the dollar limit. A quote goes to level 1 when it is under the limit ($2,000), otherwise to James.
- **Level 1 approvers by brand:** one line per brand. Write the brand as it appears in the STORE column, then the names separated by commas, with any note in brackets, e.g. `Brian DeHart (VP, sometimes)`. Use **Add brand** to add a new one. **Reset to defaults** restores the chain and the three brand lists.
- **What the client sees:**
  - the client name;
  - an optional message shown at the top of the portal;
  - the **BFI window**, 30 days by default;
  - whether to show the non-approval work orders, the full list and our updates.

## Useful to know

- **BFI counter:** the number and value of quotes that have waited longer than the BFI window. The wait is counted from the date the quote was sent, when the notes say so (e.g. "Quote sent on 8/7 - $2,450.77"); otherwise from **REC ON**. Click it to list those quotes.
- **Quote amounts** come from the CLIENT NOTES text ("Quote sent on … - $…"). NTE is shown separately. Keep that note format and the amounts read correctly.
- **Statuses** are grouped automatically:

  | Group | Statuses |
  |---|---|
  | Needs approval | Awaiting Approval, Awaiting Advice, or a note saying approval is pending |
  | On hold | Parts Needed |
  | In progress | Job Scheduled, Needs Proposal, Quote Ready, On Site, Today, Recall, RTN, Approved - Not scheduled |
  | Open | Everything else |

- If the top bar says **Offline**, the page lost its connection; it retries every 15 seconds on its own.
- If a save says editing is locked, click **Seamless FM sign-in** and enter the admin code again (it changes when the code is changed in Vercel).
- To remove all live data, use **Manage → Activity → Remove live data**. It asks you to confirm.
