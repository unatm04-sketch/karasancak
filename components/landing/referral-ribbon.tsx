import { cookies } from "next/headers";
import { findUserByReferralCode } from "@/lib/queries/members";
import { REFERRAL_COOKIE } from "@/lib/referral";

/** Referans linkiyle gelen ziyaretçiye kimin çağırdığını söyler. */
export async function ReferralRibbon() {
  const code = (await cookies()).get(REFERRAL_COOKIE)?.value;
  if (!code) return null;
  const referrer = await findUserByReferralCode(code);
  if (!referrer) return null;
  return (
    <div className="relative z-40 bg-al px-5 py-2 text-center text-sm font-medium text-bone">
      {referrer.displayName} seni sürüye çağırıyor. Başvurun onaylanırsa ikiniz de kazanırsınız.
    </div>
  );
}
