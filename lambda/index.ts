import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({
  region: process.env.AWS_REGION,
});

exports.handler = async function (event: any, context: any) {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  // TODO: send email
};
