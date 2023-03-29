export function extractResponseAfter(inputStr: string): string {
  const targetStr1 = RESPONSE_SUBSTRING;
  const targetStr2 = "[GPT]:";
  const escapeRegex = /[-/\\^$*+?.()|[\]{}]/g;
  const escapedSubstring1 = targetStr1.replace(escapeRegex, "\\$&");
  const escapedSubstring2 = targetStr2.replace(escapeRegex, "\\$&");
  const regex = new RegExp(`${escapedSubstring1}|${escapedSubstring2}`);

  const match = regex.exec(inputStr);
  const result = match
    ? inputStr.substring(match.index + match[0].length).trim()
    : inputStr;

  return result;
}
