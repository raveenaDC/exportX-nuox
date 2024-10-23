export async function uppercaseFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function lowercaseEachWordFirstLetter(str) {
  const words = str.split(' ');
  const lowercasedWords = await Promise.all(
    words.map(async (word) => {
      return word.toLowerCase();
    })
  );
  return lowercasedWords.join(' ');
}

export async function capitalizeEachWordFirstLetter(str) {
  const words = str.split(' ');
  const capitalizedWords = await Promise.all(
    words.map(async (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
  );
  return capitalizedWords.join(' ');
}
