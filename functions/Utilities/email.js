require('dotenv').config()
const nodemailer = require('nodemailer')
const EMAIL_HOST = process.env.EMAIL_HOST
const EMAIL_USERNAME = process.env.EMAIL_USERNAME
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const EMAIL_APP_UPDATER = process.env.EMAIL_APP_UPDATER
const EMAIL_SUBJECT =  process.env.EMAIL_SUBJECT

module.exports = { 
    sendEmailAboutAppUpdate : (appName, updateDescription) => {

        return new Promise((resolve, reject) => {
            
            var transporter = nodemailer.createTransport({
                service: EMAIL_HOST,
                auth: {
                    user: EMAIL_USERNAME,
                    pass: EMAIL_PASSWORD
                }
            })

            var mailOptions = {
                from: `HydraDet ${EMAIL_USERNAME}`,
                to: EMAIL_APP_UPDATER,
                subject: EMAIL_SUBJECT,
                html: `<div>                
                        <h3>Hi there!</h3>
                        <p>Please update the devices, an Update for the <b>${appName}</b> App has been published</p>
                        <p><b>Update Contains:</b></p>
                        <p>${updateDescription}</p>
                        <br>
                        <p>Best Regards<br>HydraDet Team</p>                
                    </div>
                    `
            }

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(error)
                } else {
                    resolve(info.response)
                }
            })

        });
    }
}