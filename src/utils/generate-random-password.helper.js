export function generateRandomPassword() {
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialSymbols = '!@#$%&*-_=+?';

  const randomLowercase =
    lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
  const randomUppercase =
    uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  const randomSymbol =
    specialSymbols[Math.floor(Math.random() * specialSymbols.length)];

  const randomChars = Array.from({ length: 3 }, () => {
    const allCharacters =
      lowercaseLetters + uppercaseLetters + numbers + specialSymbols;
    return allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }).join('');

  const password =
    randomLowercase +
    randomUppercase +
    randomNumber +
    randomSymbol +
    randomChars;

  return password;
}
