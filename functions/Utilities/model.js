var admin = require("firebase-admin")
require('dotenv').config()
var serviceAccount = require("../hydralogger-updater-firebase-adminsdk-4yx73-e1ea24c843.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});
const DB = admin.firestore()

const NITRO_LOGGER_DB_COLLECTION = process.env.NITRO_LOGGER_DB_COLLECTION,
        NITRO_LOGGER_PACKAGE = process.env.NITRO_LOGGER_PACKAGE,
        NITRO_LOGGER_BUCKET_URL = process.env.NITRO_LOGGER_BUCKET_URL,
        NITRO_LOGGER_APP_NAME  = process.env.NITRO_LOGGER_APP_NAME,
        NITRO_LOGGER_BUCKET_NAME = process.env.NITRO_LOGGER_BUCKET_NAME,

        O_PITBLAST_DB_COLLECTION = process.env.O_PITBLAST_DB_COLLECTION,
        O_PITBLAST_PACKAGE = process.env.O_PITBLAST_PACKAGE,
        O_PITBLAST_BUCKET_URL = process.env.O_PITBLAST_BUCKET_URL,
        O_PITBLAST_BUCKET_NAME = process.env.O_PITBLAST_BUCKET_NAME,
        O_PITBLAST_APP_NAME = process.env.O_PITBLAST_APP_NAME,
        
        HYDRA_LOGGER_DB_COLLECTION = process.env.HYDRA_LOGGER_DB_COLLECTION,
        HYDRA_LOGGER_PACKAGE = process.env.HYDRA_LOGGER_PACKAGE,
        HYDRA_LOGGER_BUCKET_URL = process.env.HYDRA_LOGGER_BUCKET_URL,
        HYDRA_LOGGER_BUCKET_NAME = process.env.HYDRA_LOGGER_BUCKET_NAME,
        HYDRA_LOGGER_APP_NAME = process.env.HYDRA_LOGGER_APP_NAME,

        UNKNOWN = process.env.UNKNOWN;

module.exports = {
    setAppDetails: async (appName) => {
        return new Promise((resolve) => {
            let appDetails = {}
            switch(appName) {
                
                case "nitrologger": {
                    appDetails.appCollectionRef = DB.collection(NITRO_LOGGER_DB_COLLECTION)
                    appDetails.appPackageName =  NITRO_LOGGER_PACKAGE
                    appDetails.bucketUrl = NITRO_LOGGER_BUCKET_URL
                    appDetails.bucketName = NITRO_LOGGER_BUCKET_NAME
                    appDetails.appNameToUpdate = NITRO_LOGGER_APP_NAME
                }
                break

                case "hydralogger": {
                    appDetails.appCollectionRef = DB.collection(HYDRA_LOGGER_DB_COLLECTION)
                    appDetails.appPackageName =  HYDRA_LOGGER_PACKAGE
                    appDetails.bucketUrl = HYDRA_LOGGER_BUCKET_URL
                    appDetails.bucketName = HYDRA_LOGGER_BUCKET_NAME
                    appDetails.appNameToUpdate = HYDRA_LOGGER_APP_NAME
                }
                break

                case "opitblast": {
                    appDetails.appCollectionRef = DB.collection(O_PITBLAST_DB_COLLECTION)
                    appDetails.appPackageName = O_PITBLAST_PACKAGE
                    appDetails.bucketUrl = O_PITBLAST_BUCKET_URL
                    appDetails.bucketName = O_PITBLAST_BUCKET_NAME
                    appDetails.appNameToUpdate = O_PITBLAST_APP_NAME
                }
                break

                default: {
                    appDetails.appCollectionRef = UNKNOWN
                }

            }
            resolve(appDetails)
        })
    },

    getDatabaseAppDetails : async (appCollectionRef) => {         
        return new Promise(async (resolve, reject) => {

            let counter = 0
            const querySnapshots = await appCollectionRef.limit(1).get() 
            
            querySnapshots.forEach(async snapshot => {
                let appData = snapshot.data()
                counter++; 

                if (counter === querySnapshots.size) {
                    let databaseAppDetails = { 
                        "documentId" : snapshot.id,
                        "appCurrentVersionCode":appData.version_code,
                        "appCertificateSerial": appData.app_certificate_serial
                    }
                    resolve(databaseAppDetails)
                }
            })     
        })    
    },

    updateAppDatabaseAppDetails : async (appCollectionRef, documentId, updateData) => {         
        return new Promise(async (resolve, reject) => {

            var updateRef = appCollectionRef.doc(documentId.trim())

            updateRef.update(updateData).then(response => {
                resolve("success")
            }).catch(error => {
                resolve(error)
            });    
        })    
    }
}