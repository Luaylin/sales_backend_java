var mysql      = require('mysql');
require('dotenv').config()
var connection = mysql.createConnection({
  host     : process.env.DBHOST,
  user     : process.env.DBUSER,
  password : process.env.DBPASS,
  database : process.env.DB
});

function query(sql){
    return new Promise((resolve, reject) => {
        connection.query(sql, function (error, results, fields) {  
            if(error){
                console.log(error)
                resolve([])
            } else {
                resolve(results)
            }
        })
    })
}

function queryWithParams(sql, params){
    return new Promise((resolve, reject) => {
        connection.query(sql, params, function (error, results, fields) {  
            if(error){
                console.log(error)
                resolve([])
            } else {
                resolve(results)
            }
        })
    })
}

function insert(sql, params){
    return new Promise((resolve, reject) => {
        connection.query(sql, params, function (error, results, fields) {  
            if(error){
                console.log(error)
                resolve({
                    status: false
                })
            } else {
                resolve({
                    status: true,
                    id: results.insertId
                })
            }
        })
    })
}

function update(sql, params){
    return new Promise((resolve, reject) => {
        connection.query(sql, params, function (error, results, fields) {  
            if(error){
                console.log(error)
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

function remove(sql, params){
    return new Promise((resolve, reject) => {
        connection.query(sql, params, function (error, results, fields) {  
            if(error){
                console.log(error)
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

module.exports = {
    query,
    queryWithParams,
    insert,
    update,
    remove
}