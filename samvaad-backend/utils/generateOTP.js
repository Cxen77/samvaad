import crypto from 'crypto';

const generateOTP = () => {
    // Generate a random integer between 100000 and 999999
    return crypto.randomInt(100000, 999999).toString();
};

export default generateOTP;
