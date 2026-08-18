import cron from "node-cron";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";

/**
 * 1. Scheduled Background Job: Audits all orders and automatically freezes delinquent accounts
 *    while automatically lifting freezes for accounts that are fully settled.
 */
export const checkAndFreezeOverdueAccounts = async () => {
  try {
    console.log("⏰ [CRON] Running daily Net 14 trade credit settlement audit...");

    const now = new Date();

    // 1. Query all unpaid orders where the due date has lapsed
    const overdueOrders = await Order.find({
      dueDate: { $lt: now },
      status: { $in: ["placed", "invoiced", "delivered"] }
    }).select("buyerOrg invoiceNumber dueDate orderTotal");

    // 2. Extract unique delinquent organization IDs
    const delinquentOrgIds = [
      ...new Set(overdueOrders.map((order) => order.buyerOrg.toString()))
    ];

    // 3. FREEZE LOGIC: Freeze all delinquent orgs that aren't already frozen
    if (delinquentOrgIds.length > 0) {
      const freezeResult = await Org.updateMany(
        {
          _id: { $in: delinquentOrgIds },
          "creditProfile.isCreditFrozen": false
        },
        {
          $set: {
            "creditProfile.isCreditFrozen": true,
            "creditProfile.freezeReason": "Account suspended: Outstanding Net trade invoice past due date."
          }
        }
      );

      if (freezeResult.modifiedCount > 0) {
        console.log(`🔒 [CRON] Successfully frozen ${freezeResult.modifiedCount} delinquent account(s).`);
      }
    }

    // 4. UNFREEZE LOGIC: Unfreeze accounts that were previously frozen but have zero overdue orders left
    const unfreezeResult = await Org.updateMany(
      {
        _id: { $nin: delinquentOrgIds },
        "creditProfile.isCreditFrozen": true,
        "creditProfile.freezeReason": "Account suspended: Outstanding Net trade invoice past due date."
      },
      {
        $set: {
          "creditProfile.isCreditFrozen": false,
          "creditProfile.freezeReason": null
        }
      }
    );

    if (unfreezeResult.modifiedCount > 0) {
      console.log(`🔓 [CRON] Restored trade credit for ${unfreezeResult.modifiedCount} settled account(s).`);
    }

    console.log("✅ [CRON] Daily credit audit completed.");
  } catch (error) {
    console.error("❌ [CRON ERROR] Failed during credit freeze/unfreeze execution:", error);
  }
};

/**
 * 2. Real-Time Reconciler Helper: Call this immediately after an invoice payment is settled in your controller/webhook
 */
export const reconcileOrgCreditStatus = async (orgId) => {
  try {
    const now = new Date();

    // Check if any overdue orders remain unpaid for this organization
    const remainingOverdueOrders = await Order.find({
      buyerOrg: orgId,
      dueDate: { $lt: now },
      status: { $in: ["placed", "invoiced", "delivered"] }
    });

    // If zero overdue orders remain, clear the freeze flag
    if (remainingOverdueOrders.length === 0) {
      await Org.findByIdAndUpdate(orgId, {
        $set: {
          "creditProfile.isCreditFrozen": false,
          "creditProfile.freezeReason": null
        }
      });
      console.log(`🔓 [UNFREEZE] Real-time credit line restored for Org: ${orgId}`);
      return { isCreditFrozen: false };
    }

    return { isCreditFrozen: true, overdueCount: remainingOverdueOrders.length };
  } catch (error) {
    console.error(`❌ [RECONCILE ERROR] Failed to reconcile Org: ${orgId}`, error);
  }
};

/**
 * 3. Schedule Initializer: Runs once every night at 00:05 (5 minutes past midnight)
 */
export const initCreditFreezeJob = () => {
  cron.schedule("5 0 * * *", checkAndFreezeOverdueAccounts);
  console.log("⏳ [CRON INITIALIZED] Daily credit freeze/unfreeze audit running at 00:05 AM.");
};