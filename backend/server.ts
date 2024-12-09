import express from "express";
import {Request, Response, Router} from "express";
import { AccountsHandler } from "./handlers/accounts";
import { walletHandler } from "./handlers/wallet";
import { EventsHandler } from "./handlers/events";
import path from "path";

const port = 3000; 
const server = express();
const routes = Router();

server.use(express.json());

//Alterar path para funcionar
server.use(express.static(path.join("C:/Users/dell/OneDrive/Documentos/GitHub/Projeto_Integrador-II/frontend")));

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

routes.put('/signUp', AccountsHandler.createAccountRoute);
routes.post('/login', AccountsHandler.loginRoute);

routes.put('/addNewEvent', EventsHandler.addEventRoute);
routes.get('/getEvents', EventsHandler.getEventsRoute);
routes.delete('/deleteEvent', EventsHandler.deleteEventsRoute);
routes.put('/evaluateEvent', EventsHandler.evaluateNewEventRoute);
routes.post('/searchEvents', EventsHandler.searchEventRoute);
routes.get('/eventMaisApostado', EventsHandler.eventMaisApostado);
routes.get('/eventMaisProximo', EventsHandler.eventMaisProximo);
routes.post('/specificEvent', EventsHandler.getSpecificEvent);

routes.post('/addFunds', walletHandler.addFundsToWalletRoute);
routes.put('/withdrawFunds', walletHandler.withdrawFundsRoute);
routes.post('/betOnEvent', walletHandler.betOnEventRoute);
routes.post('/finishEvent', walletHandler.finishEventRoute);
routes.post('/transactions', walletHandler.getTransactionHistoryRoute);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Server is running on: ${port}`);
})