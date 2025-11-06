/**
 * Order Notes Helper
 * Utilities for adding notes to WooCommerce orders
 */

import wcAPI from "@/lib/woocommerce";

/**
 * Add order note to WooCommerce order
 */
export async function addOrderNote(
  orderId: number,
  note: string,
  customerNote: boolean = false
): Promise<boolean> {
  try {
    await wcAPI.post(`/orders/${orderId}/notes`, {
      note: note,
      customer_note: customerNote,
    });
    return true;
  } catch (error: any) {
    console.error(`Error adding note to order ${orderId}:`, error);
    return false;
  }
}

/**
 * Add order status update note
 */
export async function addStatusUpdateNote(
  orderId: number,
  oldStatus: string,
  newStatus: string,
  note?: string
): Promise<boolean> {
  const statusNote = note || `Order status changed from "${oldStatus}" to "${newStatus}"`;
  const fullNote = `[Status Update]\n${statusNote}\nDate: ${new Date().toISOString()}`;
  return await addOrderNote(orderId, fullNote, false);
}

/**
 * Add payment status update note
 * Only payment status goes in notes - other info is in order data section
 */
export async function addPaymentStatusNote(
  orderId: number,
  paymentMethod: string,
  transactionId: string | null,
  status: "success" | "failed",
  details?: string
): Promise<boolean> {
  let note = `Payment Status: ${status === "success" ? "Paid" : "Failed"}`;
  if (transactionId) {
    note += `\nTransaction ID: ${transactionId}`;
  }
  note += `\nPayment Method: ${paymentMethod}`;
  if (details) {
    note += `\n${details}`;
  }
  note += `\nDate: ${new Date().toISOString()}`;
  return await addOrderNote(orderId, note, false);
}

