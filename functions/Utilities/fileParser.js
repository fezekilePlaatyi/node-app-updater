const ApkReader = require('node-apk-parser')
var {Apk} = require("node-apk")
const fs = require('fs')
const { rejects } = require('assert')

module.exports = {

    getFileCertificate: async (filePath) => {
        return new Promise((resolve, reject) => {
          
            const apk = new Apk(filePath);
            
            apk.getCertificateInfo().then((certs) => {
                resolve(certs[0])
            }).catch(e => {
                reject(e)
            })
        })
    },
    getPackageDetails: async (filePath) => {
        return new Promise((resolve) => {

            let reader = ApkReader.readFile(filePath)
            let manifest = reader.readManifestSync()
            resolve(manifest)

        })
    },
}