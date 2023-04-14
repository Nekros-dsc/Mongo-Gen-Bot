const client = require("../index.js")
const config = require("../config.json")
const urllib = require("urllib")


async function createDB(projectName, authToken,public_key) {
    return new Promise(async (resolve, reject) => {

   
     await urllib.request('https://cloud.mongodb.com/api/atlas/v1.0/groups', {
        method: 'POST',
        digestAuth : `${public_key}:${authToken}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          "name": projectName,
          "orgId": config.org_Id
        }
      }, function(err, data, res) {
      
        if(err) {
            reject(err)
        } else {
            resolve(res)

     
        }
      })
    })
  
    
  
   
  
  }
  async function getProjectId(projectName, authToken,public_key) {
    return new Promise(async (resolve, reject) => {
      urllib.request('https://cloud.mongodb.com/api/atlas/v1.0/groups', {
        method: 'GET',
        digestAuth : `${public_key}:${authToken}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }, function(err, data, res) {
        console.log(err)
        console.log(res)

        if(err) {
          reject(err)
        } else {
          resolve(JSON.parse(data).results[0].id)
        }
      })
    })
  }
  
  
  
  
     
  
  
    function addWl(projectId, authToken, public_key, ipWhitelist){ 
        
      return new Promise((resolve, reject) => {
    urllib.request('https://cloud.mongodb.com/api/atlas/v1.0/groups/'+ projectId +'/accessList', {
      method: 'POST',
      digestAuth : `${public_key}:${authToken}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: [
        {
          "ipAddress": ipWhitelist,
          "comment": "test"
        }
      ]
     
    }, function(err, data, res) {
        console.log(err)
        console.log(res)

      if(err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
    })
  
  }
  //create user
  function createUser(projectId, authToken, public_key, username, password) {
    return new Promise((resolve, reject) => {
  urllib.request('https://cloud.mongodb.com/api/atlas/v1.0/groups/'+ projectId +'/databaseUsers', {
    method: 'POST',
    digestAuth : `${public_key}:${authToken}`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      "databaseName": "admin",
      "username": username,
      "password": password,
      "roles": [
        {
          "databaseName": "admin",
          "roleName": "atlasAdmin"
        }
      ]
    }
  }, function(err, data, res) {
    console.log(err)
    console.log(res)

    if(err) {
      reject(err)
    } else {
      resolve(data)
    }
  
  }
  )
  
  
  })
  }
  
  
  
  //create cluster
  function createCluster(projectId, authToken, public_key) {
    return new Promise((resolve, reject) => {
    
  urllib.request('https://cloud.mongodb.com/api/atlas/v1.0/groups/'+ projectId +'/clusters', {
    method: 'POST',
    digestAuth : `${public_key}:${authToken}`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      "name": "Cluster0",
      "diskSizeMB": 512,
      "numShards": 1,
      "mongoDBMajorVersion": "5.0",
      "providerSettings": {
        "providerName": "TENANT",
        "regionName": "US_EAST_1",
        "backingProviderName": "AWS",
        "instanceSizeName": "M0",
       
      },
  
      
    }
  }, function(err, data, res) {
    console.log(err)
    console.log(res)

    if(err) reject(err)
      resolve(data)
  
  })
    })
  }
  
  //connection string 
  function generateConnectionString(projectId, authToken, public_key, username, password){
    
    return new Promise((resolve, reject) => {
      let connectionStringJson;
  
      const checkClusterState = setInterval(() => {
        urllib.request(`https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/clusters/Cluster0`, {
          method: 'GET',
          digestAuth: `${public_key}:${authToken}`,
          headers: {
            'Content-Type': 'application/json',
          },
        }, (err, data, res) => {
            console.log(err)
            console.log(res)

          if (err) {
            clearInterval(checkClusterState);
            reject(err);
          }
  
          connectionStringJson = JSON.parse(data.toString());
          console.log(connectionStringJson.stateName)
  
          if (connectionStringJson.stateName !== "CREATING") {
            clearInterval(checkClusterState);
  
            let toPase = username + ":" + password + "@"
            const connectionString = connectionStringJson.srvAddress.split("//")[0] + "//" + toPase + connectionStringJson.srvAddress.split("//")[1] + "/?retryWrites=true&w=majority"
  
            resolve(connectionString);
          }
        });
      }, 60000);
   
    
  
  })
    
  
  }
  
 async  function createAll(projectName, authToken, public_key, ipWhitelist, username, password){
   return new Promise(async (resolve, reject) => {

      try {
        const db = await createDB(projectName, authToken, public_key)
        console.log(db)

  
        const projectId = await getProjectId(projectName, authToken, public_key)
        const cluster = await createCluster(projectId, authToken, public_key)
        const user = await createUser(projectId, authToken, public_key, username, password)
        const wl = await addWl(projectId, authToken, public_key, ipWhitelist)
        const connectionString = await generateConnectionString(projectId, authToken, public_key, username, password)
        resolve(connectionString)
      } catch (error) {
        reject(error)
   
      
    }
    })
  }

  
  module.exports = {
    createAll
    }