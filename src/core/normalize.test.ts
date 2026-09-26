import fc from "fast-check";
import { describe, expect, it } from "vitest";
import * as ch from "../../test/chars";
import { normalizePersian } from "./normalize";

const standard = (text: string) => normalizePersian(text);
const search = (text: string) => normalizePersian(text, { mode: "search" });
const fromCodes = (...codes: number[]) => String.fromCharCode(...codes);

const MOHAMMAD_PRESENTATION_FORMS = fromCodes(0xfee3, 0xfea4, 0xfee4, 0xfeaa);
const RIAL_SIGN = fromCodes(0xfdfc);
const ALLAH_LIGATURE = fromCodes(0xfdf2);

describe("normalizePersian: standard mode", () => {
  it("is the default mode", () => {
    const text = `${ch.ARABIC_KAF}${ch.ARABIC_YEH}`;
    expect(normalizePersian(text)).toBe(normalizePersian(text, { mode: "standard" }));
  });

  it("maps Arabic yeh, alef maksura and kaf to Persian yeh and kaf", () => {
    expect(standard(`عل${ch.ARABIC_YEH}`)).toBe(`عل${ch.PERSIAN_YEH}`);
    expect(standard(`موس${ch.ALEF_MAKSURA}`)).toBe(`موس${ch.PERSIAN_YEH}`);
    expect(standard(`${ch.ARABIC_KAF}تاب`)).toBe(`${ch.PERSIAN_KAF}تاب`);
  });

  it("converts Arabic-Indic digits to Persian digits and leaves Latin digits", () => {
    expect(standard(ch.arabicIndic("1404"))).toBe(ch.fa("1404"));
    expect(standard("1404")).toBe("1404");
  });

  it("unifies the encodings of ۀ", () => {
    const expected = `خان${ch.HEH_WITH_YEH_ABOVE}`;
    expect(standard(`خان${ch.HEH}${ch.HAMZA_ABOVE}`)).toBe(expected);
    expect(standard(`خان${ch.AE}${ch.HAMZA_ABOVE}`)).toBe(expected);
    expect(standard(expected)).toBe(expected);
  });

  it("replaces presentation forms with regular letters but keeps word ligatures", () => {
    expect(standard(MOHAMMAD_PRESENTATION_FORMS)).toBe("محمد");
    expect(standard(fromCodes(0xfefb))).toBe(`ل${ch.ALEF}`);
    expect(standard(ALLAH_LIGATURE)).toBe(ALLAH_LIGATURE);
    expect(standard(RIAL_SIGN)).toBe(RIAL_SIGN);
  });

  it("removes byte order marks", () => {
    expect(standard(`${ch.BOM}سلام`)).toBe("سلام");
  });

  it("leaves Latin text alone", () => {
    expect(standard("Hello World 123")).toBe("Hello World 123");
  });

  describe("ZWNJ", () => {
    it("keeps a ZWNJ that stops two letters from joining", () => {
      const text = `م${ch.PERSIAN_YEH}${ch.ZWNJ}روم`;
      expect(standard(text)).toBe(text);
    });

    it("collapses repeated ZWNJs", () => {
      expect(standard(`م${ch.PERSIAN_YEH}${ch.ZWNJ}${ch.ZWNJ}${ch.ZWNJ}روم`)).toBe(
        `م${ch.PERSIAN_YEH}${ch.ZWNJ}روم`,
      );
    });

    it("drops a ZWNJ next to a space", () => {
      expect(standard(`م${ch.PERSIAN_YEH}${ch.ZWNJ} روم`)).toBe(`م${ch.PERSIAN_YEH} روم`);
      expect(standard(`م${ch.PERSIAN_YEH} ${ch.ZWNJ}روم`)).toBe(`م${ch.PERSIAN_YEH} روم`);
    });

    it("drops a ZWNJ at the start or end of the text", () => {
      expect(standard(`${ch.ZWNJ}سلام${ch.ZWNJ}`)).toBe("سلام");
    });

    it("drops a ZWNJ after a letter that never joins forward", () => {
      expect(standard(`آرزو${ch.ZWNJ}ها`)).toBe("آرزوها");
    });

    it("drops a ZWNJ before a character that can't join", () => {
      expect(standard(`بت${ch.ZWNJ}.`)).toBe("بت.");
      expect(standard(`ب${ch.ZWNJ}A`)).toBe("بA");
    });

    it("looks through combining marks on either side", () => {
      const markBefore = `ب${ch.KASRA}${ch.ZWNJ}ها`;
      const markAfter = `ب${ch.ZWNJ}${ch.KASRA}ها`;
      expect(standard(markBefore)).toBe(markBefore);
      expect(standard(markAfter)).toBe(markAfter);
      expect(standard(`${ch.KASRA}${ch.ZWNJ}ب`)).toBe(`${ch.KASRA}ب`);
    });
  });

  describe("whitespace", () => {
    it("collapses spaces, tabs and no-break spaces into one space", () => {
      expect(standard(`سلام  \t${ch.NBSP} دنیا`)).toBe("سلام دنیا");
    });

    it("trims the text", () => {
      expect(standard("  سلام  ")).toBe("سلام");
    });

    it("keeps line breaks, unifies their encodings and trims around them", () => {
      const text = `اول  \r\n  دوم\rسوم${ch.LINE_SEPARATOR}چهارم${ch.PARAGRAPH_SEPARATOR}پنجم\n\nششم`;
      expect(standard(text)).toBe("اول\nدوم\nسوم\nچهارم\nپنجم\n\nششم");
    });
  });
});

describe("normalizePersian: search mode", () => {
  it("removes ZWNJ so both spellings match", () => {
    const joined = `م${ch.PERSIAN_YEH}روم`;
    expect(search(`م${ch.PERSIAN_YEH}${ch.ZWNJ}روم`)).toBe(joined);
    expect(search(joined)).toBe(joined);
  });

  it("folds letter variants", () => {
    const cases: Array<[string, string]> = [
      [`خان${ch.HEH_WITH_YEH_ABOVE}`, `خان${ch.HEH}`],
      [`خان${ch.HEH}${ch.HAMZA_ABOVE}`, `خان${ch.HEH}`],
      [`خان${ch.AE}`, `خان${ch.HEH}`],
      [`رحم${ch.TEH_MARBUTA}`, `رحم${ch.HEH}`],
      [`${ch.ALEF_MADDA}ب`, `${ch.ALEF}ب`],
      [`${ch.ALEF_HAMZA_ABOVE}حمد`, `${ch.ALEF}حمد`],
      [`${ch.ALEF_HAMZA_BELOW}تمام`, `${ch.ALEF}تمام`],
      [`${ch.ALEF_WASLA}لف`, `${ch.ALEF}لف`],
      [`مس${ch.YEH_HAMZA}ول`, `مس${ch.PERSIAN_YEH}ول`],
      [`م${ch.WAW_HAMZA}من`, `م${ch.WAW}من`],
      [`عل${ch.ARABIC_YEH}`, `عل${ch.PERSIAN_YEH}`],
      [`موس${ch.ALEF_MAKSURA}`, `موس${ch.PERSIAN_YEH}`],
      [`${ch.ARABIC_KAF}تاب`, `${ch.PERSIAN_KAF}تاب`],
    ];
    for (const [input, expected] of cases) expect(search(input)).toBe(expected);
  });

  it("strips diacritics and tatweel", () => {
    expect(search(`ب${ch.KASRA}ت`)).toBe("بت");
    expect(search(`ب${ch.TATWEEL}${ch.TATWEEL}زرگ`)).toBe("بزرگ");
  });

  it("strips invisible formatting characters", () => {
    const text = `${ch.LRM}سلام${ch.RLM}${ch.ALM}${ch.ZWJ}${ch.ZWSP}${ch.SOFT_HYPHEN}${ch.BOM}${ch.LRI}x${ch.PDI}${ch.RLE}y${ch.PDF}`;
    expect(search(text)).toBe("سلامxy");
  });

  it("converts all digits to Latin", () => {
    expect(search(`${ch.fa("1404")} ${ch.arabicIndic("1404")} 1404`)).toBe("1404 1404 1404");
  });

  it("lowercases Latin text and drops accents", () => {
    expect(search("React Café")).toBe("react cafe");
  });

  it("collapses all whitespace, line breaks included", () => {
    expect(search(" سلام\n\n  دنیا\t! ")).toBe("سلام دنیا !");
  });

  it("folds presentation forms and ligatures", () => {
    expect(search(MOHAMMAD_PRESENTATION_FORMS)).toBe("محمد");
    expect(search(RIAL_SIGN)).toBe(`ر${ch.PERSIAN_YEH}ال`);
  });
});

describe("normalizePersian properties", () => {
  const pieces = [
    "ب", "ت", "ه", "ر", "و", "ا", "م", "ی", " ", "  ", "\n", "\r\n", "\t", "A", "b", "é", "1",
    ch.ZWNJ, ch.ZWJ, ch.NBSP, ch.BOM, ch.LRM, ch.KASRA, ch.HAMZA_ABOVE, ch.HEH_WITH_YEH_ABOVE,
    ch.TEH_MARBUTA, ch.AE, ch.ARABIC_YEH, ch.ALEF_MAKSURA, ch.ARABIC_KAF, ch.ALEF_MADDA,
    ch.YEH_HAMZA, ch.WAW_HAMZA, ch.ALEF_WASLA, ch.TATWEEL, ch.fa("5"), ch.arabicIndic("7"),
    ch.LINE_SEPARATOR, MOHAMMAD_PRESENTATION_FORMS, RIAL_SIGN, fromCodes(0xfefb),
  ];
  const persianish = fc.array(fc.constantFrom(...pieces), { maxLength: 30 }).map((p) => p.join(""));

  it("standard mode is idempotent", () => {
    fc.assert(fc.property(persianish, (text) => {
      expect(standard(standard(text))).toBe(standard(text));
    }));
  });

  it("search mode is idempotent", () => {
    fc.assert(fc.property(persianish, (text) => {
      expect(search(search(text))).toBe(search(text));
    }));
  });

  it("standard normalization never changes the search key", () => {
    fc.assert(fc.property(persianish, (text) => {
      expect(search(standard(text))).toBe(search(text));
    }));
  });
});
