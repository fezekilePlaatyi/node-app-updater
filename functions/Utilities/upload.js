require('dotenv').config()
const {Storage} = require('@google-cloud/storage')
const googleStorage = new Storage({
    keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
    projectId: process.env.PROJECT_ID
})
const path = require("path") 
const fs = require('fs')
const crypto = require('crypto')
const formidable = require('formidable-serverless')
const model = require('./model.js')
const { sendEmailAboutAppUpdate } = require('./email.js')
const { getFileCertificate , getPackageDetails} = require('./fileParser.js')
var admin = require("firebase-admin")
const UNKNOWN = process.env.UNKNOWN

const uploadFile = async (filePath, bucketName) => {
    await googleStorage.bucket(bucketName).upload(filePath, {
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    console.log(`${filePath} uploaded to ${bucketName}.`);
}

const renameFileAtGoogleStorage = async (bucketName, srcFilename, destFilename) => {
    await googleStorage.bucket(bucketName).file(srcFilename).move(destFilename);
    console.log(
      `gs://${bucketName}/${srcFilename} moved to gs://${bucketName}/${destFilename}.`
    );
}

const deleteFileIfExist = (filePath) => {
    try {
        fs.unlinkSync(filePath)
    } catch(err) {
        console.error(err)
    }
}

const updateAppDetailsOnDatabase = (
        response,
        appCollectionRef,
        appDocumentId,
        appName,
        newFilePath, 
        filePathOnGoogleCloud, 
        updateDescription, 
        currentVersionCode
    ) => {

        let updateData = {
            "file_name":newFilePath,
            "date_created": admin.firestore.Timestamp.now(),
            "file_location" : filePathOnGoogleCloud,
            "update_description": updateDescription,
            "version_code": currentVersionCode
        }
    
        model.updateAppDatabaseAppDetails(
            appCollectionRef, 
            appDocumentId, 
            updateData)
            .then(updateResponse => {
                sendEmailAboutAppUpdate(appName, updateDescription)

                returnResponse(
                    response, 
                    "Finished Proccessiong", 
                    "Successfully proccesed update. An email has been also sent to person set to receive Update Notification."
                )

            }).catch(err => {
                returnResponse(
                    response, 
                    "Error 505", 
                    `Failed Updating Database About New App Details. ${err}`
                ) 
            })
}

const googleCloudFileUpload = (
    response,
    filePath, 
    appDetailsObject, 
    databaseAppDetails,
    appName, 
    updateDescription,
    currentVersionCode
    ) => {
    let newFilePath = `apk_file_${Date.now()+".apk"}`    
    let bucketName = appDetailsObject.bucketName

    uploadFile(filePath, bucketName)
    .then(() =>{
        deleteFileIfExist(filePath)
        renameFileAtGoogleStorage(
            bucketName, 
            path.basename(filePath), 
            newFilePath
            )
            .then(()=>{
                updateAppDetailsOnDatabase(
                    response,
                    appDetailsObject.appCollectionRef,
                    databaseAppDetails.documentId,
                    appName,
                    newFilePath, 
                    appDetailsObject.bucketUrl+newFilePath, 
                    updateDescription, 
                    currentVersionCode
                )
                
            })
            .catch(err => {
                returnResponse(
                    response, 
                    "Error 501", 
                    `We encountered error :- ${err}`
                ) 
            })
    })
    .catch(err => {
        returnResponse(
            response, 
            "Error 502", 
            `We encountered error :- ${err}`
        ) 
    })
}

const parseFile = (response, filePath, appName, updateDescription, appDetailsObject, databaseAppDetails) => {
    getFileCertificate(filePath).then(certificateData => {

        if(Object.keys(certificateData).length < 1) {

            returnResponse(
                response, 
                "Error: App has NO Certificate.", 
                "Note: APK you are uploading is signed with original certificate signed initial version of the app."
            )

        } else {
            if(databaseAppDetails.appCertificateSerial == certificateData.serial) {
               
                getPackageDetails(filePath).then(packageDetails => {
                    if(packageDetails.package != appDetailsObject.appPackageName) {
                        
                        returnResponse(
                            response, 
                            "Error: Package name doesn't match", 
                            "Note: APK needs to have package name as initial APK uploaded."
                        )

                    } else if(packageDetails.versionCode <= databaseAppDetails.appCurrentVersionCode ) {
                        
                        returnResponse(
                            response, 
                            "Error: App not properly versioned.", 
                            "Note: APK needs to have a version greater than current one to be allowed as update."
                        )
                    } else {
                        let currentVersionCode = packageDetails.versionCode
                        googleCloudFileUpload(
                            response,
                            filePath,  
                            appDetailsObject, 
                            databaseAppDetails, 
                            appName, 
                            updateDescription,
                            currentVersionCode
                        )
                    }
                })
            }
            else {
                returnResponse(
                    response, 
                    "Error: App signed with different certificate than original.",
                    "Note: Make sure APK you are uploading is signed with original certificate signed initial version of the app."
                )
            }
        }
    }).catch(err => { 
        returnResponse(response, "Error 504", `We encountered error :- ${err}`)             
    })
    
}

const  getAppDetails = (response, filePath, appName, updateDescription)  => {
    model.setAppDetails(appName).then(appDetailsObject => {
        if(UNKNOWN != appDetailsObject.appCollectionRef) {
            model.getDatabaseAppDetails(appDetailsObject.appCollectionRef).then(databaseAppDetails => {
                parseFile(response, filePath, appName, updateDescription, appDetailsObject, databaseAppDetails) 
            })
            .catch(err => {
                returnResponse(response, "Error 503", `We encountered error :- ${err}`)
            });
        }
        else {
            returnResponse(response, "Server error", "Unknown app name submitted.")
        }
    })
}

const getExtension = (filePath, response, appName, updateDescription) => {
    var ext = path.extname(filePath||'').split('.');
    if( ext[ext.length - 1] == "apk") {
        getAppDetails(response, filePath, appName, updateDescription)
    } else {
        returnResponse(response, "File type error", "We only accepting APKs, please try again!")
    }
}

const getFileHash = (filePath, algorithm) => {
    return new Promise((resolve, reject) => {
        let shasum = crypto.createHash(algorithm)
        try {
            let stream = fs.ReadStream(filePath)
            stream.on('data', function (data) {
                shasum.update(data)
            })
            
            stream.on('end', function () {
                const hash = shasum.digest('hex')
                return resolve(hash)
            })
        } catch (error) {
            return reject(`Failed verifying app Integrity. Error - ${error}`)
        }
    });
}

const returnResponse = (response, header, body) => {
    response.render("responses", { 
        response_header: `Response: ${header}`, 
        response_body: body
    }); 
}

module.exports = { 
    uploadFile : async (request, response) => {
        const form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.keepExtensions = true;
    
        form.parse(request, async (err, fields, files) => {
    
            let filePath = files.apk_file.path
            let fileChecksum = fields.fileHash
            let appName = fields.app_name 
            let updateDescription = fields.update_description

            await getFileHash(filePath, 'sha1').then(checksum => {
                checksum == fileChecksum
                ?
                returnResponse(response, "File problem", "This file corrupted during the upload!")
                : 
                getExtension(filePath, response, appName, updateDescription) 
            })
            
        })
    }
}
