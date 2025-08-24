import CryptoJS from 'crypto-js';

const SECRET_KEY = 'thulasibloom-secret-key-2024';

export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};