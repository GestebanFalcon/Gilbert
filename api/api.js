const d = Date()

require("dotenv").config()
async function model() {
    //this defines the mongoose model to provide a format for the data i upload to the MongoDB database
    const Mongoose = require('mongoose');
    await Mongoose.connect(process.env.DB_TOKEN);
    //2024 -- feel free to hack this, nothing useful is in it

    console.log('connected v2');

    const gilbertSchem = new Mongoose.Schema({
        age: { default: 0, type: Number },
        health: { default: 100, type: Number },
        wealth: { default: 0, type: Number },
        happy: { default: 80, type: Number },
        energy: { default: 80, type: Number },
        hungry: { default: 80, type: Number },
        inventory: { default: [], type: Array },
        id: String,
        date: Number
    })
    gilbertSchem.statics.findGilbertById = async function (playerId) {
        const gilbert = await this.findOne({ id: playerId }).exec();
        if (!gilbert) {
            const newGilbert = new this({ id: id, date: d.getTime() });
            await newGilbert.save();
            return newGilbert;
        }
        return gilbert;
    };
    GilbertModel = Mongoose.model('gilbert', gilbertSchem);
    // Gilby = Mongoose.model('Gilbert', gilbertSchem)
    // Gilby.findGilbertById(23).then((gil) => {console.log('hi')})
    // console.log(Gilby)
    //useless test code i commented out ^^
}

model() // this function (look above) creates the schema and model for the database.
// The model object allows me to interact with the database by 


const cors = require('cors')
const express = require('express')
const app = express()

// import cors to communicate with API on same computer and express to create the API

app.use(express.json()) //lets me parse json data
app.use(cors())


// Routing below to the only route I need for this application. When an http request is sent, 
app.get('/fetchGilb/:id', async (req, res) => {
    console.log('it work kinda') //this was for debugging and to know what code was running when
    console.log(req.params.id) //once again for debugging
    GilbertModel.findGilbertById(req.params.id).then(playergilb => {
        // console.log(playergilb)
        res.json(playergilb)
    });

})
app.post('/save', async (req, res) => {
    console.log('save req received')
    //save the inputted gilbert and find the equivalent one in the database
    let inputGilb = req.body
    let accGilb = await GilbertModel.findOne({ id: inputGilb.id })
    accGilb.health = inputGilb.health
    accGilb.age = inputGilb.age
    accGilb.wealth = inputGilb.wealth
    accGilb.happy = inputGilb.happy
    accGilb.energy = inputGilb.energy
    accGilb.hungry = inputGilb.hungry
    accGilb.date = inputGilb.date
    accGilb.inventory = inputGilb.inventory
    accGilb.save()
    res.send('hi')

})
app.listen(3000, () => { console.log('connected') })