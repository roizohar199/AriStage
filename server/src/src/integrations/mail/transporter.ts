import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.mail.user,
    pass: env.mail.pass,
  },
});

