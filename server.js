//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//mongodb pass:K9Nz1ZHHf7P6zubd
//ip add:102.154.152.140

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1138449",
    key: "32a96f39aef4bc0b901d",
    secret: "420ede96c77f3a970280",
    cluster: "eu",
    useTLS: true
  });


//middleware
app.use(express.json());
app.use(cors());

//db config
const connection_url = 'mongodb+srv://admin:K9Nz1ZHHf7P6zubd@cluster0.a78wb.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change)=>{
        console.log("A change accured", change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
            );
        } else {
            console.log('Error triggering pusher');
        }
    });
});


//??

//api routes
app.get('/', (req, res)=>{
    res.status(200).send('Yo wussup!')
})

app.get("/messages/sync", (req, res)=>{
    Messages.find((err, data) => { 
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
})

app.post("/messages/new", (req, res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data)=>{
        if (err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})

//listener
app.listen(port, ()=> console.log(`listening on localhost: ${port}`))