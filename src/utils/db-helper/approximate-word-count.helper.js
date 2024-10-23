export async function adjustWordCount(content, targetWordCount, hashTag) {
  const sentences = content.match(/[^.!?]+[.!?]+/g);
  let currentWordCount = 0;
  let adjustedContent = '';

  for (const sentence of sentences) {
    const wordsInSentence = sentence.split(/\s+/);
    if (currentWordCount + wordsInSentence.length <= targetWordCount) {
      currentWordCount += wordsInSentence.length;
      adjustedContent += sentence.trim() + ' ';
    } else {
      adjustedContent += sentence.trim();
      break;
    }
  }

  adjustedContent = adjustedContent.trim();

  // Adjusted regex to include Arabic characters
  const hashtagsRegex = /#[a-zA-Z0-9_\u0600-\u06FF]+/g;
  const hashtagsMatch = content.match(hashtagsRegex);
  const hashtags = hashtagsMatch ? hashtagsMatch.join(' ') : '';

  if (hashTag && hashtags) {
    adjustedContent += '<p> ' + hashtags + '</p>';
  }

  return adjustedContent;
}
