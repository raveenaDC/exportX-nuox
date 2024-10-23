/**
 * get selected content ideas
 * @param {Object} contentIdea
 * @returns {Object} contentIdea
 * format: {
 *   contentEnglish:[ { title: "", content: "" } ],
 *   contentsArabic:[ { title: "", content: "" } ]
 * }
 */
export function filterContentIdeas(contentIdea = {}) {
  if (!contentIdea) throw new Error('contentIdea is required');

  const selectedItems = {
    contentsEnglish: [],
    contentsArabic: [],
  };

  contentIdea.contentEnglish.forEach((item) => {
    if (item.selected) {
      selectedItems.contentsEnglish.push(item);
    }
  });

  contentIdea.contentsArabic.forEach((item) => {
    if (item.selected) {
      selectedItems.contentsArabic.push(item);
    }
  });

  return selectedItems;
}
