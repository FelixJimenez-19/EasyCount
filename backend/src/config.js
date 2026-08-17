import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: Number(process.env.PORT),
    HOST: process.env.HOST,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
};
