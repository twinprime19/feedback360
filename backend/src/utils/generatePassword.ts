// Hàm để tạo một chuỗi ngẫu nhiên với độ dài cố định
export const generatePassword = (length: number) => {
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+[]{}|;:',.<>?/~`";

  // Chọn ngẫu nhiên mỗi loại ký tự
  let password = "";
  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Tạo tập hợp tất cả các loại ký tự
  const allChars = upperCase + lowerCase + numbers + specialChars;

  // Thêm ngẫu nhiên length - 2 ký tự từ tập hợp tất cả các loại ký tự
  for (let i = 0; i < length - 2; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Trộn thứ tự các ký tự trong chuỗi
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
};
