export function extractResponse(inputStr: string): string {
    try {
        const targetStr1 = RESPONSE_SUBSTRING;
        const targetStr2 = "[GPT]:";
        const escapeRegex = /[-/\\^$*+?.()|[\]{}]/g;
        const escapedSubstring1 = targetStr1.replace(escapeRegex, "\\$&");
        const escapedSubstring2 = targetStr2.replace(escapeRegex, "\\$&");

        const pattern = inputStr.includes(targetStr1) ? escapedSubstring1 : escapedSubstring2;
        const regex = new RegExp(pattern, "g");

        let lastMatch = null;
        let match;

        // Find the last match of targetStr1 or targetStr2, depending on the presence of targetStr1
        while ((match = regex.exec(inputStr)) !== null) {
            lastMatch = match;
        }

        const result = lastMatch
            ? inputStr.substring(lastMatch.index + lastMatch[0].length).trim()
            : inputStr;

        return result;
    } catch (error) {
        console.error("extractResponse: error:", error);
        throw new Error(`extractResponse: error: ${error}`);
    } finally {
        console.log("extractResponse: done");
    }
}
