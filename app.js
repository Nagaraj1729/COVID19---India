const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path")
const dbPath = path.join( __dirname, "covid19India.db")

const app = express();
app.use(express.json());


db = null;
const initializeDBAndServer = async ()=> {
    try{
         db = await open({
             filename : dbPath,
             driver : sqlite3.Database
         });
         
         app.listen(3000, ()=> {
            console.log("Server is running at http://localhost:3000/")
         });
    }catch(e){
        console.log(`DB Error - ${e.message}`);
        process.exit(1);
    };
   
};

initializeDBAndServer();

const getStateDataByCamelCase = (stateObj)=> {
    return {
        stateId : stateObj.state_id,
        stateName : stateObj.state_name,
        population : stateObj.population
    }
}

const getDistDataByCamelCase = (distObj)=> {
    return {
        districtId : distObj.district_id,
        districtName : distObj.district_name,
        stateId : distObj.state_id,
        cases : distObj.cases,
        cured : distObj.cured,
        active : distObj.active,
        deaths : distObj.deaths              
    };
};

//Get all States list API
app.get("/states/", async (request, response) => {
    const getAllStatesQuery = 
        `
            SELECT
                *
            FROM
                state
            ORDER BY
                state_id
        `
    const statesList = await db.all(getAllStatesQuery);
    const camelCaseData = statesList.map(state => getStateDataByCamelCase(state));
    response.send(camelCaseData)
});

//Get State by stateId API
app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params;
    const getStateByIdQuery = 
        `
            SELECT
                *
            FROM
                state
            WHERE
                state_id = ${stateId}
        `
    const stateDetails = getStateDataByCamelCase(await db.get(getStateByIdQuery))
    response.send(stateDetails);
});

//Add new District data API
app.post("/districts/", async (request, response) => {
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths        
    } = districtDetails;

    const addDistrictDataQuery =
        `
            INSERT INTO
                 district (district_name, state_id, cases, cured, active,  deaths)
            VALUES (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            )           
        `
    await db.run(addDistrictDataQuery);
    response.send("District Successfully Added");
});

//Get District by Id API
app.get("/districts/:districtId/", async (request, response) => {
    const { districtId} = request.params;
    const getDistrictByIdQuery = 
        `
            SELECT 
                *
            FROM 
                district
            WHERE
                district_id = ${districtId}        
        `
    const distDetails = getDistDataByCamelCase(await db.get(getDistrictByIdQuery))
    response.send(distDetails);
})

//Delete District by Id API
app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId} = request.params;
    const deleteDistrictByIdQuery = 
        `
            DELETE FROM 
                district
            WHERE
                district_id = ${districtId}        
        `
    await db.run(deleteDistrictByIdQuery)
    response.send("District Removed");
});

//Update District Details API
app.put("/districts/:districtId/", async (request,  response) => {
    const {districtId} = request.params;
    const districtDetails = request.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths
    } = districtDetails;

    const updateDistrictDataQuery = 
        `
            UPDATE 
                district
            SET
                district_name = '${districtName}',
                state_id = ${stateId},
                cases = ${cases},
                cured = ${cured},
                active = ${active},
                deaths = ${deaths}
            WHERE
                district_id = ${districtId}
        `
    await db.run(updateDistrictDataQuery);
    response.send("District Details Updated")
});

//Get State Statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
    const {stateId} = request.params;
    const getStateDataQuery = 
        `
            SELECT
                SUM(cases) as totalCases, 
                SUM(cured) as totalCured, 
                SUM(active) as totalActive, 
                SUM(deaths) as totalDeaths
            FROM
                district
            WHERE
                state_id = ${stateId}    
        `
    const dbResponse = await db.get(getStateDataQuery);
    response.send(dbResponse);
})

//Get state name of District API
app.get("/districts/:districtId/details/", async (request, response) => {
    const { districtId } = request.params;
    const getStateIdQuery = 
        `
            SELECT
                state_name
            FROM
                district NATURAL JOIN state
                 
            WHERE
                district_id = ${districtId}
        `    
    const dbResponse = await db.get(getStateIdQuery)
    response.send( { stateName : dbResponse.state_name })
});

module.exports =  app;