import cron from "node-cron";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";

export const checkAndFreezeOverdueAccounts = async () => {
  try {
    console.log("⏰ [CRON] Running daily Net 14 trade credit settlement audit...");

    const now = new Date();

    const overdueOrders = await Order.find({
      paymentMethod: 'net_14',
      creditSettled: false,
      dueDate: { $lt: now },
      status: { $ne: 'cancelled' }
    }).select("buyerOrg invoiceNumber dueDate orderTotal");

    const delinquentOrgIds = [
      ...new Set(overdueOrders.map((order) => order.buyerOrg.toString()))
    ];

    if (delinquentOrgIds.length > 0) {
      const freezeResult = await Org.updateMany(
        { _id: { $in: delinquentOrgIds }, "creditProfile.isCreditFrozen": false },
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

    const unfreezeResult = await Org.updateMany(
      {
        _id: { $nin: delinquentOrgIds },
        "creditProfile.isCreditFrozen": true,
        "creditProfile.freezeReason": "Account suspended: Outstanding Net trade invoice past due date."
      },
      { $set: { "creditProfile.isCreditFrozen": false, "creditProfile.freezeReason": null } }
    );
    if (unfreezeResult.modifiedCount > 0) {
      console.log(`🔓 [CRON] Restored trade credit for ${unfreezeResult.modifiedCount} settled account(s).`);
    }

    console.log("✅ [CRON] Daily credit audit completed.");
  } catch (error) {
    console.error("❌ [CRON ERROR] Failed during credit freeze/unfreeze execution:", error);
  }
};

export const reconcileOrgCreditStatus = async (orgId) => {
  try {
    const now = new Date();

    const remainingOverdueOrders = await Order.find({
      buyerOrg: orgId,
      paymentMethod: 'net_14',
      creditSettled: false,
      dueDate: { $lt: now },
      status: { $ne: 'cancelled' }
    });

    if (remainingOverdueOrders.length === 0) {
      await Org.findByIdAndUpdate(orgId, {
        $set: { "creditProfile.isCreditFrozen": false, "creditProfile.freezeReason": null }
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