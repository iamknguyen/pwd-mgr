import CryptoService from './cryptoService';

const testSecret = 'myTotalySecretKey';
const testData = 'bacon';

describe.only('Crypto Service', () => {
  it('should be able to encrypt and decrypt a string', () => {
    const cryptr = new CryptoService(testSecret);
    const encryptedString = cryptr.encrypt(testData);
    const decryptedString = cryptr.decrypt(encryptedString);
    expect(decryptedString).toBe(testData);
  });
});
