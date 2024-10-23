/**
 * format ai response to json object.
 * @param {String} responseString
 * @param {String} aiTool
 * @returns {Object}
 */
export function formatAiResponse(aiTool = 'openAi', aiResponse = '{}') {
  const response = aiTool === 'Bard' ? aiResponse.output : aiResponse;
  return typeof response === 'string' ? JSON.parse(response) : response;
}
