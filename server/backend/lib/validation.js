const RU_LETTERS = /[ёыэъ]/i;
const RU_DOMAINS = /(vk\.com|yandex|rutube|ok\.ru)/i;

function isRussianLike(text = "") {
  const lower = text.toLowerCase();
  return RU_LETTERS.test(lower);
}

function isDisallowedUrl(url = "") {
  return RU_DOMAINS.test(url.toLowerCase());
}

export function validateTrackCandidate({ title = "", url = "" }) {
  if (isDisallowedUrl(url)) return { ok: false, reason: "Заборонене джерело" };
  if (isRussianLike(title))
    return { ok: false, reason: "Заборонений виконавець/назва" };
  return { ok: true };
}
