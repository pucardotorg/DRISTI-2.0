"use client";

/**
 * Reference lookups the form offers — real public endpoints, no keys:
 *
 *   - IFSC → bank + branch     https://ifsc.razorpay.com/<code>
 *   - PIN  → district + state  https://api.postalpincode.in/pincode/<pin>
 *
 * Both are best-effort: on a network failure the person just types the value. The bar
 * council has no public registry, so advocate names are typed. Engineering swaps these
 * for the court's own services behind the same signatures.
 */

export type IfscResult = { ifsc: string; bank: string; branch: string; city: string; state: string };

const ifscCache = new Map<string, Promise<IfscResult | null>>();

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Bank details for an IFSC, `null` when the code is not known. Throws on network error. */
export function lookupIfsc(code: string): Promise<IfscResult | null> {
  const ifsc = code.trim().toUpperCase();
  if (!IFSC_PATTERN.test(ifsc)) return Promise.resolve(null);
  let p = ifscCache.get(ifsc);
  if (!p) {
    p = fetch(`https://ifsc.razorpay.com/${ifsc}`, { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`IFSC lookup failed (${res.status})`);
        const j = (await res.json()) as Record<string, string>;
        return {
          ifsc,
          bank: j.BANK ?? "",
          branch: j.BRANCH ?? "",
          city: j.CITY ?? "",
          state: titleCase(j.STATE ?? ""),
        };
      })
      .catch((e) => {
        ifscCache.delete(ifsc);
        throw e;
      });
    ifscCache.set(ifsc, p);
  }
  return p;
}

export type PinResult = { pin: string; district: string; state: string; offices: string[] };

const pinCache = new Map<string, Promise<PinResult | null>>();

/** District and state for a 6-digit PIN, `null` when unknown. Throws on network error. */
export function lookupPin(pin: string): Promise<PinResult | null> {
  const p6 = pin.replace(/\D/g, "");
  if (p6.length !== 6) return Promise.resolve(null);
  let p = pinCache.get(p6);
  if (!p) {
    p = fetch(`https://api.postalpincode.in/pincode/${p6}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`PIN lookup failed (${res.status})`);
        const j = (await res.json()) as Array<{
          Status: string;
          PostOffice: Array<{ Name: string; District: string; State: string }> | null;
        }>;
        const first = j?.[0];
        if (!first || first.Status !== "Success" || !first.PostOffice?.length) return null;
        const po = first.PostOffice;
        return {
          pin: p6,
          district: po[0].District,
          state: po[0].State,
          offices: po.map((o) => o.Name),
        };
      })
      .catch((e) => {
        pinCache.delete(p6);
        throw e;
      });
    pinCache.set(p6, p);
  }
  return p;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bAnd\b/g, "and");
}
