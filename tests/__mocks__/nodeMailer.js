export const createTransport = jest.fn(() => ({
  sendMail: jest.fn().mockResolvedValue(true),
}));
