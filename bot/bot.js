import { resolveColor, REST, Routes, ApplicationCommandOptionType } from 'discord.js';
//Import important values from the discordjs library

import { config } from 'dotenv';
config()

const commands = [
    // Though this was from the docs, I wrote the objects inside of this array
    //the following objects are the commands that this bot listens for when this array gets passed into the put request later
    {
        name: 'gilb',
        description: 'Displays current Gilbert',
    },
    {
        name: 'buy',
        description: 'Follow with item you want to buy. /catalog to browse',
        options: [ //additional input passed into the command by the user
            {
                name: 'item',
                description: 'item you would like to purchase',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    {
        name: 'work',
        description: 'Work to gain money!'
    },
    {
        name: 'catalog',
        description: 'Browse the shop catalog!'
    },
    {
        name: 'use',
        description: 'Follow with item you want to use. /inv to check inventory',
        options: [
            { //additional input passed into the command by the user
                name: 'item',
                description: 'item you would like to purchase',
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    {
        name: 'inv',
        description: 'Displays user inventory'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN); // I assume that this connects to discord bot (did not write)

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands('1098967979984687188'), { body: commands }); //registers event listener with commands to the bot

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] }); //lets discord know which events to alert bot of

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
//^^^ Code above comes from the DiscordJS library official documentation at https://discord.js.org/. I inputted my bot's information. This logs into the discord bot and the library allows for me to interract with it using the client object.
// important abstractions for commands

const fetchGilb = (userId) => {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/fetchGilb/' + userId)
            .then(res => res.json())
            .then(res => resolve(res))
    })
    //function above fetches the player's Gilbert object from the database


}

const updateStats = (gilb, time) => {
    gilb.energy = gilb.energy = gilb.energy + (time / 600000)
    if (gilb.energy > 100) {
        gilb.energy = 100
    }
    if (gilb.hungry > 60 && gilb.energy > 60) {
        gilb.health = gilb.health + time / 600000
        if (gilb.health > 100) {
            gilb.health = 100
        }
    }
    if (gilb.hungry === 0) {
        gilb.health = gilb.health - time / 3600000
    }
    gilb.hungry = gilb.hungry - (time / 3600000)
    if (gilb.hungry < 0) {
        gilb.hungry = 0
    }
    gilb.happy = gilb.happy = gilb.happy - (time / 3600000)
    if (gilb.happy < 0) {
        gilb.happy = 0
    }
}
// The function above updates the stats of the Gilbert according to the passage of time since last interracted with (rest gains energy but decreases how fed the Gilbert is)

const saveGilb = async gilb => {
    console.log('saving!')
    let a = await fetch('http://localhost:3000/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gilb)

    })
}
//the function above calls the api to update the Gilbert database based off the changes that have been made after a given interraction



const displayGilb = gilb => {
    console.log("jawn:\n" + gilb)
    return (`~health: ${Math.round(gilb.health)}~ ~money: ${gilb.wealth}~ ~happiness: ${Math.round(gilb.happy)}~ ~energy: ${Math.round(gilb.energy)}~ ~id:${gilb.id}~ ~hunger: ${Math.round(gilb.hungry)}~`)
} //displays the states of the user's Gilbert

const gilbShop = [
    { name: "MacRonalds", price: 50, hunger: 80, description: "Full meal from fast food chain 'MacRonald's'; includes grilled burger, chicken nuggets, and ice cream shake (80)" },
    { name: "Sammich", price: 15, hunger: 22, description: "Tasty sandwich made from fresh tomatoes, olives, and grilled chicken (22)" },
    { name: "Peanut", price: 1, hunger: 3, description: "Dirt cheap, but doesn't fill much (3)" },
    { name: "RcCar", price: 75, fun: 15, description: "Fun toy for Gilbert to play with - batteries included (15)" },
    { name: "Stick", price: 3, fun: 3, description: "Not much, but something for Gilbert to play with (3)" },
    { name: "Notendo", price: 200, fun: 100, description: "Ultimate gaming device (resets to full)" }
] //shop array; items that user can buy with /buy command

const displayList = (list, msg) => {
    let i = 0
    let final = ''
    while (i < list.length) { //iterates through each item of list and adds a line to a string with the value displayed
        final = final + msg(list[i])
        i++
    }
    return final
}

// Code below event listener for interaction (commands) and will run the callback procedure giving me an interaction object as the input

const interactionCallback = async interaction => {
    const date = new Date()
    let cmd = interaction.commandName //easier to type repeatedly
    if (!interaction.isChatInputCommand()) return;
    let currentId = interaction.user.id; // this variable shortens the player calling the command's ID
    let currentGilb = await fetchGilb(currentId);   // this variable fetches the Gilbert object from the api    
    updateStats(currentGilb, date.getTime() - currentGilb.date) //this updates the statistics of the bot to account for how long the user has been away to simulate hunger, sleep, and increaesd or decreased health based off of these factors. Rest gives energy but increases hunger(lowered stat) and boredom
    currentGilb.date = date.getTime()
    saveGilb(currentGilb);

    if (cmd === 'gilb') {
        //displays current stats
        interaction.reply(displayGilb(currentGilb))
    }
    if (cmd === 'work') {
        currentGilb.wealth = currentGilb.wealth + 5
        saveGilb(currentGilb)
        interaction.reply('+ 5 money for your hard work') //player needs a way to acquire money
    }
    if (cmd === 'buy') { // 
        console.log('buy logic running')
        let item = interaction.options._hoistedOptions[0].value //name of the item given in buy command
        console.log(interaction.options._hoistedOptions[0].value) //for debugging
        let storeItem = gilbShop.find(thing => thing.name == item) // checks if there is an item in the store with the name the player registered and returns it useful in the if statements after that filter whether the item exists, whether the player can afford it, and whether to increase quantity or make a new one.
        let currentIndex = currentGilb.inventory.findIndex(thing => thing.name === item)
        if (storeItem) {
            if (currentGilb.wealth >= storeItem.price) {
                currentGilb.wealth = currentGilb.wealth - storeItem.price
                if (currentIndex > -1) {
                    currentGilb.inventory[currentIndex].qty++
                    saveGilb(currentGilb)
                    interaction.reply('Bought another ' + item + '!')
                } else {
                    let end = currentGilb.inventory.push(storeItem) - 1
                    currentGilb.inventory[end].qty = 1
                    saveGilb(currentGilb)
                    interaction.reply(`Successfully bought ${item}!`)
                }
            } else { interaction.reply('not enough funds :(') }
        } else {
            interaction.reply('That item does not exist!')
        }
    }
    if (cmd === 'use') { //Allows users to use items in their inventory. Checks important requirements such as if it is in inventory.
        let item = interaction.options._hoistedOptions[0].value
        let inventoryItem = (currentGilb.inventory.find(thing => thing.name === item))
        let inventoryIndex = (currentGilb.inventory.findIndex(thing => thing.name === item))
        if (!inventoryItem) {
            interaction.reply('This item is not in your inventory! silly goose')
        } else {
            if (!(currentGilb.energy >= 5)) {
                interaction.reply('not enough energy!')
            }
            currentGilb.energy = currentGilb.energy - 5
            if (inventoryItem.fun) { //if it is a toy or food
                currentGilb.happy = currentGilb.happy + inventoryItem.fun
                if (currentGilb.happy > 100) { currentGilb.happy = 100 }
            }
            if (inventoryItem.hunger) {
                currentGilb.hungry = currentGilb.hungry + inventoryItem.hunger
                if (currentGilb.hungry > 100) { currentGilb.hungry = 100 }
            }
            if (inventoryItem.qty > 1) {
                currentGilb.inventory[inventoryIndex].qty--
            } else {
                currentGilb.inventory.splice(inventoryIndex, 1) // if there are multiple of an item lower the quantity, if there is one get rid of it from the inventory.
            }
            saveGilb(currentGilb)
            interaction.reply(`Used 1 ${item}!`)
        }
    }
    //last two commands simply go through their respective array and give information on the items
    if (cmd === 'catalog') {
        interaction.reply(displayList(gilbShop, item => `~${item.name}: $${item.price}~\n  --${item.description}\n\n`))
    }
    if (cmd === 'inv') {
        interaction.reply(displayList(currentGilb.inventory, item => `~${item.name}: ${item.qty}~\n`))
    }


}

client.on('interactionCreate', (interaction) => interactionCallback(interaction));



client.login(process.env.BOT_TOKEN);