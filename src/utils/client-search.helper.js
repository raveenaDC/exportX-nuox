export async function calculateClientRelevance(client, search) {
  const fullName = `${client.firstName} ${client.lastName}`;
  let relevance = 0;
  if (
    client.brandUrl &&
    client.brandUrl.toLowerCase().includes(search.toLowerCase())
  ) {
    relevance += 2; // Increase relevance if brandUrl matches
  }
  if (
    client.brandName &&
    client.brandName.toLowerCase().includes(search.toLowerCase())
  ) {
    relevance += 2; // Increase relevance if brandName matches
  }
  if (fullName.toLowerCase().includes(search.toLowerCase())) {
    relevance += 1; // Increase relevance if full name matches
  }
  return relevance;
}
