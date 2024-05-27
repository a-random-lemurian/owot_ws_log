/*
 * Check strings for invalid surrogate pairs. You can blame Starianna and her
 * spam bots for this entire file. Ugh!
 */
export function anti_starianna(text: string) {
    if (!text) {
        return { text: text, starianna: false }
    }

    let surrogates = /[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
    let starianna = false;
    text = text.replace(surrogates, function (s) {
        if (s.length > 1) {
            return s;
        } else {
            starianna = true;
            return "\ufffd";
        }
    });
    return { text: text, starianna: starianna }
}
