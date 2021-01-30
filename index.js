const express=require("express");
const bodyParser=require("body-parser");
const cors=require("cors")
const axios=require("axios");
const app=express();
const mariadb = require('mariadb');
const swaggerJsDoc=require("swagger-jsdoc");
const swaggerUI=require("swagger-ui-express");

const pool = mariadb.createPool(
    {host: "localhost", 
    user: "root",
    password:"admin",
    database:"user"});

//app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

//executed once to store data and create table

// async function main() {
//     let conn;
//     try {
  
//       conn = await pool.getConnection();
//       let tablecreate=await conn.query("CREATE TABLE User (id INT,name VARCHAR(255), email VARCHAR(255),password VARCHAR(255),role VARCHAR(255))")

//        const letrows1= await conn.query("INSERT INTO User value (?,?,?, ?, ?)", [1,'James','James@123.com','1!23#4','EMPLOYEE']);
//        const letrows2= await conn.query("INSERT INTO User value (?,?,?, ?, ?)", [2,'peter','peter@123.com','8^23!3','EMPLOYEE']); 
//         const letrows3= await conn.query("INSERT INTO User value (?,?,?, ?, ?)", [3,'John','John@123.com','98!891','ADMIN']);
//        const letrows4= await conn.query("INSERT INTO User value (?,?,?, ?, ?)", [4,'Fred','Fred @123.com','68651','ADMIN']); 
        
    
//     } catch (err) {
//       throw err;
//     } 
//   }

// main();  


//login route
app.post("/login",async (req,res)=>{
    //console.log("SELECT * from User where email="+req.body.email)
    let conn;
    let selectquery;
    try {
  
      conn = await pool.getConnection();
       selectquery=await conn.query(`SELECT * from User where email='${req.body.email}' AND password='${req.body.password}'`);
    } catch (err) {
      throw err;
    } 
    if(selectquery.length>0)
    {
        if(selectquery[0].role==="EMPLOYEE")
        {
            return res.send({title:"Employee",details:[{id:selectquery[0].id,name:selectquery[0].name,email:selectquery[0].email,role:selectquery[0].role}]});
        }
        else if(selectquery[0].role==="ADMIN")
        {
            const AdminPrevilege={title:"Admin",details:[]};
            try{
                const getall=await conn.query("select * from User");
                for(var i=0;i<getall.length;i++)
                {
                    AdminPrevilege.details.push({id:getall[i].id,name:getall[i].name,email:getall[i].email,role:getall[i].role});
                }
            }
            catch(err)
            {

            }
            return res.send(AdminPrevilege);
        }
       
    }
    else
    {
        return res.send({title:"BadUser",message:"Unknown username or password"})
    }
   
})

//Swagger setup
const swaggerOptions={
    definition:{
        info:{
            title:"User API",
            version:"1.0.0",
            description:"User API to get user details",
            servers:["http://localhost:4000"]
        }
    },
    apis:["index.js"]
}
 const swaggerDocs=swaggerJsDoc(swaggerOptions);
 app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerDocs));
/** 
 * @swagger
 * /usersSorted:
 *   get:
 *     description: returns all the users in sorted order by their name.
 *     responses:
 *       200:
 *         description:Success
*/

//Sorted users route

app.get("/usersSorted",async (req,res)=>{
    
    let conn;
    let selectquery;
    try {
  
      conn = await pool.getConnection();
       selectquery=await conn.query("SELECT * from User");
    } catch (err) {
      throw err;
    } 
   const users=[];
   for(var i=0;i<selectquery.length;i++)
   {
       users.push(selectquery[i]);
   }

  users.sort((a,b)=>{
    if(a.name>b.name)
    return 1;
    else
    return -1;
  });
    res.status(200).send(users)
})


/** 
 * @swagger
 * /user:
 *   get:
 *     description: used to get user details by userid.
 *     parameters:
 *      - in: query
 *        name: id
 *        type: integer
 *        description: Takes id of user and returns the user
 *     responses:
 *       200:
 *         description:Success
*/

// get user by id route
app.get("/user",async (req,res)=>{
    console.log(req.query.id);
    let conn;
    let selectquery;
    try {
  
      conn = await pool.getConnection();
       selectquery=await conn.query(`SELECT * from User where id='${req.query.id}'`);
    } catch (err) {
      return res.send({err});
    } 
    if(selectquery.length>0)
    {
        return res.send({name:selectquery[0].name,email:selectquery[0].email,role:selectquery[0].role});
    }
    else
    {
        return res.status(401).send(`required user of id ${req.query.id} not found`)
    }
    
})


/** 
 * @swagger
 * /userByField:
 *   get:
 *     description: used to get user details by field given by user(can be used to sort by id,email,role).
 *     parameters:
 *      - in: query
 *        name: sortBy
 *        type: string
 *        description: take data from user
 *     responses:
 *       "200":
 *         description:Success
*/


//get sorted by field route

app.get("/userByField",async(req,res)=>{
    var field=req.query.sortBy||"role";
    let conn;
    let selectquery;
    try {
  
      conn = await pool.getConnection();
       selectquery=await conn.query("SELECT * from User");
    } catch (err) {
      throw err;
    } 
   const users=[];
   for(var i=0;i<selectquery.length;i++)
   {
       users.push(selectquery[i]);
   }

  users.sort((a,b)=>{
      if(field==="email")
      {
        if(a.email<b.email)
    return 1;
    else
    return -1;
      }
      else if(field==="id")
      {
        if(a.id<b.id)
    return 1;
    else
    return -1;
      }
      else if(field==="role")
      {
        if(a.role<b.role)
        return 1;
        else
        return -1;
      }

    
  });
    res.status(200).send(users)
})

app.listen(4000,()=>{
    console.log("backend started at 4000");
})