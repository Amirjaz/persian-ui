import { compactDigits } from "./validators/shared";

/** Identifiers of the banks and credit institutions in {@link IRANIAN_BANKS}. */
export type IranianBankId =
  | "central"
  | "sanat-madan"
  | "mellat"
  | "refah"
  | "maskan"
  | "sepah"
  | "keshavarzi"
  | "melli"
  | "tejarat"
  | "saderat"
  | "tosee-saderat"
  | "post"
  | "tosee-taavon"
  | "tosee"
  | "karafarin"
  | "parsian"
  | "eghtesad-novin"
  | "saman"
  | "pasargad"
  | "sarmayeh"
  | "sina"
  | "mehr-iran"
  | "shahr"
  | "gardeshgari"
  | "dey"
  | "iran-zamin"
  | "resalat"
  | "melal"
  | "middle-east"
  | "iran-venezuela"
  // Merged into another bank; their cards and accounts are served by it.
  | "ansar"
  | "ghavamin"
  | "hekmat"
  | "kosar"
  | "mehr-eqtesad"
  | "noor"
  | "ayandeh";

export interface IranianBankRecord {
  id: IranianBankId;
  /** Persian name, e.g. «بانک ملی ایران». */
  name: string;
  /** First six digits of the bank's cards (Shetab BINs). */
  cardPrefixes: readonly string[];
  /** Three-digit bank codes that follow the check digits in a Sheba number. */
  shebaCodes: readonly string[];
  /** For a merged institution: the bank that now holds its cards and accounts. */
  mergedInto?: IranianBankId;
}

/** A detected bank. */
export interface IranianBank {
  /** The bank that holds the card or account today. */
  id: IranianBankId;
  name: string;
  /**
   * For cards and accounts of a merged institution, the name the user knows
   * (printed on the card), e.g. «بانک انصار» for a card now served by Sepah.
   */
  formerly?: string;
}

const bank = (
  id: IranianBankId,
  name: string,
  cardPrefixes: readonly string[],
  shebaCodes: readonly string[],
  mergedInto?: IranianBankId,
): IranianBankRecord => (mergedInto ? { id, name, cardPrefixes, shebaCodes, mergedInto } : { id, name, cardPrefixes, shebaCodes });

/**
 * Iranian banks and credit institutions with their card prefixes and Sheba
 * codes. There is no official public table of card prefixes: a prefix is listed
 * only when at least two independent sources agree (the pishkhanak.com
 * directory, persian-tools and public gists, checked Sep 2026). Prefixes found
 * in a single source are left out and resolve to `null`, e.g. 604932, 186214,
 * 581874 (Iran–Venezuela) and a second Middle East prefix the sources disagree
 * on. Sheba codes: pishkhanak.com and persian-tools agree on every one.
 *
 * Mergers: Ansar, Ghavamin, Hekmat Iranian, Kosar and Mehr Eqtesad into Sepah
 * (1399); Noor into Melli (Azar 1402); Ayandeh into Melli (Aban 1404).
 */
export const IRANIAN_BANKS: readonly IranianBankRecord[] = [
  bank("central", "بانک مرکزی", ["636795", "636797"], ["010"]),
  bank("sanat-madan", "بانک صنعت و معدن", ["627961"], ["011"]),
  bank("mellat", "بانک ملت", ["610433", "991975"], ["012"]),
  bank("refah", "بانک رفاه کارگران", ["589463"], ["013"]),
  bank("maskan", "بانک مسکن", ["628023"], ["014"]),
  bank("sepah", "بانک سپه", ["589210"], ["015"]),
  bank("keshavarzi", "بانک کشاورزی", ["603770", "639217"], ["016"]),
  bank("melli", "بانک ملی ایران", ["603799", "170019"], ["017"]),
  bank("tejarat", "بانک تجارت", ["627353", "585983"], ["018"]),
  bank("saderat", "بانک صادرات ایران", ["603769", "903769"], ["019"]),
  bank("tosee-saderat", "بانک توسعه صادرات", ["627648", "207177"], ["020"]),
  bank("post", "پست بانک ایران", ["627760"], ["021"]),
  bank("tosee-taavon", "بانک توسعه تعاون", ["502908"], ["022"]),
  bank("tosee", "مؤسسه اعتباری توسعه", ["628157"], ["051"]),
  bank("karafarin", "بانک کارآفرین", ["627488", "502910"], ["053"]),
  bank("parsian", "بانک پارسیان", ["622106", "627884", "639194"], ["054"]),
  bank("eghtesad-novin", "بانک اقتصاد نوین", ["627412"], ["055"]),
  bank("saman", "بانک سامان", ["621986"], ["056"]),
  bank("pasargad", "بانک پاسارگاد", ["502229", "639347"], ["057"]),
  bank("sarmayeh", "بانک سرمایه", ["639607"], ["058"]),
  bank("sina", "بانک سینا", ["639346"], ["059"]),
  bank("mehr-iran", "بانک قرض‌الحسنه مهر ایران", ["606373"], ["060", "090"]),
  bank("shahr", "بانک شهر", ["502806", "504706"], ["061"]),
  bank("gardeshgari", "بانک گردشگری", ["505416", "505426"], ["064"]),
  bank("dey", "بانک دی", ["502938"], ["066"]),
  bank("iran-zamin", "بانک ایران زمین", ["505785"], ["069"]),
  bank("resalat", "بانک قرض‌الحسنه رسالت", ["504172"], ["070"]),
  bank("melal", "مؤسسه اعتباری ملل", ["606256"], ["075"]),
  bank("middle-east", "بانک خاورمیانه", ["585947"], ["078"]),
  bank("iran-venezuela", "بانک ایران و ونزوئلا", [], ["095"]),
  bank("ghavamin", "بانک قوامین", ["639599"], ["052"], "sepah"),
  bank("ayandeh", "بانک آینده", ["636214"], ["062"], "melli"),
  bank("ansar", "بانک انصار", ["627381"], ["063"], "sepah"),
  bank("hekmat", "بانک حکمت ایرانیان", ["636949"], ["065"], "sepah"),
  bank("kosar", "مؤسسه اعتباری کوثر", ["505801"], ["073"], "sepah"),
  bank("mehr-eqtesad", "بانک مهر اقتصاد", ["639370"], ["079"], "sepah"),
  bank("noor", "مؤسسه اعتباری نور", ["507677"], ["080"], "melli"),
];

const BY_ID = new Map(IRANIAN_BANKS.map((record) => [record.id, record]));
const BY_CARD_PREFIX = new Map(IRANIAN_BANKS.flatMap((record) => record.cardPrefixes.map((prefix) => [prefix, record])));
const BY_SHEBA_CODE = new Map(IRANIAN_BANKS.flatMap((record) => record.shebaCodes.map((code) => [code, record])));

function toBank(record: IranianBankRecord | undefined): IranianBank | null {
  if (!record) return null;
  if (!record.mergedInto) return { id: record.id, name: record.name };
  const current = BY_ID.get(record.mergedInto)!;
  return { id: current.id, name: current.name, formerly: record.name };
}

/**
 * The bank that issued a card, from its first six digits. Works on a partial
 * number, so a form can show the bank while the user is still typing.
 *
 * @example getBankFromCardNumber("6037 99") // { id: "melli", name: "بانک ملی ایران" }
 * @returns `null` for unknown prefixes and for fewer than six digits.
 */
export function getBankFromCardNumber(card: string): IranianBank | null {
  return toBank(BY_CARD_PREFIX.get(compactDigits(card).slice(0, 6)));
}

/**
 * The bank that holds a Sheba account, from the three-digit bank code after
 * "IR" and the check digits. Works on a partial number.
 *
 * @example getBankFromSheba("IR06 0170 …") // { id: "melli", name: "بانک ملی ایران" }
 * @returns `null` for unknown codes and for numbers too short to contain one.
 */
export function getBankFromSheba(sheba: string): IranianBank | null {
  const digits = compactDigits(sheba).toUpperCase().replace(/^IR/, "");
  return toBank(BY_SHEBA_CODE.get(digits.slice(2, 5)));
}
